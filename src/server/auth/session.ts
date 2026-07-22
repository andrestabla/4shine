import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { authConfig } from './config';
import { sha256 } from './crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens';
import type { AuthSessionTokens, AuthUser } from './types';
import { SESSION_IDLE_LIMIT_MS } from '@/lib/session-timeout';

function refreshExpiryDate(): Date {
  return new Date(Date.now() + authConfig.refreshTtlSeconds * 1000);
}

export async function issueAuthTokens(
  client: PoolClient,
  user: AuthUser,
  userAgent?: string | null,
  ipAddress?: string | null,
): Promise<AuthSessionTokens> {
  const sessionId = randomUUID();
  const refreshToken = await signRefreshToken(user, sessionId);
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = refreshExpiryDate();

  await client.query(
    `
      INSERT INTO app_auth.refresh_sessions (
        session_id,
        user_id,
        refresh_token_hash,
        user_agent,
        ip_address,
        expires_at,
        last_used_at
      )
      VALUES ($1, $2, $3, $4, $5::inet, $6, now())
    `,
    [sessionId, user.userId, refreshTokenHash, userAgent ?? null, ipAddress ?? null, expiresAt.toISOString()],
  );

  const accessToken = await signAccessToken(user);

  return { accessToken, refreshToken };
}

export async function rotateFromRefreshToken(
  client: PoolClient,
  refreshToken: string,
  userAgent?: string | null,
  ipAddress?: string | null,
): Promise<{ user: AuthUser; tokens: AuthSessionTokens }> {
  const claims = await verifyRefreshToken(refreshToken);
  const refreshTokenHash = sha256(refreshToken);

  // Refresh runs before access token context exists; set RLS context from validated refresh claims.
  await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', claims.sub]);
  await client.query('SELECT set_config($1, $2, true)', ['app.current_role', claims.role]);

  const { rows } = await client.query<{
    user_id: string;
    email: string;
    display_name: string;
    primary_role: AuthUser['role'];
    refresh_token_hash: string;
    revoked_at: string | null;
    expires_at: string;
    last_used_at: string | null;
  }>(
    `
      SELECT
        rs.user_id,
        u.email,
        u.display_name,
        u.primary_role,
        rs.refresh_token_hash,
        rs.revoked_at::text,
        rs.expires_at::text,
        rs.last_used_at::text
      FROM app_auth.refresh_sessions rs
      JOIN app_core.users u ON u.user_id = rs.user_id
      WHERE rs.session_id = $1
        AND rs.user_id = $2
        AND u.is_active = true
      LIMIT 1
    `,
    [claims.sessionId, claims.sub],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Refresh session not found');
  }

  if (row.revoked_at) {
    throw new Error('Refresh session revoked');
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new Error('Refresh session expired');
  }

  if (row.refresh_token_hash !== refreshTokenHash) {
    throw new Error('Refresh token mismatch');
  }

  // Inactividad verificada en el SERVIDOR. Antes la ventana se calculaba con un
  // lastActivityAt que enviaba el cliente: omitirlo saltaba la comprobación, así
  // que la sesión "caducaba por inactividad" solo para los usuarios honestos —
  // quien robara la cookie la renovaba indefinidamente durante 30 días.
  // Margen sobre la ventana nominal: el access token dura exactamente lo mismo
  // que el límite de inactividad (30 min), así que un usuario activo que refresca
  // justo al expirar caería en el borde y sería expulsado. El margen evita ese
  // falso positivo sin perder el control: una cookie robada deja de renovarse a
  // los ~35 minutos del último uso legítimo, en vez de durar 30 días.
  const IDLE_GRACE_MS = 5 * 60 * 1000;
  if (row.last_used_at) {
    const idleMs = Date.now() - new Date(row.last_used_at).getTime();
    if (idleMs >= SESSION_IDLE_LIMIT_MS + IDLE_GRACE_MS) {
      await client.query(
        `UPDATE app_auth.refresh_sessions SET revoked_at = now() WHERE session_id = $1`,
        [claims.sessionId],
      );
      throw new Error('Refresh session idle expired');
    }
  }

  const user: AuthUser = {
    userId: row.user_id,
    email: row.email,
    name: row.display_name,
    role: row.primary_role,
  };

  const nextRefreshToken = await signRefreshToken(user, claims.sessionId);
  const nextRefreshHash = sha256(nextRefreshToken);
  const nextExpiresAt = refreshExpiryDate();

  await client.query(
    `
      UPDATE app_auth.refresh_sessions
      SET
        refresh_token_hash = $2,
        user_agent = COALESCE($3, user_agent),
        ip_address = COALESCE($4::inet, ip_address),
        expires_at = $5,
        last_used_at = now()
      WHERE session_id = $1
    `,
    [claims.sessionId, nextRefreshHash, userAgent ?? null, ipAddress ?? null, nextExpiresAt.toISOString()],
  );

  const nextAccessToken = await signAccessToken(user);

  return {
    user,
    tokens: {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    },
  };
}

export async function revokeFromRefreshToken(client: PoolClient, refreshToken: string): Promise<void> {
  try {
    const claims = await verifyRefreshToken(refreshToken);
    await client.query(
      `
        UPDATE app_auth.refresh_sessions
        SET revoked_at = now()
        WHERE session_id = $1
          AND user_id = $2
          AND revoked_at IS NULL
      `,
      [claims.sessionId, claims.sub],
    );
  } catch {
    // Ignore invalid tokens on logout
  }
}

export async function revokeAllUserSessions(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    `
      UPDATE app_auth.refresh_sessions
      SET revoked_at = now()
      WHERE user_id = $1
        AND revoked_at IS NULL
    `,
    [userId],
  );
}
