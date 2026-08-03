import path from 'node:path';
import fs from 'fs-extra';
import { paint } from '../lib/colors.js';
import { runNpm } from '../lib/process.js';

const NESS_PACKAGES = new Set([
  'analyzer',
  'cli',
  'compression',
  'core',
  'default',
  'env',
  'nest',
  'security',
  'tailwind',
  'typescript',
]);

function assertProject(cwd) {
  const packagePath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error(`No package.json found in ${cwd}.`);
  }
  return fs.readJsonSync(packagePath);
}

function assertPackageSpec(spec) {
  const value = String(spec || '').trim();
  if (!value || value.startsWith('-') || /\s/.test(value)) {
    throw new Error(`Invalid package specifier: ${spec || '(empty)'}`);
  }
  return value;
}

export function resolveDependencyName(spec) {
  const value = assertPackageSpec(spec);
  if (value.startsWith('@') || value.includes('/') || value.includes(':')) {
    return value;
  }

  const match = /^([a-z0-9._-]+)(@.+)?$/i.exec(value);
  if (match && NESS_PACKAGES.has(match[1])) {
    return `@nessframework/${match[1]}${match[2] || ''}`;
  }
  return value;
}

function packageWithTag(spec, tag) {
  const value = resolveDependencyName(spec);
  const hasVersion = value.startsWith('@')
    ? value.indexOf('@', 1) !== -1
    : value.includes('@');
  return hasVersion ? value : `${value}@${tag}`;
}

export function resolveUpdateDependencies(packages = [], cwd = process.cwd()) {
  assertProject(cwd);
  if (packages.length) return packages.map(resolveDependencyName);

  const manifest = fs.readJsonSync(path.join(cwd, 'package.json'));
  const installed = new Set();
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ]) {
    for (const name of Object.keys(manifest[field] || {})) {
      if (name.startsWith('@nessframework/')) installed.add(name);
    }
  }
  return installed.size
    ? [...installed].sort()
    : ['@nessframework/core', '@nessframework/cli'];
}

function printDryRun(args) {
  console.log(`${paint('yellow', 'Would run')} npm ${args.join(' ')}`);
}

export async function addDependency(spec, options = {}, cwd = process.cwd()) {
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
  spec,
  options = {},
  cwd = process.cwd(),
) {
  assertProject(cwd);
  const dependency = resolveDependencyName(spec);
  const args = ['uninstall', '--no-audit', '--', dependency];
  if (options.dryRun) return printDryRun(args);
  console.log(`${paint('cyan', 'Removing')} ${dependency}...`);
  await runNpm(cwd, args);
}

export async function updateDependencies(
  packages = [],
  options = {},
  cwd = process.cwd(),
) {
  const dependencies = resolveUpdateDependencies(packages, cwd).map(spec =>
    packageWithTag(spec, options.tag || 'latest'),
  );
  const args = ['install', '--no-audit', '--', ...dependencies];
  if (options.dryRun) return printDryRun(args);
  console.log(`${paint('cyan', 'Updating')} ${dependencies.join(', ')}...`);
  await runNpm(cwd, args);
}
