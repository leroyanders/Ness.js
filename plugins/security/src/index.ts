import type { Plugin } from 'vite';

export interface SecurityOptions {
  defaults?: boolean;
  contentSecurityPolicy?: string;
  headers?: Record<string, string | false | null | undefined>;
}

const DEFAULT_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

function securityHeaders(
  options: SecurityOptions = {},
): Record<string, string> {
  const headers: Record<string, string | false | null | undefined> = {
    ...(options.defaults === false ? {} : DEFAULT_HEADERS),
    ...(options.contentSecurityPolicy
      ? { 'Content-Security-Policy': options.contentSecurityPolicy }
      : {}),
    ...(options.headers || {}),
  };
  for (const [name, value] of Object.entries(headers)) {
    if (value === false || value == null) delete headers[name];
  }
  return headers as Record<string, string>;
}

function security(options: SecurityOptions = {}): Plugin {
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
