import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { hashPassword } from '@/server/auth/password';
import { writeAuditLog } from '@/server/audit/service';

export const runtime = 'nodejs';

interface Body {
  newPassword?: string;
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
  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: 'La contraseña debe tener al menos 8 caracteres' },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
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
          changeSummary: { forced: true },
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'No se pudo cambiar la contraseña', detail }, { status: 500 });
  }
}
