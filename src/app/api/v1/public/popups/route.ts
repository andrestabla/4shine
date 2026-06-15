import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { listActivePopups } from '@/features/popups/service';

// Endpoint público (sin autenticación): el runtime del popup lo consulta
// desde el sitio público y el dashboard. RLS de lectura abierta + app_runtime.
export async function GET() {
  try {
    const data = await withClient((client) => listActivePopups(client));
    const response = NextResponse.json({ ok: true, data }, { status: 200 });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Failed to fetch popups', detail }, { status: 500 });
  }
}
