import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { scheduleManualMentorshipForLeader, scheduleProgramMentorshipForLeader } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';

interface ContextParams {
    params: Promise<{ userId: string }>;
}

interface Body {
    mode?: 'program' | 'manual';
    mentorUserId?: string;
    startsAt?: string;
    durationMinutes?: number;
    title?: string;
    meetingUrl?: string | null;
    note?: string | null;
    entitlementId?: string | null;
}

export async function POST(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId } = await context.params;
    if (!userId) return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 });

    const body = await parseJsonBody<Body>(request);
    if (!body || !body.mentorUserId || !body.startsAt) {
        return NextResponse.json({ ok: false, error: 'mentorUserId y startsAt son obligatorios' }, { status: 400 });
    }
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
        return NextResponse.json({ ok: false, error: 'Fecha/hora inválida' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                let result;
                if (body.mode === 'manual') {
                    result = await scheduleManualMentorshipForLeader(client, identity, {
                        leaderUserId: userId,
                        mentorUserId: body.mentorUserId!,
                        startsAt: startsAt.toISOString(),
                        durationMinutes: body.durationMinutes ?? 60,
                        title: body.title?.trim() || 'Mentoría 1:1',
                        meetingUrl: body.meetingUrl ?? null,
                    });
                } else {
                    result = await scheduleProgramMentorshipForLeader(client, identity, {
                        leaderUserId: userId,
                        mentorUserId: body.mentorUserId!,
                        startsAt: startsAt.toISOString(),
                        entitlementId: body.entitlementId ?? null,
                        meetingUrl: body.meetingUrl ?? null,
                        note: body.note ?? null,
                    });
                }
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'lideres',
                    action: 'schedule_leader_mentorship',
                    entityTable: 'app_mentoring.mentorship_sessions',
                    entityId: result.sessionId,
                    changeSummary: { leaderUserId: userId, mode: body.mode ?? 'program', mentorUserId: body.mentorUserId },
                });
                return result;
            }),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo agendar la mentoría');
    }
}
