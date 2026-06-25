import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { listPublicAdvisors, type PublicAdvisor } from '@/features/advisors/service';

export const dynamic = 'force-dynamic';

export type { PublicAdvisor };

/**
 * Perfiles públicos de advisors para el bloque "Advisors" del site builder y la
 * página pública /advisors. Solo usuarios activos con rol mentor (advisor).
 */
export async function GET() {
  try {
    const data = await withClient((client) => listPublicAdvisors(client));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al cargar advisors', detail }, { status: 500 });
  }
}
