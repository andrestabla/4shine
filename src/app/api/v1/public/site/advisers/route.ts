import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { listPublicAdvisers, type PublicAdviser } from '@/features/advisers/service';

export const dynamic = 'force-dynamic';

export type { PublicAdviser };

/**
 * Perfiles públicos de advisers para el bloque "Advisers" del site builder y la
 * página pública /advisers. Solo usuarios activos con rol mentor (adviser).
 */
export async function GET() {
  try {
    const data = await withClient((client) => listPublicAdvisers(client));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al cargar advisers', detail }, { status: 500 });
  }
}
