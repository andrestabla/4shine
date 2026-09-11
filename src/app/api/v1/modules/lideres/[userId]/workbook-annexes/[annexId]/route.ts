import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteWorkbookAnnex } from '@/features/lideres/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
    params: Promise<{ userId: string; annexId: string }>;
}

export const runtime = 'nodejs';

export async function DELETE(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId, annexId } = await context.params;
    try {
        await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await deleteWorkbookAnnex(client, identity, userId, annexId);
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'lideres',
                    action: 'delete_workbook_annex',
                    entityTable: 'app_learning.workbook_annexes',
                    entityId: result.annexId,
                    changeSummary: { leaderUserId: userId },
                });
                return result;
            }),
        );
        return NextResponse.json({ ok: true, data: { annexId } }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo eliminar el anexo');
    }
}
