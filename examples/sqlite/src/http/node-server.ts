import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

function webRequest(message: IncomingMessage, response: ServerResponse): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(message.headers)) {
    if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const controller = new AbortController();
  response.on('close', () => { if (!response.writableEnded) controller.abort(); });
  const init: RequestInit & { duplex?: 'half' } = {
    method: message.method,
    headers,
    signal: controller.signal,
  };
  if (message.method !== 'GET' && message.method !== 'HEAD') {
    init.body = Readable.toWeb(message) as ReadableStream<Uint8Array>;
    init.duplex = 'half';
  }
  return new Request(new URL(message.url ?? '/', 'http://localhost'), init);
}

/** Node HTTP transport only; route matching and execution belong to React Router. */
export function createNodeServer(handle: (request: Request) => Promise<Response>) {
  return createServer((request, response) => {
    void (async () => {
      const result = await handle(webRequest(request, response));
      response.statusCode = result.status;
      result.headers.forEach((value, name) => {
        if (name !== 'set-cookie') response.setHeader(name, value);
      });
      const cookies = result.headers.getSetCookie();
      if (cookies.length) response.setHeader('Set-Cookie', cookies);
      if (request.method === 'HEAD') response.end();
      else response.end(Buffer.from(await result.arrayBuffer()));
    })().catch((error: unknown) => {
      console.error('HTTP transport failed:', error);
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
  });
}
