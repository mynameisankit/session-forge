import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './helpers/browser.mjs';

const password = 'correct horse battery staple';
const account = { name: 'Alex', email: 'alex@example.com', password };

test('registration, login, ownership, revocation and logout match the common client', async t => {
  const { browser, db } = await fixture(t);
  const first = browser(), second = browser(), third = browser(), stranger = browser();
  assert.equal((await first('/auth/me')).status, 401);
  assert.equal((await first('/auth/register', 'POST', { ...account, password: 'short' })).status, 400);
  const registered = await first('/auth/register', 'POST', { ...account, email: 'Alex@Example.com' });
  assert.equal(registered.status, 201);
  assert.deepEqual(registered.data, { name: 'Alex', email: 'alex@example.com' });
  assert.match(registered.setCookie, /HttpOnly/);
  assert.match(registered.setCookie, /SameSite=Lax/);
  assert.doesNotMatch(registered.setCookie, /Max-Age/);
  assert.equal((await first('/auth/me')).status, 200);
  assert.equal((await browser()('/auth/register', 'POST', account)).status, 409);
  assert.equal((await second('/auth/login', 'POST', { ...account, password: 'wrong password' })).status, 401);
  const login = await second('/auth/login', 'POST', { ...account, remember: true });
  assert.equal(login.status, 200);
  assert.match(login.setCookie, /Max-Age=2592000/);
  const sessions = (await first('/sessions')).data;
  assert.equal(sessions.length, 2);
  assert.equal(sessions.filter(session => session.current).length, 1);
  const otherId = sessions.find(session => !session.current).id;
  await stranger('/auth/register', 'POST', { ...account, email: 'other@example.com' });
  assert.equal((await stranger(`/sessions/${otherId}`, 'DELETE')).status, 404);
  assert.equal((await first(`/sessions/${sessions.find(session => session.current).id}`, 'DELETE')).status, 400);
  assert.equal((await first(`/sessions/${otherId}`, 'DELETE')).status, 204);
  assert.equal((await second('/auth/refresh', 'POST')).status, 401);
  await third('/auth/login', 'POST', account);
  assert.equal((await first('/sessions/others', 'DELETE')).status, 204);
  assert.equal((await third('/auth/refresh', 'POST')).status, 401);
  assert.equal((await first('/auth/me')).status, 200);
  assert.equal((await stranger('/auth/me')).status, 200);
  assert.equal((await first('/auth/logout', 'POST')).status, 204);
  assert.equal((await first('/auth/me')).status, 401);
  assert.equal((await first('/auth/logout', 'POST')).status, 204);
  assert.notEqual((await db('users').where('email', account.email).first()).password_hash, password);
});

