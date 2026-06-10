import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { withClient } from '@/server/db/pool';
import {
  parseInvitationStoredReports,
  resolveDiscoveryInvitationByToken,
  verifyDiscoveryInvitationAccess,
} from '@/features/descubrimiento/service';
import { createOrReuseAiJob, processAiJob, ALL_PILLARS } from '@/features/descubrimiento/ai-jobs';
import type { DiscoveryReportFilter, DiscoveryScoreResult } from '@/features/descubrimiento/types';

export const runtime = 'nodejs';
// El handler ahora retorna en <2s. El procesamiento corre en background vía waitUntil.
// maxDuration alto mantiene viva la función para waitUntil hasta que termine.
export const maxDuration = 300;

interface PublicAnalyzeBody {
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
  pillar?: DiscoveryReportFilter;
  fallbackReport?: string;
  force?: boolean;
}

/**
 * POST /api/v1/public/descubrimiento/analyze
 *
 * Nuevo comportamiento (async):
 *   1. Si el pilar pedido YA está cacheado en meta.ai_reports → 200 con { report, source: 'ai' }.
 *   2. Si no, crea (o reusa) job, lanza el procesamiento en background con
 *      waitUntil, y devuelve 202 con { report: '', source: 'pending' }.
 *
 * El frontend (ResultsView) ya hace retry con backoff exponencial cuando
 * response.report está vacío — encaja perfecto con este patrón.
 */
export async function POST(request: Request) {
  let body: PublicAnalyzeBody | null = null;
  try {
    body = (await request.json()) as PublicAnalyzeBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();
  const username = body?.username?.trim();
  const scores = body?.scores;
  const pillar = (body?.pillar ?? 'all') as DiscoveryReportFilter;
  const role = body?.role ?? 'Invitado';
  const force = Boolean(body?.force);

  if (!inviteToken || !accessCode || !username || !scores?.pillarMetrics) {
    return NextResponse.json(
      { ok: false, error: 'inviteToken, accessCode, username and scores are required' },
      { status: 400 },
    );
  }

  try {
    return await withClient(async (client) => {
      const verified = await verifyDiscoveryInvitationAccess(client, inviteToken, accessCode);
      const invitationId = verified.invitation.invitationId;
      const invRow = await resolveDiscoveryInvitationByToken(client, inviteToken);

      // 1. Cache hit (a menos que force=true): devuelve inmediatamente.
      if (!force) {
        const { rows } = await client.query<{ meta: unknown }>(
          `SELECT meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
          [invitationId],
        );
        const cached = parseInvitationStoredReports(rows[0]?.meta);
        const cachedReport = cached[pillar]?.trim();
        if (cachedReport) {
          return NextResponse.json(
            { ok: true, data: { report: cachedReport, source: 'ai' } },
            { status: 200 },
          );
        }
      }

      // 2. No hay cache: crear/reusar job y lanzar background.
      const job = await createOrReuseAiJob(client, {
        scope: 'invitation',
        invitationId,
        sessionId: invRow.session_id ?? null,
        inputPayload: { username, role, scores },
      });

      if (job.status === 'queued') {
        // Dispara el procesamiento (genera los 5 pilares en paralelo) sin
        // bloquear el handler. waitUntil mantiene la función viva hasta
        // que termine.
        waitUntil(
          processAiJob(job.jobId, {
            inviteToken,
            accessCode,
            username,
            role,
            scores,
            scope: 'invitation',
          }),
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: {
            report: '',
            source: 'pending',
            jobId: job.jobId,
            jobStatus: job.status,
            pillarsCompleted: job.pillarsCompleted,
            pillarsPending: ALL_PILLARS.filter((p) => !job.pillarsCompleted.includes(p)),
          },
        },
        { status: 202 },
      );
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    const status =
      detail.toLowerCase().includes('invit') || detail.toLowerCase().includes('codigo')
        ? 401
        : 500;
    return NextResponse.json(
      { ok: false, error: 'Failed to analyze invitation discovery report', detail },
      { status },
    );
  }
}
