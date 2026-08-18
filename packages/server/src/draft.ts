import { createHmac, timingSafeEqual } from 'node:crypto';

import { parseCookies, serializeCookie } from './responses.js';

const COOKIE = '__ness_draft';

export interface DraftOptions {
  /** Defaults to `process.env.NESS_DRAFT_SECRET`. */
  secret?: string;
  cookie?: string;
}

export interface EnableDraftOptions extends DraftOptions {
  /** Lifetime in seconds. Defaults to one hour. */
  maxAge?: number;
  path?: string;
}

/**
 * Draft mode: a signed cookie that says "show me the unpublished version".
 *
 * Signed rather than merely present, because the thing it switches on is a
 * view of content nobody outside the editorial flow is meant to see, and a
 * cookie anyone can set by hand is not an authorization. The value is the
 * expiry and its signature; there is nothing else in it, so a leaked cookie
 * reveals nothing and stops working on its own.
 *
 * It also takes the request out of the shared page cache for free: the cache
 * refuses any request carrying a cookie, from before it is read, so a draft
 * request can neither be answered from a stored render nor be stored as one.
 */
function secretFor(secret?: string): string {
  const value = secret ?? process.env['NESS_DRAFT_SECRET'];
  if (!value)
    throw new Error(
      'Draft mode needs a secret: set NESS_DRAFT_SECRET or pass { secret }.',
    );
  return value;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verify(token: string, secret: string): boolean {
  const separator = token.lastIndexOf('.');
  if (separator < 0) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload, secret);
  // Same length before comparing: timingSafeEqual throws on a mismatch, and
  // the length is not the secret.
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Whether this request is asking for drafts, and whether it may. */
function draftMode(
  request: Request,
  { secret, cookie = COOKIE }: DraftOptions = {},
): { isEnabled: boolean } {
  // `parseCookies().get` answers with `{name, value}`, not a bare string.
  const token = parseCookies(request).get(cookie)?.value;
  const enabled = Boolean(token) && verify(token!, secretFor(secret));
  return { isEnabled: enabled };
}

/**
 * Turns draft mode on for this browser. Returns the `Set-Cookie` value, so a
 * loader can put it on whatever response it was going to send anyway —
 * usually a redirect back into the previewed page.
 */
function enableDraftMode({
  secret,
  cookie = COOKIE,
  maxAge = 60 * 60,
  path = '/',
}: EnableDraftOptions = {}): string {
  const expiresAt = Date.now() + maxAge * 1000;
  const payload = String(expiresAt);
  return serializeCookie(
    cookie,
    `${payload}.${sign(payload, secretFor(secret))}`,
    {
      httpOnly: true,
      // `serializeCookie` capitalises this itself, so the emitted header is
      // `SameSite=Lax` either way.
      sameSite: 'lax',
      secure: process.env['NODE_ENV'] === 'production',
      path,
      maxAge,
    },
  );
}

/** Turns it off again. */
function disableDraftMode({
  cookie = COOKIE,
  path = '/',
}: { cookie?: string; path?: string } = {}): string {
  return serializeCookie(cookie, '', { httpOnly: true, path, maxAge: 0 });
}

export { COOKIE as DRAFT_COOKIE, disableDraftMode, draftMode, enableDraftMode };
