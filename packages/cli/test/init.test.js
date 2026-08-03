import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  cleanProject,
  generate,
  resolveDependencyName,
  resolveGeneratorType,
  resolveTemplate,
  resolveUpdateDependencies,
} from '../src/index.js';
import {
  copyTemplateFiles,
  mergeTemplatePackage,
  readTemplatePackage,
} from '../src/commands/create.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const registerCleanup = (context, cleanup) => {
  if (typeof context.after === 'function') context.after(cleanup);
  else process.once('exit', cleanup);
};

test('package exposes the ness binary', () => {
  assert.deepEqual(packageJson.bin, { ness: 'bin/index.js' });
});

test('CLI exposes the new application command', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(currentDirectory, '..', 'bin', 'index.js'), '--help'],
    {
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: ness \[options\] \[command\]/);
  assert.match(result.stdout, /new\|n \[options\] <project_name>/);
  assert.match(result.stdout, /dev \[options\]/);
  assert.match(result.stdout, /build \[options\]/);
  assert.match(result.stdout, /start \[options\]/);
  assert.match(result.stdout, /doctor/);
  assert.match(result.stdout, /generate\|g/);
  assert.match(result.stdout, /add \[options\] <package>/);
  assert.match(result.stdout, /remove\|rm \[options\] <package>/);
  assert.match(result.stdout, /update \[options\] \[packages\.\.\.\]/);
  assert.match(result.stdout, /clean \[options\]/);
  assert.match(result.stdout, /info/);

  const generateHelp = spawnSync(
    process.execPath,
    [
      path.join(currentDirectory, '..', 'bin', 'index.js'),
      'generate',
      '--help',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(generateHelp.status, 0, generateHelp.stderr);
  assert.match(generateHelp.stdout, /service/);
  assert.match(generateHelp.stdout, /resource/);
  assert.match(generateHelp.stdout, /--dry-run/);
  assert.match(generateHelp.stdout, /--force/);
});

test('generator creates JavaScript and TypeScript route modules without overwriting', t => {
  const javascript = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ness-generate-js-'),
  );
  const typescript = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ness-generate-ts-'),
  );
  registerCleanup(t, () => {
    fs.rmSync(javascript, { recursive: true, force: true });
    fs.rmSync(typescript, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(typescript, 'tsconfig.json'), '{}');
  fs.mkdirSync(path.join(typescript, 'app', 'server'), { recursive: true });
  fs.writeFileSync(
    path.join(typescript, 'app', 'server', 'app.module.ts'),
    "import {Module} from '@nestjs/common';\n\n@Module({})\nexport class AppModule {}\n",
  );
  fs.mkdirSync(path.join(javascript, 'app', 'server'), { recursive: true });
  fs.writeFileSync(
    path.join(javascript, 'app', 'server', 'app.module.js'),
    "import {Module} from '@nestjs/common';\n\nclass AppModule {}\nModule({})(AppModule);\nexport {AppModule};\n",
  );
  const page = generate('page', 'blog/[slug]', javascript);
  const middleware = generate('middleware', 'auth', typescript);
  assert.equal(
    path.relative(javascript, page),
    path.join('app', 'routes', 'blog', '[slug]', 'page.jsx'),
  );
  assert.equal(path.extname(middleware), '.ts');
  assert.match(
    fs.readFileSync(middleware, 'utf8'),
    /export default async function Auth/,
  );
  const service = generate('s', 'catalog', typescript);
  assert.equal(
    path.relative(typescript, service),
    path.join('app', 'server', 'catalog', 'catalog.service.ts'),
  );
  assert.match(fs.readFileSync(service, 'utf8'), /class CatalogService/);
  assert.match(
    fs.readFileSync(
      path.join(typescript, 'app', 'server', 'app.module.ts'),
      'utf8',
    ),
    /providers: \[CatalogService\]/,
  );

  const resource = generate('controller', 'users', javascript);
  assert.equal(
    path.relative(javascript, resource),
    path.join('app', 'server', 'users', 'users.controller.ts'),
  );
  assert.match(fs.readFileSync(resource, 'utf8'), /@Controller\("users"\)/);
  assert.match(
    fs.readFileSync(
      path.join(javascript, 'app', 'server', 'app.module.js'),
      'utf8',
    ),
    /controllers: \[UsersController\]/,
  );

  const dryRun = generate('hook', 'account', {
    cwd: typescript,
    dryRun: true,
  });
  assert.equal(fs.existsSync(dryRun), false);
  assert.throws(
    () => generate('page', 'blog/[slug]', javascript),
    /Refusing to overwrite/,
  );
  assert.doesNotThrow(() =>
    generate('p', 'blog/[slug]', { cwd: javascript, force: true }),
  );
  assert.throws(
    () => generate('page', '../escape', javascript),
    /relative paths/,
  );
  assert.equal(resolveGeneratorType('co'), 'controller');
  assert.equal(resolveGeneratorType('provider'), 'service');
  assert.throws(() => resolveGeneratorType('unknown'), /Unknown generator/);
});

test('dependency commands resolve official aliases and installed Ness packages', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-deps-'));
  registerCleanup(t, () =>
    fs.rmSync(workspace, { recursive: true, force: true }),
  );
  fs.writeFileSync(
    path.join(workspace, 'package.json'),
    JSON.stringify({
      dependencies: { '@nessframework/core': '^6.0.0', react: '^19.0.0' },
      devDependencies: { '@nessframework/analyzer': '^1.0.0' },
    }),
  );

  assert.equal(resolveDependencyName('tailwind'), '@nessframework/tailwind');
  assert.equal(resolveDependencyName('nest'), '@nessframework/nest');
  assert.equal(
    resolveDependencyName('tailwind@next'),
    '@nessframework/tailwind@next',
  );
  assert.equal(resolveDependencyName('@company/plugin'), '@company/plugin');
  assert.equal(resolveDependencyName('vitest'), 'vitest');
  assert.throws(() => resolveDependencyName('--global'), /Invalid package/);
  assert.deepEqual(resolveUpdateDependencies([], workspace), [
    '@nessframework/analyzer',
    '@nessframework/core',
  ]);
  assert.deepEqual(resolveUpdateDependencies(['security'], workspace), [
    '@nessframework/security',
  ]);
});

test('clean removes only known generated directories and supports dry runs', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-clean-'));
  registerCleanup(t, () =>
    fs.rmSync(workspace, { recursive: true, force: true }),
  );
  for (const directory of ['.ness', 'build', 'coverage', 'uploads']) {
    fs.mkdirSync(path.join(workspace, directory));
  }

  assert.deepEqual(cleanProject({ dryRun: true }, workspace), [
    '.ness',
    'build',
  ]);
  assert.equal(fs.existsSync(path.join(workspace, 'build')), true);

  cleanProject({}, workspace);
  assert.equal(fs.existsSync(path.join(workspace, '.ness')), false);
  assert.equal(fs.existsSync(path.join(workspace, 'build')), false);
  assert.equal(fs.existsSync(path.join(workspace, 'coverage')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'uploads')), true);

  cleanProject({ coverage: true }, workspace);
  assert.equal(fs.existsSync(path.join(workspace, 'coverage')), false);
  assert.equal(fs.existsSync(path.join(workspace, 'uploads')), true);
});

test('template aliases resolve to package names', () => {
  assert.deepEqual(resolveTemplate(), {
    name: '@nessframework/default',
    spec: '@nessframework/default',
  });
  assert.deepEqual(resolveTemplate('typescript'), {
    name: '@nessframework/typescript',
    spec: '@nessframework/typescript',
  });
  assert.deepEqual(resolveTemplate('ts'), {
    name: '@nessframework/typescript',
    spec: '@nessframework/typescript',
  });
  assert.deepEqual(resolveTemplate('minimal'), {
    name: '@nessframework/minimal',
    spec: '@nessframework/minimal',
  });
  assert.deepEqual(resolveTemplate('api'), {
    name: '@nessframework/api',
    spec: '@nessframework/api',
  });
  assert.deepEqual(resolveTemplate('dashboard'), {
    name: '@nessframework/dashboard',
    spec: '@nessframework/dashboard',
  });
  assert.deepEqual(resolveTemplate('custom'), {
    name: 'ness-template-custom',
    spec: 'ness-template-custom',
  });
  assert.deepEqual(resolveTemplate('@company/ness-template'), {
    name: '@company/ness-template',
    spec: '@company/ness-template',
  });
});

test('local package and direct-directory templates resolve from the filesystem', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-template-'));
  registerCleanup(t, () =>
    fs.rmSync(workspace, { recursive: true, force: true }),
  );

  const packaged = path.join(workspace, 'packaged');
  fs.mkdirSync(path.join(packaged, 'starter', 'app'), { recursive: true });
  fs.writeFileSync(
    path.join(packaged, 'package.json'),
    JSON.stringify({
      name: '@company/starter',
      ness: { template: 'starter' },
    }),
  );
  const packagedTemplate = resolveTemplate(`file:${packaged}`);
  assert.equal(packagedTemplate.name, '@company/starter');
  assert.equal(packagedTemplate.local, true);
  assert.equal(
    packagedTemplate.templateDirectory,
    fs.realpathSync(path.join(packaged, 'starter')),
  );

  const direct = path.join(workspace, 'direct');
  fs.mkdirSync(path.join(direct, 'app'), { recursive: true });
  fs.writeFileSync(path.join(direct, 'tsconfig.json'), '{}');
  const directTemplate = resolveTemplate(direct);
  assert.equal(directTemplate.local, true);
  assert.equal(directTemplate.templateDirectory, fs.realpathSync(direct));
  assert.equal(directTemplate.typescript, true);

  fs.writeFileSync(
    path.join(direct, 'package.json'),
    JSON.stringify({ ness: { template: '../outside' } }),
  );
  assert.throws(() => resolveTemplate(direct), /must stay inside/);

  assert.throws(
    () => resolveTemplate(path.join(workspace, 'missing')),
    /does not exist/,
  );
});

test('local template copying excludes generated files and merges package fields', t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-copy-'));
  registerCleanup(t, () =>
    fs.rmSync(workspace, { recursive: true, force: true }),
  );
  const source = path.join(workspace, 'source');
  const destination = path.join(workspace, 'application');
  fs.mkdirSync(path.join(source, 'app', 'node_modules', 'ignored'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(source, 'app', 'root.jsx'),
    'export default null;',
  );
  fs.writeFileSync(path.join(source, 'package.json'), '{"name":"source"}');
  fs.writeFileSync(path.join(source, 'package-lock.json'), '{}');
  fs.writeFileSync(
    path.join(source, 'template.json'),
    JSON.stringify({
      package: {
        scripts: { storybook: 'storybook dev' },
        dependencies: { example: '1.0.0' },
        prettier: { singleQuote: true },
      },
    }),
  );

  copyTemplateFiles(source, destination);
  assert.equal(fs.existsSync(path.join(destination, 'app', 'root.jsx')), true);
  assert.equal(fs.existsSync(path.join(destination, 'package.json')), false);
  assert.equal(
    fs.existsSync(path.join(destination, 'app', 'node_modules')),
    false,
  );

  fs.writeFileSync(
    path.join(destination, 'package.json'),
    JSON.stringify({
      name: 'application',
      scripts: { dev: 'ness dev' },
      dependencies: { '@nessframework/core': '6.0.0' },
    }),
  );
  const templatePackage = readTemplatePackage(source, source);
  const merged = mergeTemplatePackage(destination, {
    name: 'must-not-replace-application',
    ...templatePackage,
  });
  assert.equal(merged.name, 'application');
  assert.equal(merged.scripts.dev, 'ness dev');
  assert.equal(merged.scripts.storybook, 'storybook dev');
  assert.equal(merged.dependencies.example, '1.0.0');
  assert.equal(merged.prettier.singleQuote, true);
});

test('official template sources use one Ness configuration file', t => {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ness-official-templates-'),
  );
  registerCleanup(t, () =>
    fs.rmSync(workspace, { recursive: true, force: true }),
  );
  const templatesDirectory = path.resolve(
    currentDirectory,
    '..',
    '..',
    '..',
    'templates',
  );
  for (const name of ['default', 'typescript', 'minimal', 'api', 'dashboard']) {
    const resolved = resolveTemplate(path.join(templatesDirectory, name));
    const destination = path.join(workspace, name);
    copyTemplateFiles(resolved.templateDirectory, destination);
    assert.equal(
      fs.existsSync(path.join(destination, 'ness.config.mjs')),
      true,
      `${name} must include ness.config.mjs`,
    );
    for (const legacy of [
      '.npmignore',
      '.prettierrc',
      'instrumentation.mjs',
      'ness.server.config.mjs',
      'react-router.config.ts',
      'react-router.config.mjs',
      'vite.config.ts',
      'vite.config.mjs',
      'vite.rsc.config.mts',
    ]) {
      assert.equal(
        fs.existsSync(path.join(destination, legacy)),
        false,
        `${name} must not include ${legacy}`,
      );
    }
  }
});
