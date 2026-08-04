const DEFAULT_HEADERS = Object.freeze({
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

function securityHeaders(options = {}) {
  const headers = {
    ...(options.defaults === false ? {} : DEFAULT_HEADERS),
    ...(options.contentSecurityPolicy
      ? { 'Content-Security-Policy': options.contentSecurityPolicy }
      : {}),
    ...(options.headers || {}),
  };
  for (const [name, value] of Object.entries(headers)) {
    if (value === false || value == null) delete headers[name];
  }
  return headers;
}

function security(options = {}) {
  const headers = securityHeaders(options);
  return {
    name: 'ness:security',
    config() {
      return {
        server: { headers },
        preview: { headers },
      };
    },
  };
}

export { DEFAULT_HEADERS, security, securityHeaders };
export default security;
