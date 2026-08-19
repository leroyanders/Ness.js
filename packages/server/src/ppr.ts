import { createElement } from 'react';
import type { ReactNode } from 'react';
import { prerender } from 'react-dom/static';
import { renderToReadableStream, resume } from 'react-dom/server';
import type { PostponedState } from 'react-dom/static';
import { ServerRouter } from 'react-router';
import { getCache } from '@nessframework/cache';

/**
 * Partial prerendering, on React's own `prerender`/`resume` pair.
 *
 * The idea is Next's PPR: render the static shell of a page once, store it,
 * and per request serve the stored shell instantly while only the dynamic
 * holes — everything below a `<Suspense>` boundary that did not finish in
 * time — render fresh and stream in behind it.
 *
 * **Experimental, and honest about its seams.** The shell is truly static:
 * anything rendered above a Suspense boundary is frozen at prerender time,
 * including loader data — dynamic reads belong below a boundary, guarded by
 * `await connection()`. And this module is a primitive, not a default: the
 * standard pipeline hands rendering to React Router, so partial prerendering
 * applies where the application (or a custom `entry.server`) calls it.
 */
export interface PartialPrerenderResult {
  /** The static shell, as HTML bytes. */
  shell: Uint8Array;
  /** Where rendering stopped, or null when nothing was left to resume. */
  postponed: unknown;
}

export interface PartialPrerenderOptions {
  /**
   * How long the shell render may wait before unfinished boundaries are
   * postponed to request time. The abort is what *creates* the holes.
   */
  shellTimeout?: number;
  signal?: AbortSignal;
  bootstrapModules?: string[];
  bootstrapScripts?: string[];
}

async function collect(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Renders the static shell of `element` and records where rendering stopped.
 *
 * The returned `postponed` state is JSON-serializable — store it next to the
 * shell and hand both to `resumePartial` per request.
 */
async function partialPrerender(
  element: ReactNode,
  {
    shellTimeout = 5000,
    signal,
    bootstrapModules,
    bootstrapScripts,
  }: PartialPrerenderOptions = {},
): Promise<PartialPrerenderResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), shellTimeout);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const { prelude, postponed } = await prerender(element, {
      signal: controller.signal,
      ...(bootstrapModules ? { bootstrapModules } : {}),
      ...(bootstrapScripts ? { bootstrapScripts } : {}),
    });
    return { shell: await collect(prelude), postponed };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Continues a partially prerendered page: renders only the postponed holes of
 * `element` and streams them, to be sent after the stored shell.
 */
async function resumePartial(
  element: ReactNode,
  postponed: unknown,
): Promise<ReadableStream<Uint8Array>> {
  return resume(element, postponed as PostponedState);
}

interface StoredPartial {
  shell: string;
  postponed: unknown;
}

export interface PartialResponseOptions extends PartialPrerenderOptions {
  /** Cache key for the shell; usually the pathname. */
  key: string;
  /** Seconds the stored shell stays fresh. Default: an hour. */
  revalidate?: number;
  headers?: ConstructorParameters<typeof Headers>[0];
}

/**
 * The whole loop in one call: serve the cached shell immediately and stream
 * the resumed holes behind it; on a cold cache, prerender the shell first
 * and store it through the shared cache, tagged `pages`.
 */
async function partialResponse(
  element: ReactNode,
  { key, revalidate = 3600, headers, ...options }: PartialResponseOptions,
): Promise<Response> {
  const cache = getCache();
  const stored = await cache.getOrSet<StoredPartial>(
    `ppr:${key}`,
    async () => {
      const { shell, postponed } = await partialPrerender(element, options);
      return {
        shell: Buffer.from(shell).toString('base64'),
        postponed,
      };
    },
    {
      life: { stale: revalidate, revalidate, expire: revalidate * 10 },
      tags: ['pages'],
      path: key,
    },
  );
  const shell = Buffer.from(stored.shell, 'base64');
  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has('content-type'))
    responseHeaders.set('content-type', 'text/html; charset=utf-8');
  responseHeaders.set('x-ness-ppr', stored.postponed ? 'resumed' : 'static');

  if (!stored.postponed)
    return new Response(shell, { headers: responseHeaders });

  const holes = await resumePartial(element, stored.postponed);
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(shell);
      const reader = holes.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) controller.enqueue(value);
      }
      controller.close();
    },
  });
  return new Response(body, { headers: responseHeaders });
}

/** The corner of React Router's entry context this module reads. */
interface EntryContextLike {
  staticHandlerContext?: {
    matches?: Array<{ route: { id: string } }>;
  };
  routeModules?: Record<
    string,
    { ppr?: boolean; experimental_ppr?: boolean } | undefined
  >;
}

/** Whether any matched segment declared `ppr`/`experimental_ppr`. */
function pprRequested(context: EntryContextLike): boolean {
  const matches = context.staticHandlerContext?.matches ?? [];
  return matches.some(match => {
    const module = context.routeModules?.[match.route.id];
    return module?.ppr === true || module?.experimental_ppr === true;
  });
}

export interface PprHandleRequestOptions {
  /** See `PartialResponseOptions.shellTimeout`. */
  shellTimeout?: number;
  /** Seconds a stored shell stays fresh. Default: an hour. */
  revalidate?: number;
}

/**
 * A drop-in `entry.server` handler that turns the `experimental_ppr` segment
 * flag into the actual pipeline — the missing half of the primitive above.
 *
 * ```tsx
 * // app/entry.server.tsx  (npx react-router reveal, once)
 * import { createPprHandleRequest } from '@nessframework/server/ppr';
 * export default createPprHandleRequest();
 * ```
 *
 * A GET for a page whose matched segments include `ppr = true` (either
 * spelling) is answered with `partialResponse`: the cached static shell
 * immediately, the dynamic holes streamed in behind it. Everything else — no
 * flag, a POST, a data request — renders exactly the way React Router's own
 * default entry does. Classic mode only: the RSC pipeline owns its own
 * rendering and never consults `entry.server`.
 */
function createPprHandleRequest({
  shellTimeout,
  revalidate,
}: PprHandleRequestOptions = {}): (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: unknown,
) => Promise<Response> {
  return async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: unknown,
  ): Promise<Response> {
    const element = createElement(ServerRouter, {
      context: routerContext as never,
      url: request.url,
    });
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');

    if (
      request.method === 'GET' &&
      responseStatusCode === 200 &&
      pprRequested(routerContext as EntryContextLike)
    ) {
      const partial = await partialResponse(element, {
        key: new URL(request.url).pathname,
        headers: responseHeaders,
        ...(shellTimeout !== undefined ? { shellTimeout } : {}),
        ...(revalidate !== undefined ? { revalidate } : {}),
      });
      return new Response(partial.body, {
        status: responseStatusCode,
        headers: partial.headers,
      });
    }

    const stream = await renderToReadableStream(element, {
      signal: request.signal,
    });
    // Crawlers get the finished document; the shell-first stream is a
    // reader's bargain, not a bot's.
    if (/bot|crawler|spider/i.test(request.headers.get('user-agent') || '')) {
      await stream.allReady;
    }
    return new Response(stream, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  };
}

export {
  createPprHandleRequest,
  partialPrerender,
  partialResponse,
  resumePartial,
};
