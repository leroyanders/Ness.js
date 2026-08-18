import path from 'node:path';
import fs from 'fs-extra';
import { paint } from '../lib/colors.js';
import { runNpm } from '../lib/process.js';

export interface DependencyOptions {
  dev?: boolean;
  exact?: boolean;
  dryRun?: boolean;
}

export interface UpdateOptions {
  tag?: string;
  dryRun?: boolean;
}

interface ProjectManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const NESS_PACKAGES = new Set([
  'analyzer',
  'cli',
  'components',
  'compression',
  'core',
  'default',
  'env',
  'nest',
  'security',
  'tailwind',
  'typescript',
]);

function assertProject(cwd: string): ProjectManifest {
  const packagePath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error(`No package.json found in ${cwd}.`);
  }
  return fs.readJsonSync(packagePath) as ProjectManifest;
}

function assertPackageSpec(spec: string): string {
  const value = String(spec || '').trim();
  if (!value || value.startsWith('-') || /\s/.test(value)) {
    throw new Error(`Invalid package specifier: ${spec || '(empty)'}`);
  }
  return value;
}

export function resolveDependencyName(spec: string): string {
  const value = assertPackageSpec(spec);
  if (value.startsWith('@') || value.includes('/') || value.includes(':')) {
    return value;
  }

  const match = /^([a-z0-9._-]+)(@.+)?$/i.exec(value);
  if (match && NESS_PACKAGES.has(match[1]!)) {
    return `@nessframework/${match[1]}${match[2] || ''}`;
  }
  return value;
}

function packageWithTag(spec: string, tag: string): string {
  const value = resolveDependencyName(spec);
  const hasVersion = value.startsWith('@')
    ? value.indexOf('@', 1) !== -1
    : value.includes('@');
  return hasVersion ? value : `${value}@${tag}`;
}

export function resolveUpdateDependencies(
  packages: string[] = [],
  cwd: string = process.cwd(),
): string[] {
  assertProject(cwd);
  if (packages.length) return packages.map(resolveDependencyName);

  const manifest = fs.readJsonSync(
    path.join(cwd, 'package.json'),
  ) as ProjectManifest;
  const installed = new Set<string>();
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ] as const) {
    for (const name of Object.keys(manifest[field] || {})) {
      if (name.startsWith('@nessframework/')) installed.add(name);
    }
  }
  return installed.size
    ? [...installed].sort()
    : ['@nessframework/core', '@nessframework/cli'];
}

function printDryRun(args: string[]): void {
  console.log(`${paint('yellow', 'Would run')} npm ${args.join(' ')}`);
}

export async function addDependency(
  spec: string,
  options: DependencyOptions = {},
  cwd: string = process.cwd(),
): Promise<void> {
  assertProject(cwd);
  const dependency = resolveDependencyName(spec);
  const args = [
    'install',
    '--no-audit',
    options.dev ? '--save-dev' : '--save',
    ...(options.exact ? ['--save-exact'] : []),
    '--',
    dependency,
  ];
  if (options.dryRun) return printDryRun(args);
  console.log(`${paint('cyan', 'Adding')} ${dependency}...`);
  await runNpm(cwd, args);
}

export async function removeDependency(
  spec: string,
  options: DependencyOptions = {},
  cwd: string = process.cwd(),
): Promise<void> {
  assertProject(cwd);
  const dependency = resolveDependencyName(spec);
  const args = ['uninstall', '--no-audit', '--', dependency];
  if (options.dryRun) return printDryRun(args);
  console.log(`${paint('cyan', 'Removing')} ${dependency}...`);
  await runNpm(cwd, args);
}

export async function updateDependencies(
  packages: string[] = [],
  options: UpdateOptions = {},
  cwd: string = process.cwd(),
): Promise<void> {
  const dependencies = resolveUpdateDependencies(packages, cwd).map(spec =>
    packageWithTag(spec, options.tag || 'latest'),
  );
  const args = ['install', '--no-audit', '--', ...dependencies];
  if (options.dryRun) return printDryRun(args);
  console.log(`${paint('cyan', 'Updating')} ${dependencies.join(', ')}...`);
  await runNpm(cwd, args);
}
