import type { PoolClient } from 'pg';
import { getViewerAccessState } from '@/features/access/service';
import { withClient, withRoleContext } from '@/server/db/pool';
import type {
  BootstrapPayload,
  Chat,
  Comment,
  InterestGroup,
  Job,
  LearningItem,
  Mentee,
  Mentor,
  MentorAssignment,
  MentorshipSession,
  MethodologyResource,
  NetworkingContact,
  NewsUpdate,
  Notification,
  Quote,
  Role,
  TimelineEvent,
  User,
  UserStats,
  Workshop,
} from './types';

interface UserHydrationRow {
  user_id: string;
  email: string;
  display_name: string;
  primary_role: Role;
  avatar_initial: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  location: string | null;
  profession: string | null;
  industry: string | null;
  plan_type: string | null;
  bio: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
}

const ROLE_LABEL: Record<Role, string> = {
  lider: 'Líder',
  mentor: 'Mentor',
  gestor: 'Gestor del Programa',
  admin: 'Administrador',
  invitado: 'Invitado',
};

const ROLE_COLOR: Record<Role, string> = {
  lider: 'bg-amber-500',
  mentor: 'bg-blue-600',
  gestor: 'bg-teal-600',
  admin: 'bg-slate-700',
  invitado: 'bg-violet-600',
};

const PLAN_LABEL: Record<string, 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard'> = {
  vip: 'VIP',
  premium: 'Premium',
  empresa_elite: 'Empresa Élite',
  standard: 'Standard',
};

const SENIORITY_LABEL: Record<string, 'Senior' | 'C-Level' | 'Director' | 'Manager' | 'VP'> = {
  senior: 'Senior',
  c_level: 'C-Level',
  director: 'Director',
  manager: 'Manager',
  vp: 'VP',
};

const WORKSHOP_TYPE_LABEL: Record<string, Workshop['type']> = {
  relacionamiento: 'Relacionamiento',
  formacion: 'Formación',
  innovacion: 'Innovación',
  wellbeing: 'Wellbeing',
  otro: 'Otro',
};

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function toEsDate(value: Date | string | null): string {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace('.', '');
}

function toEsTime(value: Date | string | null): string {
  if (!value) return '--:--';
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function relativeDaysFrom(value: Date | string | null): string {
  if (!value) return 'Hace 0 días';
  const now = Date.now();
  const then = new Date(value).getTime();
  const days = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
}

function readPlan(value: string | null): 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard' {
  if (!value) return 'Standard';
  return PLAN_LABEL[value] ?? 'Standard';
}

function readSeniority(value: string | null): 'Senior' | 'C-Level' | 'Director' | 'Manager' | 'VP' {
  if (!value) return 'Manager';
  return SENIORITY_LABEL[value] ?? 'Manager';
}

async function getUserNumericMap(client: PoolClient): Promise<Map<string, number>> {
  const { rows } = await client.query<{ user_id: string }>(
    `
      SELECT user_id
      FROM app_core.users
      WHERE is_active = true
      ORDER BY created_at, user_id
    `,
  );

  const map = new Map<string, number>();
  rows.forEach((row, index) => {
    map.set(row.user_id, index + 1);
  });
  return map;
}

async function getContextUserId(client: PoolClient, role: Role): Promise<string> {
  const { rows } = await client.query<{ user_id: string }>(
    `
      SELECT u.user_id
      FROM app_core.users u
      WHERE u.is_active = true
        AND u.primary_role = $1
      ORDER BY u.created_at
      LIMIT 1
    `,
    [role],
  );

  if (!rows[0]) {
    throw new Error(`No active user found for role ${role}`);
  }

  return rows[0].user_id;
}

async function fetchRoleStats(client: PoolClient, role: Role, userId: string): Promise<UserStats> {
  if (role === 'lider') {
    const { rows: progressRows } = await client.query<{ progress: number }>(
      `
        SELECT COALESCE(ROUND(AVG(progress_percent)), 0)::int AS progress
        FROM app_learning.content_progress
        WHERE user_id = $1
      `,
      [userId],
    );
    const { rows: testsRows } = await client.query<{ tests: number }>(
      `
        SELECT COUNT(*)::int AS tests
        FROM app_assessment.test_attempts
        WHERE user_id = $1
          AND status = 'completed'
      `,
      [userId],
    );
    const { rows: connRows } = await client.query<{ connections: number }>(
      `
        SELECT COUNT(*)::int AS connections
        FROM app_networking.connections
        WHERE status = 'connected'
          AND (requester_user_id = $1 OR addressee_user_id = $1)
      `,
      [userId],
    );

    return {
      progress: progressRows[0]?.progress ?? 0,
      tests: testsRows[0]?.tests ?? 0,
      connections: connRows[0]?.connections ?? 0,
    };
  }

  if (role === 'mentor') {
    const { rows: studentsRows } = await client.query<{ students: number }>(
      `
        SELECT COUNT(*)::int AS students
        FROM app_mentoring.mentor_assignments
        WHERE mentor_user_id = $1
          AND status = 'active'
      `,
      [userId],
    );
    const { rows: hoursRows } = await client.query<{ hours: number }>(
      `
        SELECT COALESCE(ROUND(SUM(EXTRACT(EPOCH FROM (ends_at - starts_at)) / 3600.0)), 0)::int AS hours
        FROM app_mentoring.mentorship_sessions
        WHERE mentor_user_id = $1
          AND status = 'completed'
      `,
      [userId],
    );
    const { rows: ratingRows } = await client.query<{ rating: number }>(
      `
        SELECT COALESCE(rating_avg, 0)::numeric(3,2) AS rating
        FROM app_mentoring.mentors
        WHERE mentor_user_id = $1
      `,
      [userId],
    );

    return {
      students: studentsRows[0]?.students ?? 0,
      hours: hoursRows[0]?.hours ?? 0,
      rating: Number(ratingRows[0]?.rating ?? 0),
    };
  }

  if (role === 'gestor') {
    const { rows: managedRows } = await client.query<{ managed: number }>(
      `
        SELECT COUNT(*)::int AS managed
        FROM app_learning.content_items
      `,
    );
    const { rows: pendingRows } = await client.query<{ pending: number }>(
      `
        SELECT COUNT(*)::int AS pending
        FROM app_learning.content_items
        WHERE status = 'pending_review'
      `,
    );
    const { rows: satRows } = await client.query<{ satisfaction: number }>(
      `
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 4.8) AS satisfaction
        FROM app_mentoring.session_feedback
      `,
    );

    return {
      managedContent: managedRows[0]?.managed ?? 0,
      pendingReviews: pendingRows[0]?.pending ?? 0,
      programSatisfaction: `${satRows[0]?.satisfaction ?? 4.8}/5`,
    };
  }

  const { rows: usersRows } = await client.query<{ total: number }>(
    `
      SELECT COUNT(*)::int AS total
      FROM app_core.users
      WHERE is_active = true
    `,
  );
  const { rows: cohortsRows } = await client.query<{ active: number }>(
    `
      SELECT COUNT(*)::int AS active
      FROM app_core.cohorts
      WHERE status = 'active'
    `,
  );

  return {
    totalUsers: usersRows[0]?.total ?? 0,
    activeCohorts: cohortsRows[0]?.active ?? 0,
    uptime: '99.9%',
  };
}

async function hydrateUserRecord(
  client: PoolClient,
  row: UserHydrationRow,
): Promise<User> {
  const { rows: interestsRows } = await client.query<{ name: string }>(
    `
      SELECT i.name
      FROM app_core.user_interests ui
      JOIN app_core.interests i ON i.interest_id = ui.interest_id
      WHERE ui.user_id = $1
      ORDER BY i.name
    `,
    [row.user_id],
  );
  const { rows: projectsRows } = await client.query<{
    title: string;
    description: string | null;
    project_role: string | null;
  }>(
    `
      SELECT title, description, project_role
      FROM app_core.user_projects
      WHERE user_id = $1
      ORDER BY created_at
      LIMIT 3
    `,
    [row.user_id],
  );
  const { rows: testsRows } = await client.query<{ pillar_code: string; score: number }>(
    `
      SELECT tas.pillar_code, tas.score
      FROM app_assessment.test_attempt_scores tas
      JOIN app_assessment.test_attempts ta ON ta.attempt_id = tas.attempt_id
      WHERE ta.user_id = $1
        AND ta.status = 'completed'
      ORDER BY ta.completed_at DESC NULLS LAST
    `,
    [row.user_id],
  );
  const { rows: challengesRows } = await client.query<{
    title: string;
    description: string | null;
    challenge_type: 'strategic' | 'social' | 'personal';
  }>(
    `
      SELECT c.title, c.description, c.challenge_type
      FROM app_core.user_challenges uc
      JOIN app_core.challenges c ON c.challenge_id = uc.challenge_id
      WHERE uc.user_id = $1
        AND uc.status IN ('assigned', 'in_progress')
      ORDER BY uc.assigned_at DESC
      LIMIT 3
    `,
    [row.user_id],
  );
  const stats = await fetchRoleStats(client, row.primary_role, row.user_id);

  const scoreMap: Record<string, number> = {
    shine_within: 0,
    shine_out: 0,
    shine_up: 0,
    shine_beyond: 0,
  };

  for (const score of testsRows) {
    if (scoreMap[score.pillar_code] === 0) {
      scoreMap[score.pillar_code] = Number(score.score);
    }
  }

  return {
    id: row.user_id,
    name: row.display_name,
    role: ROLE_LABEL[row.primary_role],
    avatar: row.avatar_initial ?? row.display_name[0]?.toUpperCase() ?? '?',
    avatarUrl: row.avatar_url ?? undefined,
    color: ROLE_COLOR[row.primary_role],
    company: row.organization_name ?? '4Shine',
    location: row.location ?? 'Remoto',
    stats,
    profession: row.profession ?? undefined,
    industry: row.industry ?? undefined,
    planType: readPlan(row.plan_type),
    bio: row.bio ?? undefined,
    socialLinks: {
      linkedin: row.linkedin_url ?? undefined,
      twitter: row.twitter_url ?? undefined,
      website: row.website_url ?? undefined,
    },
    interests: interestsRows.map((item) => item.name),
    projects: projectsRows.map((item, index) => ({
      id: index + 1,
      title: item.title,
      description: item.description ?? '',
      role: item.project_role ?? '',
    })),
    testResults: {
      shineWithin: scoreMap.shine_within,
      shineOut: scoreMap.shine_out,
      shineUp: scoreMap.shine_up,
      shineBeyond: scoreMap.shine_beyond,
    },
    nextChallenges: challengesRows.map((item, index) => ({
      id: index + 1,
      title: item.title,
      description: item.description ?? '',
      type: item.challenge_type,
    })),
  };
}

async function fetchUsers(client: PoolClient): Promise<Record<Role, User>> {
  const { rows } = await client.query<UserHydrationRow>(
    `
      SELECT
        u.user_id,
        u.email,
        u.display_name,
        u.primary_role,
        u.avatar_initial,
        u.avatar_url,
        o.name AS organization_name,
        p.location,
        p.profession,
        p.industry,
        p.plan_type,
        p.bio,
        p.linkedin_url,
        p.twitter_url,
        p.website_url
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
      WHERE u.is_active = true
      ORDER BY u.created_at
    `,
  );

  const roleUsers = new Map<Role, User>();

  for (const row of rows) {
    if (roleUsers.has(row.primary_role)) {
      continue;
    }
    roleUsers.set(row.primary_role, await hydrateUserRecord(client, row));
  }

  const fallbackUser = (role: Role): User => ({
    id: '',
    name: 'Usuario 4Shine',
    role: ROLE_LABEL[role],
    avatar: 'U',
    color: ROLE_COLOR[role],
    company: '4Shine',
    location: 'Remoto',
    stats: {},
  });

  return {
    lider: roleUsers.get('lider') ?? fallbackUser('lider'),
    mentor: roleUsers.get('mentor') ?? fallbackUser('mentor'),
    gestor: roleUsers.get('gestor') ?? fallbackUser('gestor'),
    admin: roleUsers.get('admin') ?? fallbackUser('admin'),
    invitado: roleUsers.get('invitado') ?? fallbackUser('invitado'),
  };
}

async function fetchCurrentUser(
  client: PoolClient,
  userId: string,
): Promise<User> {
  const { rows } = await client.query<UserHydrationRow>(
    `
      SELECT
        u.user_id,
        u.email,
        u.display_name,
        u.primary_role,
        u.avatar_initial,
        u.avatar_url,
        o.name AS organization_name,
        p.location,
        p.profession,
        p.industry,
        p.plan_type,
        p.bio,
        p.linkedin_url,
        p.twitter_url,
        p.website_url
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
      WHERE u.user_id = $1
        AND u.is_active = true
      LIMIT 1
    `,
    [userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Active session user not found');
  }

  return hydrateUserRecord(client, row);
}

async function fetchAvailableMentors(client: PoolClient): Promise<Mentor[]> {
  const { rows } = await client.query<{
    mentor_user_id: string;
    name: string;
    specialty: string | null;
    rating_avg: number | null;
    sector: string | null;
    availability: string[];
  }>(
    `
      SELECT
        m.mentor_user_id,
        u.display_name AS name,
        COALESCE(pil.display_name, m.specialty, 'Mentoría General') AS specialty,
        m.rating_avg,
        up.industry AS sector,
        COALESCE(
          ARRAY_AGG(TO_CHAR(ma.starts_at, 'YYYY-MM-DD"T"HH24:MI:SS') ORDER BY ma.starts_at)
          FILTER (WHERE ma.starts_at IS NOT NULL AND ma.starts_at >= now() AND ma.is_booked = false),
          ARRAY[]::text[]
        ) AS availability
      FROM app_mentoring.mentors m
      JOIN app_core.users u ON u.user_id = m.mentor_user_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN app_mentoring.mentor_specialties ms ON ms.mentor_user_id = m.mentor_user_id
      LEFT JOIN app_assessment.pillars pil ON pil.pillar_code = ms.pillar_code
      LEFT JOIN app_mentoring.mentor_availability ma ON ma.mentor_user_id = m.mentor_user_id
      GROUP BY m.mentor_user_id, u.display_name, pil.display_name, m.specialty, m.rating_avg, up.industry
      ORDER BY u.display_name
    `,
  );

  return rows.map((row, index) => ({
    id: `mentor_${index + 1}`,
    name: row.name,
    specialty: row.specialty ?? 'Mentoría General',
    rating: Number(row.rating_avg ?? 4.8),
    avatar: row.name[0]?.toUpperCase() ?? 'M',
    sector: row.sector ?? 'Liderazgo',
    availability: row.availability,
  }));
}

async function fetchMentees(client: PoolClient, userMap: Map<string, number>): Promise<Mentee[]> {
  const { rows } = await client.query<{
    user_id: string;
    name: string;
    company: string | null;
    email: string;
    location: string | null;
    industry: string | null;
    plan_type: string | null;
    seniority_level: string | null;
    progress: number;
    next_session_at: string | null;
  }>(
    `
      SELECT
        u.user_id,
        u.display_name AS name,
        o.name AS company,
        u.email,
        up.location,
        up.industry,
        up.plan_type,
        up.seniority_level,
        COALESCE(ROUND(AVG(cp.progress_percent)), 0)::int AS progress,
        (
          SELECT ms.starts_at::text
          FROM app_mentoring.session_participants sp
          JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = sp.session_id
          WHERE sp.user_id = u.user_id
            AND ms.status = 'scheduled'
            AND ms.starts_at >= now()
          ORDER BY ms.starts_at
          LIMIT 1
        ) AS next_session_at
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN app_learning.content_progress cp ON cp.user_id = u.user_id
      WHERE u.is_active = true
        AND u.primary_role = 'lider'
      GROUP BY u.user_id, u.display_name, o.name, u.email, up.location, up.industry, up.plan_type, up.seniority_level
      ORDER BY u.display_name
    `,
  );

  return rows.map((row) => {
    const progress = Number(row.progress ?? 0);
    const status: Mentee['status'] = progress >= 65 ? 'good' : progress >= 30 ? 'warning' : 'danger';
    const nextSession = row.next_session_at ? `${toEsDate(row.next_session_at)} ${toEsTime(row.next_session_at)}` : 'Pendiente';

    return {
      id: userMap.get(row.user_id) ?? 0,
      name: row.name,
      company: row.company ?? '4Shine',
      progress,
      status,
      nextSession,
      planType: readPlan(row.plan_type),
      seniority: readSeniority(row.seniority_level),
      email: row.email,
      location: row.location ?? 'Remoto',
      industry: row.industry ?? 'General',
    };
  });
}

async function fetchTimeline(client: PoolClient, userId: string): Promise<TimelineEvent[]> {
  const { rows } = await client.query<{
    title: string;
    event_type: string;
    status: string;
    planned_at: string | null;
    completed_at: string | null;
  }>(
    `
      SELECT title, event_type, status, planned_at::text, completed_at::text
      FROM app_core.trajectory_events
      WHERE user_id = $1
      ORDER BY COALESCE(planned_at, completed_at, created_at)
      LIMIT 20
    `,
    [userId],
  );

  const typeMap: Record<string, TimelineEvent['type']> = {
    test: 'test',
    mentoria: 'mentoria',
    milestone: 'milestone',
    challenge: 'milestone',
  };

  const statusMap: Record<string, TimelineEvent['status']> = {
    completed: 'completed',
    current: 'current',
    locked: 'locked',
    cancelled: 'locked',
  };

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    date: toEsDate(row.completed_at ?? row.planned_at),
    status: statusMap[row.status] ?? 'locked',
    type: typeMap[row.event_type] ?? 'milestone',
  }));
}

async function fetchContentByScope(
  client: PoolClient,
  userId: string,
  scope: 'aprendizaje' | 'metodologia' | 'formacion_mentores' | 'formacion_lideres',
  options?: { freeOnly?: boolean },
): Promise<LearningItem[]> {
  const freeOnly = options?.freeOnly ?? false;
  const { rows } = await client.query<{
    content_id: string;
    title: string;
    description: string | null;
    content_type: LearningItem['type'];
    category: string;
    duration_label: string | null;
    duration_minutes: number | null;
    is_recommended: boolean;
    thumbnail_url: string | null;
    likes: number;
    liked: boolean;
    published_at: string | null;
    url: string | null;
    seen: boolean | null;
    progress: number | null;
    author_name: string | null;
    tags: string[];
    comments: Array<{
      author: string;
      avatar: string;
      text: string;
      date: string;
      role: string;
    }>;
  }>(
    `
      SELECT
        ci.content_id,
        ci.title,
        ci.description,
        ci.content_type,
        ci.category,
        ci.duration_label,
        ci.duration_minutes,
        ci.is_recommended,
        ci.thumbnail_url,
        COALESCE(cl.likes, 0)::int AS likes,
        COALESCE(me_liked.liked, false) AS liked,
        ci.published_at::text,
        ci.url,
        cp.seen,
        cp.progress_percent::float AS progress,
        COALESCE(ci.author_name, au.display_name) AS author_name,
        COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
        COALESCE(comments.comments, ARRAY[]::json[]) AS comments
      FROM app_learning.content_items ci
      LEFT JOIN app_core.users au ON au.user_id = ci.author_user_id
      LEFT JOIN (
        SELECT content_id, COUNT(*)::int AS likes
        FROM app_learning.content_likes
        GROUP BY content_id
      ) cl ON cl.content_id = ci.content_id
      LEFT JOIN (
        SELECT content_id, true AS liked
        FROM app_learning.content_likes
        WHERE user_id = $1
      ) me_liked ON me_liked.content_id = ci.content_id
      LEFT JOIN app_learning.content_progress cp
        ON cp.content_id = ci.content_id
       AND cp.user_id = $1
      LEFT JOIN (
        SELECT ct.content_id, ARRAY_AGG(t.tag_name ORDER BY t.tag_name) AS tags
        FROM app_learning.content_tags ct
        JOIN app_learning.tags t ON t.tag_id = ct.tag_id
        GROUP BY ct.content_id
      ) tags ON tags.content_id = ci.content_id
      LEFT JOIN (
        SELECT
          cc.content_id,
          ARRAY_AGG(
            json_build_object(
              'author', u.display_name,
              'avatar', COALESCE(u.avatar_initial, SUBSTRING(u.display_name FROM 1 FOR 1)),
              'text', cc.comment_text,
              'date', cc.created_at::text,
              'role', initcap(COALESCE(u.primary_role, 'lider'))
            )
            ORDER BY cc.created_at
          ) AS comments
        FROM app_learning.content_comments cc
        JOIN app_core.users u ON u.user_id = cc.author_user_id
        GROUP BY cc.content_id
      ) comments ON comments.content_id = ci.content_id
      WHERE ci.scope = $2
        AND ci.status = 'published'
        AND (
          $3::boolean = false
          OR EXISTS (
            SELECT 1
            FROM app_learning.content_tags ct_free
            JOIN app_learning.tags t_free ON t_free.tag_id = ct_free.tag_id
            WHERE ct_free.content_id = ci.content_id
              AND LOWER(t_free.tag_name) = 'free'
          )
        )
      ORDER BY ci.published_at DESC NULLS LAST, ci.created_at DESC
      LIMIT 50
    `,
    [userId, scope, freeOnly],
  );

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    type: row.content_type,
    duration: row.duration_label ?? (row.duration_minutes ? `${row.duration_minutes} min` : '-'),
    category: row.category,
    isRecommended: row.is_recommended,
    thumbnail: row.thumbnail_url ?? undefined,
    likes: row.likes,
    liked: row.liked,
    commentsArray: (row.comments as unknown as Comment[]).map((comment, commentIndex) => ({
      id: commentIndex + 1,
      author: comment.author,
      avatar: comment.avatar,
      text: comment.text,
      date: toEsDate(comment.date),
      role: comment.role,
    })),
    date: row.published_at ? toEsDate(row.published_at) : toEsDate(new Date()),
    url: row.url ?? undefined,
    seen: row.seen ?? false,
    progress: Number(row.progress ?? 0),
    tags: row.tags,
    author: row.author_name ?? '4Shine Academy',
  }));
}

async function fetchMethodologyContent(client: PoolClient, userId: string): Promise<MethodologyResource[]> {
  const base = await fetchContentByScope(client, userId, 'metodologia');

  const categoryMap: Record<string, MethodologyResource['category']> = {
    fundamentos: 'Fundamentos',
    herramientas: 'Herramientas',
    evaluacion: 'Evaluación',
    programas: 'Programas',
    reportes: 'Reportes',
    implementacion: 'Implementación',
    casos: 'Casos',
  };

  return base.map((item) => {
    const normalized = item.category
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

    return {
      id: item.id,
      title: item.title,
      type: item.type as MethodologyResource['type'],
      category: categoryMap[normalized] ?? 'Fundamentos',
      description: item.tags?.join(', ') ?? item.title,
      url: item.url ?? '#',
      date: item.date,
      author: item.author ?? '4Shine',
      likes: item.likes,
      liked: item.liked,
      tags: item.tags ?? [],
      comments: item.commentsArray,
    };
  });
}

async function fetchMentorships(
  client: PoolClient,
  contextUserId: string,
  role: Role,
  userMap: Map<string, number>,
): Promise<MentorshipSession[]> {
  const roleFilter =
    role === 'admin' || role === 'gestor'
      ? 'TRUE'
      : role === 'mentor'
        ? 'ms.mentor_user_id = $1'
        : `EXISTS (
            SELECT 1
            FROM app_mentoring.session_participants spi
            WHERE spi.session_id = ms.session_id
              AND spi.user_id = $1
          )`;

  const mentorshipQuery = `
      SELECT
        ms.session_id,
        ms.title,
        mentor.display_name AS mentor_name,
        ms.starts_at::text,
        ms.session_type,
        ms.status,
        ms.meeting_url,
        COALESCE(
          ARRAY_AGG(
            json_build_object(
              'user_id', u.user_id,
              'name', u.display_name,
              'avatar', COALESCE(u.avatar_initial, SUBSTRING(u.display_name FROM 1 FOR 1))
            )
          ) FILTER (WHERE sp.participant_role = 'mentee'),
          ARRAY[]::json[]
        ) AS mentees,
        AVG(sf.rating)::numeric(2,1) AS rating,
        MAX(sf.feedback_text) AS feedback_text,
        MAX(spn.note_text) AS private_note
      FROM app_mentoring.mentorship_sessions ms
      JOIN app_core.users mentor ON mentor.user_id = ms.mentor_user_id
      LEFT JOIN app_mentoring.session_participants sp ON sp.session_id = ms.session_id
      LEFT JOIN app_core.users u ON u.user_id = sp.user_id
      LEFT JOIN app_mentoring.session_feedback sf ON sf.session_id = ms.session_id
      LEFT JOIN app_mentoring.session_private_notes spn ON spn.session_id = ms.session_id
      WHERE ${roleFilter}
      GROUP BY ms.session_id, mentor.display_name
      ORDER BY ms.starts_at DESC
      LIMIT 100
    `;

  const mentorshipParams = role === 'admin' || role === 'gestor' ? [] : [contextUserId];

  const { rows } = await client.query<{
    session_id: string;
    title: string;
    mentor_name: string;
    starts_at: string;
    session_type: MentorshipSession['type'];
    status: string;
    meeting_url: string | null;
    mentees: Array<{ user_id: string; name: string; avatar: string }>;
    rating: number | null;
    feedback_text: string | null;
    private_note: string | null;
  }>(mentorshipQuery, mentorshipParams);

  return rows.map((row, index) => {
    const mentees = (row.mentees as unknown as Array<{ user_id: string; name: string; avatar: string }>) ?? [];
    const firstMentee = mentees[0];

    const mappedStatus: MentorshipSession['status'] =
      row.status === 'pending_approval'
        ? 'pending_approval'
        : row.status === 'pending_rating'
          ? 'pending_rating'
          : row.status === 'completed'
            ? 'completed'
            : row.status === 'cancelled' || row.status === 'no_show'
              ? 'cancelled'
              : 'scheduled';

    return {
      id: index + 1,
      title: row.title,
      mentor: row.mentor_name,
      mentee: mentees.length > 1 ? `Grupo (${mentees.length})` : firstMentee?.name,
      menteeId: firstMentee ? userMap.get(firstMentee.user_id) : undefined,
      date: toEsDate(row.starts_at),
      time: toEsTime(row.starts_at),
      type: row.session_type,
      status: mappedStatus,
      link: row.meeting_url ?? undefined,
      joinUrl: row.meeting_url ?? undefined,
      rating: row.rating ? Number(row.rating) : undefined,
      feedback: row.feedback_text ?? undefined,
      participants: mentees.map((m) => ({ name: m.name, avatar: m.avatar })),
      privateNotes: row.private_note ?? undefined,
    };
  });
}

async function fetchNetworking(
  client: PoolClient,
  contextUserId: string,
  userMap: Map<string, number>,
): Promise<NetworkingContact[]> {
  const { rows } = await client.query<{
    user_id: string;
    name: string;
    role: Role;
    company: string | null;
    location: string | null;
    sector: string | null;
    tags: string[];
    bio: string | null;
    connection_status: 'connected' | 'pending' | null;
  }>(
    `
      SELECT
        u.user_id,
        u.display_name AS name,
        u.primary_role AS role,
        o.name AS company,
        p.location,
        p.industry AS sector,
        COALESCE(it.tags, ARRAY[]::text[]) AS tags,
        p.bio,
        c.status AS connection_status
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT ui.user_id, ARRAY_AGG(i.name ORDER BY i.name) AS tags
        FROM app_core.user_interests ui
        JOIN app_core.interests i ON i.interest_id = ui.interest_id
        GROUP BY ui.user_id
      ) it ON it.user_id = u.user_id
      LEFT JOIN app_networking.connections c
        ON (
          (c.requester_user_id = $1 AND c.addressee_user_id = u.user_id)
          OR (c.requester_user_id = u.user_id AND c.addressee_user_id = $1)
        )
      WHERE u.is_active = true
        AND u.user_id <> $1
      ORDER BY u.display_name
      LIMIT 100
    `,
    [contextUserId],
  );

  return rows.map((row) => ({
    id: userMap.get(row.user_id) ?? 0,
    name: row.name,
    role: ROLE_LABEL[row.role],
    company: row.company ?? '4Shine',
    location: row.location ?? 'Remoto',
    sector: row.sector ?? 'General',
    tags: row.tags,
    avatar: row.name[0]?.toUpperCase() ?? 'U',
    bio: row.bio ?? 'Profesional de la comunidad 4Shine.',
    experience: 8,
    status: row.connection_status ?? 'none',
  }));
}

async function fetchInterestGroups(client: PoolClient): Promise<InterestGroup[]> {
  const { rows } = await client.query<{
    group_id: string;
    name: string;
    description: string | null;
    category: string | null;
    members: number;
  }>(
    `
      SELECT
        g.group_id,
        g.name,
        g.description,
        g.category,
        COUNT(gm.user_id)::int AS members
      FROM app_networking.interest_groups g
      LEFT JOIN app_networking.group_memberships gm ON gm.group_id = g.group_id
      WHERE g.is_active = true
      GROUP BY g.group_id, g.name, g.description, g.category
      ORDER BY g.name
    `,
  );

  const colorClasses = ['bg-amber-100 text-amber-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600'];

  return rows.map((row, index) => ({
    id: index + 1,
    name: row.name,
    description: row.description ?? '',
    members: row.members,
    category: row.category ?? 'Comunidad',
    image: colorClasses[index % colorClasses.length],
  }));
}

async function fetchJobs(client: PoolClient): Promise<Job[]> {
  const { rows } = await client.query<{
    job_post_id: string;
    title: string;
    company_name: string;
    location: string | null;
    work_mode: string | null;
    description: string;
    posted_at: string;
    applicants: number;
    tags: string[];
  }>(
    `
      SELECT
        jp.job_post_id,
        jp.title,
        jp.company_name,
        jp.location,
        jp.work_mode,
        jp.description,
        jp.posted_at::text,
        COUNT(ja.application_id)::int AS applicants,
        COALESCE(ARRAY_AGG(jt.tag_name ORDER BY jt.tag_name) FILTER (WHERE jt.tag_name IS NOT NULL), ARRAY[]::text[]) AS tags
      FROM app_networking.job_posts jp
      LEFT JOIN app_networking.job_applications ja ON ja.job_post_id = jp.job_post_id
      LEFT JOIN app_networking.job_post_tags jpt ON jpt.job_post_id = jp.job_post_id
      LEFT JOIN app_networking.job_tags jt ON jt.tag_id = jpt.tag_id
      WHERE jp.is_active = true
      GROUP BY jp.job_post_id
      ORDER BY jp.posted_at DESC
      LIMIT 50
    `,
  );

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    company: row.company_name,
    location: row.location ?? 'Remoto',
    type: capitalizeFirst((row.work_mode ?? 'hibrido').replace('_', ' ')),
    description: row.description,
    postedDate: relativeDaysFrom(row.posted_at),
    applicants: row.applicants,
    tags: row.tags,
  }));
}

async function fetchChats(
  client: PoolClient,
  contextUserId: string,
  userMap: Map<string, number>,
): Promise<Chat[]> {
  const { rows } = await client.query<{
    thread_id: string;
    participant_id: string;
    last_message: string | null;
    last_message_time: string | null;
    unread: number;
  }>(
    `
      WITH my_threads AS (
        SELECT thread_id
        FROM app_networking.thread_participants
        WHERE user_id = $1
      ),
      direct_participants AS (
        SELECT
          tp.thread_id,
          tp.user_id AS participant_id
        FROM app_networking.thread_participants tp
        JOIN app_networking.chat_threads ct ON ct.thread_id = tp.thread_id
        WHERE tp.thread_id IN (SELECT thread_id FROM my_threads)
          AND tp.user_id <> $1
          AND ct.thread_type = 'direct'
      )
      SELECT
        dp.thread_id,
        dp.participant_id,
        lm.message_text AS last_message,
        lm.created_at::text AS last_message_time,
        COALESCE(
          (
            SELECT COUNT(*)::int
            FROM app_networking.messages m
            JOIN app_networking.thread_participants me ON me.thread_id = m.thread_id
            WHERE m.thread_id = dp.thread_id
              AND m.sender_user_id <> $1
              AND (me.last_read_at IS NULL OR m.created_at > me.last_read_at)
              AND me.user_id = $1
          ),
          0
        ) AS unread
      FROM direct_participants dp
      LEFT JOIN LATERAL (
        SELECT message_text, created_at
        FROM app_networking.messages
        WHERE thread_id = dp.thread_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      ORDER BY lm.created_at DESC NULLS LAST
      LIMIT 50
    `,
    [contextUserId],
  );

  const chats: Chat[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    const { rows: messages } = await client.query<{
      sender_user_id: string;
      message_text: string;
      created_at: string;
    }>(
      `
        SELECT sender_user_id, message_text, created_at::text
        FROM app_networking.messages
        WHERE thread_id = $1
        ORDER BY created_at ASC
        LIMIT 100
      `,
      [row.thread_id],
    );

    chats.push({
      id: index + 1,
      participantId: userMap.get(row.participant_id) ?? 0,
      lastMessage: row.last_message ?? 'Sin mensajes',
      lastMessageTime: row.last_message_time ? toEsTime(row.last_message_time) : '--:--',
      unread: row.unread,
      messages: messages.map((message, messageIndex) => ({
        id: messageIndex + 1,
        senderId:
          message.sender_user_id === contextUserId
            ? 'me'
            : (userMap.get(message.sender_user_id) ?? 0),
        content: message.message_text,
        timestamp: toEsDate(message.created_at),
      })),
    });
  }

  return chats;
}

async function fetchNotifications(client: PoolClient, contextUserId: string): Promise<Notification[]> {
  const { rows } = await client.query<{
    notification_id: string;
    title: string;
    message: string;
    created_at: string;
    read_at: string | null;
    notification_type: Notification['type'];
  }>(
    `
      SELECT notification_id, title, message, created_at::text, read_at::text, notification_type
      FROM app_core.notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [contextUserId],
  );

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    message: row.message,
    time: relativeDaysFrom(row.created_at),
    read: !!row.read_at,
    type: row.notification_type,
  }));
}

async function fetchQuotes(client: PoolClient): Promise<Quote[]> {
  const { rows } = await client.query<{ quote_text: string; author_name: string }>(
    `
      SELECT quote_text, author_name
      FROM app_core.quotes
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 20
    `,
  );

  return rows.map((row) => ({ text: row.quote_text, author: row.author_name.toUpperCase() }));
}

async function fetchNews(client: PoolClient): Promise<NewsUpdate[]> {
  const palette = ['bg-amber-100 text-amber-600', 'bg-blue-100 text-blue-600', 'bg-teal-100 text-teal-600'];

  const { rows } = await client.query<{
    title: string;
    category: string;
    summary: string;
    published_at: string;
    likes_count: number;
  }>(
    `
      SELECT title, category, summary, published_at::text, likes_count
      FROM app_core.news_updates
      ORDER BY published_at DESC
      LIMIT 30
    `,
  );

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    category: row.category,
    summary: row.summary,
    date: relativeDaysFrom(row.published_at),
    image: palette[index % palette.length],
    likes: row.likes_count,
  }));
}

async function fetchWorkshops(
  client: PoolClient,
  userMap: Map<string, number>,
): Promise<Workshop[]> {
  const { rows } = await client.query<{
    workshop_id: string;
    title: string;
    description: string | null;
    workshop_type: string;
    status: Workshop['status'];
    starts_at: string;
    facilitator_name: string | null;
    meeting_url: string | null;
    attendees: Array<{ user_id: string; name: string; role: Role; avatar: string }>;
  }>(
    `
      SELECT
        w.workshop_id,
        w.title,
        w.description,
        w.workshop_type,
        w.status,
        w.starts_at::text,
        COALESCE(w.facilitator_name, fu.display_name) AS facilitator_name,
        w.meeting_url,
        COALESCE(
          ARRAY_AGG(
            json_build_object(
              'user_id', au.user_id,
              'name', au.display_name,
              'role', au.primary_role,
              'avatar', COALESCE(au.avatar_initial, SUBSTRING(au.display_name FROM 1 FOR 1))
            )
          ) FILTER (WHERE au.user_id IS NOT NULL),
          ARRAY[]::json[]
        ) AS attendees
      FROM app_networking.workshops w
      LEFT JOIN app_core.users fu ON fu.user_id = w.facilitator_user_id
      LEFT JOIN app_networking.workshop_attendees wa ON wa.workshop_id = w.workshop_id
      LEFT JOIN app_core.users au ON au.user_id = wa.user_id
      GROUP BY w.workshop_id, fu.display_name
      ORDER BY w.starts_at DESC
      LIMIT 50
    `,
  );

  return rows.map((row, index) => ({
    id: index + 1,
    title: row.title,
    description: row.description ?? '',
    date: new Date(row.starts_at).toISOString().slice(0, 10),
    time: toEsTime(row.starts_at),
    type: WORKSHOP_TYPE_LABEL[row.workshop_type] ?? 'Otro',
    facilitator: row.facilitator_name ?? '4Shine Team',
    link: row.meeting_url ?? undefined,
    status: row.status,
    attendees: ((row.attendees as unknown as Array<{ user_id: string; name: string; role: Role; avatar: string }>) ?? []).map(
      (attendee) => ({
        id: userMap.get(attendee.user_id) ?? 0,
        name: attendee.name,
        avatar: attendee.avatar,
        role: attendee.role,
      }),
    ),
  }));
}

async function fetchMentorAssignments(
  client: PoolClient,
  userMap: Map<string, number>,
): Promise<MentorAssignment[]> {
  const { rows } = await client.query<{
    assignment_id: string;
    assignee_user_id: string;
    mentor_name: string;
    title: string;
    assigned_at: string;
    status: string;
    progress_percent: number;
    last_accessed_at: string | null;
  }>(
    `
      SELECT
        ca.assignment_id,
        ca.assignee_user_id,
        u.display_name AS mentor_name,
        ci.title,
        ca.assigned_at::text,
        ca.status,
        ca.progress_percent,
        ca.last_accessed_at::text
      FROM app_learning.content_assignments ca
      JOIN app_learning.content_items ci ON ci.content_id = ca.content_id
      JOIN app_core.users u ON u.user_id = ca.assignee_user_id
      WHERE ci.scope = 'formacion_mentores'
      ORDER BY ca.assigned_at DESC
      LIMIT 100
    `,
  );

  return rows.map((row, index) => ({
    id: index + 1,
    mentorId: userMap.get(row.assignee_user_id) ?? 0,
    mentorName: row.mentor_name,
    courseId: index + 101,
    courseTitle: row.title,
    assignedDate: toEsDate(row.assigned_at),
    status:
      row.status === 'completed' ? 'Completed' : row.status === 'in_progress' ? 'In Progress' : 'Not Started',
    progress: Number(row.progress_percent ?? 0),
    lastAccess: row.last_accessed_at ? toEsDate(row.last_accessed_at) : undefined,
  }));
}

export async function getBootstrapPayloadForIdentity(userId: string, role: Role): Promise<BootstrapPayload> {
  return withClient(async (client) => {
    return withRoleContext(client, userId, role, async () => {
      const userMap = await getUserNumericMap(client);
      const viewerAccess = await getViewerAccessState(client, { userId, role });

      const users = await fetchUsers(client);
      const currentUser = await fetchCurrentUser(client, userId);
      const availableMentors = await fetchAvailableMentors(client);
      const mentees = await fetchMentees(client, userMap);
      const timeline = await fetchTimeline(client, userId);
      const learningContent = await fetchContentByScope(client, userId, 'aprendizaje', {
        freeOnly: role === 'lider' && viewerAccess.freeLearningOnly,
      });
      const methodologyContent = await fetchMethodologyContent(client, userId);
      const mentorships = await fetchMentorships(client, userId, role, userMap);
      const networking = await fetchNetworking(client, userId, userMap);
      const interestGroups = await fetchInterestGroups(client);
      const jobs = await fetchJobs(client);
      const chats = await fetchChats(client, userId, userMap);
      const notifications = await fetchNotifications(client, userId);
      const quotes = await fetchQuotes(client);
      const newsUpdates = await fetchNews(client);
      const workshops = await fetchWorkshops(client, userMap);
      const mentorTraining = await fetchContentByScope(client, userId, 'formacion_mentores');
      const leaderTraining = await fetchContentByScope(client, userId, 'formacion_lideres');
      const mentorAssignments = await fetchMentorAssignments(client, userMap);

      return {
        currentUser,
        viewerAccess,
        users,
        availableMentors,
        mentees,
        learningContent,
        methodologyContent,
        mentorships,
        timeline,
        networking,
        interestGroups,
        jobs,
        chats,
        notifications,
        quotes,
        newsUpdates,
        workshops,
        mentorTraining,
        leaderTraining,
        mentorAssignments,
      };
    });
  });
}

export async function getBootstrapPayload(role: Role): Promise<BootstrapPayload> {
  const contextUserId = await withClient(async (client) => getContextUserId(client, role));
  return getBootstrapPayloadForIdentity(contextUserId, role);
}
