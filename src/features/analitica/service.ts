import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  AnalyticsResult,
  NameCount,
  SeriesPoint,
} from './types';

async function resolveOrgId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (rows[0]?.organization_id) return rows[0].organization_id;
  const { rows: fb } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.organizations ORDER BY created_at ASC LIMIT 1`,
  );
  if (!fb[0]?.organization_id) throw new Error('Organization not found');
  return fb[0].organization_id;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export async function getAnalytics(
  client: PoolClient,
  actor: AuthUser,
  opts: { from: string; to: string },
): Promise<AnalyticsResult> {
  await requireModulePermission(client, 'analitica', 'view');
  const org = await resolveOrgId(client, actor.userId);
  const { from, to } = opts;

  // Helpers ----------------------------------------------------------------
  const nc = async (sql: string, params: unknown[] = []): Promise<NameCount[]> => {
    const { rows } = await client.query<{ label: string | null; value: number }>(sql, params);
    return rows.map((r) => ({ label: (r.label ?? '—').toString(), value: Number(r.value) }));
  };
  const series = async (sql: string, params: unknown[] = []): Promise<SeriesPoint[]> => {
    const { rows } = await client.query<{ date: string; value: number }>(sql, params);
    return rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  };
  const scalar = async (sql: string, params: unknown[] = []): Promise<number> => {
    const { rows } = await client.query<{ v: number }>(sql, params);
    return Number(rows[0]?.v ?? 0);
  };

  const DAY = "to_char(date_trunc('day', %COL%), 'YYYY-MM-DD')";
  const dayExpr = (col: string) => DAY.replace('%COL%', col);

  // ── USUARIOS ───────────────────────────────────────────────────────────
  const totalUsers = await scalar(
    `SELECT count(*)::int AS v FROM app_core.users WHERE organization_id = $1`,
    [org],
  );
  const activeUsers = await scalar(
    `SELECT count(*)::int AS v FROM app_core.users WHERE organization_id = $1 AND is_active = true`,
    [org],
  );
  const newUsers = await scalar(
    `SELECT count(*)::int AS v FROM app_core.users WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3`,
    [org, from, to],
  );
  const usersByRole = await nc(
    `SELECT primary_role AS label, count(*)::int AS value
     FROM app_core.users WHERE organization_id = $1 AND is_active = true
     GROUP BY primary_role ORDER BY value DESC`,
    [org],
  );
  const usersByPlan = await nc(
    `SELECT COALESCE(sp.name, 'Sin plan') AS label, count(*)::int AS value
     FROM app_core.users u
     JOIN app_core.user_profiles up ON up.user_id = u.user_id
     LEFT JOIN app_billing.subscription_plans sp
       ON sp.plan_id = up.subscription_plan_id
      AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
     WHERE u.organization_id = $1 AND u.is_active = true AND u.primary_role = 'lider'
     GROUP BY COALESCE(sp.name, 'Sin plan') ORDER BY value DESC`,
    [org],
  );
  const usersByCountry = await nc(
    `SELECT COALESCE(NULLIF(TRIM(up.country), ''), 'Sin país') AS label, count(*)::int AS value
     FROM app_core.users u
     JOIN app_core.user_profiles up ON up.user_id = u.user_id
     WHERE u.organization_id = $1 AND u.is_active = true
     GROUP BY 1 ORDER BY value DESC LIMIT 12`,
    [org],
  );
  const vigencia = await nc(
    `SELECT
       CASE
         WHEN up.subscription_expires_at IS NULL THEN 'Sin vigencia'
         WHEN up.subscription_expires_at < now() THEN 'Vencida'
         WHEN up.subscription_expires_at < now() + interval '30 days' THEN 'Por vencer'
         ELSE 'Vigente'
       END AS label,
       count(*)::int AS value
     FROM app_core.users u
     JOIN app_core.user_profiles up ON up.user_id = u.user_id
     WHERE u.organization_id = $1 AND u.is_active = true AND u.primary_role = 'lider'
     GROUP BY 1`,
    [org],
  );
  const signupsSeries = await series(
    `SELECT ${dayExpr('created_at')} AS date, count(*)::int AS value
     FROM app_core.users WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );

  // ── MENTORÍAS ──────────────────────────────────────────────────────────
  const mentByStatus = await nc(
    `SELECT ms.status AS label, count(*)::int AS value
     FROM app_mentoring.mentorship_sessions ms
     JOIN app_core.users u ON u.user_id = ms.mentor_user_id
     WHERE u.organization_id = $1
     GROUP BY ms.status ORDER BY value DESC`,
    [org],
  );
  const mentByType = await nc(
    `SELECT CASE ms.session_type WHEN 'grupal' THEN 'Grupal' ELSE 'Individual' END AS label, count(*)::int AS value
     FROM app_mentoring.mentorship_sessions ms
     JOIN app_core.users u ON u.user_id = ms.mentor_user_id
     WHERE u.organization_id = $1
     GROUP BY 1 ORDER BY value DESC`,
    [org],
  );
  const mentSeries = await series(
    `SELECT ${dayExpr('ms.starts_at')} AS date, count(*)::int AS value
     FROM app_mentoring.mentorship_sessions ms
     JOIN app_core.users u ON u.user_id = ms.mentor_user_id
     WHERE u.organization_id = $1 AND ms.starts_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );
  const totalSessions = await scalar(
    `SELECT count(*)::int AS v FROM app_mentoring.mentorship_sessions ms
     JOIN app_core.users u ON u.user_id = ms.mentor_user_id WHERE u.organization_id = $1`,
    [org],
  );
  const completedSessions = await scalar(
    `SELECT count(*)::int AS v FROM app_mentoring.mentorship_sessions ms
     JOIN app_core.users u ON u.user_id = ms.mentor_user_id
     WHERE u.organization_id = $1 AND ms.status = 'completed'`,
    [org],
  );
  const groupParticipation = await nc(
    `SELECT gsp.participation_status AS label, count(*)::int AS value
     FROM app_mentoring.group_session_participation gsp
     JOIN app_core.users u ON u.user_id = gsp.user_id
     WHERE u.organization_id = $1
     GROUP BY 1 ORDER BY value DESC`,
    [org],
  );
  const attendedCounts = await client.query<{ attended: number; total: number }>(
    `SELECT
       count(*) FILTER (WHERE sp.attended = true)::int AS attended,
       count(*)::int AS total
     FROM app_mentoring.session_participants sp
     JOIN app_core.users u ON u.user_id = sp.user_id
     WHERE u.organization_id = $1 AND sp.participant_role = 'mentee'`,
    [org],
  );

  // ── DESCUBRIMIENTO ─────────────────────────────────────────────────────
  const discByStatus = await nc(
    `SELECT ds.status AS label, count(*)::int AS value
     FROM app_assessment.discovery_sessions ds
     JOIN app_core.users u ON u.user_id = ds.user_id
     WHERE u.organization_id = $1
     GROUP BY ds.status ORDER BY value DESC`,
    [org],
  );
  const discTotal = await scalar(
    `SELECT count(*)::int AS v FROM app_assessment.discovery_sessions ds
     JOIN app_core.users u ON u.user_id = ds.user_id WHERE u.organization_id = $1`,
    [org],
  );
  const discCompleted = await scalar(
    `SELECT count(*)::int AS v FROM app_assessment.discovery_sessions ds
     JOIN app_core.users u ON u.user_id = ds.user_id
     WHERE u.organization_id = $1 AND ds.status = 'results'`,
    [org],
  );
  const avgPillars = await nc(
    `SELECT COALESCE(p.display_name, tas.pillar_code) AS label, round(avg(tas.score))::int AS value
     FROM app_assessment.test_attempt_scores tas
     JOIN app_assessment.discovery_sessions ds ON ds.attempt_id = tas.attempt_id
     JOIN app_core.users u ON u.user_id = ds.user_id
     LEFT JOIN app_assessment.pillars p ON p.pillar_code = tas.pillar_code
     WHERE u.organization_id = $1
     GROUP BY 1, p.sequence_no ORDER BY p.sequence_no NULLS LAST`,
    [org],
  );
  const discSeries = await series(
    `SELECT ${dayExpr('ds.completed_at')} AS date, count(*)::int AS value
     FROM app_assessment.discovery_sessions ds
     JOIN app_core.users u ON u.user_id = ds.user_id
     WHERE u.organization_id = $1 AND ds.completed_at IS NOT NULL AND ds.completed_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );

  // ── APRENDIZAJE ────────────────────────────────────────────────────────
  const wbAgg = await client.query<{ avg: number | null; completed: number }>(
    `SELECT round(avg(uw.completion_percent))::int AS avg,
            count(*) FILTER (WHERE uw.completion_percent >= 100)::int AS completed
     FROM app_learning.user_workbooks uw
     JOIN app_core.users u ON u.user_id = uw.owner_user_id
     WHERE u.organization_id = $1`,
    [org],
  );
  // content_items no tiene organization_id; en la práctica la plataforma es de
  // una sola organización, así que se cuentan global.
  const contentByType = await nc(
    `SELECT content_type AS label, count(*)::int AS value
     FROM app_learning.content_items GROUP BY content_type ORDER BY value DESC`,
  );
  const contentByStatus = await nc(
    `SELECT status AS label, count(*)::int AS value
     FROM app_learning.content_items GROUP BY status ORDER BY value DESC`,
  );
  const learnSeries = await series(
    `SELECT ${dayExpr('cp.completed_at')} AS date, count(*)::int AS value
     FROM app_learning.content_progress cp
     JOIN app_core.users u ON u.user_id = cp.user_id
     WHERE u.organization_id = $1 AND cp.completed_at IS NOT NULL AND cp.completed_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );

  // ── NETWORKING ─────────────────────────────────────────────────────────
  const connByStatus = await nc(
    `SELECT c.status AS label, count(*)::int AS value
     FROM app_networking.connections c
     JOIN app_core.users u ON u.user_id = c.requester_user_id
     WHERE u.organization_id = $1
     GROUP BY c.status ORDER BY value DESC`,
    [org],
  );
  const totalConnections = await scalar(
    `SELECT count(*)::int AS v FROM app_networking.connections c
     JOIN app_core.users u ON u.user_id = c.requester_user_id WHERE u.organization_id = $1`,
    [org],
  );
  const connSeries = await series(
    `SELECT ${dayExpr('c.requested_at')} AS date, count(*)::int AS value
     FROM app_networking.connections c
     JOIN app_core.users u ON u.user_id = c.requester_user_id
     WHERE u.organization_id = $1 AND c.requested_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );

  // ── CONVOCATORIAS ──────────────────────────────────────────────────────
  const convByStatus = await nc(
    `SELECT cv.status AS label, count(*)::int AS value
     FROM app_networking.convocatorias cv
     JOIN app_core.users u ON u.user_id = cv.created_by
     WHERE u.organization_id = $1
     GROUP BY cv.status ORDER BY value DESC`,
    [org],
  );
  const convTotal = await scalar(
    `SELECT count(*)::int AS v FROM app_networking.convocatorias cv
     JOIN app_core.users u ON u.user_id = cv.created_by WHERE u.organization_id = $1`,
    [org],
  );
  const convApplications = await scalar(
    `SELECT count(*)::int AS v FROM app_networking.convocatoria_applications ca
     JOIN app_core.users u ON u.user_id = ca.applicant_user_id WHERE u.organization_id = $1`,
    [org],
  );
  const convAppSeries = await series(
    `SELECT ${dayExpr('ca.applied_at')} AS date, count(*)::int AS value
     FROM app_networking.convocatoria_applications ca
     JOIN app_core.users u ON u.user_id = ca.applicant_user_id
     WHERE u.organization_id = $1 AND ca.applied_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );
  const convTop = await nc(
    `SELECT cv.title AS label, count(ca.application_id)::int AS value
     FROM app_networking.convocatorias cv
     JOIN app_core.users u ON u.user_id = cv.created_by
     LEFT JOIN app_networking.convocatoria_applications ca ON ca.convocatoria_id = cv.convocatoria_id
     WHERE u.organization_id = $1
     GROUP BY cv.convocatoria_id, cv.title ORDER BY value DESC LIMIT 8`,
    [org],
  );

  // ── WORKSHOPS ──────────────────────────────────────────────────────────
  const wsByStatus = await nc(
    `SELECT w.status AS label, count(*)::int AS value
     FROM app_networking.workshops w
     JOIN app_core.users u ON u.user_id = w.created_by
     WHERE u.organization_id = $1
     GROUP BY w.status ORDER BY value DESC`,
    [org],
  );
  const wsTotal = await scalar(
    `SELECT count(*)::int AS v FROM app_networking.workshops w
     JOIN app_core.users u ON u.user_id = w.created_by WHERE u.organization_id = $1`,
    [org],
  );
  const wsByAttendance = await nc(
    `SELECT wa.attendance_status AS label, count(*)::int AS value
     FROM app_networking.workshop_attendees wa
     JOIN app_core.users u ON u.user_id = wa.user_id
     WHERE u.organization_id = $1
     GROUP BY wa.attendance_status ORDER BY value DESC`,
    [org],
  );
  const wsSeries = await series(
    `SELECT ${dayExpr('wa.registered_at')} AS date, count(*)::int AS value
     FROM app_networking.workshop_attendees wa
     JOIN app_core.users u ON u.user_id = wa.user_id
     WHERE u.organization_id = $1 AND wa.registered_at BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [org, from, to],
  );

  const attended = attendedCounts.rows[0]?.attended ?? 0;
  const attTotal = attendedCounts.rows[0]?.total ?? 0;

  return {
    range: { from, to },
    usuarios: {
      total: totalUsers,
      active: activeUsers,
      newInRange: newUsers,
      byRole: usersByRole,
      byPlan: usersByPlan,
      byCountry: usersByCountry,
      vigencia,
      signupsSeries,
    },
    mentorias: {
      totalSessions,
      completedSessions,
      individualVsGroup: mentByType,
      byStatus: mentByStatus,
      sessionsSeries: mentSeries,
      groupParticipation,
      attendanceRate: pct(attended, attTotal),
    },
    descubrimiento: {
      total: discTotal,
      completed: discCompleted,
      completionRate: pct(discCompleted, discTotal),
      byStatus: discByStatus,
      avgPillars,
      completionsSeries: discSeries,
    },
    aprendizaje: {
      workbookAvgCompletion: Number(wbAgg.rows[0]?.avg ?? 0),
      workbooksCompleted: Number(wbAgg.rows[0]?.completed ?? 0),
      contentByType,
      contentByStatus,
      completionsSeries: learnSeries,
    },
    networking: {
      totalConnections,
      byStatus: connByStatus,
      connectionsSeries: connSeries,
    },
    convocatorias: {
      total: convTotal,
      byStatus: convByStatus,
      totalApplications: convApplications,
      applicationsSeries: convAppSeries,
      topByApplications: convTop,
    },
    workshops: {
      total: wsTotal,
      byStatus: wsByStatus,
      byAttendance: wsByAttendance,
      registrationsSeries: wsSeries,
    },
  };
}
