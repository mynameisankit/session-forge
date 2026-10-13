import { randomBytes, type UUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';

const ISSUER = 'session-forge-sqlite-example';
const AUDIENCE = 'session-forge-example-api';
export const ACCESS_TTL = 5 * 60;

export function createAccessTokens(secret: Uint8Array = randomBytes(32)) {
  return {
    async issue(userId: UUID, familyId: string): Promise<string> {
      return new SignJWT({ sid: familyId })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer(ISSUER).setAudience(AUDIENCE).setSubject(userId)
        .setIssuedAt().setExpirationTime(`${ACCESS_TTL}s`).sign(secret);
    },

    async verify(token: string) {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE,
        requiredClaims: ['sub', 'sid', 'iat', 'exp'],
      });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        throw new Error('Invalid access token claims.');
      }
      return { userId: payload.sub as UUID, familyId: payload.sid };
    },
  };
}
