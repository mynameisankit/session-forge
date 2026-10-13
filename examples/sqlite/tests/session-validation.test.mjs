import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './helpers/browser.mjs';

const password = 'correct horse battery staple';
const account = { name: 'Alex', email: 'alex@example.com', password };

test('origin checks, unknown routes, expired and consumed tokens', async t => {
  const { browser, db } = await fixture(t);
  const current = browser();
  assert.equal((await current('/auth/register', 'POST', account, { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await current('/missing')).status, 404);
  await current('/auth/register', 'POST', account);
  await db('refresh_tokens').update({ expiresAt: new Date(0).toISOString() });
  assert.equal((await current('/auth/refresh', 'POST')).status, 401);
  await current('/auth/login', 'POST', account);
  assert.equal((await current('/sessions')).data.length, 1);
  await db('refresh_tokens').update({ consumedAt: Date.now() });
  assert.equal((await current('/auth/refresh', 'POST')).status, 401);
});

