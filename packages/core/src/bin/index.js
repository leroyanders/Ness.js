#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sade from 'sade';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

function dispatchScript(script) {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL(`../scripts/${script}.js`, import.meta.url)),
      ...process.argv.slice(3),
    ],
    { stdio: 'inherit' },
  );

  if (result.error) throw result.error;
  if (result.signal) {
    console.error(`The ${script} command was terminated by ${result.signal}.`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

const program = sade('ness-core');
program.version(pkg.version);
program
  .command('build')
  .describe('Build the application for production.')
  .action(() => dispatchScript('build'));
program
  .command('start')
  .describe('Start the development server.')
  .action(() => dispatchScript('start'));
program
  .command('production')
  .describe('Build and start the production server.')
  .action(() => dispatchScript('production'));
program
  .command('generate')
  .describe('Generate hooks, pages, or components.')
  .option('-t, --type', 'Artifact type')
  .option('-o, --output', 'Output path')
  .action(() => dispatchScript('generate'));
program.parse(process.argv);
