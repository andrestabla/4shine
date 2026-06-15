import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getUserNetworkingSummary } from '@/features/usuarios/service';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getUserNetworkingSummary(client, userId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo cargar el resumen de networking');
  }
}
