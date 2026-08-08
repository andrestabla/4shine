import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { findSimilarUsers } from '@/features/usuarios/service';
import { errorResponse, unauthorizedResponse } from '../../_utils';

/**
 * Cuentas que podrían ser la misma persona (mismo correo o nombre parecido).
 * La usa el formulario de alta para avisar antes de duplicar a alguien que ya
 * viene con diagnóstico o avance.
 */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const name = url.searchParams.get('name') ?? '';
  const email = url.searchParams.get('email') ?? '';

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        findSimilarUsers(client, { name, email }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to search similar users');
  }
}
