import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './helpers/browser.mjs';

const password = 'correct horse battery staple';
const account = { name: 'Alex', email: 'alex@example.com', password };

test('password change preserves the browser and revokes other sessions and reset links', async t => {
  const { browser, links } = await fixture(t);
  const current = browser(), other = browser();
  await current('/auth/register', 'POST', account);
  await other('/auth/login', 'POST', account);
  await current('/auth/forgot-password', 'POST', { email: account.email });
  const token = new URL(links[0]).searchParams.get('token');
  assert.equal((await current('/auth/change-password', 'POST', { currentPassword: 'incorrect', password: 'new password here' })).status, 400);
  assert.equal((await current('/auth/change-password', 'POST', { currentPassword: password, password: 'new password here' })).status, 204);
  assert.equal((await current('/auth/me')).status, 200);
  assert.equal((await other('/auth/refresh', 'POST')).status, 401);
  assert.equal((await browser()('/auth/login', 'POST', account)).status, 401);
  assert.equal((await browser()('/auth/reset-password', 'POST', { token, password })).status, 400);
  assert.equal((await browser()('/auth/login', 'POST', { ...account, password: 'new password here' })).status, 200);
});

test('reset links are hashed, expire, work once and revoke every session', async t => {
  const { browser, links, db } = await fixture(t);
  const current = browser();
  await current('/auth/register', 'POST', account);
  assert.equal((await browser()('/auth/forgot-password', 'POST', { email: 'missing@example.com' })).status, 204);
  assert.equal(links.length, 0);
  await browser()('/auth/forgot-password', 'POST', { email: account.email });
  const expired = new URL(links[0]).searchParams.get('token');
  assert.notEqual((await db('password_resets').first()).token_hash, expired);
  await db('password_resets').update({ expires_at: 0 });
  assert.equal((await browser()('/auth/reset-password', 'POST', { token: expired, password })).status, 400);
  await browser()('/auth/forgot-password', 'POST', { email: account.email });
  const token = new URL(links[1]).searchParams.get('token');
  assert.equal((await browser()('/auth/reset-password', 'POST', { token, password: 'reset password here' })).status, 204);
  assert.equal((await current('/auth/refresh', 'POST')).status, 401);
  assert.equal((await browser()('/auth/reset-password', 'POST', { token, password })).status, 400);
  assert.equal((await browser()('/auth/login', 'POST', { ...account, password: 'reset password here' })).status, 200);
});

