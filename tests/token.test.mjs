import assert from 'node:assert/strict';
import test from 'node:test';
import { createToken, hashToken } from 'session-forge/utils';

test('public token utilities generate URL-safe tokens and stable SHA-256 hashes', () => {
  const token = createToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(Buffer.from(token, 'base64url').length, 32);
  assert.notEqual(createToken(), token);
  assert.equal(hashToken('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
