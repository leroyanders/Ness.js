import { createHash } from 'node:crypto';
import { cached } from '@nessframework/cache';
import { requestStore } from './context.js';

/**
 * The `next`-style extension `fetch()` grows on the server: a revalidation
 * window and tags, both served by the shared Ness cache.
 */
export interface FetchCacheInit extends RequestInit {
  next?: {
    /** Seconds the cached response stays fresh; `false` caches forever. */
    revalidate?: number | false;
    /** Tags `revalidateTag()` can purge this response by. */
    tags?: string[];
  };
}

/** A fetch response flattened into something the shared cache can store. */
interface StoredFetchResponse {
  body: string;
  headers: Array<[string, string]>;
  status: number;
  statusText: string;
}

let installed = false;
let originalFetch: typeof fetch | undefined;

function memoKey(input: Request | string | URL, init?: RequestInit): string | null {
  const method = (
    init?.method ||
    (input instanceof Request ? input.method : 'GET')
  ).toUpperCase();
  // Only reads are memoized. A POST fired twice was meant twice.
  if (method !== 'GET' && method !== 'HEAD') return null;
  const url =
    input instanceof Request ? input.url : new URL(String(input)).href;
  const headers = JSON.stringify([
    ...new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined),
    ),
  ]);
  return `${method} ${url} ${createHash('sha1').update(headers).digest('hex')}`;
}

async function storeResponse(response: Response): Promise<StoredFetchResponse> {
  return {
    body: Buffer.from(await response.clone().arrayBuffer()).toString('base64'),
    headers: [...response.headers] as Array<[string, string]>,
    status: response.status,
    statusText: response.statusText,
  };
}

function restoreResponse(stored: StoredFetchResponse): Response {
  return new Response(Buffer.from(stored.body, 'base64'), {
    status: stored.status,
    statusText: stored.statusText,
    headers: new Headers(stored.headers),
  });
}

/**
 * The server-side `fetch`, with the two behaviours Next taught everyone to
 * expect and this framework can honestly provide:
 *
 * **Request memoization.** Inside one request, identical GETs share one
 * network call — a layout and a page asking for the same URL costs one fetch.
 * The memo lives on the request store, so it can never leak a response across
 * requests, and it holds the promise, so concurrent callers coalesce.
 *
 * **The data cache.** `fetch(url, {next: {revalidate: 60, tags: ['posts']}})`
 * stores the response in the shared Ness cache — the same one `cached()` uses,
 * with the same adapters and the same `revalidateTag()`/`revalidatePath()`
 * invalidation. No `next` option, no data cache: an undecorated fetch is a
 * plain network call, memoized within the request and nothing more.
 *
 * A segment's `fetchCache: 'default-no-store'` turns the data cache off for
 * fetches made under it; `cache: 'no-store'` on the call itself always wins.
 */
function nessFetch(
  input: Request | string | URL,
  init?: FetchCacheInit,
): Promise<Response> {
  const base = originalFetch || fetch;
  const store = requestStore();
  const next = init?.next;
  const noStore =
    init?.cache === 'no-store' ||
    store?.dynamic === true ||
    (store?.fetchCacheDefault === 'default-no-store' && !next);

  // The data cache, when the call asked for it.
  if (next && !noStore && (next.revalidate !== undefined || next.tags)) {
    const key = memoKey(input, init);
    if (key) {
      const revalidate =
        next.revalidate === false
          ? Number.MAX_SAFE_INTEGER
          : (next.revalidate ?? 60);
      const read = cached(
        async () => storeResponse(await base(input, strip(init))),
        {
          key: `fetch:${key}`,
          life: {
            stale: revalidate,
            revalidate,
            expire:
              revalidate === Number.MAX_SAFE_INTEGER
                ? Number.MAX_SAFE_INTEGER
                : Math.max(revalidate * 10, revalidate),
          },
          ...(next.tags ? { tags: next.tags } : {}),
        },
      );
      const promise = read().then(restoreResponse);
      return dedupe(store, `data:${key}`, () => promise);
    }
  }

  // Per-request memoization for plain reads.
  const key = memoKey(input, init);
  if (!store || !key) return base(input, strip(init));
  return dedupe(store, key, () => base(input, strip(init)));
}

/** Coalesces concurrent identical reads onto one in-flight promise. */
function dedupe(
  store: ReturnType<typeof requestStore>,
  key: string,
  factory: () => Promise<Response>,
): Promise<Response> {
  if (!store) return factory();
  const existing = store.fetchMemo.get(key);
  if (existing) return existing.then(response => response.clone());
  const promise = factory();
  store.fetchMemo.set(key, promise);
  return promise.then(response => response.clone());
}

/** The `next` extension is Ness's own; undici must not see it. */
function strip(init?: FetchCacheInit): RequestInit | undefined {
  if (!init) return init;
  const { next: _next, ...rest } = init;
  return rest;
}

/**
 * Replaces the global `fetch` with the memoizing, cache-aware one. Installed
 * once by `createNessRequestHandler`; outside a request store the wrapper
 * behaves exactly like the fetch it replaced.
 */
function installFetchCache(): void {
  if (installed) return;
  installed = true;
  originalFetch = globalThis.fetch;
  globalThis.fetch = nessFetch as typeof fetch;
}

export { installFetchCache, nessFetch };
