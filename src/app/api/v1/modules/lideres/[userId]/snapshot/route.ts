import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getLeader360Snapshot } from '@/features/lideres/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
    params: Promise<{ userId: string }>;
}

export const runtime = 'nodejs';

export async function GET(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId } = await context.params;
    if (!userId) {
        return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await getLeader360Snapshot(client, identity, userId);
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'lideres',
                    action: 'query_leader_snapshot',
                    entityTable: 'app_core.users',
                    entityId: userId,
                    changeSummary: {
                        workbooks: result.workbooks.length,
                        diagnosticCompletion: result.diagnostic.completionPercent,
                        mentorships: result.mentorship.assignments.length,
                        connections: result.networking.connectedCount,
                    },
                });
                return result;
            }),
        );

        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo cargar el perfil 360 del líder');
    }
}
