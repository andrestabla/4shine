import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { computeRouteProgressPercent } from '@/features/trayectoria/journey-leader';
import type { DashboardSummary } from './types';

export async function getMyDashboard(client: PoolClient, actor: AuthUser): Promise<DashboardSummary> {
  const userId = actor.userId;

  // Workbooks del journey (código + avance) para el % de ruta y el conteo.
  const { rows: wbRows } = await client.query<{ template_code: string; completion_percent: number }>(
    `SELECT wt.workbook_code AS template_code, uw.completion_percent::float AS completion_percent
     FROM app_learning.user_workbooks uw
     JOIN app_learning.workbook_templates wt ON wt.template_id = uw.template_id
     WHERE uw.owner_user_id = $1 AND uw.is_hidden = false`,
    [userId],
  );

  // Diagnóstico (Descubrimiento): mayor avance + si alguna sesión está completa.
  const { rows: discRows } = await client.query<{ pct: number; done: boolean }>(
    `SELECT COALESCE(MAX(completion_percent), 0)::float AS pct,
            COALESCE(BOOL_OR(status = 'completed' OR completion_percent >= 100), false) AS done
     FROM app_assessment.discovery_sessions
     WHERE user_id = $1`,
    [userId],
  );
  const discovery = {
    done: discRows[0]?.done ?? false,
    completionPercent: Math.round(discRows[0]?.pct ?? 0),
  };

  const routePercent = computeRouteProgressPercent(
    wbRows.map((r) => ({ templateCode: r.template_code, completionPercent: r.completion_percent })),
    { completionPercent: discovery.completionPercent },
  );

  const { rows: testsRows } = await client.query<{ tests: number }>(
    `SELECT COUNT(*)::int AS tests FROM app_assessment.test_attempts
     WHERE user_id = $1 AND status = 'completed'`,
    [userId],
  );

  const { rows: connRows } = await client.query<{ connected: number; pending: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'connected')::int AS connected,
       COUNT(*) FILTER (WHERE status = 'pending' AND addressee_user_id = $1)::int AS pending
     FROM app_networking.connections
     WHERE requester_user_id = $1 OR addressee_user_id = $1`,
    [userId],
  );

  const { rows: mentorRows } = await client.query<{
    completed: number;
    scheduled: number;
    next_at: string | null;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE ms.status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE ms.status = 'scheduled' AND ms.starts_at >= now())::int AS scheduled,
       (
         SELECT ms2.starts_at::text
         FROM app_mentoring.session_participants sp2
         JOIN app_mentoring.mentorship_sessions ms2 ON ms2.session_id = sp2.session_id
         WHERE sp2.user_id = $1 AND ms2.status = 'scheduled' AND ms2.starts_at >= now()
         ORDER BY ms2.starts_at LIMIT 1
       ) AS next_at
     FROM app_mentoring.session_participants sp
     JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = sp.session_id
     WHERE sp.user_id = $1`,
    [userId],
  );

  const { rows: courseRows } = await client.query<{ avg_percent: number }>(
    `SELECT COALESCE(ROUND(AVG(progress_percent)), 0)::int AS avg_percent
     FROM app_learning.content_progress WHERE user_id = $1`,
    [userId],
  );

  const workbooksTotal = wbRows.length;
  const workbooksCompleted = wbRows.filter((r) => (r.completion_percent ?? 0) >= 100).length;
  const completedMentorias = mentorRows[0]?.completed ?? 0;

  return {
    routePercent,
    discovery,
    tests: testsRows[0]?.tests ?? 0,
    networking: {
      connected: connRows[0]?.connected ?? 0,
      pending: connRows[0]?.pending ?? 0,
    },
    mentorias: {
      completed: completedMentorias,
      scheduled: mentorRows[0]?.scheduled ?? 0,
      nextSessionAt: mentorRows[0]?.next_at ?? null,
    },
    learning: {
      workbooksTotal,
      workbooksCompleted,
      coursesAvgPercent: courseRows[0]?.avg_percent ?? 0,
    },
    firstTime: routePercent === 0 && !discovery.done && completedMentorias === 0 && workbooksCompleted === 0,
  };
}
