import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateWorkbookInput } from '@/features/aprendizaje/service';
import { deleteWorkbook, updateWorkbook } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ workbookId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateWorkbookInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workbookId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateWorkbook(client, identity, workbookId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'update_workbook',
          entityTable: 'app_learning.user_workbooks',
          entityId: workbookId,
          changeSummary: {
            ownerUserId: result.ownerUserId,
            accessState: result.accessState,
            isHidden: result.isHidden,
            isEnabled: result.isEnabled,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update workbook');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workbookId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteWorkbook(client, identity, workbookId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'delete_workbook',
          entityTable: 'app_learning.user_workbooks',
          entityId: workbookId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete workbook');
  }
}
