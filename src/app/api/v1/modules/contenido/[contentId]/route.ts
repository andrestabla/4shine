import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateContentInput } from '@/features/content/service';
import { deleteContent, purgeContent, restoreContent, updateContent } from '@/features/content/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ contentId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateContentInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contentId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateContent(client, identity, contentId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'contenido',
          action: 'update_content',
          entityTable: 'app_learning.content_items',
          entityId: contentId,
          changeSummary: { status: result.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update content');
  }
}

// Restaurar desde la papelera.
export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { contentId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await restoreContent(client, contentId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'contenido',
          action: 'restore_content',
          entityTable: 'app_learning.content_items',
          entityId: contentId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to restore content');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { contentId } = await context.params;
  const permanent = new URL(request.url).searchParams.get('permanent') === '1';

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = permanent
          ? await purgeContent(client, contentId)
          : await deleteContent(client, contentId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'contenido',
          action: permanent ? 'purge_content' : 'delete_content',
          entityTable: 'app_learning.content_items',
          entityId: contentId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete content');
  }
}
