export function deviceName(request: Request): string {
  const agent = request.headers.get('user-agent') ?? '';
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox'
    : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Browser';
  const platform = /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS'
    : /Windows/.test(agent) ? 'Windows' : /Macintosh/.test(agent) ? 'macOS'
      : /Linux/.test(agent) ? 'Linux' : 'Unknown device';
  return `${browser} on ${platform}`;
}
