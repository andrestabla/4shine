import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getAnalytics } from '@/features/analitica/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../_utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const now = Date.now();
  const defaultFrom = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
  const defaultTo = new Date(now).toISOString();
  const fromRaw = url.searchParams.get('from');
  const toRaw = url.searchParams.get('to');
  const from = fromRaw && !Number.isNaN(Date.parse(fromRaw)) ? new Date(fromRaw).toISOString() : defaultFrom;
  const to = toRaw && !Number.isNaN(Date.parse(toRaw)) ? new Date(toRaw).toISOString() : defaultTo;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getAnalytics(client, identity, { from, to });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'analitica',
          action: 'query_analytics',
          entityTable: 'app_core.users',
          changeSummary: { from, to },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo cargar la analítica');
  }
}
