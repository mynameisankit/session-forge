import { HttpError } from './error.js';

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'Send an application/json request.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Invalid JSON request.');
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16384) {
        await reader.cancel();
        throw new HttpError(413, 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString());
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new HttpError(400, 'Invalid JSON request.'); }
}

export function validateOrigin(request: Request, origin: string): void {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const provided = request.headers.get('origin');
  if ((provided && provided !== origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Request origin is not allowed.');
  }
}

export function requireMethod(request: Request, method: string): void {
  if (request.method !== method) {
    throw new HttpError(405, 'Method not allowed.', { Allow: method });
  }
}
