import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolvePackageBin } from '../lib/packages.js';
import { runCommand } from '../lib/process.js';

const CONFIG_COMMANDS = new Set(['build', 'dev', 'reveal', 'routes']);

function prepareUnifiedConfig(command, args, cwd) {
  const configFlagIndex = args.findIndex(
    argument => argument === '--config' || argument === '-c',
  );
  const explicitConfig =
    configFlagIndex >= 0 ? path.resolve(cwd, args[configFlagIndex + 1]) : null;
  const defaultConfig = ['ness.config.mjs', 'ness.config.js']
    .map(candidate => path.join(cwd, candidate))
    .find(fs.existsSync);
  const configFile = explicitConfig || defaultConfig;
  const unified =
    configFile && /^ness\.config\.(?:mjs|js)$/.test(path.basename(configFile));
  if (!configFile || !unified || !fs.existsSync(configFile)) {
    return { args, env: {} };
  }

  const generatedRoot = path.join(cwd, '.ness', 'config');
  const adapter = path.join(generatedRoot, 'react-router.config.mjs');
  fs.mkdirSync(generatedRoot, { recursive: true });
  const configUrl = pathToFileURL(configFile).href;
  fs.writeFileSync(
    adapter,
    `import config from ${JSON.stringify(configUrl)};\nimport {resolveNessRouterConfig} from '@ness/router';\nexport default resolveNessRouterConfig(config, ${JSON.stringify(cwd)});\n`,
  );
  return {
    args:
      CONFIG_COMMANDS.has(command) && command !== 'typegen' && !explicitConfig
        ? [...args, '--config', configFile]
        : args,
    env: {
      NESS_ROOT: cwd,
      REACT_ROUTER_ROOT: generatedRoot,
    },
  };
}

export async function runRouterCommand(
  command,
  args = [],
  cwd = process.cwd(),
) {
  const executable = resolvePackageBin('@react-router/dev', cwd);
  const unified = prepareUnifiedConfig(command, args, cwd);
  await runCommand(process.execPath, [executable, command, ...unified.args], {
    cwd,
    env: unified.env,
  });
}

export async function startProductionServer(options = {}, cwd = process.cwd()) {
  const executable = resolvePackageBin('@ness/core', cwd, 'ness-serve');
  const build = path.resolve(cwd, options.build || 'build/server/index.js');
  if (!fs.existsSync(build)) {
    throw new Error(
      `Production build not found at ${build}. Run ness build first.`,
    );
  }
  await runCommand(process.execPath, [executable, build], {
    cwd,
    env: {
      HOST: options.host || process.env.HOST || '0.0.0.0',
      PORT: options.port || process.env.PORT || '3000',
      NODE_ENV: 'production',
    },
  });
}
