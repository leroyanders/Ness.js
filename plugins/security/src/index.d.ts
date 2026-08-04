import type { Plugin } from 'vite';

export interface SecurityOptions {
  defaults?: boolean;
  contentSecurityPolicy?: string;
  headers?: Record<string, string | false | null | undefined>;
}

export const DEFAULT_HEADERS: Readonly<Record<string, string>>;
export function securityHeaders(
  options?: SecurityOptions,
): Record<string, string>;
export function security(options?: SecurityOptions): Plugin;
export default security;
