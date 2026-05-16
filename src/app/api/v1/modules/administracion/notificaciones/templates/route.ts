import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listTemplates, createTemplate } from '@/features/notificaciones/service';
import type { CreateTemplateInput } from '@/features/notificaciones/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listTemplates(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list notification templates');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateTemplateInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createTemplate(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_notification_template',
          entityTable: 'app_admin.notification_templates',
          entityId: result.templateId,
          changeSummary: { name: result.name, eventKey: result.eventKey },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create notification template');
  }
}
