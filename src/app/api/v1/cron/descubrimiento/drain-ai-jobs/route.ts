import { NextResponse } from 'next/server';
import { withClient, withRoleContext } from '@/server/db/pool';
import { bulkRegenerateDiscoveryReportsByManager } from '@/features/descubrimiento/service';
import { markJobCompleted, markJobFailed } from '@/features/descubrimiento/ai-jobs';
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
 * SIN análisis de IA. Este cron detecta esos jobs atascados y regenera los
 * informes desde los datos del diagnóstico (misma vía que "Regenerar informe").
 *
 * Procesa un lote pequeño por corrida (cada regeneración tarda ~2–4 min por los
 * 5 pilares) y confía en la cadencia del cron para drenar el resto.
 *
 * Auth: Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}` cuando el env
 * var está configurado. Si no, exige el header `x-vercel-cron`.
 */
const BATCH_SIZE = 2;

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
    const result = await withClient(async (client) => {
      // Un admin para el contexto RLS (bypassa RLS en discovery/users).
      const { rows: adminRows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        role: string;
      }>(
        `SELECT user_id::text, email::text, display_name, role
         FROM app_core.users WHERE primary_role = 'admin' ORDER BY created_at LIMIT 1`,
      );
      const admin = adminRows[0];
      if (!admin) {
        return { ok: false as const, reason: 'no-admin', processed: 0 };
      }
      const actor: AuthUser = {
        userId: admin.user_id,
        email: admin.email,
        name: admin.display_name,
        role: admin.role as AuthUser['role'],
      };

      // Jobs atascados: 'queued' > 3 min (waitUntil ya debió arrancarlo) o
      // 'running' estancado > 15 min. Solo de los últimos 30 días.
      const { rows: jobs } = await client.query<{
        job_id: string;
        session_id: string | null;
        invitation_id: string | null;
        scope: string;
      }>(
        `
          SELECT job_id::text, session_id::text, invitation_id::text, scope
          FROM app_assessment.discovery_ai_jobs
          WHERE created_at > now() - interval '30 days'
            AND (
              (status = 'queued' AND created_at < now() - interval '3 minutes')
              OR (status = 'running' AND updated_at < now() - interval '15 minutes')
            )
          ORDER BY created_at ASC
          LIMIT $1
        `,
        [BATCH_SIZE],
      );

      const outcomes: Array<{ jobId: string; ok: boolean; error?: string }> = [];

      for (const job of jobs) {
        // Para invitados el análisis vive en la invitación (meta.ai_reports).
        const targetSessionId =
          job.scope === 'invitation' && job.invitation_id
            ? `inv-${job.invitation_id}`
            : job.session_id;

        if (!targetSessionId) {
          await withClient((c) =>
            withRoleContext(c, actor.userId, actor.role, () =>
              markJobFailed(c, job.job_id, 'Job sin session_id/invitation_id.'),
            ),
          );
          outcomes.push({ jobId: job.job_id, ok: false, error: 'no-target' });
          continue;
        }

        try {
          await withClient((c) =>
            withRoleContext(c, actor.userId, actor.role, () =>
              bulkRegenerateDiscoveryReportsByManager(c, actor, targetSessionId),
            ),
          );
          await withClient((c) =>
            withRoleContext(c, actor.userId, actor.role, () =>
              markJobCompleted(c, job.job_id),
            ),
          );
          outcomes.push({ jobId: job.job_id, ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido.';
          await withClient((c) =>
            withRoleContext(c, actor.userId, actor.role, () =>
              markJobFailed(c, job.job_id, message.slice(0, 500)),
            ),
          );
          outcomes.push({ jobId: job.job_id, ok: false, error: message });
        }
      }

      return { ok: true as const, processed: jobs.length, outcomes };
    });

    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
