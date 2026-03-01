import { ACCESS_COOKIE, parseCookieValue } from './cookies';
import { verifyAccessToken } from './tokens';
import type { AuthUser } from './types';

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function authenticateRequest(request: Request): Promise<AuthUser | null> {
  const bearer = readBearerToken(request);
  const cookieToken = parseCookieValue(request, ACCESS_COOKIE);
  const token = bearer ?? cookieToken;

  if (!token) return null;

  try {
    const claims = await verifyAccessToken(token);
    return {
      userId: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role,
    };
  } catch {
    return null;
  }
}
