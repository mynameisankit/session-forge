import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from 'session-forge/utils';

test('password hashes use distinct salts and verify the original password', async () => {
  const password = 'a long password with Unicode: \u{1f512}';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.match(first, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password, second), true);
  assert.equal(await verifyPassword('incorrect password', first), false);
});

test('malformed password hashes fail verification without throwing', async () => {
  const valid = await hashPassword('example password');
  for (const stored of ['', 'invalid', 'salt:hash', valid + ':extra', valid.slice(1), 'z'.repeat(32) + valid.slice(32)]) {
    assert.equal(await verifyPassword('example password', stored), false);
  }
});
