import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { resolveZoomRecordingOneClickUrl } from '@/server/integrations/zoom';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '@/app/api/v1/modules/_utils';

export const runtime = 'nodejs';

/**
 * Convierte un enlace de grabación compartida de Zoom en uno de "un clic"
 * (con el código de acceso incrustado). Lo usa el editor de cursos al pegar
 * el enlace; solo gestores y admins editan cursos, así que se limita a ellos.
 */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  if (!['gestor', 'admin'].includes(identity.role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await parseJsonBody<{ url?: unknown }>(request);
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ ok: false, error: 'Falta el enlace de la grabación' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        resolveZoomRecordingOneClickUrl(client, url, { maxRequests: 60 }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo consultar la grabación en Zoom');
  }
}
