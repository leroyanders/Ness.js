import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'tinyglobby';
import ts from 'typescript';

const ENTRY_FILES = ['app.module.ts', 'app.module.mts', 'app.module.js'];

function findEntry(sourceDirectory) {
  return ENTRY_FILES.map(filename => path.join(sourceDirectory, filename)).find(
    fs.existsSync,
  );
}

function outputFilename(filename) {
  return filename.replace(/\.(?:mts|ts|tsx)$/, '.js');
}

/** Extensions Node resolves on its own, and which must be left alone. */
const RESOLVED = /\.(?:js|mjs|cjs|json|node)$/;
/**
 * Source extension to the extension it is emitted under, in the order a
 * specifier is tried. The keys are the compilable half of the glob below, so a
 * file this build never collects is never resolved to.
 */
const CANDIDATES = {
  '.ts': '.js',
  '.tsx': '.js',
  '.mts': '.js',
  '.js': '.js',
  '.mjs': '.mjs',
};

/**
 * Turns a relative import into one Node can resolve.
 *
 * The compiled output is ESM, where a relative specifier must carry its
 * extension. TypeScript is configured with `moduleResolution: 'bundler'` — the
 * templates' own tsconfig — under which `./health.controller` is valid source,
 * and `transpileModule` copies the specifier out verbatim. The result compiles,
 * type-checks, and runs in dev, then fails at boot in production with
 * ERR_MODULE_NOT_FOUND. Rewriting here is what keeps the two honest.
 *
 * Resolution runs against the source tree, since the output mirrors it. A
 * specifier that matches nothing is left as it was: it may be an alias this
 * compiler knows nothing about, and guessing would replace a clear error with
 * a confusing one.
 */
function resolveSpecifier(specifier, directory) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../'))
    return specifier;
  // `./x.ts` under allowImportingTsExtensions: the file ships as `.js`.
  if (/\.(?:mts|ts|tsx)$/.test(specifier)) return outputFilename(specifier);
  if (RESOLVED.test(specifier)) return specifier;

  const target = path.resolve(directory, specifier);
  for (const [source, emitted] of Object.entries(CANDIDATES)) {
    if (fs.existsSync(`${target}${source}`)) return `${specifier}${emitted}`;
  }
  for (const [source, emitted] of Object.entries(CANDIDATES)) {
    if (fs.existsSync(path.join(target, `index${source}`)))
      return `${specifier}/index${emitted}`;
  }
  return specifier;
}

/**
 * Rewrites every relative module specifier in a file, editing only the string
 * literals the parser identifies. A regex over the source would also rewrite
 * matching text inside strings and comments; walking the AST and replacing by
 * character range leaves everything else byte-for-byte intact, which matters
 * for the plain `.js` files that are otherwise copied rather than compiled.
 */
function rewriteSpecifiers(code, filename, directory) {
  const parsed = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.JS,
  );
  const edits = [];

  const record = node => {
    if (!node || !ts.isStringLiteral(node)) return;
    const resolved = resolveSpecifier(node.text, directory);
    if (resolved === node.text) return;
    const start = node.getStart(parsed);
    // Keep the quoting the file already uses, so a rewritten line does not
    // stand out from its neighbours in a stack trace or a diff.
    const quote = code[start] === '"' ? '"' : "'";
    edits.push({
      start,
      end: node.getEnd(),
      text: `${quote}${resolved}${quote}`,
    });
  };

  const visit = node => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      record(node.moduleSpecifier);
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    )
      record(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(parsed);

  let output = code;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return output;
}

function compileTypeScript(source, filename) {
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
      sourceMap: true,
    },
  });
  const errors = (result.diagnostics || []).filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length) {
    throw new Error(
      errors
        .map(diagnostic =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        )
        .join('\n'),
    );
  }
  return result.outputText;
}

export async function buildNestApplication({
  root = process.cwd(),
  source = 'app/server',
  outDir = 'build/nest',
  clean = true,
} = {}) {
  const sourceDirectory = path.resolve(root, source);
  const entry = findEntry(sourceDirectory);
  if (!entry) return null;

  const outputDirectory = path.resolve(root, outDir);
  if (clean) fs.removeSync(outputDirectory);
  fs.ensureDirSync(outputDirectory);
  const files = await glob('**/*.{ts,mts,tsx,js,mjs,json}', {
    cwd: sourceDirectory,
    absolute: true,
    onlyFiles: true,
  });

  for (const filename of files) {
    const relative = path.relative(sourceDirectory, filename);
    // A tsconfig describes how to compile this directory; it is not part of the
    // compiled output and must not be shipped with it.
    if (path.basename(relative) === 'tsconfig.json') continue;
    const destination = path.join(outputDirectory, outputFilename(relative));
    fs.ensureDirSync(path.dirname(destination));
    const directory = path.dirname(filename);
    if (/\.(?:mts|ts|tsx)$/.test(filename)) {
      const compiled = compileTypeScript(
        fs.readFileSync(filename, 'utf8'),
        filename,
      );
      fs.writeFileSync(
        destination,
        rewriteSpecifiers(compiled, filename, directory),
      );
    } else if (/\.(?:js|mjs)$/.test(filename)) {
      // Copied rather than compiled, but loaded by the same ESM loader, so an
      // extensionless import in hand-written JavaScript fails identically.
      fs.writeFileSync(
        destination,
        rewriteSpecifiers(
          fs.readFileSync(filename, 'utf8'),
          filename,
          directory,
        ),
      );
    } else {
      fs.copyFileSync(filename, destination);
    }
  }

  return path.join(
    outputDirectory,
    outputFilename(path.relative(sourceDirectory, entry)),
  );
}
