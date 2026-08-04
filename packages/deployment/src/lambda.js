import '@nessframework/server/web-api';

const BINARY_TYPES = [
  /^image\//,
  /^audio\//,
  /^video\//,
  /^font\//,
  /^application\/(?:octet-stream|pdf|zip|wasm)$/,
];

/**
 * A content-type header carries parameters — `image/png; charset=binary`, or a
 * multipart boundary — so the media type has to be isolated before matching.
 * Anchoring the pattern against the whole header would classify those as text
 * and corrupt the body.
 */
function isBinary(contentType = '') {
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  return BINARY_TYPES.some(pattern => pattern.test(mediaType));
}

/**
 * API Gateway v2 and Function URLs both use this payload shape. v1 (REST API)
 * is not supported: it splits query parameters differently and is being phased
 * out by AWS in favour of v2.
 */
function requestFromEvent(event) {
  const http = event.requestContext?.http;
  if (!http) {
    throw new TypeError(
      'Unsupported Lambda event: expected an API Gateway v2 or Function URL payload (requestContext.http is missing).',
    );
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers || {})) {
    if (value !== undefined) headers.set(name, value);
  }
  for (const cookie of event.cookies || []) headers.append('cookie', cookie);

  const host =
    headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const protocol = headers.get('x-forwarded-proto') || 'https';
  const query = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const url = `${protocol}://${host}${event.rawPath || '/'}${query}`;

  const method = http.method || 'GET';
  const body =
    method === 'GET' || method === 'HEAD' || event.body == null
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body;

  return new Request(url, { method, headers, body });
}

async function eventFromResponse(response) {
  const headers = {};
  const cookies = [];
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === 'set-cookie') cookies.push(value);
    else headers[name] = value;
  }
  // getSetCookie preserves multiple cookies that the iterator above folds into
  // one comma-joined header.
  if (typeof response.headers.getSetCookie === 'function') {
    cookies.length = 0;
    cookies.push(...response.headers.getSetCookie());
  }

  const binary = isBinary(response.headers.get('content-type') || '');
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    statusCode: response.status,
    headers,
    ...(cookies.length ? { cookies } : {}),
    body: binary ? buffer.toString('base64') : buffer.toString('utf8'),
    isBase64Encoded: binary,
  };
}

/**
 * Wraps a Web-standard handler as an AWS Lambda handler for API Gateway v2 or
 * a Function URL.
 *
 * Responses are buffered, because a buffered Lambda response is the only shape
 * API Gateway accepts. Streaming SSR still renders correctly, but the client
 * receives it in one piece — deploy to a Node or container target if
 * time-to-first-byte matters.
 */
function createLambdaHandler(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError('createLambdaHandler requires a fetch handler.');
  }
  return async function lambda(event) {
    const response = await handler(requestFromEvent(event));
    return eventFromResponse(response);
  };
}

export { createLambdaHandler, eventFromResponse, requestFromEvent };
export default createLambdaHandler;
