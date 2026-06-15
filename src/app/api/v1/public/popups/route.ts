import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listPopupsForVisitor } from '@/features/popups/service';

export const runtime = 'nodejs';

// Endpoint del runtime de popups. Autenticación OPCIONAL: si hay sesión se
// segmenta por rol y plan del usuario; si es anónimo, solo devuelve popups
// sin segmentación. Respuesta personalizada → sin caché compartida.
export async function GET(request: Request) {
  try {
    const identity = await authenticateRequest(request).catch(() => null);

    const data = await withClient((client) =>
      identity
        ? withRoleContext(client, identity.userId, identity.role, () =>
            listPopupsForVisitor(client, identity),
          )
        : listPopupsForVisitor(client, null),
    );

    const response = NextResponse.json({ ok: true, data }, { status: 200 });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Failed to fetch popups', detail }, { status: 500 });
  }
}
