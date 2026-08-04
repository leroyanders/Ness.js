import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  migrateFromNext,
  planMigration,
  rewriteImports,
} from '../src/commands/migrate.js';

function write(root, relative, contents) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  return file;
}

function createNextApp(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-migrate-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));

  write(root, 'package.json', '{"name":"next-app","private":true}\n');
  write(
    root,
    'next.config.mjs',
    'export default { redirects: async () => [] };\n',
  );
  write(
    root,
    'app/layout.tsx',
    'export default function RootLayout({children}){ return children; }\n',
  );
  write(
    root,
    'app/page.tsx',
    [
      "import Link from 'next/link';",
      "import Image from 'next/image';",
      "import { usePathname } from 'next/navigation';",
      '',
      'export default function Home(){',
      '  const pathname = usePathname();',
      '  return <Link href="/about">About {pathname}</Link>;',
      '}',
    ].join('\n'),
  );
  write(
    root,
    'app/blog/[slug]/page.tsx',
    'export default function Post(){ return null; }\n',
  );
  write(
    root,
    'app/blog/loading.tsx',
    'export default function Loading(){ return null; }\n',
  );
  write(
    root,
    'app/(marketing)/pricing/page.tsx',
    'export default function P(){ return null; }\n',
  );
  write(
    root,
    'app/api/health/route.ts',
    "import { NextResponse } from 'next/server';\nexport async function GET(){ return NextResponse.json({ok:true}); }\n",
  );
  write(
    root,
    'app/template.tsx',
    'export default function T({children}){ return children; }\n',
  );
  write(
    root,
    'app/components/button.tsx',
    'export function Button(){ return null; }\n',
  );
  return root;
}

test('the plan moves route files under app/routes and promotes the root layout', async t => {
  const root = createNextApp(t);
  const plan = planMigration(root);
  const moved = new Map(
    plan.moves.map(move => [
      path.relative(root, move.from),
      path.relative(root, move.to),
    ]),
  );

  assert.equal(
    moved.get('app/page.tsx'),
    path.join('app', 'routes', 'page.tsx'),
  );
  assert.equal(
    moved.get(path.join('app', 'blog', '[slug]', 'page.tsx')),
    path.join('app', 'routes', 'blog', '[slug]', 'page.tsx'),
  );
  assert.equal(
    moved.get(path.join('app', '(marketing)', 'pricing', 'page.tsx')),
    path.join('app', 'routes', '(marketing)', 'pricing', 'page.tsx'),
  );
  assert.equal(
    moved.get(path.join('app', 'api', 'health', 'route.ts')),
    path.join('app', 'routes', 'api', 'health', 'route.ts'),
  );
  assert.equal(
    moved.get('app/layout.tsx'),
    path.join('app', 'root.tsx'),
    'the root layout is promoted rather than nested',
  );
});

test('non-route files stay where they are', async t => {
  const root = createNextApp(t);
  const plan = planMigration(root);
  const sources = plan.moves.map(move => path.relative(root, move.from));
  assert.ok(!sources.includes(path.join('app', 'components', 'button.tsx')));
});

test('files without an equivalent are reported instead of moved', async t => {
  const root = createNextApp(t);
  const plan = planMigration(root);

  const template = plan.findings.find(finding =>
    finding.file.endsWith('template.tsx'),
  );
  assert.ok(template, 'template.tsx is reported');
  assert.equal(template.level, 'manual');
  assert.ok(
    !plan.moves.some(move => move.from.endsWith('template.tsx')),
    'template.tsx must not be moved',
  );
});

test('imports are rewritten and shape changes are reported', () => {
  const findings = [];
  const output = rewriteImports(
    [
      "import Link from 'next/link';",
      "import { revalidateTag } from 'next/cache';",
      "import { redirect } from 'next/navigation';",
      '',
      'export function Nav(){ return <Link href="/a" className="x">A</Link>; }',
    ].join('\n'),
    'app/nav.tsx',
    findings,
  );

  assert.match(output, /from 'react-router'/);
  assert.match(output, /from '@nessframework\/cache'/);
  assert.match(output, /<Link to="\/a" className="x">/);
  assert.ok(
    findings.some(finding => /redirect\(\)/.test(finding.message)),
    'redirect() has no drop-in equivalent and must be reported',
  );
});

test('next/headers and next/server are reported, not silently rewritten', () => {
  const findings = [];
  const source = "import { cookies } from 'next/headers';\n";
  const output = rewriteImports(source, 'app/page.tsx', findings);

  assert.equal(output, source, 'the import is left for a human to resolve');
  assert.ok(
    findings.some(finding => /loader\/action `request`/.test(finding.message)),
  );
});

test('a dry run changes nothing and still produces a report', async t => {
  const root = createNextApp(t);
  const before = fs.readFileSync(path.join(root, 'app', 'page.tsx'), 'utf8');

  const result = await migrateFromNext(root, { dryRun: true, force: true });

  assert.ok(fs.existsSync(path.join(root, 'app', 'page.tsx')), 'no file moved');
  assert.equal(
    fs.readFileSync(path.join(root, 'app', 'page.tsx'), 'utf8'),
    before,
  );
  assert.ok(!fs.existsSync(path.join(root, 'MIGRATION.md')));
  assert.match(result.report, /Next\.js → Ness\.js migration/);
  assert.match(result.report, /Server Components/);
});

test('a real run moves files, rewrites imports, and writes the report', async t => {
  const root = createNextApp(t);
  await migrateFromNext(root, { force: true });

  assert.ok(fs.existsSync(path.join(root, 'app', 'routes', 'page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'app', 'root.tsx')));
  assert.ok(!fs.existsSync(path.join(root, 'app', 'layout.tsx')));

  const page = fs.readFileSync(
    path.join(root, 'app', 'routes', 'page.tsx'),
    'utf8',
  );
  assert.match(page, /from 'react-router'/);
  assert.match(page, /from '@nessframework\/core'/);
  assert.match(page, /<Link to="\/about">/);

  const report = fs.readFileSync(path.join(root, 'MIGRATION.md'), 'utf8');
  assert.match(report, /## Moved/);
  assert.match(report, /## Needs a human/);
  assert.match(report, /next\.config\.mjs/);
});

test('a Pages Router application is reported as out of scope', async t => {
  const root = createNextApp(t);
  write(
    root,
    'pages/index.tsx',
    'export default function Index(){ return null; }\n',
  );

  const plan = planMigration(root);
  assert.ok(
    plan.findings.some(finding =>
      /Pages Router is not migrated/.test(finding.message),
    ),
  );
});

test('migrating a directory without app/ fails with a clear message', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ness-migrate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  await assert.rejects(
    () => migrateFromNext(root, { force: true }),
    /No app\/ directory/,
  );
});
