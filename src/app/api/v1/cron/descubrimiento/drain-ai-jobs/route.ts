import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/server/auth/cron-auth';
import { withClient } from '@/server/db/pool';
import { drainStuckDiscoveryAiJobs } from '@/features/descubrimiento/service';
import type { AuthUser } from '@/server/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Cron: rescata los análisis de IA de Descubrimiento que quedaron huérfanos.
 *
 * Los informes de IA se generan con `waitUntil(processAiJob())` dentro del
 * request que llama a /analyze. En scope 'session' ese waitUntil a veces no
 * llega a arrancar (started_at nulo) → el job queda atascado en `queued` para
 * siempre y el líder ve el spinner sin fin. Este cron drena esos jobs
 * regenerando desde los datos del diagnóstico (misma vía que "Regenerar").
 *
 * Auth: Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}`; si no hay
 * secreto configurado, exige el header `x-vercel-cron`.
 */
export async function GET(request: Request) {
  // Falla cerrado: sin CRON_SECRET no se ejecuta. Antes se aceptaba la
  // cabecera x-vercel-cron como respaldo, y esa la pone el cliente.
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const actor = await withClient(async (client) => {
      const { rows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        role: string;
      }>(
        `SELECT user_id::text, email::text, display_name, role
         FROM app_core.users WHERE primary_role = 'admin' ORDER BY created_at LIMIT 1`,
      );
      const admin = rows[0];
      if (!admin) return null;
      return {
        userId: admin.user_id,
        email: admin.email,
        name: admin.display_name,
        role: admin.role as AuthUser['role'],
      } satisfies AuthUser;
    });

    if (!actor) {
      return NextResponse.json({ ok: false, error: 'no-admin' }, { status: 200 });
    }

    const result = await drainStuckDiscoveryAiJobs(actor, { limit: 3 });
    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
