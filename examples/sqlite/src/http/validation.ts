import { HttpError } from './error.js';

export function text(body: Record<string, unknown>, key: string, min = 1, max = 256): string {
  const value = body[key];
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    throw new HttpError(400, `Invalid ${key}.`);
  }
  return value;
}

export function emailAddress(body: Record<string, unknown>): string {
  const email = text(body, 'email').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Invalid email.');
  return email;
}
