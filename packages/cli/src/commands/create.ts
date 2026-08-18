import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import semver from 'semver';
import { paint } from '../lib/colors.js';
import { resolvePackageDirectory } from '../lib/packages.js';
import { runNpm } from '../lib/process.js';

export interface CreateAppOptions {
  /** `false` scaffolds classic SSR mode instead of the default RSC mode. */
  rsc?: boolean;
  packageOverride?: string | string[] | Record<string, string>;
}

/** A template resolved to something installable, local or published. */
export interface ResolvedTemplate {
  name: string;
  spec: string;
  local?: boolean;
  directory?: string;
  templateDirectory?: string;
  typescript?: boolean;
}

/** The subset of a manifest this command reads or merges. */
export interface TemplatePackage {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  ness?: { template?: string };
  [field: string]: unknown;
}

export function checkForLatestVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      `https://registry.npmjs.org/-/package/${encodeURIComponent(packageName)}/dist-tags`,
      { timeout: 3_000 },
      response => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Registry returned ${response.statusCode}`));
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            resolve((JSON.parse(body) as { latest: string }).latest);
          } catch (error) {
            reject(error as Error);
          }
        });
      },
    );
    request.on('timeout', () =>
      request.destroy(new Error('Registry request timed out')),
    );
    request.on('error', reject);
  });
}

/**
 * `ness new` with no `--template` scaffolds TypeScript. The JavaScript starter
 * is still `@nessframework/default` under three names — `default` keeps working
 * for anyone who wrote it into a script back when it was the one you got.
 */
export const DEFAULT_TEMPLATE = 'typescript';

export function resolveTemplate(template?: string): ResolvedTemplate {
  const officialTemplates: Record<string, string> = {
    typescript: '@nessframework/typescript',
    ts: '@nessframework/typescript',
    javascript: '@nessframework/default',
    js: '@nessframework/default',
    default: '@nessframework/default',
    minimal: '@nessframework/minimal',
    api: '@nessframework/api',
    dashboard: '@nessframework/dashboard',
  };
  const officialTemplate = officialTemplates[template || DEFAULT_TEMPLATE];
  if (officialTemplate) {
    return { name: officialTemplate, spec: officialTemplate };
  }

  const requested = template!;
  const possiblePath = resolveTemplatePath(requested);
  if (fs.existsSync(possiblePath)) {
    const directory = fs.realpathSync(possiblePath);
    if (!fs.statSync(directory).isDirectory()) {
      throw new Error(
        `A local Ness template must be a directory: ${directory}`,
      );
    }

    const packagePath = path.join(directory, 'package.json');
    const manifest: TemplatePackage = fs.existsSync(packagePath)
      ? (fs.readJsonSync(packagePath) as TemplatePackage)
      : {};
    const templateDirectory = resolveTemplateDirectory(
      directory,
      manifest,
      true,
    );

    return {
      name: manifest.name || `local:${path.basename(directory)}`,
      spec: `file:${directory}`,
      local: true,
      directory,
      templateDirectory,
      typescript: fs.existsSync(path.join(templateDirectory, 'tsconfig.json')),
    };
  }

  if (looksLikeTemplatePath(requested)) {
    throw new Error(`Local template directory does not exist: ${possiblePath}`);
  }

  if (requested.startsWith('@')) return { name: requested, spec: requested };

  const name = requested.startsWith('ness-template-')
    ? requested
    : `ness-template-${requested}`;
  return { name, spec: name };
}

function looksLikeTemplatePath(template: string): boolean {
  return (
    path.isAbsolute(template) ||
    template === '~' ||
    template.startsWith('~/') ||
    template.startsWith('./') ||
    template.startsWith('../') ||
    template.startsWith('file:')
  );
}

function resolveTemplatePath(template: string): string {
  const value = template.startsWith('file:') ? template.slice(5) : template;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return path.resolve(value);
}

function resolveTemplateDirectory(
  packageDirectory: string,
  manifest: TemplatePackage = {},
  allowDirect = false,
): string {
  const packageRoot = fs.realpathSync(packageDirectory);
  const configuredTemplate = manifest.ness?.template;
  const candidate = path.resolve(packageRoot, configuredTemplate || 'template');
  assertInsidePackage(packageRoot, candidate);

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    const templateDirectory = fs.realpathSync(candidate);
    assertInsidePackage(packageRoot, templateDirectory);
    return templateDirectory;
  }
  if (
    !configuredTemplate &&
    allowDirect &&
    fs.existsSync(path.join(packageRoot, 'app'))
  ) {
    return packageRoot;
  }

  const expected = configuredTemplate
    ? `the configured ${configuredTemplate}/ directory`
    : allowDirect
      ? 'an app/ directory or a template/ directory'
      : 'a template/ directory';
  throw new Error(`Template ${packageRoot} must contain ${expected}.`);
}

function assertInsidePackage(
  packageDirectory: string,
  candidate: string,
): void {
  const relative = path.relative(packageDirectory, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      'The configured template directory must stay inside its package.',
    );
  }
}

const IGNORED_TEMPLATE_ENTRIES = new Set([
  '.git',
  '.npmignore',
  '.ness',
  '.react-router',
  'build',
  'bun.lock',
  'bun.lockb',
  'deploy',
  'dist',
  'node_modules',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'template.json',
  'yarn.lock',
]);

export function copyTemplateFiles(
  templateDirectory: string,
  destination: string,
): void {
  const source = fs.realpathSync(templateDirectory);
  const relativeDestination = path.relative(source, destination);
  if (
    relativeDestination === '' ||
    (!relativeDestination.startsWith('..') &&
      !path.isAbsolute(relativeDestination))
  ) {
    throw new Error(
      'The application directory cannot be inside the local template directory.',
    );
  }

  fs.copySync(source, destination, {
    overwrite: true,
    filter(filename: string) {
      const relative = path.relative(source, filename);
      if (!relative) return true;
      return !relative
        .split(path.sep)
        .some(entry => IGNORED_TEMPLATE_ENTRIES.has(entry));
    },
  });
}

export function readTemplatePackage(
  templateDirectory: string,
  packageDirectory: string,
): TemplatePackage {
  const templateManifest = [
    path.join(templateDirectory, 'template.json'),
    path.join(packageDirectory, 'template.json'),
  ].find(fs.existsSync);
  if (templateManifest) {
    const contents = fs.readJsonSync(templateManifest) as TemplatePackage & {
      package?: TemplatePackage;
    };
    return contents.package || contents;
  }

  if (
    fs.realpathSync(templateDirectory) !== fs.realpathSync(packageDirectory)
  ) {
    return {};
  }
  const packagePath = path.join(packageDirectory, 'package.json');
  return fs.existsSync(packagePath)
    ? (fs.readJsonSync(packagePath) as TemplatePackage)
    : {};
}

const MERGED_PACKAGE_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'scripts',
] as const;

export function mergeTemplatePackage(
  root: string,
  templatePackage: TemplatePackage = {},
): TemplatePackage {
  const packagePath = path.join(root, 'package.json');
  const applicationPackage = fs.readJsonSync(packagePath) as TemplatePackage;
  if (typeof templatePackage.description === 'string') {
    applicationPackage.description = templatePackage.description;
  }
  for (const field of MERGED_PACKAGE_FIELDS) {
    if (!templatePackage[field]) continue;
    applicationPackage[field] = {
      ...(applicationPackage[field] || {}),
      ...templatePackage[field],
    };
  }
  for (const field of [
    'browserslist',
    'eslintConfig',
    'overrides',
    'prettier',
  ]) {
    if (templatePackage[field] !== undefined) {
      applicationPackage[field] = templatePackage[field];
    }
  }
  fs.writeFileSync(
    packagePath,
    `${JSON.stringify(applicationPackage, null, 2)}${os.EOL}`,
  );
  return applicationPackage;
}

function validateProjectDirectory(root: string): void {
  if (!fs.existsSync(root)) return;
  const conflicts = fs
    .readdirSync(root)
    .filter(file => !['.DS_Store', '.git'].includes(file));
  if (conflicts.length) {
    throw new Error(
      `The directory is not empty: ${conflicts.slice(0, 5).join(', ')}`,
    );
  }
}

/**
 * Turns repeated `--package-override name=spec` values into a map. Used to
 * install a canary, a release candidate, or a locally packed tarball instead of
 * the published version — which is also how the end-to-end suite verifies the
 * working tree rather than the registry.
 */
export function normalizePackageOverrides(
  input: CreateAppOptions['packageOverride'],
): Map<string, string> {
  const entries = [input].flat().filter(Boolean) as Array<
    string | Record<string, string>
  >;
  const overrides = new Map<string, string>();
  for (const entry of entries) {
    if (typeof entry === 'object') {
      for (const [name, spec] of Object.entries(entry))
        overrides.set(name, spec);
      continue;
    }
    const separator = entry.indexOf('=');
    if (separator <= 0) {
      throw new Error(
        `A package override must look like name=spec; received: ${entry}`,
      );
    }
    overrides.set(entry.slice(0, separator), entry.slice(separator + 1));
  }
  return overrides;
}

/**
 * Replaces matching install specs in place. An override for a package the
 * template does not install is appended, so extra plugins can be added too.
 */
export function applyPackageOverrides(
  dependencies: string[],
  overrides: Map<string, string> | undefined,
  { append = true }: { append?: boolean } = {},
): string[] {
  if (!overrides?.size) return dependencies;
  const seen = new Set<string>();
  for (const [index, dependency] of dependencies.entries()) {
    const name = dependency.startsWith('@')
      ? `@${dependency.slice(1).split('@')[0]}`
      : dependency.split('@')[0]!;
    if (!overrides.has(name)) continue;
    dependencies[index] = `${name}@${overrides.get(name)}`;
    seen.add(name);
  }
  if (!append) return dependencies;
  for (const [name, spec] of overrides) {
    if (!seen.has(name)) dependencies.push(`${name}@${spec}`);
  }
  return dependencies;
}

export async function createApp(
  projectName: string,
  templateOption: string | undefined,
  createOptions: CreateAppOptions = {},
): Promise<void> {
  // The scaffolded application ships a TypeScript `ness.config.ts`, which
  // `ness start` imports at runtime — and importing TypeScript needs the Node
  // that strips types. The framework packages themselves still run on 20.19;
  // this floor is the config's, not theirs.
  if (!semver.satisfies(process.version, '>=22.18.0')) {
    throw new Error(
      `Node.js 22.18 or newer is required; current version is ${process.version}.`,
    );
  }

  const root = path.resolve(projectName);
  const appName = path.basename(root);
  if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(appName)) {
    throw new Error(
      'Project names may contain lowercase letters, numbers, dots, dashes, and underscores.',
    );
  }

  validateProjectDirectory(root);
  fs.ensureDirSync(root);
  const template = resolveTemplate(templateOption);
  let typescriptTemplate =
    Boolean(template.typescript) || template.name.includes('typescript');
  const applicationPackage = {
    name: appName,
    version: '0.1.0',
    private: true,
    type: 'module',
    engines: { node: '>=22.18.0' },
    scripts: {
      start: 'ness dev',
      dev: 'ness dev',
      build: 'ness build',
      'start:prod': 'ness start',
      typegen: 'ness typegen',
      check: typescriptTemplate
        ? 'ness typegen && tsc --noEmit'
        : 'ness typegen',
    },
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify(applicationPackage, null, 2)}${os.EOL}`,
  );

  // Runtime dependencies ship to production; build tooling does not. Keeping
  // them apart is what lets `ness bundle` trace a small deployment instead of
  // copying Vite, TypeScript, and Babel into the container.
  const dependencies = [
    '@nessframework/cache',
    // Every starter's pages declare their metadata with its `Meta`, so this is
    // not optional the way the rest of the component set is.
    '@nessframework/components',
    '@nessframework/core',
    '@nessframework/nest',
    '@nessframework/router',
    '@nestjs/common@11.1.28',
    '@nestjs/core@11.1.28',
    'reflect-metadata@0.2.2',
    'rxjs@7.8.2',
    'react',
    'react-dom',
    'react-router',
    'isbot',
    ...(template.local ? [] : [template.spec]),
  ];
  const developmentDependencies = [
    '@nessframework/cli',
    '@react-router/dev@8.3.0',
    'vite@8.2.0',
  ];
  // RSC is the default mode for new apps; pass --no-rsc to scaffold the
  // classic SSR mode instead, which skips the pre-stable @vitejs/plugin-rsc
  // and react-server-dom-webpack dependencies entirely.
  if (createOptions.rsc !== false) {
    developmentDependencies.push('@vitejs/plugin-rsc@0.5.27');
    dependencies.push('react-server-dom-webpack@19.2.8');
  }

  const overrides = normalizePackageOverrides(createOptions.packageOverride);
  // Overrides rewrite specs that are already being installed; they never add a
  // package. Appending an unmatched one would put something the template never
  // asked for into runtime dependencies — and build-only packages landing
  // there is exactly what the dev/runtime split above exists to prevent.
  applyPackageOverrides(developmentDependencies, overrides, { append: false });
  applyPackageOverrides(dependencies, overrides, { append: false });

  console.log(`Creating a new Ness app in ${paint('blue', root)}.`);
  if (template.local) {
    console.log(`Using local template ${paint('cyan', template.directory)}.`);
  }
  console.log(
    `Installing ${[...dependencies, ...developmentDependencies].join(', ')}...\n`,
  );
  await runNpm(root, [
    'install',
    '--no-audit',
    '--save',
    '--save-exact',
    '--loglevel',
    'error',
    ...dependencies,
  ]);
  await runNpm(root, [
    'install',
    '--no-audit',
    '--save-dev',
    '--save-exact',
    '--loglevel',
    'error',
    ...developmentDependencies,
  ]);

  const templatePackageDirectory = template.local
    ? template.directory!
    : resolvePackageDirectory(template.name, root);
  const templateDirectory = template.local
    ? template.templateDirectory!
    : resolveTemplateDirectory(
        templatePackageDirectory,
        fs.readJsonSync(
          path.join(templatePackageDirectory, 'package.json'),
        ) as TemplatePackage,
      );
  const templatePackage = readTemplatePackage(
    templateDirectory,
    templatePackageDirectory,
  );
  copyTemplateFiles(templateDirectory, root);

  if (!template.local) {
    await runNpm(root, [
      'uninstall',
      '--no-audit',
      '--save',
      '--loglevel',
      'error',
      template.name,
    ]);
  }

  const mergedPackage = mergeTemplatePackage(root, templatePackage);
  typescriptTemplate =
    typescriptTemplate || fs.existsSync(path.join(root, 'tsconfig.json'));
  if (
    typescriptTemplate &&
    mergedPackage.scripts?.['check'] === 'ness typegen'
  ) {
    mergeTemplatePackage(root, {
      scripts: { check: 'ness typegen && tsc --noEmit' },
    });
  }

  if (createOptions.rsc === false) disableRsc(root);
  // A no-op once a template's config already spells out `rsc: true` directly
  // (every official template does), but keeps `--template <local-path>`
  // pointed at an older, env-var-gated custom template working.
  else enableRsc(root);
  if (typescriptTemplate) {
    await runNpm(root, [
      'install',
      '--no-audit',
      '--save-dev',
      '--save-exact',
      '--loglevel',
      'error',
      '@types/node',
      '@types/react',
      '@types/react-dom',
      'typescript',
    ]);
  } else {
    await runNpm(root, ['install', '--no-audit', '--loglevel', 'error']);
  }

  console.log(
    paint(['green', 'bold'], `\nSuccess! Created ${appName} at ${root}.\n`),
  );
  console.log(`  ${paint('cyan', `cd ${projectName}`)}`);
  console.log(`  ${paint('cyan', 'npm start')}\n`);
}

function enableRsc(root: string): void {
  const unifiedConfig = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js']
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (unifiedConfig) {
    const source = fs.readFileSync(unifiedConfig, 'utf8');
    fs.writeFileSync(
      unifiedConfig,
      source.replaceAll("process.env.NESS_EXPERIMENTAL_RSC === 'true'", 'true'),
    );
    return;
  }

  const viteConfig = ['vite.config.ts', 'vite.config.mjs', 'vite.config.js']
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (viteConfig) {
    const source = fs.readFileSync(viteConfig, 'utf8');
    fs.writeFileSync(viteConfig, source.replace('ness()', 'ness({rsc: true})'));
  }

  const routerConfig = [
    'react-router.config.ts',
    'react-router.config.mjs',
    'react-router.config.js',
  ]
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (routerConfig) {
    const source = fs.readFileSync(routerConfig, 'utf8');
    fs.writeFileSync(
      routerConfig,
      source.replace("process.env.NESS_EXPERIMENTAL_RSC === 'true'", 'true'),
    );
  }
}

/**
 * The `--no-rsc` counterpart to `enableRsc`. Every official template now
 * spells `rsc: true` directly (RSC is the default), so this only needs to
 * flip that literal back — for a project that wants to avoid the pre-stable
 * `@vitejs/plugin-rsc` dependency entirely, not because anything stops
 * working under RSC: `router.prerender` works the same either way.
 */
function disableRsc(root: string): void {
  const unifiedConfig = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js']
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (unifiedConfig) {
    const source = fs.readFileSync(unifiedConfig, 'utf8');
    fs.writeFileSync(
      unifiedConfig,
      source.replaceAll('rsc: true', 'rsc: false'),
    );
    return;
  }

  const viteConfig = ['vite.config.ts', 'vite.config.mjs', 'vite.config.js']
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (viteConfig) {
    const source = fs.readFileSync(viteConfig, 'utf8');
    fs.writeFileSync(
      viteConfig,
      source.replace('ness()', 'ness({rsc: false})'),
    );
  }

  const routerConfig = [
    'react-router.config.ts',
    'react-router.config.mjs',
    'react-router.config.js',
  ]
    .map(filename => path.join(root, filename))
    .find(fs.existsSync);
  if (routerConfig) {
    const source = fs.readFileSync(routerConfig, 'utf8');
    fs.writeFileSync(
      routerConfig,
      source.replaceAll('rsc: true', 'rsc: false'),
    );
  }
}
