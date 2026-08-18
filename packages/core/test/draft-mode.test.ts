import assert from 'node:assert/strict';
import test from 'node:test';
import {
  disableDraftMode,
  draftMode,
  enableDraftMode,
} from '@nessframework/server';

const SECRET = 'test-secret';

function requestWith(cookie) {
  return new Request('https://example.com/post/1', {
    headers: cookie ? { cookie } : {},
  });
}

function cookieValue(header) {
  return header.split(';')[0];
}

test('a request carrying the cookie the framework issued is in draft mode', () => {
  const cookie = cookieValue(enableDraftMode({ secret: SECRET }));
  assert.equal(
    draftMode(requestWith(cookie), { secret: SECRET }).isEnabled,
    true,
  );
});

test('a request without the cookie is not', () => {
  assert.equal(draftMode(requestWith(), { secret: SECRET }).isEnabled, false);
});

test('a forged cookie is refused — the value is signed, not merely present', () => {
  const forged = '__ness_draft=99999999999999.not-a-signature';
  assert.equal(
    draftMode(requestWith(forged), { secret: SECRET }).isEnabled,
    false,
  );
});

test('a cookie signed with another secret is refused', () => {
  const cookie = cookieValue(enableDraftMode({ secret: 'another-secret' }));
  assert.equal(
    draftMode(requestWith(cookie), { secret: SECRET }).isEnabled,
    false,
  );
});

test('an expired cookie is refused without needing the browser to drop it', () => {
  const cookie = cookieValue(enableDraftMode({ secret: SECRET, maxAge: -1 }));
  assert.equal(
    draftMode(requestWith(cookie), { secret: SECRET }).isEnabled,
    false,
  );
});

test('the cookie is http-only and disabling it expires the value', () => {
  const enabled = enableDraftMode({ secret: SECRET });
  assert.match(enabled, /HttpOnly/);
  assert.match(enabled, /SameSite=Lax/);
  assert.match(disableDraftMode(), /Max-Age=0/);
});

test('enabling without a secret refuses rather than signing with nothing', () => {
  const previous = process.env.NESS_DRAFT_SECRET;
  delete process.env.NESS_DRAFT_SECRET;
  try {
    assert.throws(() => enableDraftMode(), /secret/);
  } finally {
    if (previous !== undefined) process.env.NESS_DRAFT_SECRET = previous;
  }
});
