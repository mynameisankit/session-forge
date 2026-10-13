import { randomBytes, createHash } from 'node:crypto';

/** Generate an opaque token containing 32 random bytes, encoded as base64url. */
export const createToken = (): string => randomBytes(32).toString('base64url');

/** Hash an opaque token for storage. Passwords must use hashPassword instead. */
export const hashToken = (value: string): string => createHash('sha256').update(value).digest('hex');
