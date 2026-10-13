import { SESSION_TTL } from '../config.js';

const REFRESH_COOKIE = 'session_forge';
const ACCESS_COOKIE = 'session_forge_access';

function readCookie(request: Request, name: string): string | undefined {
  return request.headers.get('cookie')?.split(';').map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`))?.slice(name.length + 1);
}

export const cookieToken = (request: Request) => readCookie(request, REFRESH_COOKIE);
export const accessCookie = (request: Request) => readCookie(request, ACCESS_COOKIE);

export class SessionCookies {
  private readonly secure: string;

  constructor(clientOrigin: string) {
    this.secure = clientOrigin.startsWith('https:') ? '; Secure' : '';
  }

  private write(headers: Headers, name: string, token: string, maxAge?: number): void {
    const persistence = maxAge === undefined ? '' : `; Max-Age=${maxAge}`;
    headers.append('Set-Cookie', `${name}=${token}; Path=/; HttpOnly; SameSite=Lax${this.secure}${persistence}`);
  }

  set(headers: Headers, token: string, remember: boolean): void {
    this.write(headers, REFRESH_COOKIE, token, remember ? SESSION_TTL / 1000 : undefined);
  }

  setAccess(headers: Headers, token: string): void {
    // JWT exp controls validity; the refresh cookie controls remembered sign-in.
    this.write(headers, ACCESS_COOKIE, token);
  }

  clear(headers: Headers): void {
    this.write(headers, REFRESH_COOKIE, '', 0);
    this.write(headers, ACCESS_COOKIE, '', 0);
  }
}
