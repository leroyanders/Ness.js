#!/usr/bin/env node
process.env.NODE_ENV = 'production';

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import paths from '../config/paths.js';
import * as colors from '../utils/colors.js';

function run(script) {
  return spawnSync(process.execPath, [script], { stdio: 'inherit' });
}

const build = run(fileURLToPath(new URL('./build.js', import.meta.url)));
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

console.log(
  colors.paint(['bgBlue', 'bold'], ' PRODUCTION '),
  `🌱 Ness.js running on ${colors.paint(['blue', 'bold'], `http://localhost:${process.env.PORT || 3000}`)}`,
);
const server = run(path.join(paths.appdeploy, 'server.js'));
if (server.error) throw server.error;
process.exit(server.status ?? 1);
