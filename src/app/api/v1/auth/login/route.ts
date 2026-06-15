import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { verifyPassword } from '@/server/auth/password';
import { authConfig } from '@/server/auth/config';
import { issueAuthTokens } from '@/server/auth/session';
import { setAuthCookies } from '@/server/auth/cookies';
import { promoteInvitadoToLider } from '@/server/auth/promote-invitado';
import type { AuthUser } from '@/server/auth/types';
import { buildRequestSummary, recordAuditEvent, writeAuditLog } from '@/server/audit/service';

interface LoginBody {
  email?: string;
  password?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    try {
      await recordAuditEvent({
        action: 'auth_login_invalid_json',
        entityTable: 'app_auth.user_credentials',
        changeSummary: buildRequestSummary(request),
      });
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    try {
      await recordAuditEvent({
        action: 'auth_login_missing_fields',
        entityTable: 'app_auth.user_credentials',
        changeSummary: buildRequestSummary(request, { email: email ?? null }),
      });
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }
    return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        // Login runs before user context is known; set a read-capable role context so RLS can evaluate users SELECT.
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

        const { rows } = await client.query<{
          user_id: string;
          email: string;
          display_name: string;
          primary_role: AuthUser['role'];
          password_hash: string;
          failed_attempts: number;
          locked_until: string | null;
          is_active: boolean;
          email_verified_at: string | null;
          privacy_policy_accepted_at: string | null;
          must_change_password: boolean;
        }>(
          `
            SELECT
              u.user_id,
              u.email,
              u.display_name,
              u.primary_role,
              uc.password_hash,
              uc.failed_attempts,
              uc.locked_until::text,
              u.is_active,
              uc.email_verified_at::text,
              uc.must_change_password,
              lpa.accepted_at::text AS privacy_policy_accepted_at
            FROM app_core.users u
            JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
            LEFT JOIN LATERAL (
              SELECT accepted_at
              FROM app_auth.user_policy_acceptances
              WHERE user_id = u.user_id AND policy_code = 'privacy_policy'
              ORDER BY accepted_at DESC LIMIT 1
            ) lpa ON true
            WHERE u.email = $1
            LIMIT 1
          `,
          [email],
        );

        const authRow = rows[0];

        if (!authRow || !authRow.is_active) {
          await client.query('ROLLBACK');
          return { status: 401 as const, payload: { ok: false, error: 'Invalid credentials' } };
        }

        // Los invitados ya probaron control del correo al recibir+usar el
        // código único de invitación; consideramos su correo verificado.
        // El resto de roles sí debe verificar antes de loguearse.
        if (!authRow.email_verified_at && authRow.primary_role !== 'invitado') {
          await client.query('ROLLBACK');
          return {
            status: 403 as const,
            payload: {
              ok: false,
              error: 'email_not_verified',
              email: authRow.email,
            },
          };
        }

        if (authRow.locked_until && new Date(authRow.locked_until).getTime() > Date.now()) {
          await client.query('ROLLBACK');
          return {
            status: 423 as const,
            payload: {
              ok: false,
              error: 'Account temporarily locked due to multiple failed attempts',
            },
          };
        }

        const isValid = await verifyPassword(password, authRow.password_hash);

        if (!isValid) {
          const nextAttempts = authRow.failed_attempts + 1;
          const shouldLock = nextAttempts >= authConfig.lockMaxAttempts;

          await client.query(
            `
              UPDATE app_auth.user_credentials
              SET
                failed_attempts = $2,
                locked_until = CASE
                  WHEN $3 THEN now() + ($4 || ' minutes')::interval
                  ELSE NULL
                END,
                updated_at = now()
              WHERE user_id = $1
            `,
            [authRow.user_id, nextAttempts, shouldLock, authConfig.lockMinutes],
          );

          await client.query('COMMIT');

          return { status: 401 as const, payload: { ok: false, error: 'Invalid credentials' } };
        }

        await client.query(
          `
            UPDATE app_auth.user_credentials
            SET
              failed_attempts = 0,
              locked_until = NULL,
              updated_at = now()
            WHERE user_id = $1
          `,
          [authRow.user_id],
        );

        // Auto-promoción: si el usuario era 'invitado' y se loguea por
        // /acceso (no por el flow de invitación), lo promovemos a 'lider'
        // sin suscripción + registramos la compra puntual de Descubrimiento.
        // Mantiene el mismo user_id (no duplica) y conserva su sesión.
        let effectiveRole: AuthUser['role'] = authRow.primary_role;
        if (authRow.primary_role === 'invitado') {
          await promoteInvitadoToLider(client, authRow.user_id);
          await writeAuditLog(client, {
            actorUserId: authRow.user_id,
            action: 'auth_invitado_promoted_to_lider',
            entityTable: 'app_core.users',
            entityId: authRow.user_id,
            changeSummary: { previousRole: 'invitado', newRole: 'lider', via: 'login_password' },
          });
          effectiveRole = 'lider';
        }

        const user: AuthUser = {
          userId: authRow.user_id,
          email: authRow.email,
          name: authRow.display_name,
          role: effectiveRole,
        };

        const tokens = await issueAuthTokens(
          client,
          user,
          request.headers.get('user-agent'),
          getIpAddress(request),
        );

        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', user.userId]);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', user.role]);
        await writeAuditLog(client, {
          actorUserId: user.userId,
          action: 'auth_login_success',
          entityTable: 'app_auth.user_credentials',
          changeSummary: buildRequestSummary(request, { email: user.email }),
        });

        await client.query('COMMIT');

        return {
          status: 200 as const,
          payload: {
            ok: true,
            user: {
              id: user.userId,
              email: user.email,
              name: user.name,
              role: user.role,
              privacyPolicyAccepted: !!authRow.privacy_policy_accepted_at,
              mustChangePassword: !!authRow.must_change_password,
            },
          },
          tokens,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    const response = NextResponse.json(result.payload, { status: result.status });

    if (result.status === 200 && 'tokens' in result) {
      setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    } else {
      try {
        await recordAuditEvent({
          action: result.status === 423 ? 'auth_login_locked' : 'auth_login_failed',
          entityTable: 'app_auth.user_credentials',
          changeSummary: buildRequestSummary(request, { email }),
        });
      } catch (auditError) {
        console.error('Audit log failed', auditError);
      }
    }

    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: 'Login failed', detail },
      { status: 500 },
    );
  }
}
