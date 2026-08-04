# Benchmarks

```bash
node scripts/bench/run.mjs
node scripts/bench/run.mjs --duration=20 --connections=100
node scripts/bench/run.mjs --only=ness --keep
```

The script scaffolds two applications that render the same catalogue from the same module — a dynamic list page, a dynamic detail page, and a JSON endpoint — builds both, and measures them as self-hosted Node servers. Next runs with `output: 'standalone'`; comparing a self-hosted server against a Vercel deployment would measure the platform, not the framework.

The Ness side installs tarballs packed from this working tree, so the numbers describe the current code rather than the published release.

Results are written to `results.md`. Absolute values depend on the machine — re-run the script rather than quoting a committed number.

## Method

- **Cold start** is measured from spawning the process to its first successful response, on a fresh process. That is what a container restart or a scale-up event costs.
- **Throughput** is a fixed-concurrency closed loop: N workers each request in sequence for the configured duration. Each route is warmed for one second first, so JIT and lazy module loading do not land in the sample.
- **TTFB** reads one chunk rather than the whole body, so a streamed response is not charged for its completion time.
- **Deployable output** is the directory you would actually ship: `build/standalone` for Ness, `.next/standalone` for Next.

## Fairness

An earlier version of this harness reported Ness at roughly ten times Next's
throughput. That number was wrong. Ness caches HTML responses by default, so it
was answering from memory while the Next fixtures — which declare
`export const dynamic = 'force-dynamic'` — re-rendered every request. The
comparison was a memory read against a React render, labelled "SSR throughput".

Two things now prevent that from recurring. The Ness fixture ships its own
`ness.config.mjs` with the page cache and prerendering disabled, and the harness
probes each route before measuring: if the server answers with an `x-ness-cache`
header other than `MISS`, the run fails rather than producing a number.

If you add a route or change the fixture config, keep both sides rendering. A
benchmark that flatters the framework is worse than none.

## What the current numbers say

**Throughput is roughly 1.9–2.2× Next's on the SSR routes and 1.6× on the JSON
endpoint.** That is a real margin and a defensible one. It is not the 10× the
broken harness reported.

**Cold start is still about 2.8× slower than Next** — 541 ms against 192 ms,
down from 2406 ms once `sharp` stopped loading eagerly at boot. What remains is
worth another profile: the NestJS bootstrap in `configureServer` and the
react-router server build are the obvious candidates.

**The deployable bundle is about 1.6× Next's**, down from 2.7× once build-only
packages stopped being appended to runtime dependencies. The rest is the
expected cost of package-level tracing versus Next's file-level tracing — a
deliberate trade, since package granularity never drops a file reached through
a runtime `require` or a native binding.

Build time, client asset size, and install size favour Ness.

Absolute values move a lot with machine load: the same commit measured Next at
229 rps on a busy machine and 1256 rps on an idle one. Compare columns from a
single run, never numbers from different runs.
