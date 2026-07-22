import { NextResponse } from 'next/server';
import { validatePassword } from '@/server/auth/password-policy';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { writeAuditLog } from '@/server/audit/service';

export const runtime = 'nodejs';

interface Body {
  newPassword?: string;
  /**
   * Cambio autoservicio desde el perfil: si se envía, se verifica contra el
   * hash actual antes de actualizar. El flujo de cambio forzado (/cambiar-clave)
   * no lo envía y conserva su comportamiento.
   */
  currentPassword?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const newPassword = body.newPassword ?? '';
  const policy = validatePassword(newPassword);
  if (!policy.ok) {
    return NextResponse.json({ ok: false, error: policy.error }, { status: 400 });
  }

  const currentPassword = body.currentPassword;

  try {
    const passwordHash = await hashPassword(newPassword);
    const result = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        // La contraseña actual es OBLIGATORIA salvo que el servidor tenga
        // marcada la cuenta con must_change_password (primer ingreso o reset
        // hecho por un admin). Antes la comprobación se activaba solo si el
        // cliente enviaba el campo: omitirlo la saltaba por completo, y
        // cualquier sesión robada se convertía en toma de control permanente.
        const { rows } = await client.query<{
          password_hash: string | null;
          must_change_password: boolean | null;
        }>(
          `SELECT password_hash, must_change_password
             FROM app_auth.user_credentials WHERE user_id = $1::uuid LIMIT 1`,
          [identity.userId],
        );
        const storedHash = rows[0]?.password_hash;
        const forcedChange = rows[0]?.must_change_password === true;

        if (!forcedChange) {
          if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
            return { ok: false as const, reason: 'missing_current' as const };
          }
          if (!storedHash || !(await verifyPassword(currentPassword, storedHash))) {
            return { ok: false as const, reason: 'invalid_current' as const };
          }
        }
        await client.query(
          `UPDATE app_auth.user_credentials
           SET password_hash = $2, must_change_password = false,
               password_updated_at = now(), updated_at = now()
           WHERE user_id = $1::uuid`,
          [identity.userId, passwordHash],
        );
        await writeAuditLog(client, {
          actorUserId: identity.userId,
          action: 'self_change_password',
          moduleCode: 'usuarios',
          entityTable: 'app_auth.user_credentials',
          entityId: identity.userId,
          changeSummary: { forced: forcedChange },
        });
        return { ok: true as const };
      }),
    );
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            result.reason === 'missing_current'
              ? 'Debes ingresar tu contraseña actual'
              : 'La contraseña actual no es correcta',
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    console.error('[auth/change-password] failed:', error);
    return NextResponse.json({ ok: false, error: 'No se pudo cambiar la contraseña' }, { status: 500 });
  }
}
