import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listUserNavigationLogs } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { userId } = await context.params;

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 200);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listUserNavigationLogs(client, { userId, limit });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'query_user_audit_logs',
          entityTable: 'app_admin.audit_logs',
          entityId: userId,
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list user audit logs');
  }
}
