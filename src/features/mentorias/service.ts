import type { PoolClient } from 'pg';
import { getViewerAccessState, requireProgramSubscriptionAccess } from '@/features/access/service';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type MentorshipSessionType = 'individual' | 'grupal';
export type MentorshipStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'pending_rating'
  | 'pending_approval'
  | 'no_show';
export type MentorshipSessionOrigin = 'manual' | 'program_included' | 'additional_paid';
export type ProgramMentorshipStatus = 'available' | 'scheduled' | 'completed';
export type AdditionalMentorshipOrderStatus =
  | 'pending_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled';
export type GroupSessionParticipationStatus = 'interested' | 'joined' | 'declined';
export type GroupSessionReaction = 'like' | 'celebrate' | 'insightful' | 'love';

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
  sessionOrigin: MentorshipSessionOrigin;
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
  sessionOrigin?: MentorshipSessionOrigin;
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

export interface ProgramMentorshipEntitlementRecord {
  entitlementId: string;
  templateCode: string;
  sequenceNo: number;
  title: string;
  description: string | null;
  phaseCode: string;
  workbookCode: string | null;
  suggestedWeek: number;
  defaultDurationMinutes: number;
  status: ProgramMentorshipStatus;
  scheduledSessionId: string | null;
  scheduledStartsAt: string | null;
  scheduledEndsAt: string | null;
  mentorUserId: string | null;
  mentorName: string | null;
}

export interface MentorOfferingRecord {
  offerId: string;
  offerCode: string;
  title: string;
  description: string | null;
  sessionType: MentorshipSessionType;
  durationMinutes: number;
  priceAmount: number;
  currencyCode: string;
  isActive: boolean;
}

export interface MentorAvailabilitySlot {
  startsAt: string;
  endsAt: string;
}

export interface MentorCatalogRecord {
  mentorUserId: string;
  name: string;
  specialty: string;
  sector: string;
  ratingAvg: number;
  ratingCount: number;
  avatarInitial: string;
  availability: MentorAvailabilitySlot[];
  offers: MentorOfferingRecord[];
}

export interface AdditionalMentorshipOrderRecord {
  orderId: string;
  ownerUserId: string;
  mentorUserId: string;
  mentorName: string;
  offerId: string | null;
  offerTitle: string | null;
  title: string;
  topic: string | null;
  notes: string | null;
  status: AdditionalMentorshipOrderStatus;
  priceAmount: number;
  currencyCode: string;
  scheduledSessionId: string | null;
  scheduledStartsAt: string | null;
  scheduledEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipOverviewRecord {
  sessions: MentorshipRecord[];
  programEntitlements: ProgramMentorshipEntitlementRecord[];
  mentorCatalog: MentorCatalogRecord[];
  additionalOrders: AdditionalMentorshipOrderRecord[];
  groupSessions: GroupSessionEventRecord[];
  groupSessionRecordings: GroupSessionRecordingRecord[];
}

export interface GroupSessionEventRecord {
  eventId: string;
  sessionId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  meetingUrl: string | null;
  zoomJoinUrl: string | null;
  zoomHostUrl: string | null;
  hostUserId: string | null;
  hostName: string | null;
  externalExpertName: string | null;
  externalExpertBio: string | null;
  participationStatus: GroupSessionParticipationStatus | null;
  participantCount: number;
  intentCount: number;
}

export interface GroupSessionRecordingCommentRecord {
  commentId: string;
  userId: string;
  authorName: string;
  commentText: string;
  createdAt: string;
}

export interface GroupSessionRecordingRecord {
  recordingId: string;
  eventId: string;
  eventTitle: string;
  hostName: string | null;
  title: string;
  description: string | null;
  recordingUrl: string;
  thumbnailUrl: string | null;
  durationMinutes: number;
  recordedAt: string | null;
  publishedAt: string | null;
  reactionTotals: Record<GroupSessionReaction, number>;
  myReaction: GroupSessionReaction | null;
  comments: GroupSessionRecordingCommentRecord[];
}

export interface ScheduleProgramMentorshipInput {
  entitlementId: string;
  mentorUserId: string;
  startsAt: string;
  meetingUrl?: string | null;
  note?: string | null;
}

export interface CreateAdditionalMentorshipOrderInput {
  offerId: string;
  startsAt: string;
  topic?: string | null;
  note?: string | null;
  meetingUrl?: string | null;
}

export interface CreateGroupSessionInput {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  zoomJoinUrl?: string | null;
  zoomHostUrl?: string | null;
  hostUserId?: string | null;
  externalExpertName?: string | null;
  externalExpertBio?: string | null;
}

export interface UpdateGroupSessionInput {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  zoomJoinUrl?: string | null;
  zoomHostUrl?: string | null;
  hostUserId?: string | null;
  externalExpertName?: string | null;
  externalExpertBio?: string | null;
  status?: MentorshipStatus;
}

export interface ParticipateGroupSessionInput {
  status: GroupSessionParticipationStatus;
}

export interface CreateGroupSessionRecordingInput {
  eventId: string;
  title: string;
  description?: string | null;
  recordingUrl: string;
  thumbnailUrl?: string | null;
  durationMinutes?: number;
  recordedAt?: string | null;
}

export interface InviteGroupSessionByRolesInput {
  eventId: string;
  roleCodes: Array<'lider' | 'mentor' | 'gestor' | 'admin'>;
}

export interface GroupSessionAnalyticsRecord {
  eventId: string;
  title: string;
  startsAt: string;
  interestedCount: number;
  joinedCount: number;
  declinedCount: number;
  hostName: string | null;
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
  session_origin: MentorshipSessionOrigin;
}

interface ProgramEntitlementRow {
  entitlement_id: string;
  template_code: string;
  sequence_no: number;
  title: string;
  description: string | null;
  phase_code: string;
  workbook_code: string | null;
  suggested_week: number;
  default_duration_minutes: number;
  stored_status: ProgramMentorshipStatus;
  scheduled_session_id: string | null;
  scheduled_starts_at: string | null;
  scheduled_ends_at: string | null;
  scheduled_session_status: MentorshipStatus | null;
  mentor_user_id: string | null;
  mentor_name: string | null;
}

interface MentorCatalogRow {
  mentor_user_id: string;
  name: string;
  specialty: string | null;
  sector: string | null;
  rating_avg: string | number | null;
  rating_count: number | null;
  avatar_initial: string | null;
  availability: unknown;
  offers: unknown;
}

interface AdditionalOrderRow {
  order_id: string;
  owner_user_id: string;
  mentor_user_id: string;
  mentor_name: string;
  offer_id: string | null;
  offer_title: string | null;
  title: string;
  topic: string | null;
  notes: string | null;
  status: AdditionalMentorshipOrderStatus;
  price_amount: string | number;
  currency_code: string;
  scheduled_session_id: string | null;
  scheduled_starts_at: string | null;
  scheduled_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MentorOfferingRow {
  offer_id: string;
  mentor_user_id: string;
  offer_code: string;
  title: string;
  description: string | null;
  session_type: MentorshipSessionType;
  duration_minutes: number;
  price_amount: string | number;
  currency_code: string;
  is_active: boolean;
}

interface GroupSessionEventRow {
  event_id: string;
  session_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  zoom_join_url: string | null;
  zoom_host_url: string | null;
  host_user_id: string | null;
  host_name: string | null;
  external_expert_name: string | null;
  external_expert_bio: string | null;
  participation_status: GroupSessionParticipationStatus | null;
  participant_count: number | null;
  intent_count: number | null;
}

interface GroupSessionRecordingRow {
  recording_id: string;
  event_id: string;
  event_title: string;
  host_name: string | null;
  title: string;
  description: string | null;
  recording_url: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  recorded_at: string | null;
  published_at: string | null;
  my_reaction: GroupSessionReaction | null;
  reaction_like: number | null;
  reaction_celebrate: number | null;
  reaction_insightful: number | null;
  reaction_love: number | null;
}

interface GroupSessionRecordingCommentRow {
  comment_id: string;
  recording_id: string;
  user_id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

interface SessionInsertOptions {
  mentorUserId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  status: MentorshipStatus;
  meetingUrl?: string | null;
  menteeUserIds?: string[];
  sessionOrigin: MentorshipSessionOrigin;
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
    sessionOrigin: row.session_origin,
  };
}

function mapProgramEntitlement(row: ProgramEntitlementRow): ProgramMentorshipEntitlementRecord {
  const derivedStatus: ProgramMentorshipStatus =
    row.scheduled_session_status === 'completed'
      ? 'completed'
      : row.scheduled_session_status && row.scheduled_session_status !== 'cancelled' && row.scheduled_session_status !== 'no_show'
        ? 'scheduled'
        : row.stored_status;

  return {
    entitlementId: row.entitlement_id,
    templateCode: row.template_code,
    sequenceNo: Number(row.sequence_no),
    title: row.title,
    description: row.description,
    phaseCode: row.phase_code,
    workbookCode: row.workbook_code,
    suggestedWeek: Number(row.suggested_week),
    defaultDurationMinutes: Number(row.default_duration_minutes),
    status: derivedStatus,
    scheduledSessionId: row.scheduled_session_id,
    scheduledStartsAt: row.scheduled_starts_at,
    scheduledEndsAt: row.scheduled_ends_at,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name,
  };
}

function mapAdditionalOrder(row: AdditionalOrderRow): AdditionalMentorshipOrderRecord {
  return {
    orderId: row.order_id,
    ownerUserId: row.owner_user_id,
    mentorUserId: row.mentor_user_id,
    mentorName: row.mentor_name,
    offerId: row.offer_id,
    offerTitle: row.offer_title,
    title: row.title,
    topic: row.topic,
    notes: row.notes,
    status: row.status,
    priceAmount: Number(row.price_amount ?? 0),
    currencyCode: row.currency_code,
    scheduledSessionId: row.scheduled_session_id,
    scheduledStartsAt: row.scheduled_starts_at,
    scheduledEndsAt: row.scheduled_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGroupSessionEvent(row: GroupSessionEventRow): GroupSessionEventRecord {
  return {
    eventId: row.event_id,
    sessionId: row.session_id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    meetingUrl: row.meeting_url,
    zoomJoinUrl: row.zoom_join_url,
    zoomHostUrl: row.zoom_host_url,
    hostUserId: row.host_user_id,
    hostName: row.host_name,
    externalExpertName: row.external_expert_name,
    externalExpertBio: row.external_expert_bio,
    participationStatus: row.participation_status,
    participantCount: Number(row.participant_count ?? 0),
    intentCount: Number(row.intent_count ?? 0),
  };
}

function emptyReactionTotals(): Record<GroupSessionReaction, number> {
  return {
    like: 0,
    celebrate: 0,
    insightful: 0,
    love: 0,
  };
}

function parseAvailability(value: unknown): MentorAvailabilitySlot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const slot = item as Record<string, unknown>;
      const startsAt = typeof slot.startsAt === 'string' ? slot.startsAt : null;
      const endsAt = typeof slot.endsAt === 'string' ? slot.endsAt : null;

      if (!startsAt || !endsAt) {
        return null;
      }

      return { startsAt, endsAt };
    })
    .filter(Boolean) as MentorAvailabilitySlot[];
}

function parseOffers(value: unknown): MentorOfferingRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const offer = item as Record<string, unknown>;
      const offerId = typeof offer.offerId === 'string' ? offer.offerId : null;
      const offerCode = typeof offer.offerCode === 'string' ? offer.offerCode : null;
      const title = typeof offer.title === 'string' ? offer.title : null;
      const sessionType =
        offer.sessionType === 'grupal' ? 'grupal' : offer.sessionType === 'individual' ? 'individual' : null;

      if (!offerId || !offerCode || !title || !sessionType) {
        return null;
      }

      return {
        offerId,
        offerCode,
        title,
        description: typeof offer.description === 'string' ? offer.description : null,
        sessionType,
        durationMinutes: Number(offer.durationMinutes ?? 60),
        priceAmount: Number(offer.priceAmount ?? 0),
        currencyCode: typeof offer.currencyCode === 'string' ? offer.currencyCode : 'COP',
        isActive: Boolean(offer.isActive ?? true),
      } satisfies MentorOfferingRecord;
    })
    .filter(Boolean) as MentorOfferingRecord[];
}

function mapMentorCatalog(row: MentorCatalogRow): MentorCatalogRecord {
  return {
    mentorUserId: row.mentor_user_id,
    name: row.name,
    specialty: row.specialty ?? 'Mentoría ejecutiva',
    sector: row.sector ?? 'Liderazgo',
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    avatarInitial: row.avatar_initial ?? row.name.charAt(0).toUpperCase() ?? 'I',
    availability: parseAvailability(row.availability),
    offers: parseOffers(row.offers),
  };
}

function addMinutes(value: string, minutes: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid schedule date');
  }

  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function assertLeaderActor(actor: AuthUser): void {
  if (actor.role !== 'lider') {
    throw new Error('This action is only available for leaders');
  }
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
    ms.updated_at::text,
    ms.session_origin
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

async function createSessionWithParticipants(
  client: PoolClient,
  actor: AuthUser,
  input: SessionInsertOptions,
): Promise<MentorshipRecord> {
  await ensureMentor(client, input.mentorUserId);

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
        created_by,
        session_origin
      )
      VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, $6, $7, $8, $9, $10)
      RETURNING session_id::text
    `,
    [
      input.mentorUserId,
      input.title,
      input.description ?? null,
      input.startsAt,
      input.endsAt,
      input.sessionType,
      input.status,
      input.meetingUrl ?? null,
      actor.userId,
      input.sessionOrigin,
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
    [sessionId, input.mentorUserId],
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

async function getProgramEntitlement(
  client: PoolClient,
  entitlementId: string,
  ownerUserId: string,
): Promise<ProgramMentorshipEntitlementRecord> {
  const { rows } = await client.query<ProgramEntitlementRow>(
    `
      SELECT
        upm.entitlement_id::text,
        upm.template_code,
        pt.sequence_no,
        pt.title,
        pt.description,
        pt.phase_code,
        pt.workbook_code,
        pt.suggested_week,
        pt.default_duration_minutes,
        upm.status AS stored_status,
        upm.scheduled_session_id::text,
        ms.starts_at::text AS scheduled_starts_at,
        ms.ends_at::text AS scheduled_ends_at,
        ms.status AS scheduled_session_status,
        ms.mentor_user_id::text AS mentor_user_id,
        mentor.display_name AS mentor_name
      FROM app_mentoring.user_program_mentorships upm
      JOIN app_mentoring.program_mentorship_templates pt ON pt.template_code = upm.template_code
      LEFT JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = upm.scheduled_session_id
      LEFT JOIN app_core.users mentor ON mentor.user_id = ms.mentor_user_id
      WHERE upm.entitlement_id = $1
        AND upm.owner_user_id = $2
      LIMIT 1
    `,
    [entitlementId, ownerUserId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Program mentorship entitlement not found');
  }

  return mapProgramEntitlement(row);
}

async function getMentorOffering(client: PoolClient, offerId: string): Promise<MentorOfferingRow> {
  const { rows } = await client.query<MentorOfferingRow>(
    `
      SELECT
        offer_id::text,
        mentor_user_id::text,
        offer_code,
        title,
        description,
        session_type,
        duration_minutes,
        price_amount,
        currency_code,
        is_active
      FROM app_mentoring.mentor_offerings
      WHERE offer_id = $1
        AND is_active = true
      LIMIT 1
    `,
    [offerId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Mentor offer not found');
  }

  return row;
}

async function syncProgramEntitlementForSession(
  client: PoolClient,
  sessionId: string,
  status: MentorshipStatus | null,
): Promise<void> {
  const nextStatus: ProgramMentorshipStatus =
    status === 'completed'
      ? 'completed'
      : status && status !== 'cancelled' && status !== 'no_show'
        ? 'scheduled'
        : 'available';

  await client.query(
    `
      UPDATE app_mentoring.user_program_mentorships
      SET
        status = $2,
        scheduled_session_id = CASE WHEN $2 = 'available' THEN NULL ELSE $1::uuid END,
        updated_at = now()
      WHERE scheduled_session_id = $1
    `,
    [sessionId, nextStatus],
  );
}

async function syncAdditionalOrderForSession(
  client: PoolClient,
  sessionId: string,
  status: MentorshipStatus | null,
): Promise<void> {
  const nextStatus: AdditionalMentorshipOrderStatus =
    status === 'completed'
      ? 'completed'
      : status === 'cancelled' || status === 'no_show'
        ? 'cancelled'
        : status
          ? 'scheduled'
          : 'cancelled';

  await client.query(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET
        status = $2,
        scheduled_session_id = CASE WHEN $2 = 'cancelled' THEN NULL ELSE $1::uuid END,
        updated_at = now()
      WHERE scheduled_session_id = $1
    `,
    [sessionId, nextStatus],
  );
}

async function syncLinkedMentorshipEntities(client: PoolClient, sessionId: string): Promise<void> {
  const { rows } = await client.query<{ session_origin: MentorshipSessionOrigin; status: MentorshipStatus }>(
    `
      SELECT session_origin, status
      FROM app_mentoring.mentorship_sessions
      WHERE session_id = $1
      LIMIT 1
    `,
    [sessionId],
  );

  const row = rows[0];
  if (!row) {
    return;
  }

  if (row.session_origin === 'program_included') {
    await syncProgramEntitlementForSession(client, sessionId, row.status);
  }

  if (row.session_origin === 'additional_paid') {
    await syncAdditionalOrderForSession(client, sessionId, row.status);
  }
}

async function listProgramEntitlements(
  client: PoolClient,
  ownerUserId: string,
): Promise<ProgramMentorshipEntitlementRecord[]> {
  const { rows } = await client.query<ProgramEntitlementRow>(
    `
      SELECT
        upm.entitlement_id::text,
        upm.template_code,
        pt.sequence_no,
        pt.title,
        pt.description,
        pt.phase_code,
        pt.workbook_code,
        pt.suggested_week,
        pt.default_duration_minutes,
        upm.status AS stored_status,
        upm.scheduled_session_id::text,
        ms.starts_at::text AS scheduled_starts_at,
        ms.ends_at::text AS scheduled_ends_at,
        ms.status AS scheduled_session_status,
        ms.mentor_user_id::text AS mentor_user_id,
        mentor.display_name AS mentor_name
      FROM app_mentoring.user_program_mentorships upm
      JOIN app_mentoring.program_mentorship_templates pt ON pt.template_code = upm.template_code
      LEFT JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = upm.scheduled_session_id
      LEFT JOIN app_core.users mentor ON mentor.user_id = ms.mentor_user_id
      WHERE upm.owner_user_id = $1
      ORDER BY pt.sequence_no
    `,
    [ownerUserId],
  );

  return rows.map(mapProgramEntitlement);
}

async function listMentorCatalog(client: PoolClient): Promise<MentorCatalogRecord[]> {
  const { rows } = await client.query<MentorCatalogRow>(
    `
      SELECT
        m.mentor_user_id::text,
        u.display_name AS name,
        COALESCE(spec.specialty_label, m.specialty, 'Mentoría ejecutiva') AS specialty,
        COALESCE(up.industry, 'Liderazgo') AS sector,
        COALESCE(m.rating_avg, 0) AS rating_avg,
        m.rating_count,
        COALESCE(u.avatar_initial, SUBSTRING(u.display_name FROM 1 FOR 1)) AS avatar_initial,
        COALESCE(availability.availability, '[]'::json) AS availability,
        COALESCE(offers.offers, '[]'::json) AS offers
      FROM app_mentoring.mentors m
      JOIN app_core.users u ON u.user_id = m.mentor_user_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT string_agg(DISTINCT pil.display_name, ' · ' ORDER BY pil.display_name) AS specialty_label
        FROM app_mentoring.mentor_specialties ms
        JOIN app_assessment.pillars pil ON pil.pillar_code = ms.pillar_code
        WHERE ms.mentor_user_id = m.mentor_user_id
      ) spec ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
                 json_build_object(
                   'startsAt', slot.starts_at::text,
                   'endsAt', slot.ends_at::text
                 )
                 ORDER BY slot.starts_at
               ) AS availability
        FROM (
          SELECT ma.starts_at, ma.ends_at
          FROM app_mentoring.mentor_availability ma
          WHERE ma.mentor_user_id = m.mentor_user_id
            AND ma.starts_at >= now()
            AND ma.is_booked = false
          ORDER BY ma.starts_at
          LIMIT 6
        ) slot
      ) availability ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
                 json_build_object(
                   'offerId', mo.offer_id::text,
                   'offerCode', mo.offer_code,
                   'title', mo.title,
                   'description', mo.description,
                   'sessionType', mo.session_type,
                   'durationMinutes', mo.duration_minutes,
                   'priceAmount', mo.price_amount,
                   'currencyCode', mo.currency_code,
                   'isActive', mo.is_active
                 )
                 ORDER BY mo.sort_order, mo.created_at
               ) AS offers
        FROM app_mentoring.mentor_offerings mo
        WHERE mo.mentor_user_id = m.mentor_user_id
          AND mo.is_active = true
      ) offers ON true
      ORDER BY u.display_name
    `,
  );

  return rows.map(mapMentorCatalog);
}

async function listAdditionalOrders(
  client: PoolClient,
  actor: AuthUser,
  limit = 50,
): Promise<AdditionalMentorshipOrderRecord[]> {
  const { rows } = await client.query<AdditionalOrderRow>(
    `
      SELECT
        amo.order_id::text,
        amo.owner_user_id::text,
        amo.mentor_user_id::text,
        mentor.display_name AS mentor_name,
        amo.offer_id::text,
        mo.title AS offer_title,
        amo.title,
        amo.topic,
        amo.notes,
        amo.status,
        amo.price_amount,
        amo.currency_code,
        amo.scheduled_session_id::text,
        amo.scheduled_starts_at::text,
        amo.scheduled_ends_at::text,
        amo.created_at::text,
        amo.updated_at::text
      FROM app_mentoring.additional_mentorship_orders amo
      JOIN app_core.users mentor ON mentor.user_id = amo.mentor_user_id
      LEFT JOIN app_mentoring.mentor_offerings mo ON mo.offer_id = amo.offer_id
      WHERE (
        $1 = 'admin'
        OR $1 = 'gestor'
        OR ($1 = 'lider' AND amo.owner_user_id = $2::uuid)
        OR ($1 = 'mentor' AND amo.mentor_user_id = $2::uuid)
      )
      ORDER BY amo.created_at DESC
      LIMIT $3
    `,
    [actor.role, actor.userId, Math.min(Math.max(limit, 1), 200)],
  );

  return rows.map(mapAdditionalOrder);
}

async function getAdditionalOrderById(
  client: PoolClient,
  actor: AuthUser,
  orderId: string,
): Promise<AdditionalMentorshipOrderRecord> {
  const { rows } = await client.query<AdditionalOrderRow>(
    `
      SELECT
        amo.order_id::text,
        amo.owner_user_id::text,
        amo.mentor_user_id::text,
        mentor.display_name AS mentor_name,
        amo.offer_id::text,
        mo.title AS offer_title,
        amo.title,
        amo.topic,
        amo.notes,
        amo.status,
        amo.price_amount,
        amo.currency_code,
        amo.scheduled_session_id::text,
        amo.scheduled_starts_at::text,
        amo.scheduled_ends_at::text,
        amo.created_at::text,
        amo.updated_at::text
      FROM app_mentoring.additional_mentorship_orders amo
      JOIN app_core.users mentor ON mentor.user_id = amo.mentor_user_id
      LEFT JOIN app_mentoring.mentor_offerings mo ON mo.offer_id = amo.offer_id
      WHERE amo.order_id = $3
        AND (
          $1 = 'admin'
          OR $1 = 'gestor'
          OR ($1 = 'lider' AND amo.owner_user_id = $2::uuid)
          OR ($1 = 'mentor' AND amo.mentor_user_id = $2::uuid)
        )
      LIMIT 1
    `,
    [actor.role, actor.userId, orderId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Additional mentorship order not found');
  }

  return mapAdditionalOrder(row);
}

async function listGroupSessionEvents(
  client: PoolClient,
  actor: AuthUser,
  limit = 120,
): Promise<GroupSessionEventRecord[]> {
  const { rows } = await client.query<GroupSessionEventRow>(
    `
      SELECT
        gse.event_id::text,
        gse.session_id::text,
        ms.title,
        ms.description,
        ms.starts_at::text,
        ms.ends_at::text,
        ms.meeting_url,
        gse.zoom_join_url,
        gse.zoom_host_url,
        gse.host_user_id::text,
        host_user.display_name AS host_name,
        gse.external_expert_name,
        gse.external_expert_bio,
        gsp.participation_status,
        (
          SELECT COUNT(*)::int
          FROM app_mentoring.group_session_participation p
          WHERE p.event_id = gse.event_id
            AND p.participation_status = 'joined'
        ) AS participant_count,
        (
          SELECT COUNT(*)::int
          FROM app_mentoring.group_session_participation p
          WHERE p.event_id = gse.event_id
            AND p.participation_status = 'interested'
        ) AS intent_count
      FROM app_mentoring.group_session_events gse
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      LEFT JOIN app_core.users host_user ON host_user.user_id = gse.host_user_id
      LEFT JOIN app_mentoring.group_session_participation gsp
        ON gsp.event_id = gse.event_id
       AND gsp.user_id = $2::uuid
      WHERE (
        $1 = 'admin'
        OR $1 = 'gestor'
        OR $1 = 'lider'
        OR $1 = 'mentor'
      )
      ORDER BY ms.starts_at DESC
      LIMIT $3
    `,
    [actor.role, actor.userId, Math.min(Math.max(limit, 1), 300)],
  );

  return rows.map(mapGroupSessionEvent);
}

async function listGroupSessionRecordings(
  client: PoolClient,
  actor: AuthUser,
  limit = 120,
): Promise<GroupSessionRecordingRecord[]> {
  const { rows } = await client.query<GroupSessionRecordingRow>(
    `
      SELECT
        gsr.recording_id::text,
        gsr.event_id::text,
        ms.title AS event_title,
        host_user.display_name AS host_name,
        gsr.title,
        gsr.description,
        gsr.recording_url,
        gsr.thumbnail_url,
        gsr.duration_minutes,
        gsr.recorded_at::text,
        gsr.published_at::text,
        my_reaction.reaction AS my_reaction,
        COALESCE(reactions.reaction_like, 0) AS reaction_like,
        COALESCE(reactions.reaction_celebrate, 0) AS reaction_celebrate,
        COALESCE(reactions.reaction_insightful, 0) AS reaction_insightful,
        COALESCE(reactions.reaction_love, 0) AS reaction_love
      FROM app_mentoring.group_session_recordings gsr
      JOIN app_mentoring.group_session_events gse ON gse.event_id = gsr.event_id
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      LEFT JOIN app_core.users host_user ON host_user.user_id = gse.host_user_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE r.reaction = 'like')::int AS reaction_like,
          COUNT(*) FILTER (WHERE r.reaction = 'celebrate')::int AS reaction_celebrate,
          COUNT(*) FILTER (WHERE r.reaction = 'insightful')::int AS reaction_insightful,
          COUNT(*) FILTER (WHERE r.reaction = 'love')::int AS reaction_love
        FROM app_mentoring.group_session_recording_reactions r
        WHERE r.recording_id = gsr.recording_id
      ) reactions ON true
      LEFT JOIN LATERAL (
        SELECT r.reaction
        FROM app_mentoring.group_session_recording_reactions r
        WHERE r.recording_id = gsr.recording_id
          AND r.user_id = $2::uuid
        LIMIT 1
      ) my_reaction ON true
      WHERE (
        $1 = 'admin'
        OR $1 = 'gestor'
        OR $1 = 'lider'
        OR $1 = 'mentor'
      )
      ORDER BY COALESCE(gsr.recorded_at, gsr.created_at) DESC
      LIMIT $3
    `,
    [actor.role, actor.userId, Math.min(Math.max(limit, 1), 300)],
  );

  const recordingIds = rows.map((row) => row.recording_id);
  const commentByRecording = new Map<string, GroupSessionRecordingCommentRecord[]>();
  if (recordingIds.length > 0) {
    const { rows: comments } = await client.query<GroupSessionRecordingCommentRow>(
      `
        SELECT
          comment_id::text,
          recording_id::text,
          c.user_id::text,
          u.display_name AS author_name,
          c.comment_text,
          c.created_at::text
        FROM app_mentoring.group_session_recording_comments c
        JOIN app_core.users u ON u.user_id = c.user_id
        WHERE c.recording_id = ANY($1::uuid[])
        ORDER BY c.created_at DESC
      `,
      [recordingIds],
    );

    for (const row of comments) {
      const bucket = commentByRecording.get(row.recording_id) ?? [];
      bucket.push({
        commentId: row.comment_id,
        userId: row.user_id,
        authorName: row.author_name,
        commentText: row.comment_text,
        createdAt: row.created_at,
      });
      commentByRecording.set(row.recording_id, bucket);
    }
  }

  return rows.map((row) => ({
    recordingId: row.recording_id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    hostName: row.host_name,
    title: row.title,
    description: row.description,
    recordingUrl: row.recording_url,
    thumbnailUrl: row.thumbnail_url,
    durationMinutes: Number(row.duration_minutes ?? 0),
    recordedAt: row.recorded_at,
    publishedAt: row.published_at,
    reactionTotals: {
      ...emptyReactionTotals(),
      like: Number(row.reaction_like ?? 0),
      celebrate: Number(row.reaction_celebrate ?? 0),
      insightful: Number(row.reaction_insightful ?? 0),
      love: Number(row.reaction_love ?? 0),
    },
    myReaction: row.my_reaction,
    comments: commentByRecording.get(row.recording_id) ?? [],
  }));
}

export async function listMentorships(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<MentorshipRecord[]> {
  await requireModulePermission(client, 'mentorias', 'view');

  const { rows } = await client.query<MentorshipRow>(
    `${BASE_SELECT}
     WHERE (
       $1 = 'admin'
       OR $1 = 'gestor'
       OR ($1 = 'mentor' AND (
         ms.mentor_user_id = $2::uuid
         OR EXISTS (
           SELECT 1
           FROM app_mentoring.session_participants sp
           WHERE sp.session_id = ms.session_id
             AND sp.user_id = $2::uuid
         )
       ))
       OR ($1 = 'lider' AND EXISTS (
         SELECT 1
         FROM app_mentoring.session_participants sp
         WHERE sp.session_id = ms.session_id
           AND sp.user_id = $2::uuid
       ))
     )
     ORDER BY ms.starts_at DESC
     LIMIT $3`,
    [actor.role, actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function getMentorshipOverview(
  client: PoolClient,
  actor: AuthUser,
): Promise<MentorshipOverviewRecord> {
  await requireModulePermission(client, 'mentorias', 'view');

  const sessions = await listMentorships(client, actor, 120);
  const mentorCatalog = await listMentorCatalog(client);
  const [groupSessions, groupSessionRecordings] = await Promise.all([
    listGroupSessionEvents(client, actor, 120),
    listGroupSessionRecordings(client, actor, 120),
  ]);

  if (actor.role === 'lider') {
    const access = await getViewerAccessState(client, actor, { includeCatalog: false });
    const [programEntitlements, additionalOrders] = await Promise.all([
      access.canAccessProgramMentorships
        ? listProgramEntitlements(client, actor.userId)
        : Promise.resolve([]),
      listAdditionalOrders(client, actor, 50),
    ]);

    return {
      sessions,
      programEntitlements,
      mentorCatalog,
      additionalOrders,
      groupSessions,
      groupSessionRecordings,
    };
  }

  return {
    sessions,
    programEntitlements: [],
    mentorCatalog,
    additionalOrders: await listAdditionalOrders(client, actor, 50),
    groupSessions,
    groupSessionRecordings,
  };
}

export async function createMentorship(
  client: PoolClient,
  actor: AuthUser,
  input: CreateMentorshipInput,
): Promise<MentorshipRecord> {
  await requireModulePermission(client, 'mentorias', 'create');

  const mentorUserId = input.mentorUserId ?? actor.userId;
  const status = input.status ?? 'scheduled';

  return createSessionWithParticipants(client, actor, {
    mentorUserId,
    title: input.title,
    description: input.description ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    sessionType: input.sessionType,
    status,
    meetingUrl: input.meetingUrl ?? null,
    menteeUserIds: input.menteeUserIds ?? [],
    sessionOrigin: input.sessionOrigin ?? 'manual',
  });
}

export async function createGroupSession(
  client: PoolClient,
  actor: AuthUser,
  input: CreateGroupSessionInput,
): Promise<GroupSessionEventRecord> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can create group sessions');
  }
  await requireModulePermission(client, 'mentorias', 'create');

  const session = await createSessionWithParticipants(client, actor, {
    mentorUserId: input.hostUserId ?? actor.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    sessionType: 'grupal',
    status: 'scheduled',
    meetingUrl: input.zoomJoinUrl?.trim() || null,
    sessionOrigin: 'manual',
    menteeUserIds: [],
  });

  await client.query(
    `
      INSERT INTO app_mentoring.group_session_events (
        session_id,
        host_user_id,
        external_expert_name,
        external_expert_bio,
        zoom_join_url,
        zoom_host_url,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      session.sessionId,
      input.hostUserId ?? null,
      input.externalExpertName?.trim() || null,
      input.externalExpertBio?.trim() || null,
      input.zoomJoinUrl?.trim() || null,
      input.zoomHostUrl?.trim() || null,
      actor.userId,
    ],
  );

  const events = await listGroupSessionEvents(client, actor, 20);
  const created = events.find((item) => item.sessionId === session.sessionId);
  if (!created) throw new Error('Failed to create group session');
  return created;
}

export async function updateGroupSession(
  client: PoolClient,
  actor: AuthUser,
  eventId: string,
  input: UpdateGroupSessionInput,
): Promise<GroupSessionEventRecord> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can update group sessions');
  }
  await requireModulePermission(client, 'mentorias', 'update');

  const { rows } = await client.query<{ session_id: string }>(
    `SELECT session_id::text FROM app_mentoring.group_session_events WHERE event_id = $1 LIMIT 1`,
    [eventId],
  );
  const sessionId = rows[0]?.session_id;
  if (!sessionId) throw new Error('Group session not found');

  await client.query(
    `
      UPDATE app_mentoring.mentorship_sessions
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        starts_at = COALESCE($4::timestamptz, starts_at),
        ends_at = COALESCE($5::timestamptz, ends_at),
        status = COALESCE($6, status),
        meeting_url = COALESCE($7, meeting_url),
        updated_at = now()
      WHERE session_id = $1
    `,
    [
      sessionId,
      input.title?.trim() || null,
      input.description?.trim() || null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.status ?? null,
      input.zoomJoinUrl?.trim() || null,
    ],
  );

  await client.query(
    `
      UPDATE app_mentoring.group_session_events
      SET
        host_user_id = COALESCE($2, host_user_id),
        external_expert_name = COALESCE($3, external_expert_name),
        external_expert_bio = COALESCE($4, external_expert_bio),
        zoom_join_url = COALESCE($5, zoom_join_url),
        zoom_host_url = COALESCE($6, zoom_host_url),
        updated_at = now()
      WHERE event_id = $1
    `,
    [
      eventId,
      input.hostUserId ?? null,
      input.externalExpertName?.trim() || null,
      input.externalExpertBio?.trim() || null,
      input.zoomJoinUrl?.trim() || null,
      input.zoomHostUrl?.trim() || null,
    ],
  );

  const events = await listGroupSessionEvents(client, actor, 300);
  const updated = events.find((item) => item.eventId === eventId);
  if (!updated) throw new Error('Group session not found after update');
  return updated;
}

export async function participateInGroupSession(
  client: PoolClient,
  actor: AuthUser,
  eventId: string,
  input: ParticipateGroupSessionInput,
): Promise<GroupSessionEventRecord> {
  await requireModulePermission(client, 'mentorias', 'view');

  await client.query(
    `
      INSERT INTO app_mentoring.group_session_participation (
        event_id, user_id, participation_status, last_confirmation_sent_at
      )
      VALUES ($1, $2, $3, CASE WHEN $3 = 'joined' THEN now() ELSE NULL END)
      ON CONFLICT (event_id, user_id) DO UPDATE
      SET
        participation_status = EXCLUDED.participation_status,
        last_confirmation_sent_at = CASE
          WHEN EXCLUDED.participation_status = 'joined' THEN now()
          ELSE app_mentoring.group_session_participation.last_confirmation_sent_at
        END,
        updated_at = now()
    `,
    [eventId, actor.userId, input.status],
  );

  const { rows } = await client.query<{ title: string; zoom_join_url: string | null }>(
    `
      SELECT ms.title, gse.zoom_join_url
      FROM app_mentoring.group_session_events gse
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      WHERE gse.event_id = $1
      LIMIT 1
    `,
    [eventId],
  );
  const event = rows[0];
  if (!event) throw new Error('Group session not found');

  if (input.status === 'joined') {
    await client.query(
      `
        INSERT INTO app_core.notifications (user_id, notification_type, title, message, payload)
        VALUES (
          $1, 'info', 'Participación confirmada',
          $2,
          jsonb_build_object('eventId', $3, 'zoomJoinUrl', $4)
        )
      `,
      [
        actor.userId,
        `Tu participación en "${event.title}" fue confirmada.${event.zoom_join_url ? ' Revisa el enlace de conexión.' : ''}`,
        eventId,
        event.zoom_join_url,
      ],
    );
  }

  const events = await listGroupSessionEvents(client, actor, 300);
  const updated = events.find((item) => item.eventId === eventId);
  if (!updated) throw new Error('Group session not found after participation update');
  return updated;
}

export async function createGroupSessionRecording(
  client: PoolClient,
  actor: AuthUser,
  input: CreateGroupSessionRecordingInput,
): Promise<GroupSessionRecordingRecord> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can publish recordings');
  }
  await requireModulePermission(client, 'mentorias', 'update');

  await client.query(
    `
      INSERT INTO app_mentoring.group_session_recordings (
        event_id,
        source_type,
        title,
        description,
        recording_url,
        thumbnail_url,
        duration_minutes,
        recorded_at,
        published_at,
        created_by
      )
      VALUES ($1, 'manual', $2, $3, $4, $5, $6, $7::timestamptz, now(), $8)
    `,
    [
      input.eventId,
      input.title.trim(),
      input.description?.trim() || null,
      input.recordingUrl.trim(),
      input.thumbnailUrl?.trim() || null,
      Math.max(0, Math.floor(input.durationMinutes ?? 0)),
      input.recordedAt ?? null,
      actor.userId,
    ],
  );

  const recordings = await listGroupSessionRecordings(client, actor, 300);
  const found = recordings.find((item) => item.eventId === input.eventId && item.title === input.title.trim());
  if (!found) throw new Error('Failed to create recording');
  return found;
}

export async function reactToGroupSessionRecording(
  client: PoolClient,
  actor: AuthUser,
  recordingId: string,
  reaction: GroupSessionReaction,
): Promise<GroupSessionRecordingRecord> {
  await requireModulePermission(client, 'mentorias', 'view');

  await client.query(
    `
      INSERT INTO app_mentoring.group_session_recording_reactions (recording_id, user_id, reaction)
      VALUES ($1, $2, $3)
      ON CONFLICT (recording_id, user_id) DO UPDATE
      SET reaction = EXCLUDED.reaction
    `,
    [recordingId, actor.userId, reaction],
  );

  const recordings = await listGroupSessionRecordings(client, actor, 300);
  const updated = recordings.find((item) => item.recordingId === recordingId);
  if (!updated) throw new Error('Recording not found');
  return updated;
}

export async function commentGroupSessionRecording(
  client: PoolClient,
  actor: AuthUser,
  recordingId: string,
  commentText: string,
): Promise<GroupSessionRecordingRecord> {
  await requireModulePermission(client, 'mentorias', 'view');
  const normalized = commentText.trim();
  if (!normalized) throw new Error('Comment text is required');

  await client.query(
    `
      INSERT INTO app_mentoring.group_session_recording_comments (
        recording_id, user_id, comment_text
      )
      VALUES ($1, $2, $3)
    `,
    [recordingId, actor.userId, normalized],
  );

  const recordings = await listGroupSessionRecordings(client, actor, 300);
  const updated = recordings.find((item) => item.recordingId === recordingId);
  if (!updated) throw new Error('Recording not found');
  return updated;
}

export async function inviteGroupSessionByRoles(
  client: PoolClient,
  actor: AuthUser,
  input: InviteGroupSessionByRolesInput,
): Promise<{ invitedCount: number }> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can send invitations');
  }
  await requireModulePermission(client, 'mentorias', 'update');

  const roleCodes = Array.from(new Set(input.roleCodes)).filter(Boolean);
  if (roleCodes.length === 0) {
    throw new Error('At least one role is required');
  }

  const { rows: eventRows } = await client.query<{ title: string; zoom_join_url: string | null }>(
    `
      SELECT ms.title, gse.zoom_join_url
      FROM app_mentoring.group_session_events gse
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      WHERE gse.event_id = $1
      LIMIT 1
    `,
    [input.eventId],
  );
  const event = eventRows[0];
  if (!event) throw new Error('Group session event not found');

  const { rows: targets } = await client.query<{ user_id: string }>(
    `
      SELECT DISTINCT ur.user_id::text
      FROM app_auth.user_roles ur
      JOIN app_core.users u ON u.user_id = ur.user_id
      WHERE ur.role_code = ANY($1::text[])
        AND u.is_active = true
    `,
    [roleCodes],
  );

  for (const target of targets) {
    await client.query(
      `
        INSERT INTO app_mentoring.group_session_participation (
          event_id, user_id, participation_status
        )
        VALUES ($1, $2, 'interested')
        ON CONFLICT (event_id, user_id) DO NOTHING
      `,
      [input.eventId, target.user_id],
    );

    await client.query(
      `
        INSERT INTO app_core.notifications (user_id, notification_type, title, message, payload)
        VALUES (
          $1,
          'info',
          'Invitación a sesión grupal',
          $2,
          jsonb_build_object('eventId', $3, 'zoomJoinUrl', $4, 'type', 'group_session_invitation')
        )
      `,
      [
        target.user_id,
        `Tienes una invitación para "${event.title}". Confirma tu participación en Mentorías.`,
        input.eventId,
        event.zoom_join_url,
      ],
    );
  }

  await client.query(
    `
      UPDATE app_mentoring.group_session_events
      SET invitation_filters = jsonb_build_object('roles', $2::text[]), updated_at = now()
      WHERE event_id = $1
    `,
    [input.eventId, roleCodes],
  );

  return { invitedCount: targets.length };
}

export async function getGroupSessionAnalytics(
  client: PoolClient,
  actor: AuthUser,
): Promise<GroupSessionAnalyticsRecord[]> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can view group analytics');
  }
  await requireModulePermission(client, 'mentorias', 'view');

  const { rows } = await client.query<{
    event_id: string;
    title: string;
    starts_at: string;
    host_name: string | null;
    interested_count: number;
    joined_count: number;
    declined_count: number;
  }>(
    `
      SELECT
        gse.event_id::text,
        ms.title,
        ms.starts_at::text,
        host_user.display_name AS host_name,
        COUNT(*) FILTER (WHERE gsp.participation_status = 'interested')::int AS interested_count,
        COUNT(*) FILTER (WHERE gsp.participation_status = 'joined')::int AS joined_count,
        COUNT(*) FILTER (WHERE gsp.participation_status = 'declined')::int AS declined_count
      FROM app_mentoring.group_session_events gse
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      LEFT JOIN app_core.users host_user ON host_user.user_id = gse.host_user_id
      LEFT JOIN app_mentoring.group_session_participation gsp ON gsp.event_id = gse.event_id
      GROUP BY gse.event_id, ms.title, ms.starts_at, host_user.display_name
      ORDER BY ms.starts_at DESC
    `,
  );

  return rows.map((row) => ({
    eventId: row.event_id,
    title: row.title,
    startsAt: row.starts_at,
    interestedCount: Number(row.interested_count ?? 0),
    joinedCount: Number(row.joined_count ?? 0),
    declinedCount: Number(row.declined_count ?? 0),
    hostName: row.host_name,
  }));
}

export async function dispatchGroupSessionReminders(
  client: PoolClient,
  actor: AuthUser,
  windowType: '14h' | '30m',
): Promise<{ notified: number }> {
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new Error('Only admin or gestor can dispatch reminders');
  }
  await requireModulePermission(client, 'mentorias', 'manage');

  const now = new Date();
  const rangeStart = new Date(now);
  const rangeEnd = new Date(now);
  if (windowType === '14h') {
    rangeStart.setHours(rangeStart.getHours() + 13, rangeStart.getMinutes() - 30, 0, 0);
    rangeEnd.setHours(rangeEnd.getHours() + 14, rangeEnd.getMinutes() + 30, 0, 0);
  } else {
    rangeStart.setMinutes(rangeStart.getMinutes() + 20, 0, 0);
    rangeEnd.setMinutes(rangeEnd.getMinutes() + 40, 0, 0);
  }

  const { rows } = await client.query<{
    event_id: string;
    user_id: string;
    title: string;
    zoom_join_url: string | null;
  }>(
    `
      SELECT
        gse.event_id::text,
        gsp.user_id::text,
        ms.title,
        gse.zoom_join_url
      FROM app_mentoring.group_session_events gse
      JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
      JOIN app_mentoring.group_session_participation gsp ON gsp.event_id = gse.event_id
      WHERE ms.starts_at BETWEEN $1::timestamptz AND $2::timestamptz
        AND (
          (gsp.participation_status IN ('interested', 'joined'))
        )
        AND (
          ($3 = '14h' AND gsp.reminder_14h_sent_at IS NULL)
          OR
          ($3 = '30m' AND gsp.reminder_30m_sent_at IS NULL)
        )
    `,
    [rangeStart.toISOString(), rangeEnd.toISOString(), windowType],
  );

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO app_core.notifications (user_id, notification_type, title, message, payload)
        VALUES (
          $1, 'info', 'Recordatorio de sesión grupal',
          $2,
          jsonb_build_object('eventId', $3, 'zoomJoinUrl', $4, 'type', 'group_session_reminder', 'windowType', $5)
        )
      `,
      [
        row.user_id,
        `Tu sesión grupal "${row.title}" inicia pronto. Revisa el enlace de conexión.`,
        row.event_id,
        row.zoom_join_url,
        windowType,
      ],
    );
  }

  if (rows.length > 0) {
    if (windowType === '14h') {
      await client.query(
        `
          UPDATE app_mentoring.group_session_participation
          SET reminder_14h_sent_at = now(), updated_at = now()
          WHERE (event_id::text, user_id::text) IN (
            SELECT x.event_id, x.user_id FROM jsonb_to_recordset($1::jsonb) AS x(event_id text, user_id text)
          )
        `,
        [JSON.stringify(rows.map((row) => ({ event_id: row.event_id, user_id: row.user_id })))],
      );
    } else {
      await client.query(
        `
          UPDATE app_mentoring.group_session_participation
          SET reminder_30m_sent_at = now(), updated_at = now()
          WHERE (event_id::text, user_id::text) IN (
            SELECT x.event_id, x.user_id FROM jsonb_to_recordset($1::jsonb) AS x(event_id text, user_id text)
          )
        `,
        [JSON.stringify(rows.map((row) => ({ event_id: row.event_id, user_id: row.user_id })))],
      );
    }
  }

  return { notified: rows.length };
}

export async function scheduleProgramMentorship(
  client: PoolClient,
  actor: AuthUser,
  input: ScheduleProgramMentorshipInput,
): Promise<MentorshipRecord> {
  assertLeaderActor(actor);
  await requireModulePermission(client, 'mentorias', 'create');
  await requireProgramSubscriptionAccess(client, actor, 'Las mentorías incluidas del programa');

  const entitlement = await getProgramEntitlement(client, input.entitlementId, actor.userId);

  if (entitlement.status === 'completed') {
    throw new Error('This included mentorship is already completed');
  }

  if (entitlement.status === 'scheduled' && entitlement.scheduledSessionId) {
    throw new Error('This included mentorship is already scheduled');
  }

  const endsAt = addMinutes(input.startsAt, entitlement.defaultDurationMinutes);
  const description = input.note?.trim()
    ? `${entitlement.description ?? ''}\n\nNota del líder:\n${input.note.trim()}`.trim()
    : entitlement.description;

  const session = await createSessionWithParticipants(client, actor, {
    mentorUserId: input.mentorUserId,
    title: entitlement.title,
    description,
    startsAt: input.startsAt,
    endsAt,
    sessionType: 'individual',
    status: 'scheduled',
    meetingUrl: input.meetingUrl ?? null,
    menteeUserIds: [actor.userId],
    sessionOrigin: 'program_included',
  });

  await client.query(
    `
      UPDATE app_mentoring.user_program_mentorships
      SET
        status = 'scheduled',
        scheduled_session_id = $2,
        updated_at = now()
      WHERE entitlement_id = $1
    `,
    [input.entitlementId, session.sessionId],
  );

  return session;
}

export async function createAdditionalMentorshipOrder(
  client: PoolClient,
  actor: AuthUser,
  input: CreateAdditionalMentorshipOrderInput,
): Promise<AdditionalMentorshipOrderRecord> {
  assertLeaderActor(actor);
  await requireModulePermission(client, 'mentorias', 'create');

  const offer = await getMentorOffering(client, input.offerId);
  const endsAt = addMinutes(input.startsAt, Number(offer.duration_minutes));
  const topic = input.topic?.trim() || null;
  const notes = input.note?.trim() || null;
  const initialOrderStatus: AdditionalMentorshipOrderStatus =
    Number(offer.price_amount ?? 0) > 0 ? 'pending_payment' : 'scheduled';

  const descriptionParts = [offer.description, topic ? `Tema central: ${topic}` : null, notes ? `Nota del líder: ${notes}` : null].filter(Boolean);

  const session = await createSessionWithParticipants(client, actor, {
    mentorUserId: offer.mentor_user_id,
    title: offer.title,
    description: descriptionParts.join('\n\n') || null,
    startsAt: input.startsAt,
    endsAt,
    sessionType: offer.session_type,
    status: 'scheduled',
    meetingUrl: input.meetingUrl ?? null,
    menteeUserIds: [actor.userId],
    sessionOrigin: 'additional_paid',
  });

  const { rows } = await client.query<AdditionalOrderRow>(
    `
      INSERT INTO app_mentoring.additional_mentorship_orders (
        owner_user_id,
        mentor_user_id,
        offer_id,
        scheduled_session_id,
        title,
        topic,
        notes,
        scheduled_starts_at,
        scheduled_ends_at,
        status,
        price_amount,
        currency_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, $10, $11, $12)
      RETURNING
        order_id::text,
        owner_user_id::text,
        mentor_user_id::text,
        ''::text AS mentor_name,
        offer_id::text,
        ''::text AS offer_title,
        title,
        topic,
        notes,
        status,
        price_amount,
        currency_code,
        scheduled_session_id::text,
        scheduled_starts_at::text,
        scheduled_ends_at::text,
        created_at::text,
        updated_at::text
    `,
    [
      actor.userId,
      offer.mentor_user_id,
      offer.offer_id,
      session.sessionId,
      offer.title,
      topic,
      notes,
      input.startsAt,
      endsAt,
      initialOrderStatus,
      offer.price_amount,
      offer.currency_code,
    ],
  );

  const inserted = rows[0];
  if (!inserted) {
    throw new Error('Failed to register the additional mentorship order');
  }

  return getAdditionalOrderById(client, actor, inserted.order_id);
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

  await syncLinkedMentorshipEntities(client, sessionId);
  return getSession(client, sessionId);
}

export async function deleteMentorship(
  client: PoolClient,
  sessionId: string,
): Promise<{ sessionId: string }> {
  await requireModulePermission(client, 'mentorias', 'delete');

  const { rows: metaRows } = await client.query<{ session_origin: MentorshipSessionOrigin }>(
    `
      SELECT session_origin
      FROM app_mentoring.mentorship_sessions
      WHERE session_id = $1
      LIMIT 1
    `,
    [sessionId],
  );

  const meta = metaRows[0];
  if (meta?.session_origin === 'program_included') {
    await syncProgramEntitlementForSession(client, sessionId, null);
  }

  if (meta?.session_origin === 'additional_paid') {
    await syncAdditionalOrderForSession(client, sessionId, null);
  }

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
