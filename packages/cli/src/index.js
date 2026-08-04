import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import semver from 'semver';
import {
  applyPackageOverrides,
  checkForLatestVersion,
  createApp,
  normalizePackageOverrides,
  resolveTemplate,
} from './commands/create.js';
import { bundle, TARGETS as BUNDLE_TARGETS } from './commands/bundle.js';
import { cleanProject } from './commands/clean.js';
import {
  addDependency,
  removeDependency,
  resolveDependencyName,
  resolveUpdateDependencies,
  updateDependencies,
} from './commands/dependencies.js';
import { doctor, printEnvironmentInfo } from './commands/doctor.js';
import { migrateFromNext } from './commands/migrate.js';
import {
  generate,
  GENERATOR_TYPES,
  resolveGeneratorType,
} from './commands/generate.js';
import { runRouterCommand, startProductionServer } from './commands/router.js';
import { paint } from './lib/colors.js';
import { resolvePackageBin } from './lib/packages.js';
import { optionArgs } from './lib/process.js';

const packageJson = JSON.parse(
  fs.readFileSync(
    fileURLToPath(new URL('../package.json', import.meta.url)),
    'utf8',
  ),
);

export async function init() {
  let commandExecuted = false;
  const program = new Command('ness')
    .version(packageJson.version)
    .description(packageJson.description)
    .option('--info', 'print environment debug information');

  program
    .command('new')
    .alias('n')
    .description('create a new Ness.js application')
    .argument('<project_name>', 'directory for the new application')
    .option(
      '--template <name-or-path>',
      'use default, typescript, minimal, api, dashboard, or a custom template',
      'default',
    )
    .option('--rsc', 'enable experimental React Server Components')
    .option(
      '--package-override <name=spec>',
      'install a specific version, tag, or tarball of a framework package (repeatable)',
      (value, previous) => [...(previous || []), value],
    )
    .action(async (projectName, options) => {
      commandExecuted = true;
      const latest = await checkForLatestVersion(packageJson.name).catch(
        () => null,
      );
      if (latest && semver.lt(packageJson.version, latest)) {
        console.warn(
          paint(
            'yellow',
            `A newer ${packageJson.name} release is available (${latest}; current ${packageJson.version}).`,
          ),
        );
      }
      await createApp(projectName, options.template, options);
    });

  program
    .command('dev')
    .description('start the development server')
    .option('--host <host>', 'server hostname')
    .option('--port <port>', 'server port')
    .option('--open [path]', 'open the browser')
    .option('--mode <mode>', 'Vite environment mode')
    .option('--force', 'force dependency optimization')
    .option('--strict-port', 'fail when the selected port is unavailable')
    .action(async options => {
      commandExecuted = true;
      await runRouterCommand(
        'dev',
        optionArgs(options, {
          host: '--host',
          port: '--port',
          open: '--open',
          mode: '--mode',
          force: '--force',
          strictPort: '--strictPort',
        }),
      );
    });

  program
    .command('build')
    .description('create an optimized production build')
    .option('--config <file>', 'use a custom Vite config')
    .option('--mode <mode>', 'Vite environment mode')
    .option('--sourcemap-client', 'emit client source maps')
    .option('--sourcemap-server', 'emit server source maps')
    .option('--profile', 'run the build with the Node inspector')
    .action(async options => {
      commandExecuted = true;
      await runRouterCommand(
        'build',
        optionArgs(options, {
          config: '--config',
          mode: '--mode',
          sourcemapClient: '--sourcemapClient',
          sourcemapServer: '--sourcemapServer',
          profile: '--profile',
        }),
      );
    });

  program
    .command('start')
    .description('serve an existing production build')
    .option('--host <host>', 'server hostname')
    .option('--port <port>', 'server port')
    .option('--build <file>', 'server build entry', 'build/server/index.js')
    .action(async options => {
      commandExecuted = true;
      await startProductionServer(options);
    });

  program
    .command('bundle')
    .description('package an existing build for deployment')
    .argument(
      '[target]',
      `deployment target: ${BUNDLE_TARGETS.join(', ')}`,
      'node',
    )
    .option('--output <dir>', 'output directory (node target)')
    .option('--build-directory <dir>', 'build directory', 'build')
    .option('--name <name>', 'worker name (cloudflare target)')
    .action(async (target, options) => {
      commandExecuted = true;
      await bundle(target, {
        output: options.output,
        buildDirectory: options.buildDirectory,
        name: options.name,
      });
    });

  program
    .command('typegen')
    .description('generate route types')
    .option('--watch', 'regenerate types on changes')
    .action(async options => {
      commandExecuted = true;
      await runRouterCommand(
        'typegen',
        optionArgs(options, { watch: '--watch' }),
      );
    });

  program
    .command('routes')
    .description('print the application route tree')
    .option('--json', 'print JSON')
    .action(async options => {
      commandExecuted = true;
      await runRouterCommand('routes', optionArgs(options, { json: '--json' }));
    });

  program
    .command('reveal')
    .description(
      'write the default client or server entry into the application',
    )
    .argument('<entry>', 'entry.client or entry.server')
    .option('--no-typescript', 'generate JavaScript')
    .action(async (entry, options) => {
      commandExecuted = true;
      await runRouterCommand('reveal', [
        entry,
        ...(options.typescript === false ? ['--no-typescript'] : []),
      ]);
    });

  program
    .command('add')
    .description('install a Ness plugin or another package')
    .argument('<package>', 'package name or official plugin alias')
    .option('-D, --dev', 'save as a development dependency')
    .option('-E, --exact', 'save an exact version')
    .option('--dry-run', 'print the npm command without running it')
    .action(async (packageName, options) => {
      commandExecuted = true;
      await addDependency(packageName, options);
    });

  program
    .command('remove')
    .alias('rm')
    .description('uninstall a Ness plugin or another package')
    .argument('<package>', 'package name or official plugin alias')
    .option('--dry-run', 'print the npm command without running it')
    .action(async (packageName, options) => {
      commandExecuted = true;
      await removeDependency(packageName, options);
    });

  program
    .command('update')
    .description('update installed @nessframework packages')
    .argument('[packages...]', 'specific package names or aliases')
    .option('--tag <tag>', 'npm distribution tag', 'latest')
    .option('--dry-run', 'print the npm command without running it')
    .action(async (packages, options) => {
      commandExecuted = true;
      await updateDependencies(packages || [], options);
    });

  program
    .command('clean')
    .description('remove generated build and framework caches')
    .option('--coverage', 'also remove the coverage directory')
    .option('--dry-run', 'show directories without removing them')
    .action(options => {
      commandExecuted = true;
      cleanProject(options);
    });

  program
    .command('generate')
    .alias('g')
    .description('generate an application module from a schematic')
    .argument('<type>', GENERATOR_TYPES.join(', '))
    .argument('<name>', 'relative module or route name')
    .option('--dry-run', 'show the target file without creating it')
    .option('--force', 'overwrite an existing generated file')
    .action((type, name, options) => {
      commandExecuted = true;
      generate(type, name, options);
    });

  program
    .command('migrate')
    .description('migrate an application from another framework')
    .argument('<framework>', 'source framework: next')
    .argument('[directory]', 'application directory', '.')
    .option('--dry-run', 'print the plan without changing any file')
    .option('--force', 'run even with a dirty or absent git working tree')
    .action(async (framework, directory, options) => {
      commandExecuted = true;
      if (framework !== 'next') {
        throw new Error(
          `Unsupported migration source: ${framework}. Only "next" is supported.`,
        );
      }
      await migrateFromNext(directory, options);
    });

  program
    .command('doctor')
    .description('diagnose the current Ness.js application')
    .action(async () => {
      commandExecuted = true;
      await doctor();
    });

  program
    .command('info')
    .description('print environment and package information')
    .action(async () => {
      commandExecuted = true;
      await printEnvironmentInfo();
    });

  await program.parseAsync(process.argv);
  if (program.opts().info) return printEnvironmentInfo();
  if (!commandExecuted) program.outputHelp();
}

export {
  addDependency,
  cleanProject,
  applyPackageOverrides,
  bundle,
  BUNDLE_TARGETS,
  createApp,
  doctor,
  generate,
  GENERATOR_TYPES,
  migrateFromNext,
  normalizePackageOverrides,
  removeDependency,
  resolveDependencyName,
  resolveGeneratorType,
  resolvePackageBin,
  resolveTemplate,
  resolveUpdateDependencies,
  runRouterCommand,
  startProductionServer,
  updateDependencies,
};
