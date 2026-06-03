import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listUserSessions } from '@/features/usuarios/service';
import { errorResponse, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const onlyOnline = url.searchParams.get('only_online') === 'true';
  const limit = Number(url.searchParams.get('limit') ?? 500);

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listUserSessions(client, { onlyOnline, limit }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudieron cargar las sesiones.');
  }
}
