export { data, redirectDocument, replace } from 'react-router';
export function json<T>(value: T, init?: ResponseInit): Response;
export function redirect(
  url: string | URL,
  init?: number | ResponseInit,
): Response;
export function permanentRedirect(
  url: string | URL,
  init?: number | ResponseInit,
): Response;
export function notFound(body?: BodyInit): never;
export function unauthorized(body?: BodyInit): never;
export function forbidden(body?: BodyInit): never;
export function after<T>(callback: () => Promise<T> | T): Promise<T>;
export function parseCookies(request: Request): {
  get(name: string): { name: string; value: string } | undefined;
  getAll(): Array<{ name: string; value: string }>;
  has(name: string): boolean;
};
export interface CookieOptions {
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date | string | number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}
export function serializeCookie(
  name: string,
  value: string,
  options?: CookieOptions,
): string;
export function userAgent(request: Request): {
  source: string;
  bot: boolean;
  mobile: boolean;
};
