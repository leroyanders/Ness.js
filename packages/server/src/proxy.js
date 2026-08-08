/**
 * Restores the scheme and host a request had before it reached the proxy.
 *
 * Almost every production deployment terminates TLS at a load balancer and
 * forwards plaintext to the application, so the URL the server sees is
 * `http://` on an internal name. Everything derived from it is then wrong:
 * redirects downgrade the visitor to HTTP, canonical links and `og:url` point
 * at an address nobody can reach, and an OAuth callback fails a strict
 * redirect-URI check.
 *
 * Off by default, and that is the point. These headers are sent by the client
 * unless a proxy overwrites them, so trusting them on a directly exposed server
 * lets anyone rewrite the host the application believes it is serving — which
 * is how cache-poisoning and password-reset-link attacks start. Turn it on only
 * where something in front is known to set them.
 */

/**
 * The first value in a comma-separated forwarded header.
 *
 * Chained proxies append, so the first entry is the one closest to the client
 * and describes the connection the visitor actually made.
 */
function firstValue(header) {
  if (!header) return undefined;
  const [first] = header.split(',');
  const value = first?.trim();
  return value || undefined;
}

/** Schemes worth honouring. Anything else is a client making things up. */
const SCHEMES = new Set(['http', 'https']);

function forwardedProtocol(headers) {
  const value = firstValue(headers.get('x-forwarded-proto'))?.toLowerCase();
  return value && SCHEMES.has(value) ? value : undefined;
}

/**
 * A host is only accepted if it parses as one. A malformed value would either
 * throw when the URL is rebuilt or, worse, be accepted and end up in a
 * generated link.
 */
function forwardedHost(headers) {
  const value = firstValue(headers.get('x-forwarded-host'));
  if (!value) return undefined;
  try {
    const parsed = new URL(`https://${value}`);
    return parsed.host === value ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns the request as the client made it, or the request unchanged.
 *
 * The same instance comes back when nothing needs correcting, so the common
 * path costs one header lookup rather than a rebuild.
 */
function applyForwardedHeaders(request, { trustProxy = false } = {}) {
  if (!trustProxy) return request;

  const protocol = forwardedProtocol(request.headers);
  const host = forwardedHost(request.headers);
  if (!protocol && !host) return request;

  const url = new URL(request.url);
  if (protocol) url.protocol = `${protocol}:`;
  if (host) {
    url.host = host;
    // The `host` setter keeps the existing port when the new value carries
    // none, so a public `shop.example.com` would inherit the internal `:8080`
    // and leak it into every generated link. An explicit port in the header is
    // honoured; the absence of one means the scheme's default.
    if (!host.includes(':')) url.port = '';
  }
  if (url.href === request.url) return request;

  return new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
    redirect: request.redirect,
    referrer: request.referrer,
    // Node requires this whenever a body is a stream.
    ...(request.body ? { duplex: 'half' } : {}),
  });
}

export { applyForwardedHeaders, firstValue, forwardedHost, forwardedProtocol };
