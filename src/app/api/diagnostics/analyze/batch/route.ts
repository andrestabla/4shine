import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';
import {
  resolveDiscoveryInvitationByToken,
  verifyDiscoveryInvitationAccess,
  parseInvitationStoredReports,
} from '@/features/descubrimiento/service';
import { createOrReuseAiJob, processAiJob, ALL_PILLARS } from '@/features/descubrimiento/ai-jobs';
import type { DiscoveryScoreResult } from '@/features/descubrimiento/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // El handler en sí es rápido (200ms-2s).
                               // El procesamiento corre en background vía waitUntil.

interface DiagnosticsAnalyzeBatchBody {
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
}

export async function POST(request: Request) {
  let body: DiagnosticsAnalyzeBatchBody | null = null;
  try {
    body = (await request.json()) as DiagnosticsAnalyzeBatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const username = body?.username?.trim();
  const scores = body?.scores;
  if (!username || !scores?.pillarMetrics) {
    return NextResponse.json(
      { ok: false, error: 'username and scores are required' },
      { status: 400 },
    );
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();
  const role = body?.role ?? 'Invitado';

  try {
    // INVITATION FLOW (la mayor parte del tráfico)
    if (inviteToken && accessCode) {
      return await withClient(async (client) => {
        // Verifico acceso y resuelvo invitación.
        const verified = await verifyDiscoveryInvitationAccess(client, inviteToken, accessCode);
        const invRow = await resolveDiscoveryInvitationByToken(client, inviteToken);
        const invitationId = verified.invitation.invitationId;

        // Cache check: si los 5 pilares ya están persistidos, devuelvo directo.
        const { rows: metaRows } = await client.query<{ meta: unknown }>(
          `SELECT meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
          [invitationId],
        );
        const cached = parseInvitationStoredReports(metaRows[0]?.meta);
        const missingPillars = ALL_PILLARS.filter((p) => !cached[p]?.trim());
        if (missingPillars.length === 0) {
          return NextResponse.json(
            {
              ok: true,
              status: 'completed',
              data: { reports: cached },
            },
            { status: 200 },
          );
        }

        // Crear o reusar job en queued/running.
        const job = await createOrReuseAiJob(client, {
          scope: 'invitation',
          invitationId,
          sessionId: invRow.session_id ?? null,
          inputPayload: { username, role, scores },
        });

        // Si el job ya estaba running, NO disparar otra vez waitUntil.
        // El cliente verá el progreso vía /status.
        if (job.status === 'queued') {
          // Dispara procesamiento en background. waitUntil garantiza que
          // Vercel mantenga la función viva hasta que la promesa resuelva,
          // sin que el cliente espere.
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
            status: job.status,
            data: {
              jobId: job.jobId,
              pillarsCompleted: job.pillarsCompleted,
              pillarsPending: missingPillars,
            },
          },
          { status: 202 },
        );
      });
    }

    // AUTH / GUEST FLOWS (sin invitation token) — por ahora siguen sincronos.
    // TODO: refactor en próxima iteración a job asíncrono también.
    const {
      generateDiscoveryAnalysisBundleContract,
      generateDiscoveryGuestSessionAnalysisBundleContract,
    } = await import('@/features/descubrimiento/service');
    const { withRoleContext } = await import('@/server/db/pool');

    const data = await withClient(async (client) => {
      const identity = await authenticateRequest(request);
      if (identity?.guestScope === 'descubrimiento') {
        if (!identity.inviteToken) throw new Error('Invitation access denied');
        return generateDiscoveryGuestSessionAnalysisBundleContract(client, {
          inviteToken: identity.inviteToken,
          username,
          role,
          scores,
        });
      }
      if (identity?.role === 'invitado') {
        return withRoleContext(client, identity.userId, identity.role, async () =>
          generateDiscoveryAnalysisBundleContract(client, identity, { username, role, scores }),
        );
      }
      if (!identity) throw new Error('Unauthorized');
      return withRoleContext(client, identity.userId, identity.role, async () =>
        generateDiscoveryAnalysisBundleContract(client, identity, {
          username,
          role: body?.role ?? 'Lider',
          scores,
        }),
      );
    });
    return NextResponse.json({ ok: true, status: 'completed', data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    if (detail.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (detail.toLowerCase().includes('invit') || detail.toLowerCase().includes('codigo')) {
      return NextResponse.json(
        { ok: false, error: 'Invitation access denied', detail },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: 'Failed to analyze diagnostics bundle', detail },
      { status: 500 },
    );
  }
}
