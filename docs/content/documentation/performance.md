# Performance

Ness is benchmarked against Next.js on the same application, and the harness that produces these numbers is in the repository: [`scripts/bench/run.mjs`](https://github.com/leroyanders/Ness.js/blob/master/scripts/bench/run.mjs). Run it yourself rather than taking the table below on trust.

```bash
node scripts/bench/run.mjs
```

## The comparison

Both applications render the same catalogue from the same module: a dynamic list page, a dynamic detail page, and a JSON endpoint. Both are measured as self-hosted Node servers — Next with `output: 'standalone'` — because that is the deployment Ness targets. Comparing a self-hosted server against a managed platform would measure the platform, not the framework.

Both sides render every request. Next's fixtures declare `export const dynamic = 'force-dynamic'`, and the Ness fixture disables the page cache and prerendering. This matters more than it sounds: Ness caches HTML responses by default, and an earlier version of this harness had it answering from memory while Next re-rendered — which produced a flattering tenfold result that meant nothing. The harness now probes each route first and aborts the run if the server answers with anything other than `x-ness-cache: MISS`.

## Results

Apple M4, 10 cores, Node 22, 40 concurrent connections for 10 s per route.

| Metric                       | Ness.js         | Next.js     |             |
| ---------------------------- | --------------- | ----------- | ----------- |
| List page (SSR)              | **2522 req/s**  | 1323 req/s  | 1.9×        |
| Detail page (SSR)            | **3176 req/s**  | 1689 req/s  | 1.9×        |
| JSON endpoint                | **11389 req/s** | 6794 req/s  | 1.7×        |
| List page p95 latency        | **18.0 ms**     | 35.7 ms     | 2.0× lower  |
| Detail page p95 latency      | **14.3 ms**     | 26.3 ms     | 1.8× lower  |
| Build time                   | **1.8 s**       | 4.4 s       | 2.4× faster |
| Client assets                | **310 KB**      | 560 KB      | 45% smaller |
| `node_modules` (dev)         | **163.8 MB**    | 330.8 MB    | 50% smaller |
| Cold start to first response | 459 ms          | **198 ms**  | 2.3× slower |
| Deployable output            | 67.3 MB         | **43.2 MB** | 1.6× larger |

Throughput is roughly twice Next's across server-rendered routes, builds finish in about a third of the time, and applications install and ship about half the JavaScript.

The latency rows are the ones worth reading closely. p95 is what a user actually waits for when the server is busy, and the gap there is wider than the throughput ratio — a server that keeps its tail short under 40 concurrent connections is describing its behaviour at peak, not its best case.

## Where Ness is behind

Two rows go the other way, and they are here for the same reason as the rest.

**Cold start is about 2.3× slower.** This is down from 2406 ms — `sharp`, the native image-processing library, used to load during boot even in applications that never serve an optimized image, and now loads on the first image request instead. What remains is under investigation; the NestJS bootstrap and the size of the server module graph are the likely candidates. If your workload scales to zero and pays a cold start per request, measure it for your own application before choosing.

**The deployable bundle is about 1.6× larger.** Ness traces dependencies at package granularity rather than file granularity. The output is larger, and in exchange it never drops a file reached through a runtime `require`, a dynamic import, or a native binding — the failure mode that makes file-level tracing unpleasant to debug in production. An opt-in file-level mode is a reasonable future addition; changing the default is not.

## Reading the numbers

Absolute values move a great deal with machine load. The same commit measured Next at 229 req/s on a busy machine and 1256 req/s on an idle one. Compare the two columns of a single run; never compare a number from one run against a number from another.

The measurement method is documented in [`scripts/bench/readme.md`](https://github.com/leroyanders/Ness.js/blob/master/scripts/bench/readme.md): cold start is timed from process spawn to first successful response on a fresh process, throughput is a fixed-concurrency closed loop after a one-second warm-up, and TTFB reads one chunk rather than the whole body so a streamed response is not charged for its completion time.
