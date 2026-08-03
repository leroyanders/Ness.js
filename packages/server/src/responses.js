import * as router from 'react-router';
import './web-api.js';

function json(value, init) {
  return Response.json(value, init);
}

function redirect(url, init = 307) {
  return router.redirect(url, init);
}

function permanentRedirect(url, init = 308) {
  return router.redirect(url, init);
}

function interrupt(status, statusText, body = statusText) {
  throw new Response(body, { status, statusText });
}

function notFound(body) {
  return interrupt(404, 'Not Found', body);
}

function unauthorized(body) {
  return interrupt(401, 'Unauthorized', body);
}

function forbidden(body) {
  return interrupt(403, 'Forbidden', body);
}

function after(callback) {
  if (typeof callback !== 'function')
    throw new TypeError('after() expects a callback.');
  const promise = new Promise(resolve => setImmediate(resolve)).then(callback);
  promise.catch(error =>
    queueMicrotask(() => {
      throw error;
    }),
  );
  return promise;
}

function parseCookies(request) {
  const source = request.headers.get('cookie') || '';
  const values = new Map(
    source
      .split(';')
      .map(value => value.trim())
      .filter(Boolean)
      .map(value => {
        const separator = value.indexOf('=');
        const name = separator < 0 ? value : value.slice(0, separator);
        const content = separator < 0 ? '' : value.slice(separator + 1);
        return [decodeURIComponent(name), decodeURIComponent(content)];
      }),
  );
  return {
    get(name) {
      const value = values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return [...values].map(([name, value]) => ({ name, value }));
    },
    has(name) {
      return values.has(name);
    },
  };
}

function serializeCookie(name, value, options = {}) {
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

function userAgent(request) {
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
