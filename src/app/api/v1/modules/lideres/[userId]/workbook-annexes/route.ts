import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
    createWorkbookAnnex,
    listWorkbookAnnexesForLeader,
    type CreateWorkbookAnnexInput,
} from '@/features/lideres/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
    params: Promise<{ userId: string }>;
}

export const runtime = 'nodejs';

/** Anexos PDF de los workbooks de un líder (el propio líder o el equipo). */
export async function GET(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId } = await context.params;
    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, () =>
                listWorkbookAnnexesForLeader(client, identity, userId),
            ),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudieron cargar los anexos');
    }
}

/** Anexa un PDF ya cargado en R2 a un workbook del líder (advisor, gestor o admin). */
export async function POST(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId } = await context.params;
    const body = await parseJsonBody<CreateWorkbookAnnexInput>(request);
    if (!body?.workbookId || !body.fileUrl?.trim()) {
        return NextResponse.json({ ok: false, error: 'workbookId y fileUrl son obligatorios' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await createWorkbookAnnex(client, identity, userId, body);
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'lideres',
                    action: 'create_workbook_annex',
                    entityTable: 'app_learning.workbook_annexes',
                    entityId: result.annexId,
                    changeSummary: { leaderUserId: userId, workbookId: body.workbookId, fileName: result.fileName },
                });
                return result;
            }),
        );
        return NextResponse.json({ ok: true, data }, { status: 201 });
    } catch (error) {
        return errorResponse(error, 'No se pudo guardar el anexo');
    }
}
