import path from 'node:path';
import fs from 'fs-extra';
import { paint } from '../lib/colors.js';

export interface CleanOptions {
  /** Also remove `coverage`, which is not build output. */
  coverage?: boolean;
  dryRun?: boolean;
}

const GENERATED_DIRECTORIES = [
  '.ness',
  '.react-router',
  'build',
  'dist',
  'coverage',
];

export function cleanProject(
  options: CleanOptions = {},
  cwd: string = process.cwd(),
): string[] {
  const root = fs.realpathSync(cwd);
  const removed: string[] = [];

  for (const directory of GENERATED_DIRECTORIES) {
    if (directory === 'coverage' && !options.coverage) continue;
    const target = path.join(root, directory);
    if (!fs.existsSync(target)) continue;
    removed.push(directory);
    if (!options.dryRun) fs.removeSync(target);
  }

  if (!removed.length) {
    console.log(paint('green', 'Nothing to clean.'));
    return removed;
  }
  const action = options.dryRun ? 'Would remove' : 'Removed';
  console.log(
    `${paint(options.dryRun ? 'yellow' : 'green', action)} ${removed.join(', ')}`,
  );
  return removed;
}
