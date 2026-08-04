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

## What the current numbers say

Two results are worth acting on rather than quoting.

**Cold start is roughly four times slower than Next.** This is the one number that would be used against the framework, and it is not yet explained. Candidates are the NestJS bootstrap in `configureServer`, config loading in `serve.js`, and module graph size. It needs a profile before it needs a fix.

**The deployable bundle is about 2.5× larger than Next's.** This is the expected cost of package-level tracing versus Next's file-level tracing, and it is a deliberate trade — package granularity never drops a file reached through a runtime `require` or a native binding. Whether the trade is worth 70 MB is a fair question; the answer is probably an opt-in file-level mode, not a change of default.

Throughput, build time, client asset size, and install size currently favour Ness by wide margins. Those margins are large enough to be suspicious of the harness rather than to celebrate: before quoting them anywhere public, verify that both applications are doing the same work — in particular that neither is serving a cached response the other is recomputing.
