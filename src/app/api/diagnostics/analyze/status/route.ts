import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import {
  parseInvitationStoredReports,
  verifyDiscoveryInvitationAccess,
} from '@/features/descubrimiento/service';
import { ALL_PILLARS, getLatestAiJob } from '@/features/descubrimiento/ai-jobs';

export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/diagnostics/analyze/status?inviteToken=&accessCode=
 * Poll del frontend cada ~3s. Devuelve:
 *   - status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'no_job'
 *   - pillarsCompleted: pilares ya persistidos
 *   - pillarsPending: pilares aún por generar
 *   - reports?: cuando status='completed', los 5 reports
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('inviteToken')?.trim();
  const accessCode = url.searchParams.get('accessCode')?.trim();

  if (!inviteToken || !accessCode) {
    return NextResponse.json(
      { ok: false, error: 'inviteToken and accessCode are required' },
      { status: 400 },
    );
  }

  try {
    const result = await withClient(async (client) => {
      const verified = await verifyDiscoveryInvitationAccess(client, inviteToken, accessCode);
      const invitationId = verified.invitation.invitationId;

      // Lo más importante: los reports cacheados. Si ya están los 5, status=completed.
      const { rows: metaRows } = await client.query<{ meta: unknown }>(
        `SELECT meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
        [invitationId],
      );
      const cached = parseInvitationStoredReports(metaRows[0]?.meta);
      const completedPillars = ALL_PILLARS.filter((p) => Boolean(cached[p]?.trim()));
      const pendingPillars = ALL_PILLARS.filter((p) => !cached[p]?.trim());

      if (pendingPillars.length === 0) {
        return {
          status: 'completed' as const,
          pillarsCompleted: completedPillars,
          pillarsPending: [],
          reports: cached,
        };
      }

      // Hay pilares pendientes: consultamos el job más reciente para saber si
      // está running, queued, o falló.
      const job = await getLatestAiJob(client, { invitationId });
      if (!job) {
        return {
          status: 'no_job' as const,
          pillarsCompleted: completedPillars,
          pillarsPending: pendingPillars,
        };
      }

      // Reflejamos lo más actual entre el job y el cache: el cache puede
      // tener más pilares ya persistidos que lo que el job apunta (si el
      // pillar terminó pero el job aún no se updatea). Usamos el cache.
      return {
        status: job.status,
        pillarsCompleted: completedPillars,
        pillarsPending: pendingPillars,
        errorMessage: job.errorMessage,
      };
    });

    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    if (detail.toLowerCase().includes('invit') || detail.toLowerCase().includes('codigo')) {
      return NextResponse.json(
        { ok: false, error: 'Invitation access denied', detail },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: 'Failed to get analyze status', detail },
      { status: 500 },
    );
  }
}
