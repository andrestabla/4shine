import { ACCESS_COOKIE, GUEST_ACCESS_COOKIE, parseCookieValue } from './cookies';
import { verifyAccessToken, verifyGuestAccessToken } from './tokens';
import { withClient } from '@/server/db/pool';
import type { Role } from '@/server/bootstrap/types';
import type { AuthUser } from './types';

function readBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

// Re-lee el rol vigente desde la BD por cada request autenticado.
//
// Por qué: el JWT congela `role` al momento del login. Si admin cambia
// `primary_role` después (o desactiva al usuario), el JWT viejo seguiría
// reportando el rol antiguo hasta que expire, dando lugar a "role leak"
// donde el usuario sigue viendo permisos y datos del rol anterior.
//
// Esta lectura agrega ~1 query liviano por request (la mayoría de rutas
// ya abren `withClient` después para la query de negocio, así que el costo
// marginal es mínimo). Si el usuario ya no existe o está desactivado,
// devolvemos null y el request queda como no autenticado.
async function readFreshUserRole(
  userId: string,
): Promise<{ role: Role; isActive: boolean } | null> {
  try {
    return await withClient(async (client) => {
      const { rows } = await client.query<{
        primary_role: Role;
        is_active: boolean;
      }>(
        `SELECT primary_role, is_active
           FROM app_core.users
          WHERE user_id = $1::uuid
          LIMIT 1`,
        [userId],
      );
      const row = rows[0];
      if (!row) return null;
      return { role: row.primary_role, isActive: row.is_active };
    });
  } catch {
    // Si la BD no responde, NO inferimos: fallar a no-autenticado es más
    // seguro que servir con un rol potencialmente obsoleto.
    return null;
  }
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
      // Sobreescribimos `role` con el valor vigente del DB para que el
      // rol actual siempre tenga prioridad sobre el que viajaba en el JWT.
      const fresh = await readFreshUserRole(claims.sub);
      if (!fresh || !fresh.isActive) return null;
      return {
        userId: claims.sub,
        email: claims.email,
        name: claims.name,
        role: fresh.role,
        guestScope: claims.guestScope,
        inviteToken: claims.inviteToken,
      };
    } catch {
      // Los guest tokens no tienen fila en app_core.users (son scopes
      // efímeros vinculados a una invitación), así que para ellos el rol
      // del token es la única verdad disponible.
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
