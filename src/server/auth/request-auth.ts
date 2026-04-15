import { ACCESS_COOKIE, GUEST_ACCESS_COOKIE, parseCookieValue } from './cookies';
import { verifyAccessToken, verifyGuestAccessToken } from './tokens';
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
  const guestCookieToken = parseCookieValue(request, GUEST_ACCESS_COOKIE);
  const token = bearer ?? cookieToken ?? guestCookieToken;

  if (!token) return null;

  try {
    try {
      const claims = await verifyAccessToken(token);
      return {
        userId: claims.sub,
        email: claims.email,
        name: claims.name,
        role: claims.role,
        guestScope: claims.guestScope,
        inviteToken: claims.inviteToken,
      };
    } catch {
      const guestClaims = await verifyGuestAccessToken(token);
      return {
        userId: guestClaims.sub,
        email: guestClaims.email,
        name: guestClaims.name,
        role: guestClaims.role,
        guestScope: guestClaims.guestScope,
        inviteToken: guestClaims.inviteToken,
      };
    }
  } catch {
    return null;
  }
}
