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
    };
  }

  return {
    sessions,
    programEntitlements: [],
    mentorCatalog,
    additionalOrders: await listAdditionalOrders(client, actor, 50),
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
