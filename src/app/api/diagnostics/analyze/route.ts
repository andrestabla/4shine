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

    // AUTH / GUEST FLOWS — patrón async: cache check + job + waitUntil.
    const identity = await authenticateRequest(request);
    if (!identity) throw new Error('Unauthorized');

    // GUEST scope (líder con sesión temporal vía invitation token).
    if (identity.guestScope === 'descubrimiento' && identity.inviteToken) {
      return await withClient(async (client) => {
        const verified = await verifyDiscoveryInvitationAccess(
          client,
          identity.inviteToken!,
          // El guest no tiene accessCode en el body; el verify acepta el token
          // como identidad de invitación válida vía guest auth. Si fallaba el
          // verify haríamos fallback al flujo sincronos.
          'guest-scope',
        ).catch(() => null);
        // Para guest scope, no tenemos accessCode. Cacheamos solo por invitation
        // si la pudimos resolver, sino procedemos sincrono.
        if (!verified) {
          // Fallback sincronos para mantener compat.
          const data = await generateDiscoveryGuestSessionAnalysisContract(client, {
            inviteToken: identity.inviteToken!,
            username,
            role,
            scores,
            pillar,
            fallbackReport: body?.fallbackReport,
            force: body?.force,
          });
          return NextResponse.json({ ok: true, data }, { status: 200 });
        }
        const invitationId = verified.invitation.invitationId;
        const invRow = await resolveDiscoveryInvitationByToken(client, identity.inviteToken!);

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
          scope: 'guest',
          invitationId,
          sessionId: invRow.session_id ?? null,
          userId: identity.userId,
          inputPayload: { username, role, scores },
        });
        if (job.status === 'queued') {
          waitUntil(
            processAiJob(job.jobId, {
              inviteToken: identity.inviteToken!,
              actorUserId: identity.userId,
              username,
              role,
              scores,
              scope: 'guest',
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

    // AUTH user (líder loggeado normal) — usa session_id propia.
    return await withClient(async (client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        // Cache check: lee sesión por sessionId o user_id.
        const sessionId = body?.sessionId;
        const isInvitationId = typeof sessionId === 'string' && sessionId.startsWith('inv-');
        let cachedReport: string | undefined;
        let resolvedSessionId: string | null = null;

        if (!force) {
          if (isInvitationId) {
            const invId = sessionId.slice(4);
            const { rows } = await client.query<{ session_id: string | null; meta: unknown }>(
              `SELECT session_id::text, meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
              [invId],
            );
            const cached = parseInvitationStoredReports(rows[0]?.meta);
            cachedReport = cached[pillar]?.trim();
            resolvedSessionId = rows[0]?.session_id ?? null;
          } else if (sessionId) {
            const { rows } = await client.query<{ ai_reports: unknown }>(
              `SELECT ai_reports FROM app_assessment.discovery_sessions WHERE session_id = $1::uuid`,
              [sessionId],
            );
            const r = rows[0]?.ai_reports;
            if (r && typeof r === 'object' && pillar in (r as Record<string, unknown>)) {
              const v = (r as Record<string, unknown>)[pillar];
              cachedReport = typeof v === 'string' ? v.trim() : undefined;
            }
            resolvedSessionId = sessionId;
          } else {
            // Sesión del propio actor.
            const { rows } = await client.query<{ session_id: string; ai_reports: unknown }>(
              `SELECT session_id::text, ai_reports
               FROM app_assessment.discovery_sessions
               WHERE user_id = $1::uuid
               ORDER BY created_at DESC LIMIT 1`,
              [identity.userId],
            );
            const r = rows[0]?.ai_reports;
            if (r && typeof r === 'object' && pillar in (r as Record<string, unknown>)) {
              const v = (r as Record<string, unknown>)[pillar];
              cachedReport = typeof v === 'string' ? v.trim() : undefined;
            }
            resolvedSessionId = rows[0]?.session_id ?? null;
          }
          if (cachedReport) {
            return NextResponse.json(
              { ok: true, data: { report: cachedReport, source: 'ai' } },
              { status: 200 },
            );
          }
        }

        // Generación SÍNCRONA para la sesión del usuario logueado (incluye el
        // rol "invitado" con acceso solo a Descubrimiento). Antes se encolaba un
        // job con waitUntil(processAiJob) en scope 'session', pero ese waitUntil
        // a veces no arrancaba (started_at nulo) y el informe quedaba huérfano →
        // spinner infinito para el usuario y descargas admin sin IA. Generar
        // dentro del request (maxDuration=300) lo vuelve determinista: el informe
        // del pilar se genera, se persiste en discovery_sessions.ai_reports y se
        // devuelve 200. Cada pilar que dispara ResultsView resuelve de forma
        // independiente (la persistencia por pilar es un UPDATE atómico).
        const data = await generateDiscoveryAnalysisContract(client, identity, {
          sessionId: body?.sessionId ?? resolvedSessionId ?? undefined,
          username,
          role: body?.role ?? 'Lider',
          scores,
          pillar,
          fallbackReport: body?.fallbackReport,
          force: body?.force,
        });
        return NextResponse.json({ ok: true, data }, { status: 200 });
      }),
    );
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
