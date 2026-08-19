import { getCache } from '@nessframework/cache';

/**
 * The `/_ness/font` endpoint behind `googleFont()`: a caching proxy that
 * self-hosts Google Fonts.
 *
 * `/css2?family=...` fetches the stylesheet from the css2 API and rewrites
 * every `fonts.gstatic.com` URL into a relative `file?url=` reference, so the
 * font bytes are served from this same endpoint — the browser talks only to
 * the application's own origin. `/file?url=...` streams one font file,
 * refusing any URL that is not Google's font host.
 *
 * Both answers live in the shared Ness cache (memory, filesystem, Redis —
 * whatever the application configured), so Google is asked once per cache
 * lifetime, not once per visitor. The user agent is pinned to a woff2-capable
 * browser: css2 varies its answer by UA, and pinning it means one stored
 * stylesheet serves everyone.
 */
const CSS_HOST = 'https://fonts.googleapis.com/css2';
const FILE_HOST = 'https://fonts.gstatic.com/';

/** css2 varies by UA; this one gets woff2 with unicode-range subsets. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** The css2 parameters the proxy forwards. Anything else is dropped. */
const CSS_PARAMS = new Set(['family', 'display', 'text']);

/** A font file, flattened into something every cache adapter can store. */
interface StoredFontFile {
  body: string;
  type: string;
}

async function fetchStylesheet(query: URLSearchParams): Promise<string> {
  const upstream = new URL(CSS_HOST);
  for (const [key, value] of query) {
    if (CSS_PARAMS.has(key)) upstream.searchParams.append(key, value);
  }
  const response = await fetch(upstream, {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Google Fonts answered ${response.status} for ${upstream}`);
  }
  const css = await response.text();
  // Relative on purpose: `url(file?url=...)` resolves against the stylesheet's
  // own URL, so the rewrite needs no knowledge of the application's basePath.
  return css.replace(
    /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,
    (_match, fontUrl: string) => `url(file?url=${encodeURIComponent(fontUrl)})`,
  );
}

async function fetchFontFile(fontUrl: string): Promise<StoredFontFile> {
  const response = await fetch(fontUrl, {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Google Fonts answered ${response.status} for ${fontUrl}`);
  }
  return {
    body: Buffer.from(await response.arrayBuffer()).toString('base64'),
    type: response.headers.get('content-type') || 'font/woff2',
  };
}

export interface FontHandlerOptions {
  /**
   * Seconds a cached stylesheet stays fresh. A day by default: stylesheets
   * change when Google revs a font, which is rare and never urgent. Font
   * files are content-addressed by their URL and cached for a year.
   */
  revalidate?: number;
}

function createFontHandler({ revalidate = 86_400 }: FontHandlerOptions = {}): (
  request: Request,
) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const cache = getCache();

    if (url.pathname.endsWith('/css2')) {
      const key = `font:css:${[...url.searchParams]
        .sort()
        .map(pair => pair.join('='))
        .join('&')}`;
      try {
        const css = await cache.getOrSet<string>(
          key,
          () => fetchStylesheet(url.searchParams),
          { life: { stale: revalidate, revalidate, expire: revalidate * 30 } },
        );
        return new Response(css, {
          headers: {
            'content-type': 'text/css; charset=utf-8',
            'cache-control': `public, max-age=${revalidate}, stale-while-revalidate=${revalidate * 29}`,
          },
        });
      } catch (error) {
        return new Response(
          `/* ${error instanceof Error ? error.message : 'font stylesheet unavailable'} */`,
          { status: 502, headers: { 'content-type': 'text/css' } },
        );
      }
    }

    if (url.pathname.endsWith('/file')) {
      const fontUrl = url.searchParams.get('url') || '';
      // The one host this proxy exists for. Anything else — another origin, a
      // protocol trick, a redirect collector — is refused before any fetch.
      if (!fontUrl.startsWith(FILE_HOST)) {
        return new Response('Forbidden', { status: 403 });
      }
      try {
        const stored = await cache.getOrSet<StoredFontFile>(
          `font:file:${fontUrl}`,
          () => fetchFontFile(fontUrl),
          { life: 'max' },
        );
        return new Response(Buffer.from(stored.body, 'base64'), {
          headers: {
            'content-type': stored.type,
            'cache-control': 'public, max-age=31536000, immutable',
            'access-control-allow-origin': '*',
          },
        });
      } catch (error) {
        return new Response(
          error instanceof Error ? error.message : 'font file unavailable',
          { status: 502 },
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  };
}

export { createFontHandler };
