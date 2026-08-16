import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { paint } from '../lib/colors.js';

/**
 * Next.js App Router files that already have the same meaning in Ness.js. The
 * conventions overlap almost exactly, which is what makes this migration
 * mechanical rather than a rewrite.
 */
const ROUTE_FILES = new Set([
  'page',
  'layout',
  'loading',
  'error',
  'not-found',
  'route',
  'forbidden',
  'unauthorized',
  'template',
  'sitemap',
  'robots',
  'manifest',
]);

/** Files with no Ness equivalent; they are reported, not moved. */
const UNSUPPORTED_FILES = new Map([
  ['default', 'Parallel-route defaults are not supported.'],
  ['global-error', 'Use app/routes/error.tsx at the root instead.'],
  [
    'instrumentation',
    'Move the hooks into instrumentation.mjs at the project root.',
  ],
  [
    'middleware',
    'Next middleware runs per request; Ness middleware is per route segment.',
  ],
]);

/**
 * Import rewrites. Each entry replaces a Next module with its Ness equivalent;
 * `notes` are surfaced when the rewrite changes the call shape and needs a
 * human to finish the job.
 */
const IMPORT_REWRITES = [
  {
    from: 'next/link',
    to: 'react-router',
    named: { default: 'Link' },
    notes: '<Link href> becomes <Link to>.',
  },
  {
    from: 'next/image',
    to: '@nessframework/core',
    named: { default: 'Image' },
  },
  {
    from: 'next/script',
    to: '@nessframework/core',
    named: { default: 'Script' },
  },
  {
    from: 'next/navigation',
    to: '@nessframework/core',
    rename: {
      useRouter: 'useRouter',
      usePathname: 'usePathname',
      useSearchParams: 'useSearchParams',
      useParams: 'useParams',
      useSelectedLayoutSegment: 'useSelectedLayoutSegment',
      useSelectedLayoutSegments: 'useSelectedLayoutSegments',
    },
    unsupported: {
      redirect:
        'Throw redirect() from @nessframework/core/server/responses inside a loader or action.',
      notFound: 'Throw notFound() from @nessframework/core/server/responses.',
      permanentRedirect:
        'Throw permanentRedirect() from @nessframework/core/server/responses.',
    },
  },
  {
    from: 'next/cache',
    to: '@nessframework/cache',
    rename: {
      revalidateTag: 'revalidateTag',
      revalidatePath: 'revalidatePath',
      unstable_cache: 'cached',
    },
  },
  {
    from: 'next/font/local',
    to: '@nessframework/core/font',
    named: { default: 'localFont' },
  },
  {
    from: 'next/headers',
    to: null,
    notes:
      'cookies() and headers() read from an implicit request. Read them from the loader/action `request` argument instead.',
  },
  {
    from: 'next/server',
    to: null,
    notes:
      'NextRequest and NextResponse are Web-standard Request and Response in Ness; remove the import and use the globals.',
  },
];

function listFiles(directory, filter = () => true, collected = []) {
  if (!fs.existsSync(directory)) return collected;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      listFiles(target, filter, collected);
    } else if (filter(target)) {
      collected.push(target);
    }
  }
  return collected;
}

function isSource(file) {
  return /\.(?:[cm]?[jt]sx?)$/.test(file);
}

function gitIsClean(root) {
  try {
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return status.trim() === '';
  } catch {
    // Not a git repository; the caller decides whether to continue.
    return undefined;
  }
}

/**
 * Rewrites the import specifier and records anything the rewrite cannot carry
 * across. Deliberately textual: a codemod that silently reshapes code it did
 * not fully understand is worse than one that says what it skipped.
 */
function rewriteImports(source, file, findings) {
  let output = source;
  // Decided from the original source: only a file that actually imported
  // next/link should have its <Link> props rewritten.
  const importsNextLink = /from\s+(['"`])next\/link\1/.test(source);

  for (const rule of IMPORT_REWRITES) {
    // Anchored to a module specifier position. A bare quoted-string match would
    // also rewrite the same text inside a comment or an ordinary string.
    const specifier = rule.from.replaceAll('/', '\\/');
    const pattern = new RegExp(
      `((?:from|import)\\s*\\(?\\s*)(['"\`])${specifier}\\2`,
      'g',
    );
    if (!pattern.test(output)) continue;
    pattern.lastIndex = 0;

    for (const [name, reason] of Object.entries(rule.unsupported || {})) {
      if (new RegExp(`\\b${name}\\b`).test(output)) {
        findings.push({ file, level: 'manual', message: reason });
      }
    }

    if (rule.to === null) {
      findings.push({ file, level: 'manual', message: rule.notes });
      continue;
    }

    // A default import has to become a named one: `import Link from 'next/link'`
    // is `import { Link } from 'react-router'`. Swapping only the specifier
    // would emit an import of an export that does not exist.
    const defaultName = rule.named?.default;
    if (defaultName) {
      const defaultImport = new RegExp(
        `import\\s+([A-Za-z_$][\\w$]*)\\s+from\\s+(['"\`])${rule.from.replaceAll('/', '\\/')}\\2`,
        'g',
      );
      let rewroteClause = false;
      output = output.replace(defaultImport, (_match, local, quote) => {
        rewroteClause = true;
        const clause =
          local === defaultName ? defaultName : `${defaultName} as ${local}`;
        return `import { ${clause} } from ${quote}${rule.to}${quote}`;
      });
      if (
        !rewroteClause &&
        new RegExp(`from\\s+['"\`]${rule.from.replaceAll('/', '\\/')}`).test(
          output,
        )
      ) {
        findings.push({
          file,
          level: 'manual',
          message: `${rule.from} exports a default; ${rule.to} exports \`${defaultName}\` by name. Adjust the import clause.`,
        });
      }
    }

    // Renamed named exports, e.g. unstable_cache -> cached.
    for (const [from, to] of Object.entries(rule.rename || {})) {
      if (from === to) continue;
      const named = new RegExp(`\\b${from}\\b`, 'g');
      if (named.test(output)) {
        output = output.replace(named, to);
        findings.push({
          file,
          level: 'rewritten',
          message: `${from} → ${to}`,
        });
      }
    }

    output = output.replace(pattern, `$1$2${rule.to}$2`);
    findings.push({
      file,
      level: 'rewritten',
      message: `${rule.from} → ${rule.to}${rule.notes ? ` (${rule.notes})` : ''}`,
    });
  }

  // Only for a file that imported next/link: plenty of components are called
  // Link and take an href that must stay an href.
  if (importsNextLink && /<Link\s[^>]*\bhref=/.test(output)) {
    output = output.replace(/(<Link\s[^>]*?)\bhref=/g, '$1to=');
    findings.push({
      file,
      level: 'rewritten',
      message: '<Link href> → <Link to>',
    });
  }

  if (/^\s*['"]use server['"]/m.test(output)) {
    findings.push({
      file,
      level: 'manual',
      message:
        "'use server' functions map to an `action` in an adjacent page.server file.",
    });
  }

  return output;
}

/** Splits an App Router file path into its route segments and basename. */
function describeRouteFile(file, appDirectory) {
  const relative = path.relative(appDirectory, file);
  const parsed = path.parse(relative);
  return {
    relative,
    segments: parsed.dir ? parsed.dir.split(path.sep) : [],
    name: parsed.name,
    extension: parsed.ext,
  };
}

/**
 * Plans the file moves. Next's App Router puts route files directly under
 * `app/`; Ness puts them under `app/routes/`, with the root layout promoted to
 * `app/root.tsx`.
 */
function planMigration(root) {
  const appDirectory = path.join(root, 'app');
  const pagesDirectory = path.join(root, 'pages');
  const moves = [];
  const findings = [];

  if (fs.existsSync(pagesDirectory)) {
    findings.push({
      file: 'pages/',
      level: 'manual',
      message:
        'The Pages Router is not migrated. Convert it to the App Router in Next first, then re-run this command.',
    });
  }
  if (!fs.existsSync(appDirectory)) {
    throw new Error(
      `No app/ directory in ${root}. Point the command at a Next.js App Router project.`,
    );
  }

  for (const file of listFiles(appDirectory, isSource)) {
    const { relative, segments, name, extension } = describeRouteFile(
      file,
      appDirectory,
    );
    if (relative.startsWith(`routes${path.sep}`)) continue;

    if (UNSUPPORTED_FILES.has(name)) {
      findings.push({
        file: relative,
        level: 'manual',
        message: UNSUPPORTED_FILES.get(name),
      });
      continue;
    }
    if (!ROUTE_FILES.has(name)) {
      // Components, utilities, and styles keep their place inside app/.
      continue;
    }
    if (name === 'layout' && segments.length === 0) {
      moves.push({
        from: file,
        to: path.join(appDirectory, `root${extension}`),
      });
      findings.push({
        file: relative,
        level: 'manual',
        message:
          'The root layout becomes app/root.tsx and must render <Links/>, <Meta/>, <Outlet/>, <Scripts/> from react-router.',
      });
      continue;
    }

    moves.push({
      from: file,
      to: path.join(appDirectory, 'routes', ...segments, `${name}${extension}`),
    });
  }

  return { appDirectory, moves, findings };
}

function migrateNextConfig(root, findings) {
  const configFile = ['next.config.mjs', 'next.config.js', 'next.config.ts']
    .map(candidate => path.join(root, candidate))
    .find(fs.existsSync);
  if (!configFile) return;

  const source = fs.readFileSync(configFile, 'utf8');
  const carried = ['redirects', 'rewrites', 'headers', 'images'].filter(key =>
    new RegExp(`\\b${key}\\b`).test(source),
  );
  findings.push({
    file: path.basename(configFile),
    level: 'manual',
    message: carried.length
      ? `Move ${carried.join(', ')} into the \`server\` section of ness.config.mjs; the option shapes match.`
      : 'Review the options and move anything still needed into ness.config.mjs.',
  });
}

function renderReport(root, { moves, findings }) {
  const byLevel = level => findings.filter(finding => finding.level === level);
  const manual = byLevel('manual');
  const rewritten = byLevel('rewritten');

  const lines = [
    '# Next.js → Ness.js migration',
    '',
    `Ran in \`${root}\`.`,
    '',
    `## Moved (${moves.length})`,
    '',
    ...(moves.length
      ? moves.map(
          move =>
            `- \`${path.relative(root, move.from)}\` → \`${path.relative(root, move.to)}\``,
        )
      : ['Nothing to move.']),
    '',
    `## Rewritten imports (${rewritten.length})`,
    '',
    ...(rewritten.length
      ? rewritten.map(finding => `- \`${finding.file}\`: ${finding.message}`)
      : ['No imports needed rewriting.']),
    '',
    `## Needs a human (${manual.length})`,
    '',
    ...(manual.length
      ? manual.map(finding => `- \`${finding.file}\`: ${finding.message}`)
      : ['Nothing outstanding.']),
    '',
    '## Not migrated automatically',
    '',
    '- **Server Components.** A Next `async` page component maps to a `loader` in an adjacent `page.server` file plus a synchronous component. The split depends on what the component awaits, so it is left alone.',
    '- **Server Actions.** A `"use server"` function becomes an `action` export in `page.server`, reached through a `<Form>`.',
    '- **`generateStaticParams`.** List the paths under `router.prerender` in `ness.config.mjs`.',
    '- **`generateMetadata`.** Export `meta` from the route, or use `@nessframework/core/metadata`.',
    '- **Route groups and dynamic segments** carry over unchanged: `(group)`, `[id]`, `[...rest]`, `[[...rest]]`.',
    '',
  ];
  return lines.join('\n');
}

export async function migrateFromNext(directory = '.', options = {}) {
  const root = path.resolve(directory);
  // A dry run writes nothing, so a dirty tree is irrelevant to it.
  const clean = options.dryRun ? true : gitIsClean(root);
  if (clean === false && !options.force) {
    throw new Error(
      'The working tree has uncommitted changes. Commit them first so the migration can be reviewed as a diff, or pass --force.',
    );
  }
  if (clean === undefined && !options.force && !options.dryRun) {
    throw new Error(
      `${root} is not a git repository. Initialise one so the migration can be reviewed, or pass --force.`,
    );
  }

  const plan = planMigration(root);
  migrateNextConfig(root, plan.findings);

  // A Next application may already have an `app/routes` URL segment, whose
  // files sit exactly where this wants to move things. Renaming over them would
  // destroy them silently, so collisions are reported and skipped instead.
  const collisions = plan.moves.filter(move => fs.existsSync(move.to));
  for (const move of collisions) {
    plan.findings.push({
      file: path.relative(root, move.from),
      level: 'manual',
      message: `Not moved: ${path.relative(root, move.to)} already exists. Merge the two by hand.`,
    });
  }
  plan.moves = plan.moves.filter(move => !fs.existsSync(move.to));

  if (!options.dryRun) {
    for (const move of plan.moves) {
      fs.mkdirSync(path.dirname(move.to), { recursive: true });
      fs.renameSync(move.from, move.to);
    }
    for (const file of listFiles(path.join(root, 'app'), isSource)) {
      const source = fs.readFileSync(file, 'utf8');
      const rewritten = rewriteImports(
        source,
        path.relative(root, file),
        plan.findings,
      );
      if (rewritten !== source) fs.writeFileSync(file, rewritten);
    }
  } else {
    // A dry run still reports what the import pass would find.
    for (const file of listFiles(path.join(root, 'app'), isSource)) {
      rewriteImports(
        fs.readFileSync(file, 'utf8'),
        path.relative(root, file),
        plan.findings,
      );
    }
  }

  const report = renderReport(root, plan);
  const reportFile = path.join(root, 'MIGRATION.md');
  if (!options.dryRun) fs.writeFileSync(reportFile, report);

  const manual = plan.findings.filter(finding => finding.level === 'manual');
  console.log(
    `${paint('green', options.dryRun ? 'Would move' : 'Moved')} ${plan.moves.length} file(s).`,
  );
  console.log(
    `${paint(manual.length ? 'yellow' : 'green', `${manual.length} item(s) need a human.`)}`,
  );
  if (!options.dryRun) {
    console.log(`Report written to ${path.relative(root, reportFile)}.`);
    console.log(
      'Review the diff with git, then run `ness typegen && ness build`.',
    );
  } else {
    console.log(`\n${report}`);
  }

  return { ...plan, report };
}

export {
  IMPORT_REWRITES,
  ROUTE_FILES,
  UNSUPPORTED_FILES,
  planMigration,
  renderReport,
  rewriteImports,
};
