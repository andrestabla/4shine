import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type WorkshopType = 'relacionamiento' | 'formacion' | 'innovacion' | 'wellbeing' | 'otro';
export type WorkshopStatus = 'upcoming' | 'completed' | 'cancelled';
export type AttendanceStatus = 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled';

export interface AgendaItem {
  time: string;
  title: string;
  description?: string;
}

export interface Speaker {
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
}

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
  myAttendanceStatus: AttendanceStatus | null;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationPhotos: string[];
  price: number | null;
  currency: string;
  maxAttendees: number | null;
  agenda: AgendaItem[];
  speakers: Speaker[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopFaqRecord {
  faqId: string;
  workshopId: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface WorkshopForumPostRecord {
  postId: string;
  workshopId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
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
  locationName?: string | null;
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPhotos?: string[];
  price?: number | null;
  currency?: string;
  maxAttendees?: number | null;
  agenda?: AgendaItem[];
  speakers?: Speaker[];
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
  locationName?: string | null;
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPhotos?: string[];
  price?: number | null;
  currency?: string;
  maxAttendees?: number | null;
  agenda?: AgendaItem[];
  speakers?: Speaker[];
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  sortOrder?: number;
}

// ── Internal row types ─────────────────────────────────────────────────────────

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
  my_attendance_status: AttendanceStatus | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: string | null;
  location_lng: string | null;
  location_photos: string[] | null;
  price: string | null;
  currency: string;
  max_attendees: number | null;
  agenda: AgendaItem[] | null;
  speakers: Speaker[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ForumRow {
  post_id: string;
  workshop_id: string;
  author_user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
}

interface FaqRow {
  faq_id: string;
  workshop_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

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
    myAttendanceStatus: row.my_attendance_status ?? null,
    locationName: row.location_name,
    locationAddress: row.location_address,
    locationLat: row.location_lat !== null ? Number(row.location_lat) : null,
    locationLng: row.location_lng !== null ? Number(row.location_lng) : null,
    locationPhotos: row.location_photos ?? [],
    price: row.price !== null ? Number(row.price) : null,
    currency: row.currency ?? 'USD',
    maxAttendees: row.max_attendees ?? null,
    agenda: row.agenda ?? [],
    speakers: row.speakers ?? [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapForum(row: ForumRow): WorkshopForumPostRecord {
  return {
    postId: row.post_id,
    workshopId: row.workshop_id,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapFaq(row: FaqRow): WorkshopFaqRecord {
  return {
    faqId: row.faq_id,
    workshopId: row.workshop_id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
  };
}

// ── Shared SELECT fragment ────────────────────────────────────────────────────

const WORKSHOP_SELECT = `
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
    my_reg.attendance_status AS my_attendance_status,
    w.location_name,
    w.location_address,
    w.location_lat::text AS location_lat,
    w.location_lng::text AS location_lng,
    w.location_photos,
    w.price::text AS price,
    w.currency,
    w.max_attendees,
    w.agenda,
    w.speakers,
    w.created_by::text,
    w.created_at::text,
    w.updated_at::text
  FROM app_networking.workshops w
  LEFT JOIN app_networking.workshop_attendees wa
    ON wa.workshop_id = w.workshop_id
  LEFT JOIN app_networking.workshop_attendees my_reg
    ON my_reg.workshop_id = w.workshop_id AND my_reg.user_id = $1::uuid
`;

// ── Workshops CRUD ────────────────────────────────────────────────────────────

export async function listWorkshops(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<WorkshopRecord[]> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<WorkshopRow>(
    `${WORKSHOP_SELECT}
     GROUP BY w.workshop_id, my_reg.attendance_status
     ORDER BY w.starts_at DESC
     LIMIT $2`,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function getWorkshop(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<WorkshopRecord> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<WorkshopRow>(
    `${WORKSHOP_SELECT}
     WHERE w.workshop_id = $2::uuid
     GROUP BY w.workshop_id, my_reg.attendance_status`,
    [actor.userId, workshopId],
  );

  const row = rows[0];
  if (!row) throw new Error('Workshop not found');
  return mapRow(row);
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
        title, description, workshop_type, status,
        starts_at, ends_at, facilitator_user_id, facilitator_name, meeting_url,
        location_name, location_address, location_lat, location_lng, location_photos,
        price, currency, max_attendees, agenda, speakers,
        created_by
      )
      VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18::jsonb, $19::jsonb,
        $20
      )
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
      input.locationName ?? null,
      input.locationAddress ?? null,
      input.locationLat ?? null,
      input.locationLng ?? null,
      input.locationPhotos ?? [],
      input.price ?? null,
      input.currency ?? 'USD',
      input.maxAttendees ?? null,
      JSON.stringify(input.agenda ?? []),
      JSON.stringify(input.speakers ?? []),
      actor.userId,
    ],
  );

  const workshopId = rows[0]?.workshop_id;
  if (!workshopId) throw new Error('Failed to create workshop');
  return getWorkshop(client, actor, workshopId);
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
        title               = COALESCE($2, title),
        description         = COALESCE($3, description),
        workshop_type       = COALESCE($4, workshop_type),
        status              = COALESCE($5, status),
        starts_at           = COALESCE($6::timestamptz, starts_at),
        ends_at             = COALESCE($7::timestamptz, ends_at),
        facilitator_user_id = COALESCE($8, facilitator_user_id),
        facilitator_name    = COALESCE($9, facilitator_name),
        meeting_url         = COALESCE($10, meeting_url),
        location_name       = $11,
        location_address    = $12,
        location_lat        = $13,
        location_lng        = $14,
        location_photos     = COALESCE($15, location_photos),
        price               = $16,
        currency            = COALESCE($17, currency),
        max_attendees       = $18,
        agenda              = COALESCE($19::jsonb, agenda),
        speakers            = COALESCE($20::jsonb, speakers),
        updated_at          = now()
      WHERE workshop_id = $1
    `,
    [
      workshopId,
      input.title ?? null,
      input.description !== undefined ? input.description : null,
      input.workshopType ?? null,
      input.status ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.facilitatorUserId !== undefined ? input.facilitatorUserId : null,
      input.facilitatorName !== undefined ? input.facilitatorName : null,
      input.meetingUrl !== undefined ? input.meetingUrl : null,
      input.locationName !== undefined ? input.locationName : null,
      input.locationAddress !== undefined ? input.locationAddress : null,
      input.locationLat !== undefined ? input.locationLat : null,
      input.locationLng !== undefined ? input.locationLng : null,
      input.locationPhotos !== undefined ? input.locationPhotos : null,
      input.price !== undefined ? input.price : null,
      input.currency ?? null,
      input.maxAttendees !== undefined ? input.maxAttendees : null,
      input.agenda !== undefined ? JSON.stringify(input.agenda) : null,
      input.speakers !== undefined ? JSON.stringify(input.speakers) : null,
    ],
  );

  if (!rowCount) throw new Error('Workshop not found');
  return getWorkshop(client, actor, workshopId);
}

export async function deleteWorkshop(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<{ workshopId: string }> {
  await requireModulePermission(client, 'workshops', 'delete');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<{ workshop_id: string }>(
    `DELETE FROM app_networking.workshops WHERE workshop_id = $1 RETURNING workshop_id::text`,
    [workshopId],
  );

  if (!rows[0]) throw new Error('Workshop not found');
  return { workshopId: rows[0].workshop_id };
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function applyToWorkshop(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<WorkshopRecord> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows: check } = await client.query<{ status: WorkshopStatus }>(
    `SELECT status FROM app_networking.workshops WHERE workshop_id = $1`,
    [workshopId],
  );
  if (!check[0]) throw new Error('Workshop not found');
  if (check[0].status !== 'upcoming') throw new Error('Solo puedes inscribirte a workshops próximos');

  await client.query(
    `
      INSERT INTO app_networking.workshop_attendees (workshop_id, user_id, attendance_status)
      VALUES ($1, $2, 'registered')
      ON CONFLICT (workshop_id, user_id) DO UPDATE SET attendance_status = 'registered'
    `,
    [workshopId, actor.userId],
  );

  return getWorkshop(client, actor, workshopId);
}

export async function cancelApplication(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<WorkshopRecord> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  await client.query(
    `DELETE FROM app_networking.workshop_attendees WHERE workshop_id = $1 AND user_id = $2`,
    [workshopId, actor.userId],
  );

  return getWorkshop(client, actor, workshopId);
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

export async function listFaqs(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<WorkshopFaqRecord[]> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<FaqRow>(
    `SELECT faq_id::text, workshop_id::text, question, answer, sort_order
     FROM app_networking.workshop_faqs
     WHERE workshop_id = $1
     ORDER BY sort_order, created_at`,
    [workshopId],
  );

  return rows.map(mapFaq);
}

export async function createFaq(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
  input: CreateFaqInput,
): Promise<WorkshopFaqRecord> {
  await requireModulePermission(client, 'workshops', 'manage');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<FaqRow>(
    `
      INSERT INTO app_networking.workshop_faqs (workshop_id, question, answer, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING faq_id::text, workshop_id::text, question, answer, sort_order
    `,
    [workshopId, input.question, input.answer, input.sortOrder ?? 0],
  );

  return mapFaq(rows[0]!);
}

export async function deleteFaq(
  client: PoolClient,
  actor: AuthUser,
  faqId: string,
): Promise<{ faqId: string }> {
  await requireModulePermission(client, 'workshops', 'manage');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<{ faq_id: string }>(
    `DELETE FROM app_networking.workshop_faqs WHERE faq_id = $1 RETURNING faq_id::text`,
    [faqId],
  );

  if (!rows[0]) throw new Error('FAQ not found');
  return { faqId: rows[0].faq_id };
}

// ── Forum ─────────────────────────────────────────────────────────────────────

export async function listForumPosts(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<WorkshopForumPostRecord[]> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<ForumRow>(
    `
      SELECT
        fp.post_id::text,
        fp.workshop_id::text,
        fp.author_user_id::text,
        u.display_name AS author_name,
        u.avatar_url   AS author_avatar_url,
        fp.body,
        fp.created_at::text
      FROM app_networking.workshop_forum_posts fp
      JOIN app_core.users u ON u.user_id = fp.author_user_id
      WHERE fp.workshop_id = $1
      ORDER BY fp.created_at ASC
    `,
    [workshopId],
  );

  return rows.map(mapForum);
}

export async function createForumPost(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
  body: string,
): Promise<WorkshopForumPostRecord> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  const { rows } = await client.query<ForumRow>(
    `
      INSERT INTO app_networking.workshop_forum_posts (workshop_id, author_user_id, body)
      SELECT $1, $2, $3
      RETURNING
        post_id::text,
        workshop_id::text,
        author_user_id::text,
        (SELECT display_name FROM app_core.users WHERE user_id = author_user_id) AS author_name,
        (SELECT avatar_url   FROM app_core.users WHERE user_id = author_user_id) AS author_avatar_url,
        body,
        created_at::text
    `,
    [workshopId, actor.userId, body],
  );

  if (!rows[0]) throw new Error('Failed to create post');
  return mapForum(rows[0]);
}

export async function deleteForumPost(
  client: PoolClient,
  actor: AuthUser,
  postId: string,
): Promise<{ postId: string }> {
  await requireModulePermission(client, 'workshops', 'view');
  await requireCommunityAccess(client, actor, 'Workshops');

  // Authors can delete their own; moderators/admins can delete any
  const canModerate = ['gestor', 'admin'].includes(actor.role);
  const condition = canModerate
    ? `post_id = $1`
    : `post_id = $1 AND author_user_id = $2`;
  const params = canModerate ? [postId] : [postId, actor.userId];

  const { rows } = await client.query<{ post_id: string }>(
    `DELETE FROM app_networking.workshop_forum_posts WHERE ${condition} RETURNING post_id::text`,
    params,
  );

  if (!rows[0]) throw new Error('Post not found or access denied');
  return { postId: rows[0].post_id };
}
