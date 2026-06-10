import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  generateDiscoveryAnalysisContract,
  generateDiscoveryGuestSessionAnalysisContract,
  parseInvitationStoredReports,
  resolveDiscoveryInvitationByToken,
  verifyDiscoveryInvitationAccess,
} from '@/features/descubrimiento/service';
import { createOrReuseAiJob, processAiJob, ALL_PILLARS } from '@/features/descubrimiento/ai-jobs';
import type {
  DiscoveryReportFilter,
  DiscoveryScoreResult,
} from '@/features/descubrimiento/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface DiagnosticsAnalyzeBody {
  sessionId?: string;
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
  pillar?: DiscoveryReportFilter;
  fallbackReport?: string;
  force?: boolean;
}

export async function POST(request: Request) {
  let body: DiagnosticsAnalyzeBody | null = null;
  try {
    body = (await request.json()) as DiagnosticsAnalyzeBody;
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
  const pillar = (body?.pillar ?? 'all') as DiscoveryReportFilter;
  const role = body?.role ?? 'Invitado';
  const force = Boolean(body?.force);

  try {
    // INVITATION FLOW (mismo patrón async que el endpoint público).
    if (inviteToken && accessCode) {
      return await withClient(async (client) => {
        const verified = await verifyDiscoveryInvitationAccess(client, inviteToken, accessCode);
        const invitationId = verified.invitation.invitationId;
        const invRow = await resolveDiscoveryInvitationByToken(client, inviteToken);

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

        const job = await createOrReuseAiJob(client, {
          scope: 'invitation',
          invitationId,
          sessionId: invRow.session_id ?? null,
          inputPayload: { username, role, scores },
        });
        if (job.status === 'queued') {
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
    }

    // AUTH / GUEST FLOWS — siguen sincronos por ahora (single pillar es <60s en
    // la mayoría de casos; refactor async pendiente si hace falta).
    const data = await withClient(async (client) => {
      const identity = await authenticateRequest(request);
      if (identity?.guestScope === 'descubrimiento') {
        if (!identity.inviteToken) throw new Error('Invitation access denied');
        return generateDiscoveryGuestSessionAnalysisContract(client, {
          inviteToken: identity.inviteToken,
          username,
          role,
          scores,
          pillar,
          fallbackReport: body?.fallbackReport,
          force: body?.force,
        });
      }
      if (identity?.role === 'invitado') {
        return withRoleContext(client, identity.userId, identity.role, async () =>
          generateDiscoveryAnalysisContract(client, identity, {
            sessionId: body?.sessionId,
            username,
            role,
            scores,
            pillar,
            fallbackReport: body?.fallbackReport,
            force: body?.force,
          }),
        );
      }
      if (!identity) throw new Error('Unauthorized');
      return withRoleContext(client, identity.userId, identity.role, async () =>
        generateDiscoveryAnalysisContract(client, identity, {
          sessionId: body?.sessionId,
          username,
          role: body?.role ?? 'Lider',
          scores,
          pillar,
          fallbackReport: body?.fallbackReport,
          force: body?.force,
        }),
      );
    });

    return NextResponse.json({ ok: true, data }, { status: 200 });
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
      { ok: false, error: 'Failed to analyze diagnostics', detail },
      { status: 500 },
    );
  }
}
