import path from 'node:path';
import { pathToFileURL } from 'node:url';
import envinfo from 'envinfo';
import fs from 'fs-extra';
import semver from 'semver';
import { paint } from '../lib/colors.js';
import { resolvePackageDirectory } from '../lib/packages.js';

function isInstalled(packageName, cwd) {
  try {
    resolvePackageDirectory(packageName, cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * RSC is the default mode `ness new` scaffolds, so `ness doctor` surfaces its
 * status the same way it does every other package check — plus, unlike a
 * plain pass/fail, the known upstream gaps from `rscSupport()` (see
 * `@nessframework/core/rsc`), since those aren't things a developer can fix.
 */
async function checkRsc(cwd) {
  const rscInstalled = isInstalled('@vitejs/plugin-rsc', cwd);
  if (!rscInstalled) {
    return {
      name: 'RSC mode',
      ok: true,
      detail:
        'not installed (classic SSR mode; scaffold without --no-rsc to opt in)',
      gaps: [],
    };
  }
  try {
    const coreDirectory = resolvePackageDirectory('@nessframework/core', cwd);
    const rscModule = await import(
      pathToFileURL(path.join(coreDirectory, 'src', 'rsc', 'index.js')).href
    );
    const support = rscModule.rscSupport();
    return {
      name: 'RSC mode',
      ok: true,
      detail: `@vitejs/plugin-rsc installed — ${support.supported.length} capabilities supported, ${support.unsupported.length} known upstream gap(s)`,
      gaps: support.unsupported,
    };
  } catch (error) {
    return {
      name: 'RSC mode',
      ok: true,
      detail: `@vitejs/plugin-rsc installed (${error.message})`,
      gaps: [],
    };
  }
}

export async function doctor(cwd = process.cwd()) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });
  add(
    'Node.js',
    semver.satisfies(process.version, '>=20.19.0'),
    process.version,
  );
  add('package.json', fs.existsSync(path.join(cwd, 'package.json')), cwd);
  try {
    const core = fs.readJsonSync(
      path.join(
        resolvePackageDirectory('@nessframework/core', cwd),
        'package.json',
      ),
    );
    add(
      '@nessframework/core',
      semver.satisfies(core.version, '^6.0.0'),
      core.version,
    );
  } catch (error) {
    add('@nessframework/core', false, error.message);
  }
  try {
    const nest = fs.readJsonSync(
      path.join(
        resolvePackageDirectory('@nessframework/nest', cwd),
        'package.json',
      ),
    );
    add(
      '@nessframework/nest',
      semver.satisfies(nest.version, '^1.0.0'),
      nest.version,
    );
  } catch (error) {
    add('@nessframework/nest', false, error.message);
  }
  add(
    'Ness config',
    [
      'ness.config.mjs',
      'ness.config.js',
      'vite.config.ts',
      'vite.config.js',
      'vite.config.mts',
      'vite.config.mjs',
    ].some(file => fs.existsSync(path.join(cwd, file))),
    'ness.config.mjs',
  );
  add(
    'App root',
    ['root.tsx', 'root.jsx'].some(file =>
      fs.existsSync(path.join(cwd, 'app', file)),
    ),
    'app/root',
  );
  add('Routes', fs.existsSync(path.join(cwd, 'app', 'routes')), 'app/routes');
  add(
    'Nest AppModule',
    ['app.module.ts', 'app.module.mts', 'app.module.js'].some(file =>
      fs.existsSync(path.join(cwd, 'app', 'server', file)),
    ),
    'app/server/app.module',
  );
  const rsc = await checkRsc(cwd);
  checks.push(rsc);

  for (const check of checks) {
    console.log(
      `${check.ok ? paint('green', '✓') : paint('red', '✗')} ${check.name}: ${check.detail}`,
    );
  }
  for (const gap of rsc.gaps) {
    console.log(paint('yellow', `  ⚠ ${gap}`));
  }
  const failures = checks.filter(check => !check.ok);
  if (failures.length) {
    throw new Error(`${failures.length} Ness doctor check(s) failed.`);
  }
  console.log(paint(['green', 'bold'], '\nNess doctor found no problems.'));
  return checks;
}

export async function printEnvironmentInfo() {
  console.log(paint('bold', '\nEnvironment Info:\n'));
  console.log(
    await envinfo.run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'npm', 'Yarn'],
        Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        npmPackages: [
          '@nessframework/core',
          '@nessframework/nest',
          '@nestjs/common',
          '@nestjs/core',
        ],
        npmGlobalPackages: ['@nessframework/cli'],
      },
      { duplicates: true, showNotFound: true },
    ),
  );
}
