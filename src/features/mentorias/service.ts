import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type MentorshipSessionType = 'individual' | 'grupal';
export type MentorshipStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending_rating' | 'pending_approval' | 'no_show';

export interface MentorshipRecord {
  sessionId: string;
  title: string;
  description: string | null;
  mentorUserId: string;
  mentorName: string;
  menteeUserId: string | null;
  menteeName: string | null;
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  status: MentorshipStatus;
  meetingUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipInput {
  title: string;
  description?: string | null;
  mentorUserId?: string;
  menteeUserIds?: string[];
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  status?: MentorshipStatus;
  meetingUrl?: string | null;
}

export interface UpdateMentorshipInput {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  sessionType?: MentorshipSessionType;
  status?: MentorshipStatus;
  meetingUrl?: string | null;
}

interface MentorshipRow {
  session_id: string;
  title: string;
  description: string | null;
  mentor_user_id: string;
  mentor_name: string;
  mentee_user_id: string | null;
  mentee_name: string | null;
  starts_at: string;
  ends_at: string;
  session_type: MentorshipSessionType;
  status: MentorshipStatus;
  meeting_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: MentorshipRow): MentorshipRecord {
  return {
    sessionId: row.session_id,
    title: row.title,
    description: row.description,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name,
    menteeUserId: row.mentee_user_id,
    menteeName: row.mentee_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    sessionType: row.session_type,
    status: row.status,
    meetingUrl: row.meeting_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT
    ms.session_id::text,
    ms.title,
    ms.description,
    ms.mentor_user_id::text,
    mentor.display_name AS mentor_name,
    mentee.mentee_user_id,
    mentee.mentee_name,
    ms.starts_at::text,
    ms.ends_at::text,
    ms.session_type,
    ms.status,
    ms.meeting_url,
    ms.created_by::text,
    ms.created_at::text,
    ms.updated_at::text
  FROM app_mentoring.mentorship_sessions ms
  JOIN app_core.users mentor ON mentor.user_id = ms.mentor_user_id
  LEFT JOIN LATERAL (
    SELECT
      sp.user_id::text AS mentee_user_id,
      u.display_name AS mentee_name
    FROM app_mentoring.session_participants sp
    JOIN app_core.users u ON u.user_id = sp.user_id
    WHERE sp.session_id = ms.session_id
      AND sp.participant_role = 'mentee'
    ORDER BY u.display_name
    LIMIT 1
  ) mentee ON true
`;

async function ensureMentor(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    `
      INSERT INTO app_mentoring.mentors (mentor_user_id)
      VALUES ($1)
      ON CONFLICT (mentor_user_id) DO NOTHING
    `,
    [userId],
  );
}

async function getSession(client: PoolClient, sessionId: string): Promise<MentorshipRecord> {
  const { rows } = await client.query<MentorshipRow>(
    `${BASE_SELECT}
     WHERE ms.session_id = $1
     LIMIT 1`,
    [sessionId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Mentorship session not found');
  }

  return mapRow(row);
}

export async function listMentorships(client: PoolClient, limit = 100): Promise<MentorshipRecord[]> {
  const { rows } = await client.query<MentorshipRow>(
    `${BASE_SELECT}
     ORDER BY ms.starts_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function createMentorship(
  client: PoolClient,
  actor: AuthUser,
  input: CreateMentorshipInput,
): Promise<MentorshipRecord> {
  await requireModulePermission(client, 'mentorias', 'create');

  const mentorUserId = input.mentorUserId ?? actor.userId;
  const status = input.status ?? 'scheduled';

  await ensureMentor(client, mentorUserId);

  const { rows } = await client.query<{ session_id: string }>(
    `
      INSERT INTO app_mentoring.mentorship_sessions (
        mentor_user_id,
        title,
        description,
        starts_at,
        ends_at,
        session_type,
        status,
        meeting_url,
        created_by
      )
      VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7, $8, $9)
      RETURNING session_id::text
    `,
    [
      mentorUserId,
      input.title,
      input.description ?? null,
      input.startsAt,
      input.endsAt,
      input.sessionType,
      status,
      input.meetingUrl ?? null,
      actor.userId,
    ],
  );

  const sessionId = rows[0]?.session_id;
  if (!sessionId) {
    throw new Error('Failed to create mentorship session');
  }

  await client.query(
    `
      INSERT INTO app_mentoring.session_participants (session_id, user_id, participant_role)
      VALUES ($1, $2, 'mentor')
      ON CONFLICT (session_id, user_id) DO UPDATE
      SET participant_role = EXCLUDED.participant_role
    `,
    [sessionId, mentorUserId],
  );

  for (const menteeUserId of input.menteeUserIds ?? []) {
    await client.query(
      `
        INSERT INTO app_mentoring.session_participants (session_id, user_id, participant_role)
        VALUES ($1, $2, 'mentee')
        ON CONFLICT (session_id, user_id) DO UPDATE
        SET participant_role = EXCLUDED.participant_role
      `,
      [sessionId, menteeUserId],
    );
  }

  return getSession(client, sessionId);
}

export async function updateMentorship(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
  input: UpdateMentorshipInput,
): Promise<MentorshipRecord> {
  await requireModulePermission(client, 'mentorias', 'update');

  const { rowCount } = await client.query(
    `
      UPDATE app_mentoring.mentorship_sessions
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        starts_at = COALESCE($4::timestamptz, starts_at),
        ends_at = COALESCE($5::timestamptz, ends_at),
        session_type = COALESCE($6, session_type),
        status = COALESCE($7, status),
        meeting_url = COALESCE($8, meeting_url),
        approved_by = CASE WHEN $7 = 'pending_approval' THEN approved_by ELSE $9 END,
        approved_at = CASE WHEN $7 = 'pending_approval' THEN approved_at ELSE now() END,
        updated_at = now()
      WHERE session_id = $1
    `,
    [
      sessionId,
      input.title ?? null,
      input.description ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.sessionType ?? null,
      input.status ?? null,
      input.meetingUrl ?? null,
      actor.userId,
    ],
  );

  if (!rowCount) {
    throw new Error('Mentorship session not found');
  }

  return getSession(client, sessionId);
}

export async function deleteMentorship(client: PoolClient, sessionId: string): Promise<{ sessionId: string }> {
  await requireModulePermission(client, 'mentorias', 'delete');

  const { rows } = await client.query<{ session_id: string }>(
    `
      DELETE FROM app_mentoring.mentorship_sessions
      WHERE session_id = $1
      RETURNING session_id::text
    `,
    [sessionId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Mentorship session not found');
  }

  return {
    sessionId: deleted.session_id,
  };
}
