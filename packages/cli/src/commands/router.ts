import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolvePackageBin } from '../lib/packages.js';
import { runCommand } from '../lib/process.js';

export interface StartOptions {
  build?: string;
  host?: string;
  port?: string | number;
}

const CONFIG_COMMANDS = new Set(['build', 'dev', 'reveal', 'routes']);

function prepareUnifiedConfig(
  command: string,
  args: string[],
  cwd: string,
): { args: string[]; env: NodeJS.ProcessEnv } {
  const configFlagIndex = args.findIndex(
    argument => argument === '--config' || argument === '-c',
  );
  const explicitConfig =
    configFlagIndex >= 0 ? path.resolve(cwd, args[configFlagIndex + 1]!) : null;
  const defaultConfig = ['ness.config.ts', 'ness.config.mjs', 'ness.config.js']
    .map(candidate => path.join(cwd, candidate))
    .find(fs.existsSync);
  const configFile = explicitConfig || defaultConfig;
  const unified =
    configFile &&
    /^ness\.config\.(?:ts|mjs|js)$/.test(path.basename(configFile));
  if (!configFile || !unified || !fs.existsSync(configFile)) {
    return { args, env: {} };
  }

  const generatedRoot = path.join(cwd, '.ness', 'config');
  const adapter = path.join(generatedRoot, 'react-router.config.mjs');
  fs.mkdirSync(generatedRoot, { recursive: true });
  const configUrl = pathToFileURL(configFile).href;
  fs.writeFileSync(
    adapter,
    `import config from ${JSON.stringify(configUrl)};\nimport {resolveNessRouterConfig} from '@nessframework/router';\nexport default resolveNessRouterConfig(config, ${JSON.stringify(cwd)});\n`,
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
  command: string,
  args: string[] = [],
  cwd: string = process.cwd(),
): Promise<void> {
  const executable = resolvePackageBin('@react-router/dev', cwd);
  const unified = prepareUnifiedConfig(command, args, cwd);
  await runCommand(process.execPath, [executable, command, ...unified.args], {
    cwd,
    env: unified.env,
  });
}

export async function startProductionServer(
  options: StartOptions = {},
  cwd: string = process.cwd(),
): Promise<void> {
  const executable = resolvePackageBin(
    '@nessframework/core',
    cwd,
    'ness-serve',
  );
  const build = path.resolve(cwd, options.build || 'build/server/index.js');
  if (!fs.existsSync(build)) {
    // A static export is the one build that is *supposed* to have no server
    // bundle — tell the user what they actually have instead of implying the
    // build failed.
    try {
      const manifest = JSON.parse(
        fs.readFileSync(
          path.resolve(cwd, 'build', 'ness-manifest.json'),
          'utf8',
        ),
      ) as { output?: string };
      if (manifest.output === 'export') {
        throw new Error(
          "This build is a static export (output: 'export'): there is no server to start. Deploy build/client/ to any static host, or serve it locally with: npx serve build/client",
        );
      }
    } catch (error) {
      if (error instanceof Error && /static export/.test(error.message))
        throw error;
    }
    throw new Error(
      `Production build not found at ${build}. Run ness build first.`,
    );
  }
  await runCommand(process.execPath, [executable, build], {
    cwd,
    env: {
      HOST: options.host || process.env['HOST'] || '0.0.0.0',
      PORT: String(options.port || process.env['PORT'] || '3000'),
      NODE_ENV: 'production',
    },
  });
}
