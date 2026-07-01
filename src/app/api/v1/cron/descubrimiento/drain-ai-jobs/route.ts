import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { drainStuckDiscoveryAiJobs } from '@/features/descubrimiento/service';
import type { AuthUser } from '@/server/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Cron: rescata los análisis de IA de Descubrimiento que quedaron huérfanos.
 *
 * Los informes de IA solo se generan con `waitUntil(processAiJob())` dentro del
 * request que llama a /analyze. Si ese request muere/expira (cold start, deploy,
 * timeout), el job queda atascado en `queued` para siempre y el informe descarga
 * SIN análisis de IA. Este cron drena esos jobs regenerando desde los datos del
 * diagnóstico (misma vía que "Regenerar informe").
 *
 * NOTA: si el dominio del proyecto redirige (p. ej. *.vercel.app → www), el cron
 * de Vercel puede recibir 301 y no ejecutarse. Por eso el mismo drenado también
 * se dispara desde la carga autenticada del panel admin (ver overview route).
 *
 * Auth: Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}`; si no hay
 * secreto configurado, exige el header `x-vercel-cron`.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    const isVercelCron = request.headers.get('x-vercel-cron') !== null;
    if (!isVercelCron) {
      return NextResponse.json(
        { ok: false, error: 'CRON_SECRET not configured.' },
        { status: 503 },
      );
    }
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

    const result = await drainStuckDiscoveryAiJobs(actor, { limit: 2 });
    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
