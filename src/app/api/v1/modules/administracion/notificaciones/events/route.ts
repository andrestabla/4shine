import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listEventConfigs, upsertEventConfig } from '@/features/notificaciones/service';
import type { UpdateEventConfigInput } from '@/features/notificaciones/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listEventConfigs(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list notification event configs');
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ eventKey: string; moduleCode: string } & UpdateEventConfigInput>(request);
  if (!body?.eventKey || !body?.moduleCode) {
    return NextResponse.json({ ok: false, error: 'eventKey and moduleCode are required' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await upsertEventConfig(client, identity, body.eventKey, body.moduleCode, {
          templateId: body.templateId,
          channelEmail: body.channelEmail,
          channelInApp: body.channelInApp,
          isEnabled: body.isEnabled,
        });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_notification_event_config',
          entityTable: 'app_admin.notification_event_configs',
          entityId: result.configId,
          changeSummary: { eventKey: body.eventKey, isEnabled: body.isEnabled },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update notification event config');
  }
}
