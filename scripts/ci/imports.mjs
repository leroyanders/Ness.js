#!/usr/bin/env node
/**
 * Imports every published entry point from the compiled output.
 *
 * Deliberately JavaScript, and the only script in this repository that is:
 * it runs on the oldest Node the packages claim to support (`engines`:
 * >=20.19.0), where importing TypeScript is not possible — type stripping
 * arrived in 22.18. The rest of the toolchain, including the test suite, is
 * TypeScript and needs the newer runtime; what actually ships is compiled
 * ES2022 and has to keep working on the older one. This is what checks that
 * the two claims stay true at the same time.
 *
 *   node scripts/ci/imports.mjs
 */
const ENTRY_POINTS = [
  '@nessframework/cache',
  '@nessframework/cache/resolve',
  '@nessframework/cache/filesystem',
  '@nessframework/instrumentation',
  '@nessframework/server',
  '@nessframework/server/compress',
  '@nessframework/server/proxy',
  '@nessframework/server/runtime',
  '@nessframework/router',
  '@nessframework/deployment',
  '@nessframework/deployment/trace',
  '@nessframework/testing',
  '@nessframework/components',
  '@nessframework/core',
  '@nessframework/core/rsc',
];

let failed = 0;
for (const name of ENTRY_POINTS) {
  try {
    await import(name);
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}\n       ${error.message}`);
  }
}

if (failed) {
  console.error(
    `\n${failed} of ${ENTRY_POINTS.length} entry points failed to load on Node ${process.version}.`,
  );
  process.exit(1);
}
console.log(
  `\nAll ${ENTRY_POINTS.length} entry points load on Node ${process.version}.`,
);
