import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { readModuleVisibilityMap } from '@/server/modules/visibility';
import { unauthorizedResponse } from '../_utils';

export const dynamic = 'force-dynamic';

/**
 * Estado de encendido de los módulos, para cualquier usuario autenticado: el
 * menú y el guard de rutas lo necesitan. Devuelve solo las excepciones; lo que
 * no aparece está encendido.
 */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const disabled = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        readModuleVisibilityMap(client),
      ),
    );
    return NextResponse.json({ ok: true, data: disabled }, { status: 200 });
  } catch {
    // Nunca romper la navegación por esto: ante un fallo, todo encendido.
    return NextResponse.json({ ok: true, data: {} }, { status: 200 });
  }
}
