import type { PoolClient } from 'pg'
import {
    ForbiddenError,
    requireModulePermission,
} from '@/server/auth/module-permissions'
import type { AuthUser } from '@/server/auth/types'

export interface LeaderSummary {
    userId: string
    name: string
    email: string
    avatarUrl: string | null
    avatarInitial: string
    country: string | null
    location: string | null
    company: string
    industry: string | null
    seniority: string | null
    plan: {
        id: string | null
        code: string | null
        name: string | null
        group: string | null
        highlightLabel: string | null
    }
    workbooks: {
        total: number
        completed: number
        avgPercent: number
    }
    mentorias: {
        completed: number
        scheduled: number
        nextSessionAt: string | null
    }
    cursos: {
        total: number
        completed: number
        avgPercent: number
    }
    overallPercent: number
}

interface LeaderSummaryRow {
    user_id: string
    name: string
    email: string
    avatar_url: string | null
    avatar_initial: string | null
    country: string | null
    location: string | null
    company: string | null
    industry: string | null
    seniority_level: string | null
    plan_id: string | null
    plan_code: string | null
    plan_name: string | null
    plan_group: string | null
    plan_highlight_label: string | null
    wb_total: number | string | null
    wb_completed: number | string | null
    wb_avg_percent: number | string | null
    mentor_completed: number | string | null
    mentor_scheduled: number | string | null
    mentor_next_at: string | null
    course_total: number | string | null
    course_completed: number | string | null
    course_avg_percent: number | string | null
}

const ELEVATED_ROLES = new Set<AuthUser['role']>([
    'admin',
    'gestor',
    'mentor',
])

function ensureCanReadLideres(actor: AuthUser) {
    if (!ELEVATED_ROLES.has(actor.role)) {
        throw new ForbiddenError(
            'Sólo admin, gestor o adviser pueden ver el resumen de líderes.',
        )
    }
}

function toInt(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
}

function toPercent(value: number | string | null | undefined): number {
    const n = toInt(value)
    return Math.max(0, Math.min(100, n))
}

export async function listLeaderSummaries(
    client: PoolClient,
    actor: AuthUser,
): Promise<LeaderSummary[]> {
    ensureCanReadLideres(actor)
    await requireModulePermission(client, 'lideres', 'view')

    const { rows } = await client.query<LeaderSummaryRow>(
        `
            SELECT
                u.user_id::text,
                u.display_name AS name,
                u.email::text,
                u.avatar_url,
                u.avatar_initial,
                up.country,
                up.location,
                o.name AS company,
                up.industry,
                up.seniority_level,
                sp.plan_id::text AS plan_id,
                sp.plan_code,
                sp.name AS plan_name,
                sp.plan_group::text AS plan_group,
                sp.highlight_label AS plan_highlight_label,
                wb_stats.wb_total,
                wb_stats.wb_completed,
                wb_stats.wb_avg_percent,
                mentor_stats.mentor_completed,
                mentor_stats.mentor_scheduled,
                mentor_stats.mentor_next_at,
                course_stats.course_total,
                course_stats.course_completed,
                course_stats.course_avg_percent
            FROM app_core.users u
            LEFT JOIN app_core.organizations o
                ON o.organization_id = u.organization_id
            LEFT JOIN app_core.user_profiles up
                ON up.user_id = u.user_id
            LEFT JOIN app_billing.subscription_plans sp
                ON sp.plan_id = up.subscription_plan_id
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS wb_total,
                    COUNT(*) FILTER (WHERE uw.completion_percent >= 100)::int AS wb_completed,
                    COALESCE(ROUND(AVG(uw.completion_percent)), 0)::int AS wb_avg_percent
                FROM app_learning.user_workbooks uw
                WHERE uw.owner_user_id = u.user_id
                  AND uw.is_hidden = false
            ) wb_stats ON true
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*) FILTER (WHERE ms.status = 'completed')::int AS mentor_completed,
                    COUNT(*) FILTER (
                        WHERE ms.status = 'scheduled'
                          AND ms.starts_at >= now()
                    )::int AS mentor_scheduled,
                    (
                        SELECT ms2.starts_at::text
                        FROM app_mentoring.session_participants sp2
                        JOIN app_mentoring.mentorship_sessions ms2
                            ON ms2.session_id = sp2.session_id
                        WHERE sp2.user_id = u.user_id
                          AND ms2.status = 'scheduled'
                          AND ms2.starts_at >= now()
                        ORDER BY ms2.starts_at
                        LIMIT 1
                    ) AS mentor_next_at
                FROM app_mentoring.session_participants sp
                JOIN app_mentoring.mentorship_sessions ms
                    ON ms.session_id = sp.session_id
                WHERE sp.user_id = u.user_id
            ) mentor_stats ON true
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS course_total,
                    COUNT(*) FILTER (WHERE cp.progress_percent >= 100)::int AS course_completed,
                    COALESCE(ROUND(AVG(cp.progress_percent)), 0)::int AS course_avg_percent
                FROM app_learning.content_progress cp
                WHERE cp.user_id = u.user_id
            ) course_stats ON true
            WHERE u.is_active = true
              AND u.primary_role = 'lider'
            ORDER BY u.display_name ASC
        `,
    )

    return rows.map((row) => {
        const name = row.name ?? ''
        const avatarInitial =
            (row.avatar_initial && row.avatar_initial.trim()) ||
            name.trim().charAt(0).toUpperCase() ||
            '?'

        const wbAvg = toPercent(row.wb_avg_percent)
        const courseAvg = toPercent(row.course_avg_percent)
        const overall = Math.round((wbAvg + courseAvg) / 2)

        return {
            userId: row.user_id,
            name,
            email: row.email,
            avatarUrl: row.avatar_url ?? null,
            avatarInitial,
            country: row.country?.trim() || null,
            location: row.location?.trim() || null,
            company: row.company ?? '4Shine',
            industry: row.industry?.trim() || null,
            seniority: row.seniority_level?.trim() || null,
            plan: {
                id: row.plan_id ?? null,
                code: row.plan_code ?? null,
                name: row.plan_name ?? null,
                group: row.plan_group ?? null,
                highlightLabel: row.plan_highlight_label ?? null,
            },
            workbooks: {
                total: toInt(row.wb_total),
                completed: toInt(row.wb_completed),
                avgPercent: wbAvg,
            },
            mentorias: {
                completed: toInt(row.mentor_completed),
                scheduled: toInt(row.mentor_scheduled),
                nextSessionAt: row.mentor_next_at ?? null,
            },
            cursos: {
                total: toInt(row.course_total),
                completed: toInt(row.course_completed),
                avgPercent: courseAvg,
            },
            overallPercent: overall,
        }
    })
}
