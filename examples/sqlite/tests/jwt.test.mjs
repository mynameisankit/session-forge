import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { decodeJwt, jwtVerify, SignJWT } from 'jose';
import { fixture } from './helpers/browser.mjs';

const secret = new TextEncoder().encode('test-only-signing-key-with-at-least-32-bytes');
const account = { name: 'Alex', email: 'alex@example.com', password: 'example password here' };

test('login issues a five-minute JWT; valid JWT requests skip refresh-session lookups', async t => {
  const { browser, db } = await fixture(t, { jwtSecret: secret });
  const current = browser();
  await current('/auth/register', 'POST', account);
  const access = current.cookies.get('session_forge_access');
  const refresh = current.cookies.get('session_forge');
  assert.ok(refresh && access);
  assert.notEqual(access, refresh);
  const { payload } = await jwtVerify(access, secret, {
    algorithms: ['HS256'], issuer: 'session-forge-sqlite-example', audience: 'session-forge-example-api',
  });
  assert.equal(payload.exp - payload.iat, 300);
  assert.equal(payload.sid, createHash('sha256').update(refresh).digest('hex'));
  const queries = [];
  db.on('query', query => queries.push(query.sql));
  assert.equal((await current('/auth/me')).status, 200);
  assert.equal(queries.some(sql => /refresh_tokens|session_families/.test(sql)), false);
});

test('expired JWT renews on the backend without rotating or extending the refresh token', async t => {
  const { browser, db } = await fixture(t, { jwtSecret: secret });
  const current = browser();
  await current('/auth/register', 'POST', account);
  const refresh = current.cookies.get('session_forge');
  const claims = decodeJwt(current.cookies.get('session_forge_access'));
  const expired = await new SignJWT({ sid: claims.sid }).setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub).setIssuer(claims.iss).setAudience(claims.aud)
    .setIssuedAt(Math.floor(Date.now() / 1000) - 600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 300).sign(secret);
  const before = await db('refresh_tokens').first();
  current.cookies.set('session_forge_access', expired);
  const response = await current('/auth/me');
  assert.equal(response.status, 200);
  assert.match(response.setCookie, /session_forge_access=/);
  assert.notEqual(current.cookies.get('session_forge_access'), expired);
  assert.equal(current.cookies.get('session_forge'), refresh);
  assert.deepEqual(await db('refresh_tokens').first(), before);
  assert.equal((await db('refresh_tokens')).length, 1);
});

test('revocation stops renewal while an issued access JWT remains valid until expiration', async t => {
  const { browser, db } = await fixture(t, { jwtSecret: secret });
  const current = browser();
  await current('/auth/register', 'POST', account);
  await db('session_families').update({ revoked_at: Date.now() });
  assert.equal((await current('/auth/me')).status, 200);
  assert.equal((await current('/auth/refresh', 'POST')).status, 401);
  assert.equal(current.cookies.size, 0);
  assert.equal((await current('/auth/me')).status, 401);
});

test('an invalid access JWT cannot authenticate without a valid refresh token', async t => {
  const { browser } = await fixture(t, { jwtSecret: secret });
  const current = browser();
  current.cookies.set('session_forge_access', 'invalid.jwt.value');
  assert.equal((await current('/auth/me')).status, 401);
  assert.equal(current.cookies.size, 0);
});
