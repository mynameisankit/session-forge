import type { Knex } from 'knex';
import { errors } from 'jose';
import { createSessions, hashToken } from '../session-forge.js';
import { HttpError } from '../http/error.js';
import { accessCookie, cookieToken, SessionCookies } from './cookies.js';
import { createAccessTokens } from './access-token.js';
import { deviceName } from './device.js';
import type { UserRow } from './user.js';

export function createAuthentication(db: Knex, origin: string, secret?: Uint8Array) {
  const { store, sessions } = createSessions(db);
  const cookies = new SessionCookies(origin);
  const accessTokens = createAccessTokens(secret);

  function signedOut(headers: Headers): never {
    cookies.clear(headers);
    throw new HttpError(401, 'Please sign in again.', headers);
  }

  async function establish(request: Request, headers: Headers, user: UserRow, remember: boolean) {
    const previous = cookieToken(request);
    if (previous) {
      const details = await store.findToken(hashToken(previous));
      if (details) await sessions.revokeSession(details.family.tokenHash);
    }
    const token = await sessions.createSession({ userId: user.id, sessionName: deviceName(request) });
    cookies.set(headers, token, remember);
    cookies.setAccess(headers, await accessTokens.issue(user.id, hashToken(token)));
  }

  async function refresh(request: Request, headers = new Headers()) {
    const token = cookieToken(request);
    if (!token) return signedOut(headers);
    const validation = await sessions.validateRefreshToken(token);
    if (validation.status !== 'valid') return signedOut(headers);
    const user = await db<UserRow>('users').where('id', validation.userId).first();
    if (!user) return signedOut(headers);
    cookies.setAccess(headers, await accessTokens.issue(user.id, validation.familyId));
    return { user, familyId: validation.familyId, headers };
  }

  async function authenticate(request: Request) {
    const token = accessCookie(request);
    if (token) {
      try {
        const claims = await accessTokens.verify(token);
        const user = await db<UserRow>('users').where('id', claims.userId).first();
        if (!user) return signedOut(new Headers());
        return { user, familyId: claims.familyId, headers: new Headers() };
      } catch (error) {
        if (!(error instanceof errors.JOSEError)) throw error;
      }
    }
    // Renewal stays on the backend: no browser retry or token-storage machinery.
    return refresh(request);
  }

  async function signOut(request: Request, headers: Headers) {
    const token = cookieToken(request);
    const details = token ? await store.findToken(hashToken(token)) : null;
    if (details) await sessions.revokeSession(details.family.tokenHash);
    cookies.clear(headers);
  }

  return { authenticate, establish, refresh, signOut, cookies, sessions };
}

export type Authentication = ReturnType<typeof createAuthentication>;
