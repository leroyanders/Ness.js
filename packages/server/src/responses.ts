import * as router from 'react-router';
import './web-api.js';

/**
 * `BodyInit` is a DOM lib type. This package targets Node, where the same
 * values are accepted but the name is not global — so it is taken from the
 * constructor that actually consumes it.
 */
type BodyInit = ConstructorParameters<typeof Response>[0];

export interface CookieOptions {
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date | string | number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface ParsedCookie {
  name: string;
  value: string;
}

export interface ParsedCookies {
  get(name: string): ParsedCookie | undefined;
  getAll(): ParsedCookie[];
  has(name: string): boolean;
}

export interface UserAgent {
  source: string;
  bot: boolean;
  mobile: boolean;
}

function json<T>(value: T, init?: ResponseInit): Response {
  return Response.json(value, init);
}

function redirect(
  url: string | URL,
  init: number | ResponseInit = 307,
): Response {
  return router.redirect(String(url), init);
}

function permanentRedirect(
  url: string | URL,
  init: number | ResponseInit = 308,
): Response {
  return router.redirect(String(url), init);
}

function interrupt(
  status: number,
  statusText: string,
  body: BodyInit = statusText,
): never {
  throw new Response(body, { status, statusText });
}

function notFound(body?: BodyInit): never {
  return interrupt(404, 'Not Found', body);
}

function unauthorized(body?: BodyInit): never {
  return interrupt(401, 'Unauthorized', body);
}

function forbidden(body?: BodyInit): never {
  return interrupt(403, 'Forbidden', body);
}

function after<T>(callback: () => Promise<T> | T): Promise<T> {
  if (typeof callback !== 'function')
    throw new TypeError('after() expects a callback.');
  const promise = new Promise<void>(resolve => {
    setImmediate(resolve);
  }).then(callback);
  promise.catch((error: unknown) =>
    queueMicrotask(() => {
      throw error;
    }),
  );
  return promise;
}

function parseCookies(request: Request): ParsedCookies {
  const source = request.headers.get('cookie') || '';
  const values = new Map<string, string>(
    source
      .split(';')
      .map(value => value.trim())
      .filter(Boolean)
      .map((value): [string, string] => {
        const separator = value.indexOf('=');
        const name = separator < 0 ? value : value.slice(0, separator);
        const content = separator < 0 ? '' : value.slice(separator + 1);
        return [decodeURIComponent(name), decodeURIComponent(content)];
      }),
  );
  return {
    get(name: string) {
      const value = values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return [...values].map(([name, value]) => ({ name, value }));
    },
    has(name: string) {
      return values.has(name);
    },
  };
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined)
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires)
    parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite)
    parts.push(
      `SameSite=${String(options.sameSite).replace(/^./, character => character.toUpperCase())}`,
    );
  return parts.join('; ');
}

function userAgent(request: Request): UserAgent {
  const source = request.headers.get('user-agent') || '';
  return {
    source,
    bot: /bot|crawler|spider|crawling/i.test(source),
    mobile: /android|iphone|ipad|mobile/i.test(source),
  };
}

const { data, redirectDocument, replace } = router;

export {
  after,
  data,
  forbidden,
  json,
  notFound,
  parseCookies,
  permanentRedirect,
  redirect,
  redirectDocument,
  replace,
  serializeCookie,
  unauthorized,
  userAgent,
};
