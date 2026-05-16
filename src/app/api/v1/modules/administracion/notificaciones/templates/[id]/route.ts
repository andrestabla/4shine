import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getTemplate, updateTemplate, deleteTemplate } from '@/features/notificaciones/service';
import type { UpdateTemplateInput } from '@/features/notificaciones/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getTemplate(client, identity, id),
      ),
    );
    if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to get notification template');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody<UpdateTemplateInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateTemplate(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_notification_template',
          entityTable: 'app_admin.notification_templates',
          entityId: id,
          changeSummary: { fields: Object.keys(body) },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update notification template');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await deleteTemplate(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_notification_template',
          entityTable: 'app_admin.notification_templates',
          entityId: id,
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { deleted: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete notification template');
  }
}
