import assert from 'node:assert/strict';
import test from 'node:test';
import {
  forbidden,
  parseCookies,
  permanentRedirect,
  serializeCookie,
  userAgent,
} from '../dist/runtime/responses.js';

test('response helpers cover redirects, status interruptions, cookies, and user agents', () => {
  const redirect = permanentRedirect('/new');
  assert.equal(redirect.status, 308);
  assert.throws(
    () => forbidden(),
    error => error instanceof Response && error.status === 403,
  );
  const request = new Request('http://ness.test', {
    headers: {
      cookie: 'session=abc; theme=dark',
      'user-agent': 'MobileBot/1.0',
    },
  });
  assert.equal(parseCookies(request).get('theme').value, 'dark');
  assert.match(
    serializeCookie('session', 'abc', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    }),
    /HttpOnly; Secure; SameSite=Lax/,
  );
  assert.deepEqual(userAgent(request), {
    source: 'MobileBot/1.0',
    bot: true,
    mobile: true,
  });
});
