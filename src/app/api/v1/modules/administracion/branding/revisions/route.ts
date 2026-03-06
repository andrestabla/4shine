import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listBrandingRevisions } from '@/features/administracion/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 40);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 40;

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const revisions = await listBrandingRevisions(client, identity, safeLimit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'query_branding_revisions',
          entityTable: 'app_admin.branding_revisions',
          changeSummary: {
            limit: safeLimit,
            returnedRows: revisions.length,
          },
        });
        return revisions;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list branding revisions');
  }
}
