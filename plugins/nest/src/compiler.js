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
    const destination = path.join(outputDirectory, outputFilename(relative));
    fs.ensureDirSync(path.dirname(destination));
    if (/\.(?:mts|ts|tsx)$/.test(filename)) {
      fs.writeFileSync(
        destination,
        compileTypeScript(fs.readFileSync(filename, 'utf8'), filename),
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
