import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listGroupReminderWindows, setGroupReminderWindow } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () => listGroupReminderWindows(client, identity)),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudieron cargar las ventanas de recordatorio');
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ windowMinutes?: number; isEnabled?: boolean }>(request);
  if (!body || typeof body.windowMinutes !== 'number' || typeof body.isEnabled !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'windowMinutes (number) e isEnabled (boolean) son obligatorios' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await setGroupReminderWindow(client, identity, body.windowMinutes!, body.isEnabled!);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'set_group_reminder_window',
          entityTable: 'app_admin.group_reminder_windows',
          changeSummary: { windowMinutes: body.windowMinutes, isEnabled: body.isEnabled },
        });
        return listGroupReminderWindows(client, identity);
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo actualizar la ventana de recordatorio');
  }
}
