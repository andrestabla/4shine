import type { PoolClient } from 'pg';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { ensureWorkbookInstances } from '@/features/aprendizaje/service';
import { listProgramEntitlements } from '@/features/mentorias/service';

export interface LeaderWorkbookSummary {
    workbookId: string;
    templateCode: string;
    sequenceNo: number;
    title: string;
    pillarCode: string | null;
    completionPercent: number;
    isEnabled: boolean;
    isHidden: boolean;
    availableFrom: string | null;
    lastDownloadedAt: string | null;
    updatedAt: string;
    deepLink: string;
}

export interface LeaderDiagnosticPillarScore {
    pillarCode: string;
    pillarLabel: string | null;
    score: number;
}

export interface LeaderDiagnosticSummary {
    sessionId: string | null;
    status: 'intro' | 'instructions' | 'quiz' | 'results' | null;
    completionPercent: number;
    completedAt: string | null;
    sharedAt: string | null;
    pillarScores: LeaderDiagnosticPillarScore[];
    deepLink: string;
}

export interface LeaderMentorshipSession {
    sessionId: string;
    title: string;
    mentorName: string;
    sessionType: 'individual' | 'grupal';
    status: string;
    startsAt: string;
    endsAt: string;
    attended: boolean | null;
}

export interface LeaderMentorshipAssignment {
    assignmentId: string;
    mentorName: string;
    status: 'active' | 'paused' | 'completed';
    assignedAt: string;
    endedAt: string | null;
    notes: string | null;
}

export interface LeaderProgramNext {
    entitlementId: string;
    code: string;
    title: string;
    sequenceNo: number;
    /** true si ya está disponible para agendar ahora (orden/cadencia OK). */
    schedulable: boolean;
    /** Fecha de habilitación si está bloqueada por la cadencia de 10 días. */
    unlockDate: string | null;
}

export interface LeaderMentorshipSummary {
    assignments: LeaderMentorshipAssignment[];
    upcomingSessions: LeaderMentorshipSession[];
    pastSessions: LeaderMentorshipSession[];
    totalSessions: number;
    attendedSessions: number;
    /** Total de mentorías 1:1 incluidas en el plan del líder (0 si no aplica). */
    programIncludedTotal: number;
    /** Próxima mentoría del programa a consumir (o null si no hay paquete/agenda). */
    programNext: LeaderProgramNext | null;
}

export interface LeaderContentItem {
    contentId: string;
    title: string;
    contentType: string;
    category: string;
    scope: string;
    progressPercent: number;
    seen: boolean;
    completedAt: string | null;
    lastViewedAt: string | null;
}

export interface LeaderContentSummary {
    totalSeen: number;
    totalCompleted: number;
    items: LeaderContentItem[];
}

export interface LeaderNetworkingConnection {
    connectionId: string;
    counterpartUserId: string;
    counterpartName: string;
    counterpartRole: string | null;
    status: string;
    requestedAt: string;
    respondedAt: string | null;
    counterpartIsRequester: boolean;
}

export interface LeaderNetworkingSummary {
    connectedCount: number;
    pendingCount: number;
    communityCount: number;
    recentConnections: LeaderNetworkingConnection[];
}

export interface LeaderConvocatoriaItem {
    convocatoriaId: string;
    title: string;
    status: string;
    appliedAt: string;
}

export interface LeaderConvocatoriaSummary {
    totalApplied: number;
    items: LeaderConvocatoriaItem[];
    note: string;
}

export interface LeaderWorkshopItem {
    workshopId: string;
    title: string;
    workshopType: string;
    status: string;
    startsAt: string;
    attendanceStatus: 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled';
    registeredAt: string;
}

export interface LeaderWorkshopSummary {
    totalRegistered: number;
    totalAttended: number;
    items: LeaderWorkshopItem[];
    note: string;
}

export interface LeaderProfile {
    userId: string;
    email: string;
    displayName: string;
    primaryRole: string;
    organizationName: string | null;
    isActive: boolean;
}

export interface Leader360Snapshot {
    profile: LeaderProfile;
    workbooks: LeaderWorkbookSummary[];
    diagnostic: LeaderDiagnosticSummary;
    mentorship: LeaderMentorshipSummary;
    content: LeaderContentSummary;
    networking: LeaderNetworkingSummary;
    convocatorias: LeaderConvocatoriaSummary;
    workshops: LeaderWorkshopSummary;
}

const ELEVATED_ROLES = new Set<AuthUser['role']>(['admin', 'gestor', 'mentor']);

async function ensureLeaderAccess(actor: AuthUser, targetUserId: string) {
    if (actor.userId === targetUserId) return;
    if (!ELEVATED_ROLES.has(actor.role)) {
        throw new ForbiddenError(
            'Solo administradores, gestores o advisors pueden consultar el perfil 360 de un líder.',
        );
    }
}

async function fetchProfile(client: PoolClient, userId: string): Promise<LeaderProfile> {
    const { rows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        primary_role: string;
        organization_name: string | null;
        is_active: boolean;
    }>(
        `
            SELECT
                u.user_id::text,
                u.email::text,
                u.display_name,
                u.primary_role,
                o.name AS organization_name,
                u.is_active
            FROM app_core.users u
            LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
            WHERE u.user_id = $1::uuid
            LIMIT 1
        `,
        [userId],
    );

    const row = rows[0];
    if (!row) throw new ForbiddenError('Líder no encontrado.');

    return {
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        primaryRole: row.primary_role,
        organizationName: row.organization_name,
        isActive: row.is_active,
    };
}

async function fetchWorkbooks(client: PoolClient, userId: string): Promise<LeaderWorkbookSummary[]> {
    const { rows } = await client.query<{
        workbook_id: string;
        workbook_code: string;
        sequence_no: number;
        title: string;
        pillar_code: string | null;
        completion_percent: number;
        is_enabled: boolean;
        is_hidden: boolean;
        available_from: string | null;
        last_downloaded_at: string | null;
        updated_at: string;
    }>(
        `
            SELECT
                uw.workbook_id::text,
                wt.workbook_code,
                wt.sequence_no,
                uw.title,
                wt.pillar_code,
                uw.completion_percent::numeric,
                uw.is_enabled,
                uw.is_hidden,
                uw.available_from,
                uw.last_downloaded_at,
                uw.updated_at
            FROM app_learning.user_workbooks uw
            JOIN app_learning.workbook_templates wt ON wt.template_id = uw.template_id
            WHERE uw.owner_user_id = $1::uuid
            ORDER BY wt.sequence_no
        `,
        [userId],
    );

    return rows.map((row) => ({
        workbookId: row.workbook_id,
        templateCode: row.workbook_code,
        sequenceNo: row.sequence_no,
        title: row.title,
        pillarCode: row.pillar_code,
        completionPercent: Number(row.completion_percent ?? 0),
        isEnabled: row.is_enabled,
        isHidden: row.is_hidden,
        availableFrom: row.available_from,
        lastDownloadedAt: row.last_downloaded_at,
        updatedAt: row.updated_at,
        deepLink: `/dashboard/aprendizaje/workbooks/${row.workbook_code.toLowerCase()}?workbookId=${row.workbook_id}`,
    }));
}

async function fetchDiagnostic(client: PoolClient, userId: string): Promise<LeaderDiagnosticSummary> {
    const { rows: sessionRows } = await client.query<{
        session_id: string;
        attempt_id: string;
        status: 'intro' | 'instructions' | 'quiz' | 'results';
        completion_percent: number;
        completed_at: string | null;
        shared_at: string | null;
        public_id: string | null;
    }>(
        `
            SELECT
                session_id::text,
                attempt_id::text,
                status,
                completion_percent::numeric,
                completed_at,
                shared_at,
                public_id
            FROM app_assessment.discovery_sessions
            WHERE user_id = $1::uuid
            LIMIT 1
        `,
        [userId],
    );

    if (sessionRows.length === 0) {
        return {
            sessionId: null,
            status: null,
            completionPercent: 0,
            completedAt: null,
            sharedAt: null,
            pillarScores: [],
            deepLink: '/dashboard/descubrimiento',
        };
    }

    const session = sessionRows[0];

    const { rows: scoreRows } = await client.query<{
        pillar_code: string;
        pillar_label: string | null;
        score: number;
    }>(
        `
            SELECT
                tas.pillar_code,
                p.display_name AS pillar_label,
                tas.score::numeric
            FROM app_assessment.test_attempt_scores tas
            LEFT JOIN app_assessment.pillars p ON p.pillar_code = tas.pillar_code
            WHERE tas.attempt_id = $1::uuid
            ORDER BY p.display_name
        `,
        [session.attempt_id],
    );

    return {
        sessionId: session.session_id,
        status: session.status,
        completionPercent: Number(session.completion_percent ?? 0),
        completedAt: session.completed_at,
        sharedAt: session.shared_at,
        pillarScores: scoreRows.map((row) => ({
            pillarCode: row.pillar_code,
            pillarLabel: row.pillar_label,
            score: Number(row.score ?? 0),
        })),
        // Si la sesión ya tiene informe público (public_id), enlazamos al
        // informe específico de este líder; si aún no, al módulo general.
        deepLink: session.public_id
            ? `/descubrimiento/share/${session.public_id}`
            : '/dashboard/descubrimiento',
    };
}

async function fetchMentorship(client: PoolClient, userId: string): Promise<LeaderMentorshipSummary> {
    const { rows: assignmentRows } = await client.query<{
        assignment_id: string;
        mentor_user_id: string;
        mentor_name: string;
        status: 'active' | 'paused' | 'completed';
        assigned_at: string;
        ended_at: string | null;
        notes: string | null;
    }>(
        `
            SELECT
                ma.assignment_id::text,
                ma.mentor_user_id::text,
                u.display_name AS mentor_name,
                ma.status,
                ma.assigned_at,
                ma.ended_at,
                ma.notes
            FROM app_mentoring.mentor_assignments ma
            LEFT JOIN app_core.users u ON u.user_id = ma.mentor_user_id
            WHERE ma.mentee_user_id = $1::uuid
            ORDER BY ma.assigned_at DESC
            LIMIT 25
        `,
        [userId],
    );

    const { rows: sessionRows } = await client.query<{
        session_id: string;
        title: string;
        mentor_name: string;
        session_type: 'individual' | 'grupal';
        status: string;
        starts_at: string;
        ends_at: string;
        attended: boolean | null;
    }>(
        `
            SELECT
                ms.session_id::text,
                ms.title,
                u.display_name AS mentor_name,
                ms.session_type,
                ms.status,
                ms.starts_at,
                ms.ends_at,
                sp.attended
            FROM app_mentoring.session_participants sp
            JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = sp.session_id
            LEFT JOIN app_core.users u ON u.user_id = ms.mentor_user_id
            WHERE sp.user_id = $1::uuid
              AND sp.participant_role = 'mentee'
            ORDER BY ms.starts_at DESC
            LIMIT 100
        `,
        [userId],
    );

    const now = Date.now();
    const upcoming = sessionRows
        .filter((row) => new Date(row.starts_at).getTime() >= now && row.status !== 'cancelled')
        .reverse();
    const past = sessionRows.filter(
        (row) => new Date(row.starts_at).getTime() < now || row.status === 'cancelled',
    );
    const attendedSessions = sessionRows.filter((row) => row.attended === true).length;

    const mapSession = (row: typeof sessionRows[number]): LeaderMentorshipSession => ({
        sessionId: row.session_id,
        title: row.title,
        mentorName: row.mentor_name ?? 'Sin asignar',
        sessionType: row.session_type,
        status: row.status,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        attended: row.attended,
    });

    // Paquete de mentorías del programa: total incluido y la próxima a consumir.
    const entitlements = await listProgramEntitlements(client, userId).catch(() => []);
    let programNext: LeaderProgramNext | null = null;
    if (entitlements.length > 0) {
        const sorted = [...entitlements].sort((a, b) => a.sequenceNo - b.sequenceNo);
        const TEN = 10 * 24 * 60 * 60 * 1000;
        const blocker = sorted
            .filter((e) => e.status === 'scheduled' && e.scheduledStartsAt && new Date(e.scheduledStartsAt).getTime() + TEN > now)
            .sort((a, b) => a.sequenceNo - b.sequenceNo)[0];
        const candidate = sorted.find(
            (e) => e.status === 'available' || (e.status === 'locked' && (!blocker || e.sequenceNo > blocker.sequenceNo)),
        );
        if (candidate) {
            const schedulable = candidate.status === 'available' && !blocker;
            const unlockDate = blocker?.scheduledStartsAt
                ? new Date(new Date(blocker.scheduledStartsAt).getTime() + TEN).toISOString()
                : null;
            programNext = {
                entitlementId: candidate.entitlementId,
                code: `M${String(candidate.sequenceNo).padStart(2, '0')}`,
                title: candidate.title,
                sequenceNo: candidate.sequenceNo,
                schedulable,
                unlockDate: schedulable ? null : unlockDate,
            };
        }
    }

    return {
        assignments: assignmentRows.map((row) => ({
            assignmentId: row.assignment_id,
            mentorName: row.mentor_name ?? 'Sin asignar',
            status: row.status,
            assignedAt: row.assigned_at,
            endedAt: row.ended_at,
            notes: row.notes,
        })),
        upcomingSessions: upcoming.map(mapSession),
        pastSessions: past.slice(0, 20).map(mapSession),
        totalSessions: sessionRows.length,
        attendedSessions,
        programIncludedTotal: entitlements.length,
        programNext,
    };
}

async function fetchContent(client: PoolClient, userId: string): Promise<LeaderContentSummary> {
    const { rows } = await client.query<{
        content_id: string;
        title: string;
        content_type: string;
        category: string;
        scope: string;
        progress_percent: number;
        seen: boolean;
        completed_at: string | null;
        last_viewed_at: string | null;
    }>(
        `
            SELECT
                cp.content_id::text,
                ci.title,
                ci.content_type,
                ci.category,
                ci.scope,
                cp.progress_percent::numeric,
                cp.seen,
                cp.completed_at,
                cp.last_viewed_at
            FROM app_learning.content_progress cp
            JOIN app_learning.content_items ci ON ci.content_id = cp.content_id
            WHERE cp.user_id = $1::uuid
              AND (cp.seen = true OR cp.progress_percent > 0)
            ORDER BY COALESCE(cp.last_viewed_at, cp.completed_at) DESC NULLS LAST
            LIMIT 100
        `,
        [userId],
    );

    const items = rows.map((row) => ({
        contentId: row.content_id,
        title: row.title,
        contentType: row.content_type,
        category: row.category,
        scope: row.scope,
        progressPercent: Number(row.progress_percent ?? 0),
        seen: row.seen,
        completedAt: row.completed_at,
        lastViewedAt: row.last_viewed_at,
    }));

    return {
        totalSeen: items.filter((item) => item.seen).length,
        totalCompleted: items.filter((item) => item.progressPercent >= 100).length,
        items,
    };
}

async function fetchNetworking(client: PoolClient, userId: string): Promise<LeaderNetworkingSummary> {
    const { rows } = await client.query<{
        connection_id: string;
        requester_user_id: string;
        addressee_user_id: string;
        status: string;
        requested_at: string;
        responded_at: string | null;
        counterpart_name: string;
        counterpart_role: string | null;
    }>(
        `
            SELECT
                c.connection_id::text,
                c.requester_user_id::text,
                c.addressee_user_id::text,
                c.status,
                c.requested_at,
                c.responded_at,
                u.display_name AS counterpart_name,
                u.primary_role AS counterpart_role
            FROM app_networking.connections c
            JOIN app_core.users u
              ON u.user_id = CASE
                  WHEN c.requester_user_id = $1::uuid THEN c.addressee_user_id
                  ELSE c.requester_user_id
              END
            WHERE c.requester_user_id = $1::uuid OR c.addressee_user_id = $1::uuid
            ORDER BY COALESCE(c.responded_at, c.requested_at) DESC
            LIMIT 50
        `,
        [userId],
    );

    const connections: LeaderNetworkingConnection[] = rows.map((row) => {
        const counterpartIsRequester = row.requester_user_id !== userId;
        const counterpartUserId = counterpartIsRequester ? row.requester_user_id : row.addressee_user_id;
        return {
            connectionId: row.connection_id,
            counterpartUserId,
            counterpartName: row.counterpart_name,
            counterpartRole: row.counterpart_role,
            status: row.status,
            requestedAt: row.requested_at,
            respondedAt: row.responded_at,
            counterpartIsRequester,
        };
    });

    const connectedCount = connections.filter((row) => row.status === 'connected').length;
    const pendingCount = connections.filter((row) => row.status === 'pending').length;

    const { rows: communityRows } = await client.query<{ total: number }>(
        `
            SELECT COUNT(*)::int AS total
            FROM app_networking.group_memberships
            WHERE user_id = $1::uuid
        `,
        [userId],
    );

    return {
        connectedCount,
        pendingCount,
        communityCount: communityRows[0]?.total ?? 0,
        recentConnections: connections.slice(0, 12),
    };
}

async function fetchConvocatorias(client: PoolClient, userId: string): Promise<LeaderConvocatoriaSummary> {
    const { rows } = await client.query<{
        convocatoria_id: string;
        title: string;
        status: string;
        applied_at: string;
    }>(
        `
            SELECT
                ca.convocatoria_id::text,
                c.title,
                c.status,
                ca.applied_at
            FROM app_networking.convocatoria_applications ca
            JOIN app_networking.convocatorias c ON c.convocatoria_id = ca.convocatoria_id
            WHERE ca.applicant_user_id = $1::uuid
            ORDER BY ca.applied_at DESC
            LIMIT 50
        `,
        [userId],
    );

    return {
        totalApplied: rows.length,
        items: rows.map((row) => ({
            convocatoriaId: row.convocatoria_id,
            title: row.title,
            status: row.status,
            appliedAt: row.applied_at,
        })),
        note:
            'El tracking de convocatorias “vistas” aún no está instrumentado. Mostramos las aplicadas.',
    };
}

async function fetchWorkshops(client: PoolClient, userId: string): Promise<LeaderWorkshopSummary> {
    const { rows } = await client.query<{
        workshop_id: string;
        title: string;
        workshop_type: string;
        status: string;
        starts_at: string;
        attendance_status: 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled';
        registered_at: string;
    }>(
        `
            SELECT
                wa.workshop_id::text,
                w.title,
                w.workshop_type,
                w.status,
                w.starts_at,
                wa.attendance_status,
                wa.registered_at
            FROM app_networking.workshop_attendees wa
            JOIN app_networking.workshops w ON w.workshop_id = wa.workshop_id
            WHERE wa.user_id = $1::uuid
            ORDER BY w.starts_at DESC
            LIMIT 50
        `,
        [userId],
    );

    const items = rows.map((row) => ({
        workshopId: row.workshop_id,
        title: row.title,
        workshopType: row.workshop_type,
        status: row.status,
        startsAt: row.starts_at,
        attendanceStatus: row.attendance_status,
        registeredAt: row.registered_at,
    }));

    return {
        totalRegistered: items.filter((item) => item.attendanceStatus === 'registered' || item.attendanceStatus === 'attended').length,
        totalAttended: items.filter((item) => item.attendanceStatus === 'attended').length,
        items,
        note:
            'El tracking de workshops “vistos” aún no está instrumentado. Mostramos los inscritos y asistidos.',
    };
}

export async function getLeader360Snapshot(
    client: PoolClient,
    actor: AuthUser,
    targetUserId: string,
): Promise<Leader360Snapshot> {
    await requireModulePermission(client, 'lideres', 'view');
    await ensureLeaderAccess(actor, targetUserId);

    // Provisiona los workbooks del líder según su plan (incl. planes dinámicos)
    // para que el panel los muestre aunque el líder aún no haya abierto Aprendizaje.
    await ensureWorkbookInstances(client, targetUserId).catch(() => {});

    const [profile, workbooks, diagnostic, mentorship, content, networking, convocatorias, workshops] =
        await Promise.all([
            fetchProfile(client, targetUserId),
            fetchWorkbooks(client, targetUserId),
            fetchDiagnostic(client, targetUserId),
            fetchMentorship(client, targetUserId),
            fetchContent(client, targetUserId),
            fetchNetworking(client, targetUserId),
            fetchConvocatorias(client, targetUserId),
            fetchWorkshops(client, targetUserId),
        ]);

    return {
        profile,
        workbooks,
        diagnostic,
        mentorship,
        content,
        networking,
        convocatorias,
        workshops,
    };
}
