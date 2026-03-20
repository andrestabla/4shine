import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type WorkshopType = 'relacionamiento' | 'formacion' | 'innovacion' | 'wellbeing' | 'otro';
export type WorkshopStatus = 'upcoming' | 'completed' | 'cancelled';

export interface WorkshopRecord {
  workshopId: string;
  title: string;
  description: string | null;
  workshopType: WorkshopType;
  status: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId: string | null;
  facilitatorName: string | null;
  meetingUrl: string | null;
  attendees: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string | null;
  workshopType: WorkshopType;
  status?: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

export interface UpdateWorkshopInput {
  title?: string;
  description?: string | null;
  workshopType?: WorkshopType;
  status?: WorkshopStatus;
  startsAt?: string;
  endsAt?: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

interface WorkshopRow {
  workshop_id: string;
  title: string;
  description: string | null;
  workshop_type: WorkshopType;
  status: WorkshopStatus;
  starts_at: string;
  ends_at: string;
  facilitator_user_id: string | null;
  facilitator_name: string | null;
  meeting_url: string | null;
  attendees: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: WorkshopRow): WorkshopRecord {
  return {
    workshopId: row.workshop_id,
    title: row.title,
    description: row.description,
    workshopType: row.workshop_type,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    facilitatorUserId: row.facilitator_user_id,
    facilitatorName: row.facilitator_name,
    meetingUrl: row.meeting_url,
    attendees: Number(row.attendees ?? 0),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT
    w.workshop_id::text,
    w.title,
    w.description,
    w.workshop_type,
    w.status,
    w.starts_at::text,
    w.ends_at::text,
    w.facilitator_user_id::text,
    w.facilitator_name,
    w.meeting_url,
    COUNT(wa.user_id)::int AS attendees,
    w.created_by::text,
    w.created_at::text,
    w.updated_at::text
  FROM app_networking.workshops w
  LEFT JOIN app_networking.workshop_attendees wa ON wa.workshop_id = w.workshop_id
`;

export async function listWorkshops(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<WorkshopRecord[]> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<WorkshopRow>(
    `${BASE_SELECT}
     GROUP BY w.workshop_id
     ORDER BY w.starts_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function createWorkshop(
  client: PoolClient,
  actor: AuthUser,
  input: CreateWorkshopInput,
): Promise<WorkshopRecord> {
  await requireModulePermission(client, 'workshops', 'create');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<{ workshop_id: string }>(
    `
      INSERT INTO app_networking.workshops (
        title,
        description,
        workshop_type,
        status,
        starts_at,
        ends_at,
        facilitator_user_id,
        facilitator_name,
        meeting_url,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9, $10)
      RETURNING workshop_id::text
    `,
    [
      input.title,
      input.description ?? null,
      input.workshopType,
      input.status ?? 'upcoming',
      input.startsAt,
      input.endsAt,
      input.facilitatorUserId ?? null,
      input.facilitatorName ?? null,
      input.meetingUrl ?? null,
      actor.userId,
    ],
  );

  const workshopId = rows[0]?.workshop_id;
  if (!workshopId) {
    throw new Error('Failed to create workshop');
  }

  const all = await listWorkshops(client, actor, 500);
  const workshop = all.find((item) => item.workshopId === workshopId);
  if (!workshop) {
    throw new Error('Created workshop not found');
  }

  return workshop;
}

export async function updateWorkshop(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
  input: UpdateWorkshopInput,
): Promise<WorkshopRecord> {
  await requireModulePermission(client, 'workshops', 'update');
  await requireCommunityAccess(client, actor, 'Workshops');
  const { rowCount } = await client.query(
    `
      UPDATE app_networking.workshops
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        workshop_type = COALESCE($4, workshop_type),
        status = COALESCE($5, status),
        starts_at = COALESCE($6::timestamptz, starts_at),
        ends_at = COALESCE($7::timestamptz, ends_at),
        facilitator_user_id = COALESCE($8, facilitator_user_id),
        facilitator_name = COALESCE($9, facilitator_name),
        meeting_url = COALESCE($10, meeting_url),
        updated_at = now()
      WHERE workshop_id = $1
    `,
    [
      workshopId,
      input.title ?? null,
      input.description ?? null,
      input.workshopType ?? null,
      input.status ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.facilitatorUserId ?? null,
      input.facilitatorName ?? null,
      input.meetingUrl ?? null,
    ],
  );

  if (!rowCount) {
    throw new Error('Workshop not found');
  }

  const all = await listWorkshops(client, actor, 500);
  const workshop = all.find((item) => item.workshopId === workshopId);
  if (!workshop) {
    throw new Error('Workshop not found');
  }

  return workshop;
}

export async function deleteWorkshop(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<{ workshopId: string }> {
  await requireModulePermission(client, 'workshops', 'delete');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<{ workshop_id: string }>(
    `
      DELETE FROM app_networking.workshops
      WHERE workshop_id = $1
      RETURNING workshop_id::text
    `,
    [workshopId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Workshop not found');
  }

  return {
    workshopId: deleted.workshop_id,
  };
}
