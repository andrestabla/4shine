/**
 * AI Jobs: generación asíncrona de reportes de descubrimiento.
 *
 * Flujo:
 *   POST /analyze/batch crea (o reusa) un job → devuelve 202 con job_id.
 *   En el mismo handler, `waitUntil()` dispara processAiJob() en background.
 *   El frontend hace polling GET /analyze/status?... cada 3 s.
 *
 * Evita el problema clásico de "timeout del cliente vs maxDuration del servidor":
 * el cliente no espera el AI, solo el ack del job.
 */

import type { PoolClient } from 'pg';
import { withClient } from '@/server/db/pool';
import type {
  DiscoveryReportFilter,
  DiscoveryScoreResult,
} from './types';

export type DiscoveryAiJobScope = 'invitation' | 'session' | 'guest';
export type DiscoveryAiJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout';

export const ALL_PILLARS: DiscoveryReportFilter[] = ['all', 'within', 'out', 'up', 'beyond'];

export interface DiscoveryAiJob {
  jobId: string;
  invitationId: string | null;
  sessionId: string | null;
  userId: string | null;
  scope: DiscoveryAiJobScope;
  status: DiscoveryAiJobStatus;
  pillarsCompleted: DiscoveryReportFilter[];
  pillarsFailed: DiscoveryReportFilter[];
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobRow {
  job_id: string;
  invitation_id: string | null;
  session_id: string | null;
  user_id: string | null;
  scope: DiscoveryAiJobScope;
  status: DiscoveryAiJobStatus;
  pillars_completed: string[];
  pillars_failed: string[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapJobRow(row: JobRow): DiscoveryAiJob {
  return {
    jobId: row.job_id,
    invitationId: row.invitation_id,
    sessionId: row.session_id,
    userId: row.user_id,
    scope: row.scope,
    status: row.status,
    pillarsCompleted: (row.pillars_completed ?? []).filter((p): p is DiscoveryReportFilter =>
      ALL_PILLARS.includes(p as DiscoveryReportFilter),
    ),
    pillarsFailed: (row.pillars_failed ?? []).filter((p): p is DiscoveryReportFilter =>
      ALL_PILLARS.includes(p as DiscoveryReportFilter),
    ),
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateJobInput {
  scope: DiscoveryAiJobScope;
  invitationId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  inputPayload?: {
    username: string;
    role: string;
    scores: DiscoveryScoreResult;
  };
}

/**
 * Crea un nuevo job o reusa uno existente:
 *   - Si hay job 'queued' o 'running' para la misma invitación/sesión, lo retorna.
 *   - Si el último job 'completed' es reciente, lo retorna (cliente verá reports
 *     ya cacheados).
 *   - Caso contrario, crea uno nuevo en status='queued'.
 */
export async function createOrReuseAiJob(
  client: PoolClient,
  input: CreateJobInput,
): Promise<DiscoveryAiJob> {
  // Reuse: job activo para la misma invitation o session
  const whereClause = input.invitationId
    ? 'invitation_id = $1::uuid'
    : 'session_id = $1::uuid';
  const whereParam = input.invitationId || input.sessionId;

  if (whereParam) {
    const existing = await client.query<JobRow>(
      `SELECT
         job_id::text, invitation_id::text, session_id::text, user_id::text, scope, status,
         pillars_completed, pillars_failed, error_message,
         started_at::text, completed_at::text, created_at::text, updated_at::text
       FROM app_assessment.discovery_ai_jobs
       WHERE ${whereClause}
         AND status IN ('queued','running')
       ORDER BY created_at DESC
       LIMIT 1`,
      [whereParam],
    );
    if (existing.rows[0]) {
      return mapJobRow(existing.rows[0]);
    }
  }

  const { rows } = await client.query<JobRow>(
    `INSERT INTO app_assessment.discovery_ai_jobs (
       invitation_id, session_id, user_id, scope, status,
       input_payload, started_at
     ) VALUES (
       $1::uuid, $2::uuid, $3::uuid, $4, 'queued', $5::jsonb, NULL
     )
     RETURNING
       job_id::text, invitation_id::text, session_id::text, user_id::text, scope, status,
       pillars_completed, pillars_failed, error_message,
       started_at::text, completed_at::text, created_at::text, updated_at::text`,
    [
      input.invitationId ?? null,
      input.sessionId ?? null,
      input.userId ?? null,
      input.scope,
      JSON.stringify(input.inputPayload ?? {}),
    ],
  );
  return mapJobRow(rows[0]);
}

/**
 * Busca el job más reciente para una invitación/sesión.
 * Lo usa el endpoint GET /status para poll desde el frontend.
 */
export async function getLatestAiJob(
  client: PoolClient,
  filter: { invitationId?: string | null; sessionId?: string | null },
): Promise<DiscoveryAiJob | null> {
  const whereClause = filter.invitationId
    ? 'invitation_id = $1::uuid'
    : 'session_id = $1::uuid';
  const whereParam = filter.invitationId || filter.sessionId;
  if (!whereParam) return null;

  const { rows } = await client.query<JobRow>(
    `SELECT
       job_id::text, invitation_id::text, session_id::text, user_id::text, scope, status,
       pillars_completed, pillars_failed, error_message,
       started_at::text, completed_at::text, created_at::text, updated_at::text
     FROM app_assessment.discovery_ai_jobs
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT 1`,
    [whereParam],
  );
  return rows[0] ? mapJobRow(rows[0]) : null;
}

export async function markJobRunning(client: PoolClient, jobId: string): Promise<void> {
  await client.query(
    `UPDATE app_assessment.discovery_ai_jobs
     SET status = 'running', started_at = COALESCE(started_at, now()), updated_at = now()
     WHERE job_id = $1::uuid AND status = 'queued'`,
    [jobId],
  );
}

export async function markPillarCompleted(
  client: PoolClient,
  jobId: string,
  pillar: DiscoveryReportFilter,
): Promise<void> {
  await client.query(
    `UPDATE app_assessment.discovery_ai_jobs
     SET pillars_completed = (
       SELECT ARRAY(SELECT DISTINCT unnest(pillars_completed || ARRAY[$2]))
     ),
     updated_at = now()
     WHERE job_id = $1::uuid`,
    [jobId, pillar],
  );
}

export async function markPillarFailed(
  client: PoolClient,
  jobId: string,
  pillar: DiscoveryReportFilter,
): Promise<void> {
  await client.query(
    `UPDATE app_assessment.discovery_ai_jobs
     SET pillars_failed = (
       SELECT ARRAY(SELECT DISTINCT unnest(pillars_failed || ARRAY[$2]))
     ),
     updated_at = now()
     WHERE job_id = $1::uuid`,
    [jobId, pillar],
  );
}

export async function markJobCompleted(
  client: PoolClient,
  jobId: string,
): Promise<void> {
  await client.query(
    `UPDATE app_assessment.discovery_ai_jobs
     SET status = 'completed', completed_at = now(), updated_at = now()
     WHERE job_id = $1::uuid AND status IN ('queued','running')`,
    [jobId],
  );
}

export async function markJobFailed(
  client: PoolClient,
  jobId: string,
  errorMessage: string,
): Promise<void> {
  await client.query(
    `UPDATE app_assessment.discovery_ai_jobs
     SET status = 'failed', completed_at = now(), error_message = $2, updated_at = now()
     WHERE job_id = $1::uuid AND status IN ('queued','running')`,
    [jobId, errorMessage.substring(0, 1000)],
  );
}

/**
 * Procesa un job en background. Lanzado vía waitUntil() desde el handler POST.
 * Genera los 5 pilares en paralelo (concurrency=5) y actualiza el job conforme
 * cada uno termina. Si alguno falla, lo marca pero sigue con los demás.
 * El reporte final se persiste en discovery_invitations.meta.ai_reports (o
 * en la sesión, según scope), igual que el flujo síncrono previo.
 */
export async function processAiJob(
  jobId: string,
  args: {
    inviteToken?: string;
    accessCode?: string;
    username: string;
    role: string;
    scores: DiscoveryScoreResult;
    scope: DiscoveryAiJobScope;
  },
): Promise<void> {
  // Importes lazy para evitar circular deps.
  const { generateDiscoveryInvitationAnalysisContract } = await import('./service');

  const generateOne = async (pillar: DiscoveryReportFilter): Promise<{ ok: boolean; err?: string }> => {
    if (args.scope !== 'invitation' || !args.inviteToken || !args.accessCode) {
      return { ok: false, err: `scope ${args.scope} sin handler` };
    }
    try {
      await withClient(async (c) => {
        await generateDiscoveryInvitationAnalysisContract(c, {
          inviteToken: args.inviteToken!,
          accessCode: args.accessCode!,
          username: args.username,
          role: args.role,
          scores: args.scores,
          pillar,
        });
        await markPillarCompleted(c, jobId, pillar);
      });
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ai-job ${jobId}] pillar ${pillar} FAILED:`, msg);
      await withClient((c) => markPillarFailed(c, jobId, pillar));
      return { ok: false, err: msg };
    }
  };

  try {
    await withClient((c) => markJobRunning(c, jobId));

    // Genero "all" primero (es el reporte ejecutivo más extenso, sirve de
    // contexto en algunas configuraciones del prompt) y los 4 pilares
    // restantes en paralelo (concurrency=4 como tenía el bundle original).
    const allResult = await generateOne('all');
    const otherPillars: DiscoveryReportFilter[] = ['within', 'out', 'up', 'beyond'];
    const others = await Promise.all(otherPillars.map((p) => generateOne(p)));

    const successCount = [allResult, ...others].filter((r) => r.ok).length;
    if (successCount > 0) {
      await withClient((c) => markJobCompleted(c, jobId));
      console.log(`[ai-job ${jobId}] completed: ${successCount}/5 pillars`);
    } else {
      const firstErr =
        allResult.err || others.map((r) => r.err).find(Boolean) || 'all pillars failed';
      await withClient((c) => markJobFailed(c, jobId, firstErr));
      console.error(`[ai-job ${jobId}] all pillars failed: ${firstErr}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ai-job ${jobId}] crashed: ${message}`);
    try {
      await withClient((c) => markJobFailed(c, jobId, message));
    } catch {
      // best-effort
    }
  }
}
