import path from 'node:path';
import { pathToFileURL } from 'node:url';
import envinfo from 'envinfo';
import fs from 'fs-extra';
import semver from 'semver';
import { paint } from '../lib/colors.js';
import { resolvePackageDirectory } from '../lib/packages.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  gaps?: string[];
}

function isInstalled(packageName: string, cwd: string): boolean {
  try {
    resolvePackageDirectory(packageName, cwd);
    return true;
  } catch {
    return false;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * RSC is the default mode `ness new` scaffolds, so `ness doctor` surfaces its
 * status the same way it does every other package check — plus, unlike a
 * plain pass/fail, the known upstream gaps from `rscSupport()` (see
 * `@nessframework/core/rsc`), since those aren't things a developer can fix.
 */
async function checkRsc(cwd: string): Promise<Required<DoctorCheck>> {
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
    const rscModule = (await import(
      pathToFileURL(path.join(coreDirectory, 'dist', 'rsc', 'index.js')).href
    )) as {
      rscSupport(): { supported: string[]; unsupported: string[] };
    };
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
      detail: `@vitejs/plugin-rsc installed (${messageOf(error)})`,
      gaps: [],
    };
  }
}

export async function doctor(
  cwd: string = process.cwd(),
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });
  // The application's floor, not the framework packages': a `ness.config.ts`
  // is imported at runtime, and importing TypeScript needs 22.18.
  add(
    'Node.js',
    semver.satisfies(process.version, '>=22.18.0'),
    process.version,
  );
  add('package.json', fs.existsSync(path.join(cwd, 'package.json')), cwd);
  try {
    const core = fs.readJsonSync(
      path.join(
        resolvePackageDirectory('@nessframework/core', cwd),
        'package.json',
      ),
    ) as { version: string };
    // A floor, not a caret range. What this catches is an install left
    // behind by an old CLI; drifting permissive as the framework moves on is
    // the harmless direction, while a caret pinned to one major goes stale on
    // the next release and fails a perfectly healthy application.
    add(
      '@nessframework/core',
      semver.satisfies(core.version, '>=9.0.0'),
      core.version,
    );
  } catch (error) {
    add('@nessframework/core', false, messageOf(error));
  }
  try {
    const nest = fs.readJsonSync(
      path.join(
        resolvePackageDirectory('@nessframework/nest', cwd),
        'package.json',
      ),
    ) as { version: string };
    add(
      '@nessframework/nest',
      semver.satisfies(nest.version, '>=3.0.0'),
      nest.version,
    );
  } catch (error) {
    add('@nessframework/nest', false, messageOf(error));
  }
  add(
    'Ness config',
    [
      'ness.config.ts',
      'ness.config.mjs',
      'ness.config.js',
      'vite.config.ts',
      'vite.config.js',
      'vite.config.mts',
      'vite.config.mjs',
    ].some(file => fs.existsSync(path.join(cwd, file))),
    'ness.config.ts',
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

export async function printEnvironmentInfo(): Promise<void> {
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
