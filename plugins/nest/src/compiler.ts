import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'tinyglobby';
import ts from 'typescript';

export interface BuildNestOptions {
  root?: string;
  source?: string;
  outDir?: string;
  clean?: boolean;
}

const ENTRY_FILES = ['app.module.ts', 'app.module.mts', 'app.module.js'];

function findEntry(sourceDirectory: string): string | undefined {
  return ENTRY_FILES.map(filename => path.join(sourceDirectory, filename)).find(
    fs.existsSync,
  );
}

function outputFilename(filename: string): string {
  return filename.replace(/\.(?:mts|ts|tsx)$/, '.js');
}

/** Extensions Node resolves on its own, and which must be left alone. */
const RESOLVED = /\.(?:js|mjs|cjs|json|node)$/;
/**
 * Source extension to the extension it is emitted under, in the order a
 * specifier is tried. The keys are the compilable half of the glob below, so a
 * file this build never collects is never resolved to.
 */
const CANDIDATES: Record<string, string> = {
  '.ts': '.js',
  '.tsx': '.js',
  '.mts': '.js',
  '.js': '.js',
  '.mjs': '.mjs',
};

/**
 * Rebases a specifier that reaches outside the source tree (e.g. a shared
 * `../../generated/client.ts` two directories above `app/server`).
 *
 * The compiled output only mirrors `app/server` itself — a file at
 * `app/server/shared/db.ts` lands at `<outDir>/shared/db.js` — so the two
 * trees sit at different depths from the specifier's real target. Reusing
 * the original `../` count (the in-tree fast path below) silently walks up
 * the wrong number of levels and resolves inside `<outDir>` instead of the
 * project root. The target itself is never compiled or moved — it lives
 * outside `app/server` on purpose — so this only recomputes the path
 * prefix, from the importing file's new location to that unchanged target.
 */
function rebaseEscapingSpecifier(
  target: string,
  directory: string,
  sourceDirectory: string,
  outputDirectory: string,
): string {
  let resolvedTarget = target;
  if (!RESOLVED.test(target) && !/\.(?:mts|ts|tsx)$/.test(target)) {
    const source = Object.keys(CANDIDATES).find(extension =>
      fs.existsSync(`${target}${extension}`),
    );
    if (source) resolvedTarget = `${target}${source}`;
  }
  const outputFileDirectory = path.join(
    outputDirectory,
    path.relative(sourceDirectory, directory),
  );
  const rebased = path
    .relative(outputFileDirectory, resolvedTarget)
    .split(path.sep)
    .join('/');
  return rebased.startsWith('.') ? rebased : `./${rebased}`;
}

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
 * Resolution runs against the source tree, since the output mirrors it —
 * except for a specifier that escapes `app/server` entirely, which needs its
 * path prefix rebased instead (see rebaseEscapingSpecifier). A specifier
 * that matches nothing is left as it was: it may be an alias this compiler
 * knows nothing about, and guessing would replace a clear error with a
 * confusing one.
 */
function resolveSpecifier(
  specifier: string,
  directory: string,
  sourceDirectory: string,
  outputDirectory: string,
): string {
  if (!specifier.startsWith('./') && !specifier.startsWith('../'))
    return specifier;

  const target = path.resolve(directory, specifier);
  const relativeToSource = path.relative(sourceDirectory, target);
  const escapesSource =
    relativeToSource.startsWith('..') || path.isAbsolute(relativeToSource);
  if (escapesSource)
    return rebaseEscapingSpecifier(
      target,
      directory,
      sourceDirectory,
      outputDirectory,
    );

  // `./x.ts` under allowImportingTsExtensions: the file ships as `.js`.
  if (/\.(?:mts|ts|tsx)$/.test(specifier)) return outputFilename(specifier);
  if (RESOLVED.test(specifier)) return specifier;

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
function rewriteSpecifiers(
  code: string,
  filename: string,
  directory: string,
  sourceDirectory: string,
  outputDirectory: string,
): string {
  const parsed = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.JS,
  );
  const edits: Array<{ start: number; end: number; text: string }> = [];

  const record = (node: ts.Node | undefined) => {
    if (!node || !ts.isStringLiteral(node)) return;
    const resolved = resolveSpecifier(
      node.text,
      directory,
      sourceDirectory,
      outputDirectory,
    );
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

  const visit = (node: ts.Node): void => {
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

function compileTypeScript(source: string, filename: string): string {
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
}: BuildNestOptions = {}): Promise<string | null> {
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
        rewriteSpecifiers(
          compiled,
          filename,
          directory,
          sourceDirectory,
          outputDirectory,
        ),
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
          sourceDirectory,
          outputDirectory,
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
