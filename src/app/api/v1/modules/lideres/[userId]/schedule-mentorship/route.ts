import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
    listMentorOpenSlots,
    scheduleManualMentorshipForLeader,
    scheduleProgramMentorshipForLeader,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';
import { requireModulePermission } from '@/server/auth/module-permissions';

export const runtime = 'nodejs';

interface ContextParams {
    params: Promise<{ userId: string }>;
}

interface Body {
    mode?: 'program' | 'manual';
    mentorUserId?: string;
    startsAt?: string;
    endsAt?: string;
    title?: string;
    meetingUrl?: string | null;
    note?: string | null;
    entitlementId?: string | null;
}

// Franjas libres del adviser (?mentorUserId=...), para ofrecerlas en el modal.
export async function GET(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();
    await context.params; // userId no necesario para listar slots

    const mentorUserId = new URL(request.url).searchParams.get('mentorUserId');
    if (!mentorUserId) {
        return NextResponse.json({ ok: false, error: 'mentorUserId es obligatorio' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                await requireModulePermission(client, 'mentorias', 'view');
                return listMentorOpenSlots(client, mentorUserId);
            }),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudieron cargar las franjas del adviser');
    }
}

export async function POST(request: Request, context: ContextParams) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();

    const { userId } = await context.params;
    if (!userId) return NextResponse.json({ ok: false, error: 'userId is required' }, { status: 400 });

    const body = await parseJsonBody<Body>(request);
    if (!body || !body.mentorUserId || !body.startsAt || !body.endsAt) {
        return NextResponse.json({ ok: false, error: 'mentorUserId, startsAt y endsAt son obligatorios' }, { status: 400 });
    }
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
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
                        endsAt: endsAt.toISOString(),
                        title: body.title?.trim() || 'Mentoría 1:1',
                        meetingUrl: body.meetingUrl ?? null,
                    });
                } else {
                    result = await scheduleProgramMentorshipForLeader(client, identity, {
                        leaderUserId: userId,
                        mentorUserId: body.mentorUserId!,
                        startsAt: startsAt.toISOString(),
                        endsAt: endsAt.toISOString(),
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
