import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { PoolClient } from 'pg';
import { createDirectThread, sendMessage } from '@/features/mensajes/service';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { hashPassword } from '@/server/auth/password';
import { withClient } from '@/server/db/pool';
import type { Role } from '@/server/bootstrap/types';
import type { AuthUser } from '@/server/auth/types';
import {
  USER_COUNTRY_SET,
  USER_GENDER_SET,
  USER_JOB_ROLE_OPTIONS,
  type UserJobRoleOption,
} from '@/lib/user-demographics';
import { buildBrandedEmailHtml, type EmailBranding } from '@/lib/email-template';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';
type JobRole = UserJobRoleOption;
type PolicyStatus = 'accepted' | 'pending';
type OutboundProvider = 'smtp' | 'sendgrid' | 'resend' | 'ses';

export interface UserRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarInitial: string | null;
  timezone: string;
  primaryRole: Role;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  profession: string | null;
  industry: string | null;
  planType: PlanType | null;
  subscriptionPlanId: string | null;
  subscriptionPlanCode: string | null;
  subscriptionPlanName: string | null;
  seniorityLevel: SeniorityLevel | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  jobRole: JobRole | null;
  gender: string | null;
  yearsExperience: number | null;
  policyStatus: PolicyStatus;
  policyCode: string | null;
  policyVersion: string | null;
  policyAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsRecord {
  projectsCount: number;
  contentCreatedCount: number;
  commentsCount: number;
  messagesSentCount: number;
  mentorshipSessionsCount: number;
  navigationEventsCount: number;
}

export interface UserPolicyAcceptanceRecord {
  acceptanceId: string;
  policyCode: string;
  policyVersion: string;
  acceptedAt: string;
  acceptanceSource: string;
  metadata: Record<string, unknown>;
}

export interface RolePermissionRecord {
  moduleCode: string;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canModerate: boolean;
  canManage: boolean;
}

export interface UserDetailRecord extends UserRecord {
  passwordUpdatedAt: string | null;
  lastSessionAt: string | null;
  stats: UserStatsRecord;
  rolePermissions: RolePermissionRecord[];
  policyHistory: UserPolicyAcceptanceRecord[];
}

export interface AuditLogRecord {
  auditId: number;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  moduleCode: string | null;
  entityTable: string;
  entityId: string | null;
  changeSummary: Record<string, unknown>;
  occurredAt: string;
}

export interface ListUsersInput {
  limit?: number;
  search?: string;
  role?: Role | 'all';
  status?: 'all' | 'active' | 'inactive';
  policyStatus?: 'all' | PolicyStatus;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  timezone?: string;
  primaryRole: Role;
  organizationId?: string | null;
  password: string;
  profession?: string | null;
  industry?: string | null;
  planType?: PlanType | null;
  seniorityLevel?: SeniorityLevel | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone?: string;
  primaryRole?: Role;
  organizationId?: string | null;
  isActive?: boolean;
  password?: string;
  profession?: string | null;
  industry?: string | null;
  planType?: PlanType | null;
  subscriptionPlanId?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
}

export interface ResetUserPasswordResult {
  userId: string;
  recipient: string;
  messageId: string | null;
  passwordUpdatedAt: string;
}

export interface SendUserMessageResult {
  threadId: string;
  messageId: string;
}

interface UserRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_initial: string | null;
  timezone: string;
  primary_role: Role;
  is_active: boolean;
  organization_id: string | null;
  organization_name: string | null;
  profession: string | null;
  industry: string | null;
  plan_type: PlanType | null;
  subscription_plan_id: string | null;
  subscription_plan_code: string | null;
  subscription_plan_name: string | null;
  seniority_level: SeniorityLevel | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  job_role: JobRole | null;
  gender: string | null;
  years_experience: number | null;
  policy_code: string | null;
  policy_version: string | null;
  policy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStatsRow {
  projects_count: number;
  content_created_count: number;
  comments_count: number;
  messages_sent_count: number;
  mentorship_sessions_count: number;
  navigation_events_count: number;
}

interface SessionMetaRow {
  password_updated_at: string | null;
  last_session_at: string | null;
}

const SUBSCRIBED_LEADER_PLAN_TYPES = new Set<PlanType>([
  'premium',
  'vip',
  'empresa_elite',
]);

const JOB_ROLE_SET = new Set<JobRole>(USER_JOB_ROLE_OPTIONS);
const USER_PROFILE_DEFAULTS = {
  country: 'No definido',
  jobRole: 'Especialista sin personal a cargo' as JobRole,
  gender: 'Prefiero no decirlo',
  yearsExperience: 0,
};

function resolvePlanTypeForCreate(input: CreateUserInput): PlanType | null {
  if (input.primaryRole !== 'lider') {
    return input.planType ?? null;
  }

  return input.planType ?? 'standard';
}

async function ensureLeaderProgramPurchase(
  client: PoolClient,
  userId: string,
  input: {
    role: Role;
    planType: PlanType | null;
    priceAmount?: number;
    source?: string;
  },
): Promise<void> {
  const shouldHaveProgramPurchase =
    input.role === 'lider' &&
    Boolean(input.planType) &&
    SUBSCRIBED_LEADER_PLAN_TYPES.has(input.planType as PlanType);

  if (shouldHaveProgramPurchase) {
    await client.query(
      `
        INSERT INTO app_billing.user_purchases (
          user_id,
          product_code,
          status,
          quantity,
          unit_price_amount,
          currency_code,
          metadata,
          purchased_at,
          activated_at
        )
        SELECT
          $1::uuid,
          'program_4shine',
          'active',
          1,
          COALESCE(pc.price_amount, $2::numeric),
          COALESCE(pc.currency_code, 'USD'),
          jsonb_build_object('source', $3::text),
          now(),
          now()
        FROM app_billing.product_catalog pc
        WHERE pc.product_code = 'program_4shine'
          AND NOT EXISTS (
            SELECT 1
            FROM app_billing.user_purchases up
            WHERE up.user_id = $1::uuid
              AND up.product_code = 'program_4shine'
              AND up.status = 'active'
          )
      `,
      [userId, input.priceAmount ?? 2000, input.source ?? 'manual_user_creation'],
    );
    return;
  }

  await client.query(
    `
      UPDATE app_billing.user_purchases
      SET
        status = 'cancelled',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'source', $2::text,
          'cancelled_at', now()
        ),
        updated_at = now()
      WHERE user_id = $1::uuid
        AND product_code = 'program_4shine'
        AND status = 'active'
    `,
    [userId, input.source ?? 'manual_user_update'],
  );
}

async function getUserRoleAndPlan(
  client: PoolClient,
  userId: string,
): Promise<{ primaryRole: Role; planType: PlanType | null }> {
  const { rows } = await client.query<{ primary_role: Role; plan_type: PlanType | null }>(
    `
      SELECT
        u.primary_role,
        up.plan_type
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE u.user_id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('User not found');
  }

  return {
    primaryRole: row.primary_role,
    planType: row.plan_type,
  };
}

function resolvePlanTypeForUpdate(
  current: { primaryRole: Role; planType: PlanType | null },
  input: UpdateUserInput,
): PlanType | null | undefined {
  const nextRole = input.primaryRole ?? current.primaryRole;

  if (nextRole === 'lider') {
    if (input.planType !== undefined) {
      return input.planType ?? 'standard';
    }

    if (input.primaryRole === 'lider' && current.primaryRole !== 'lider') {
      return 'standard';
    }

    return current.planType ?? 'standard';
  }

  if (input.primaryRole !== undefined) {
    return null;
  }

  if (input.planType !== undefined) {
    return input.planType;
  }

  return undefined;
}

interface PolicyAcceptanceRow {
  acceptance_id: string;
  policy_code: string;
  policy_version: string;
  accepted_at: string;
  acceptance_source: string;
  metadata: Record<string, unknown>;
}

interface RolePermissionRow {
  module_code: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_moderate: boolean;
  can_manage: boolean;
}

interface AuditLogRow {
  audit_id: number;
  actor_user_id: string | null;
  actor_name: string | null;
  action: string;
  module_code: string | null;
  entity_table: string;
  entity_id: string | null;
  change_summary: Record<string, unknown> | null;
  occurred_at: string;
}

interface OutboundConfigRow {
  organization_id: string;
  enabled: boolean;
  provider: OutboundProvider;
  from_name: string;
  from_email: string;
  reply_to: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  api_key: string;
  ses_region: string;
}

interface OutboundEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

const BASE_SELECT = `
  SELECT
    u.user_id::text,
    u.email::text,
    u.first_name,
    u.last_name,
    u.display_name,
    u.avatar_initial::text,
    u.timezone,
    u.primary_role,
    u.is_active,
    u.organization_id::text,
    o.name AS organization_name,
    p.profession,
    p.industry,
    p.plan_type,
    p.subscription_plan_id::text AS subscription_plan_id,
    sp.plan_code AS subscription_plan_code,
    sp.name AS subscription_plan_name,
    p.seniority_level,
    p.bio,
    p.location,
    p.country,
    p.job_role,
    p.gender,
    p.years_experience,
    lp.policy_code,
    lp.policy_version,
    lp.accepted_at::text AS policy_accepted_at,
    u.created_at::text,
    u.updated_at::text
  FROM app_core.users u
  LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
  LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
  LEFT JOIN app_billing.subscription_plans sp ON sp.plan_id = p.subscription_plan_id
  LEFT JOIN LATERAL (
    SELECT
      upa.policy_code,
      upa.policy_version,
      upa.accepted_at
    FROM app_auth.user_policy_acceptances upa
    WHERE upa.user_id = u.user_id
    ORDER BY upa.accepted_at DESC
    LIMIT 1
  ) lp ON true
`;

function mapUser(row: UserRow): UserRecord {
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    avatarInitial: row.avatar_initial,
    timezone: row.timezone,
    primaryRole: row.primary_role,
    isActive: row.is_active,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    profession: row.profession,
    industry: row.industry,
    planType: row.plan_type,
    subscriptionPlanId: row.subscription_plan_id,
    subscriptionPlanCode: row.subscription_plan_code,
    subscriptionPlanName: row.subscription_plan_name,
    seniorityLevel: row.seniority_level,
    bio: row.bio,
    location: row.location,
    country: row.country,
    jobRole: row.job_role,
    gender: row.gender,
    yearsExperience: row.years_experience,
    policyStatus: row.policy_accepted_at ? 'accepted' : 'pending',
    policyCode: row.policy_code,
    policyVersion: row.policy_version,
    policyAcceptedAt: row.policy_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStats(row: UserStatsRow | undefined): UserStatsRecord {
  return {
    projectsCount: Number(row?.projects_count ?? 0),
    contentCreatedCount: Number(row?.content_created_count ?? 0),
    commentsCount: Number(row?.comments_count ?? 0),
    messagesSentCount: Number(row?.messages_sent_count ?? 0),
    mentorshipSessionsCount: Number(row?.mentorship_sessions_count ?? 0),
    navigationEventsCount: Number(row?.navigation_events_count ?? 0),
  };
}

function mapPolicyAcceptance(row: PolicyAcceptanceRow): UserPolicyAcceptanceRecord {
  return {
    acceptanceId: row.acceptance_id,
    policyCode: row.policy_code,
    policyVersion: row.policy_version,
    acceptedAt: row.accepted_at,
    acceptanceSource: row.acceptance_source,
    metadata: row.metadata ?? {},
  };
}

function mapRolePermission(row: RolePermissionRow): RolePermissionRecord {
  return {
    moduleCode: row.module_code,
    moduleName: row.module_name,
    canView: row.can_view,
    canCreate: row.can_create,
    canUpdate: row.can_update,
    canDelete: row.can_delete,
    canApprove: row.can_approve,
    canModerate: row.can_moderate,
    canManage: row.can_manage,
  };
}

function mapAuditLog(row: AuditLogRow): AuditLogRecord {
  return {
    auditId: row.audit_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    action: row.action,
    moduleCode: row.module_code,
    entityTable: row.entity_table,
    entityId: row.entity_id,
    changeSummary: row.change_summary ?? {},
    occurredAt: row.occurred_at,
  };
}

function clampLimit(limit: number | undefined, fallback = 200): number {
  const value = Number(limit ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), 1000);
}

function normalizeSearch(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return `%${trimmed}%`;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeJobRole(value: JobRole | string | null | undefined): JobRole | null {
  if (value === undefined || value === null) return null;
  const normalized = value.trim() === 'Gerente/Mand medio' ? 'Gerente/Mando medio' : value.trim();
  return JOB_ROLE_SET.has(normalized as JobRole) ? (normalized as JobRole) : null;
}

function normalizeGender(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (USER_GENDER_SET.has(trimmed)) {
    return trimmed;
  }
  return null;
}

function normalizeCountry(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  return USER_COUNTRY_SET.has(normalized) ? normalized : null;
}

function normalizeYearsExperience(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(80, Math.floor(Number(value))));
}

function assertRequiredDemographics(input: {
  country: string | null;
  jobRole: JobRole | null;
  gender: string | null;
  yearsExperience: number | null;
}) {
  if (!input.country || input.country.trim().length === 0) {
    throw new Error('País es obligatorio.');
  }
  if (!input.jobRole) {
    throw new Error('Cargo es obligatorio.');
  }
  if (!input.gender) {
    throw new Error('Género es obligatorio.');
  }
  if (!Number.isFinite(input.yearsExperience)) {
    throw new Error('Años de experiencia es obligatorio.');
  }
}

function hasUsableEmail(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function buildFromHeader(config: OutboundConfigRow): string {
  const fromEmail = config.from_email.trim();
  const fromName = config.from_name.trim();
  if (!fromName) return fromEmail;
  const escaped = fromName.replace(/"/g, '\\"');
  return `"${escaped}" <${fromEmail}>`;
}

function buildReplyTo(config: OutboundConfigRow): string | undefined {
  const replyTo = config.reply_to.trim();
  return replyTo.length > 0 ? replyTo : undefined;
}

function generateTemporaryPassword(): string {
  const base = randomBytes(18).toString('base64url').slice(0, 12);
  return `${base}A9!`;
}

function isOutboundConfigUsable(config: OutboundConfigRow): boolean {
  if (!hasUsableEmail(config.from_email)) {
    return false;
  }

  if (config.provider === 'sendgrid' || config.provider === 'resend') {
    return config.api_key.trim().length > 0;
  }

  const smtpHost = config.smtp_host.trim();
  const smtpUser = config.smtp_user.trim();
  const smtpPassword = config.smtp_password.trim();
  const smtpPort = Number(config.smtp_port);

  return (
    smtpHost.length > 0 &&
    smtpUser.length > 0 &&
    smtpPassword.length > 0 &&
    Number.isFinite(smtpPort) &&
    smtpPort > 0
  );
}

async function getUserById(client: PoolClient, userId: string): Promise<UserRecord> {
  const { rows } = await client.query<UserRow>(
    `${BASE_SELECT}
     WHERE u.user_id = $1
     LIMIT 1`,
    [userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('User not found');
  }

  return mapUser(row);
}

async function getUserStats(client: PoolClient, userId: string): Promise<UserStatsRecord> {
  const { rows } = await client.query<UserStatsRow>(
    `
      SELECT
        (SELECT COUNT(*)::int FROM app_core.user_projects up WHERE up.user_id = $1) AS projects_count,
        (SELECT COUNT(*)::int FROM app_learning.content_items ci WHERE ci.author_user_id = $1) AS content_created_count,
        (SELECT COUNT(*)::int FROM app_learning.content_comments cc WHERE cc.author_user_id = $1) AS comments_count,
        (SELECT COUNT(*)::int FROM app_networking.messages m WHERE m.sender_user_id = $1 AND m.deleted_at IS NULL) AS messages_sent_count,
        (
          SELECT COUNT(*)::int
          FROM app_mentoring.mentorship_sessions ms
          WHERE ms.mentor_user_id = $1
             OR ms.created_by = $1
             OR EXISTS (
               SELECT 1
               FROM app_mentoring.session_participants sp
               WHERE sp.session_id = ms.session_id
                 AND sp.user_id = $1
             )
        ) AS mentorship_sessions_count,
        (SELECT COUNT(*)::int FROM app_admin.audit_logs al WHERE al.actor_user_id = $1) AS navigation_events_count
    `,
    [userId],
  );

  return mapStats(rows[0]);
}

async function getUserSessionMeta(client: PoolClient, userId: string): Promise<SessionMetaRow> {
  const { rows } = await client.query<SessionMetaRow>(
    `
      SELECT
        uc.password_updated_at::text,
        MAX(rs.last_used_at)::text AS last_session_at
      FROM app_auth.user_credentials uc
      LEFT JOIN app_auth.refresh_sessions rs
        ON rs.user_id = uc.user_id
      WHERE uc.user_id = $1
      GROUP BY uc.password_updated_at
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? { password_updated_at: null, last_session_at: null };
}

async function listRolePermissionMatrix(client: PoolClient, role: Role): Promise<RolePermissionRecord[]> {
  const { rows } = await client.query<RolePermissionRow>(
    `
      SELECT
        module_code,
        module_name,
        can_view,
        can_create,
        can_update,
        can_delete,
        can_approve,
        can_moderate,
        can_manage
      FROM app_auth.v_role_permission_matrix
      WHERE role_code = $1
      ORDER BY module_name
    `,
    [role],
  );

  return rows.map(mapRolePermission);
}

export async function listUserPolicyAcceptances(
  client: PoolClient,
  userId: string,
  limit = 20,
): Promise<UserPolicyAcceptanceRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');

  const { rows } = await client.query<PolicyAcceptanceRow>(
    `
      SELECT
        acceptance_id::text,
        policy_code,
        policy_version,
        accepted_at::text,
        acceptance_source,
        metadata
      FROM app_auth.user_policy_acceptances
      WHERE user_id = $1
      ORDER BY accepted_at DESC
      LIMIT $2
    `,
    [userId, clampLimit(limit, 20)],
  );

  return rows.map(mapPolicyAcceptance);
}

async function resolveOutboundConfig(
  client: PoolClient,
  organizationId: string | null,
): Promise<OutboundConfigRow | null> {
  if (organizationId) {
    const preferred = await client.query<OutboundConfigRow>(
      `
        SELECT
          organization_id::text,
          enabled,
          provider,
          from_name,
          from_email,
          reply_to,
          smtp_host,
          smtp_port,
          smtp_user,
          smtp_password,
          smtp_secure,
          api_key,
          ses_region
        FROM app_admin.outbound_email_configs
        WHERE organization_id = $1
          AND enabled = true
        LIMIT 1
      `,
      [organizationId],
    );

    if (preferred.rows[0]) {
      return preferred.rows[0];
    }

    const preferredDisabled = await client.query<OutboundConfigRow>(
      `
        SELECT
          organization_id::text,
          enabled,
          provider,
          from_name,
          from_email,
          reply_to,
          smtp_host,
          smtp_port,
          smtp_user,
          smtp_password,
          smtp_secure,
          api_key,
          ses_region
        FROM app_admin.outbound_email_configs
        WHERE organization_id = $1
        LIMIT 1
      `,
      [organizationId],
    );

    const byOrg = preferredDisabled.rows[0];
    if (byOrg && isOutboundConfigUsable(byOrg)) {
      return byOrg;
    }
  }

  const fallback = await client.query<OutboundConfigRow>(
    `
      SELECT
        organization_id::text,
        enabled,
        provider,
        from_name,
        from_email,
        reply_to,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        api_key,
        ses_region
      FROM app_admin.outbound_email_configs
      WHERE enabled = true
      ORDER BY updated_at DESC
      LIMIT 1
    `,
  );

  if (fallback.rows[0]) {
    return fallback.rows[0];
  }

  const fallbackDisabled = await client.query<OutboundConfigRow>(
    `
      SELECT
        organization_id::text,
        enabled,
        provider,
        from_name,
        from_email,
        reply_to,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        api_key,
        ses_region
      FROM app_admin.outbound_email_configs
      ORDER BY updated_at DESC
      LIMIT 1
    `,
  );

  const latest = fallbackDisabled.rows[0];
  if (latest && isOutboundConfigUsable(latest)) {
    return latest;
  }

  return null;
}

async function sendViaSmtp(config: OutboundConfigRow, payload: OutboundEmailPayload): Promise<string | null> {
  const smtpHost = config.smtp_host.trim();
  const smtpUser = config.smtp_user.trim();
  const smtpPassword = config.smtp_password.trim();
  const smtpPort = Number(config.smtp_port);

  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new Error('SMTP configuration is incomplete');
  }

  const secure = smtpPort === 465 ? true : config.smtp_secure && smtpPort !== 587;
  const requireTLS = smtpPort === 587 || !secure;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const result = await transporter.sendMail({
    from: buildFromHeader(config),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: payload.replyTo,
  });

  return typeof result.messageId === 'string' ? result.messageId : null;
}

async function sendViaSendgrid(config: OutboundConfigRow, payload: OutboundEmailPayload): Promise<string | null> {
  const apiKey = config.api_key.trim();
  if (!apiKey) {
    throw new Error('SendGrid API key is missing');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: config.from_email.trim(), name: config.from_name.trim() || undefined },
      personalizations: [{ to: [{ email: payload.to }] }],
      subject: payload.subject,
      content: [{ type: 'text/plain', value: payload.text }],
      ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return response.headers.get('x-message-id');
}

async function sendViaResend(config: OutboundConfigRow, payload: OutboundEmailPayload): Promise<string | null> {
  const apiKey = config.api_key.trim();
  if (!apiKey) {
    throw new Error('Resend API key is missing');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: buildFromHeader(config),
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body?.message === 'string' ? body.message : JSON.stringify(body);
    throw new Error(`Resend rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return typeof body?.id === 'string' ? body.id : null;
}

async function sendOutboundEmail(config: OutboundConfigRow, payload: OutboundEmailPayload): Promise<string | null> {
  if (!hasUsableEmail(config.from_email)) {
    throw new Error('fromEmail is invalid');
  }
  if (!hasUsableEmail(payload.to)) {
    throw new Error('Recipient email is invalid');
  }

  if (config.provider === 'sendgrid') {
    return sendViaSendgrid(config, payload);
  }

  if (config.provider === 'resend') {
    return sendViaResend(config, payload);
  }

  return sendViaSmtp(config, payload);
}

function buildPasswordResetPayload(
  config: OutboundConfigRow,
  recipient: string,
  targetName: string,
  temporaryPassword: string,
  branding: EmailBranding,
): OutboundEmailPayload {
  const safeName = targetName.trim() || 'usuario';
  const platformName = branding.platformName || '4Shine';
  const subject = `${platformName} · Nueva contraseña temporal`;
  const text = [
    `Hola ${safeName},`,
    '',
    `Se ha solicitado un reseteo de contraseña desde el panel de administración de ${platformName}.`,
    `Tu nueva contraseña temporal es: ${temporaryPassword}`,
    '',
    'Te recomendamos cambiarla al iniciar sesión.',
  ].join('\n');

  const bodyHtml = [
    `<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${safeName}</strong>,</p>`,
    `<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">Se ha solicitado un reseteo de contraseña desde el panel de administración de ${platformName}.</p>`,
    `<p style="margin:0 0 8px;font-size:15px;color:#334155;">Tu nueva contraseña temporal es:</p>`,
    `<p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:1px;">${temporaryPassword}</p>`,
    `<p style="margin:0;font-size:13px;color:#94a3b8;">Te recomendamos cambiarla al iniciar sesión.</p>`,
  ].join('');

  return {
    to: recipient,
    subject,
    text,
    html: buildBrandedEmailHtml(bodyHtml, branding),
    replyTo: buildReplyTo(config),
  };
}

function buildVerificationEmailPayload(
  config: OutboundConfigRow,
  recipient: string,
  firstName: string,
  verificationUrl: string,
  branding: { platformName: string; logoUrl: string | null },
): OutboundEmailPayload {
  const safeName = firstName.trim() || 'usuario';
  const platformName = branding.platformName || '4Shine';
  const subject = `${platformName} · Confirma tu cuenta`;
  const text = [
    `Hola ${safeName},`,
    '',
    `Gracias por registrarte en ${platformName}. Para activar tu cuenta, haz clic en el siguiente enlace:`,
    '',
    verificationUrl,
    '',
    'Este enlace expira en 24 horas.',
    '',
    'Si no creaste esta cuenta, puedes ignorar este mensaje.',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.6;">
      Gracias por registrarte en ${platformName}. Haz clic en el botón para confirmar tu correo y activar tu cuenta:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
      <tr>
        <td align="center" bgcolor="#6366f1" style="border-radius:10px;">
          <a href="${verificationUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#6366f1;">
            Confirmar mi cuenta
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="margin:0;font-size:12px;color:#94a3b8;word-break:break-all;">${verificationUrl}</p>
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
  `;

  return { to: recipient, subject, text, html: buildBrandedEmailHtml(bodyHtml, branding), replyTo: buildReplyTo(config) };
}

// Public self-service password reset flow.
// Generates a single-use token, persists its sha256 hash with a 1h expiry,
// and dispatches the auth.password_reset notification with the reset link.
// Silently returns true even if the email does not exist to prevent enumeration.
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;    // 1 minute between requests

export async function requestPasswordResetByEmail(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co').trim().replace(/\/$/, '');
  const resetUrl = `${appUrl}/restablecer?token=${token}`;

  let target: {
    userId: string;
    firstName: string;
    organizationId: string | null;
  } | null = null;

  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      const { rows } = await client.query<{
        user_id: string;
        first_name: string;
        organization_id: string | null;
        password_reset_requested_at: string | null;
      }>(
        `SELECT u.user_id::text,
                u.first_name,
                u.organization_id::text,
                uc.password_reset_requested_at::text
         FROM app_core.users u
         JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
         WHERE u.email = $1 AND u.is_active = true
         LIMIT 1`,
        [email],
      );

      const row = rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return;
      }

      // Cooldown: don't spam if user clicks multiple times.
      if (row.password_reset_requested_at) {
        const lastRequested = new Date(row.password_reset_requested_at).getTime();
        if (Date.now() - lastRequested < PASSWORD_RESET_COOLDOWN_MS) {
          await client.query('ROLLBACK');
          return;
        }
      }

      await client.query(
        `UPDATE app_auth.user_credentials
         SET password_reset_token = $2,
             password_reset_expires_at = $3,
             password_reset_requested_at = now()
         WHERE user_id = $1`,
        [row.user_id, tokenHash, expiresAt.toISOString()],
      );

      await client.query('COMMIT');

      target = {
        userId: row.user_id,
        firstName: row.first_name,
        organizationId: row.organization_id,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });

  if (!target) return;

  // Send via the notifications engine so admins can customize the template
  // from /dashboard/administracion/notificaciones. Falls back to a built-in
  // email if no template is configured.
  const captured = target as { userId: string; firstName: string; organizationId: string | null };
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      const { dispatchNotification } = await import('@/features/notificaciones/engine');
      const { resolveEventConfig } = await import('@/features/notificaciones/service');

      if (captured.organizationId) {
        const resolved = await resolveEventConfig(
          client,
          captured.organizationId,
          'auth.password_reset',
        );

        if (resolved.isEnabled && resolved.template) {
          await dispatchNotification(client, {
            organizationId: captured.organizationId,
            recipientUserId: captured.userId,
            recipientEmail: email,
            eventKey: 'auth.password_reset',
            variables: {
              nombre: captured.firstName,
              enlace_reset: resetUrl,
            },
          });
          await client.query('COMMIT');
          return;
        }
      }

      // Fallback: hard-coded email if no template is configured.
      const outboundConfig = await resolveOutboundConfig(client, captured.organizationId);
      if (!outboundConfig) {
        console.warn('[requestPasswordReset] no outbound email config; reset link not delivered for', email);
        await client.query('COMMIT');
        return;
      }

      const brandingQuery = captured.organizationId
        ? `SELECT platform_name, logo_url, logo_dark_url FROM app_admin.branding_settings WHERE organization_id = $1::uuid LIMIT 1`
        : `SELECT platform_name, logo_url, logo_dark_url FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`;
      const brandingParams = captured.organizationId ? [captured.organizationId] : [];
      const { rows: brandingRows } = await client.query<{
        platform_name: string;
        logo_url: string | null;
        logo_dark_url: string | null;
      }>(brandingQuery, brandingParams);
      const branding: EmailBranding = {
        platformName: brandingRows[0]?.platform_name || '4Shine',
        // El header del email es oscuro -> preferimos logo_dark_url.
        logoUrl: brandingRows[0]?.logo_dark_url ?? brandingRows[0]?.logo_url ?? null,
      };

      const safeName = captured.firstName.trim() || 'usuario';
      const subject = `${branding.platformName} · Restablecer tu contraseña`;
      const text = [
        `Hola ${safeName},`,
        '',
        `Recibimos una solicitud para restablecer tu contraseña en ${branding.platformName}.`,
        'Abre el siguiente enlace en tu navegador (expira en 1 hora):',
        resetUrl,
        '',
        'Si no fuiste tú, ignora este correo.',
      ].join('\n');
      const bodyHtml = `
        <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña en <strong>${branding.platformName}</strong>. Si fuiste tú, abre el siguiente enlace para definir una nueva contraseña. El enlace expira en una hora.</p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${resetUrl}">Restablecer contraseña</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;word-break:break-all;">${resetUrl}</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">Si no solicitaste este cambio, puedes ignorar este mensaje y tu contraseña seguirá igual.</p>
      `.trim();

      await sendOutboundEmail(outboundConfig, {
        to: email,
        subject,
        text,
        html: buildBrandedEmailHtml(bodyHtml, branding),
        replyTo: buildReplyTo(outboundConfig),
      });

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

export async function resetPasswordWithToken(
  tokenRaw: string,
  newPassword: string,
): Promise<{ userId: string }> {
  const token = tokenRaw.trim();
  if (!token) throw new Error('Token requerido');
  if (newPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const passwordHash = await hashPassword(newPassword);

  return await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      const { rows } = await client.query<{
        user_id: string;
        is_active: boolean;
        expires_at: string | null;
      }>(
        `SELECT u.user_id::text,
                u.is_active,
                uc.password_reset_expires_at::text AS expires_at
         FROM app_auth.user_credentials uc
         JOIN app_core.users u ON u.user_id = uc.user_id
         WHERE uc.password_reset_token = $1
         LIMIT 1`,
        [tokenHash],
      );

      const row = rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        throw new Error('El enlace de restablecimiento es inválido o ya fue utilizado.');
      }
      if (!row.is_active) {
        await client.query('ROLLBACK');
        throw new Error('Tu cuenta está inactiva. Contacta a soporte.');
      }
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        await client.query('ROLLBACK');
        throw new Error('El enlace expiró. Solicita uno nuevo desde la pantalla de acceso.');
      }

      await client.query(
        `UPDATE app_auth.user_credentials
         SET password_hash = $2,
             password_updated_at = now(),
             password_reset_token = NULL,
             password_reset_expires_at = NULL,
             password_reset_requested_at = NULL,
             failed_attempts = 0,
             locked_until = NULL,
             updated_at = now()
         WHERE user_id = $1`,
        [row.user_id, passwordHash],
      );

      // Invalidate all active refresh sessions: force re-login everywhere.
      await client.query(
        `UPDATE app_auth.refresh_sessions
         SET revoked_at = now()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [row.user_id],
      );

      await client.query('COMMIT');
      return { userId: row.user_id };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
  firstName: string,
  organizationId: string | null,
): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co').trim().replace(/\/$/, '');
  const verificationUrl = `${appUrl}/verificar?token=${token}`;

  // Use a dedicated connection with its own transaction so the role context
  // (required by RLS on outbound_email_configs) is properly set regardless of
  // whether the caller already committed its transaction.
  let config: OutboundConfigRow | null = null;
  let branding: { platformName: string; logoUrl: string | null } = { platformName: '4Shine', logoUrl: null };
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      await client.query(
        `
          UPDATE app_auth.user_credentials
          SET email_verification_token = $2,
              email_verification_expires_at = $3
          WHERE user_id = $1
        `,
        [userId, tokenHash, expiresAt.toISOString()],
      );

      config = await resolveOutboundConfig(client, organizationId);

      // branding_settings has a public SELECT policy — no user context required
      const brandingQuery = organizationId
        ? `SELECT platform_name, logo_url FROM app_admin.branding_settings WHERE organization_id = $1::uuid LIMIT 1`
        : `SELECT platform_name, logo_url FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`;
      const brandingParams = organizationId ? [organizationId] : [];
      const { rows: brandingRows } = await client.query<{ platform_name: string; logo_url: string | null }>(
        brandingQuery,
        brandingParams,
      );
      if (brandingRows[0]) {
        branding = { platformName: brandingRows[0].platform_name || '4Shine', logoUrl: brandingRows[0].logo_url ?? null };
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });

  if (!config) {
    console.warn('[sendVerificationEmail] No outbound email config found — email not sent for userId:', userId);
    return;
  }

  const payload = buildVerificationEmailPayload(config, email, firstName, verificationUrl, branding);
  await sendOutboundEmail(config, payload);
}

export async function listUsers(client: PoolClient, input: ListUsersInput = {}): Promise<UserRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');

  const limit = clampLimit(input.limit, 200);
  const params: Array<string | number | boolean> = [];
  const filters: string[] = [];

  const search = normalizeSearch(input.search);
  if (search) {
    params.push(search);
    filters.push(`(u.display_name ILIKE $${params.length} OR u.email::text ILIKE $${params.length})`);
  }

  if (input.role && input.role !== 'all') {
    params.push(input.role);
    filters.push(`u.primary_role = $${params.length}`);
  }

  if (input.status === 'active') {
    filters.push('u.is_active = true');
  } else if (input.status === 'inactive') {
    filters.push('u.is_active = false');
  }

  if (input.policyStatus === 'accepted') {
    filters.push('lp.accepted_at IS NOT NULL');
  } else if (input.policyStatus === 'pending') {
    filters.push('lp.accepted_at IS NULL');
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  params.push(limit);

  const { rows } = await client.query<UserRow>(
    `${BASE_SELECT}
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${params.length}`,
    params,
  );

  return rows.map(mapUser);
}

export async function getUserDetail(client: PoolClient, userId: string): Promise<UserDetailRecord> {
  await requireModulePermission(client, 'usuarios', 'view');

  const user = await getUserById(client, userId);

  const [stats, rolePermissions, policyHistory, sessionMeta] = await Promise.all([
    getUserStats(client, userId),
    listRolePermissionMatrix(client, user.primaryRole),
    listUserPolicyAcceptances(client, userId, 30),
    getUserSessionMeta(client, userId),
  ]);

  return {
    ...user,
    passwordUpdatedAt: sessionMeta.password_updated_at,
    lastSessionAt: sessionMeta.last_session_at,
    stats,
    rolePermissions,
    policyHistory,
  };
}

export async function listUserNavigationLogs(
  client: PoolClient,
  input: { limit?: number; userId?: string } = {},
): Promise<AuditLogRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const limit = clampLimit(input.limit, 200);
  const userId = input.userId ?? null;

  const { rows } = await client.query<AuditLogRow>(
    `
      SELECT
        al.audit_id,
        al.actor_user_id::text,
        u.display_name AS actor_name,
        al.action,
        al.module_code,
        al.entity_table,
        al.entity_id::text,
        al.change_summary,
        al.occurred_at::text
      FROM app_admin.audit_logs al
      LEFT JOIN app_core.users u ON u.user_id = al.actor_user_id
      WHERE ($1::uuid IS NULL OR al.actor_user_id = $1::uuid OR al.entity_id = $1::uuid)
      ORDER BY al.occurred_at DESC
      LIMIT $2
    `,
    [userId, limit],
  );

  return rows.map(mapAuditLog);
}

export async function createUser(
  client: PoolClient,
  actor: AuthUser,
  input: CreateUserInput,
): Promise<UserRecord> {
  await requireModulePermission(client, 'usuarios', 'create');

  const passwordHash = await hashPassword(input.password);
  const displayName = input.displayName ?? `${input.firstName} ${input.lastName}`.trim();
  const resolvedPlanType = resolvePlanTypeForCreate(input);
  const normalizedCountry = normalizeCountry(input.country ?? null);
  const normalizedJobRole = normalizeJobRole(input.jobRole ?? null);
  const normalizedGender = normalizeGender(input.gender ?? null);
  const normalizedYearsExperience = normalizeYearsExperience(input.yearsExperience ?? null);
  assertRequiredDemographics({
    country: normalizedCountry,
    jobRole: normalizedJobRole,
    gender: normalizedGender,
    yearsExperience: normalizedYearsExperience,
  });
  let organizationId = input.organizationId ?? null;

  if (!organizationId) {
    const { rows: actorRows } = await client.query<{ organization_id: string | null }>(
      `
        SELECT organization_id::text
        FROM app_core.users
        WHERE user_id = $1::uuid
        LIMIT 1
      `,
      [actor.userId],
    );
    organizationId = actorRows[0]?.organization_id ?? null;
  }

  if (!organizationId) {
    const { rows: fallbackRows } = await client.query<{ organization_id: string }>(
      `
        SELECT organization_id::text
        FROM app_core.organizations
        ORDER BY created_at
        LIMIT 1
      `,
    );
    organizationId = fallbackRows[0]?.organization_id ?? null;
  }

  const { rows } = await client.query<{ user_id: string }>(
    `
      INSERT INTO app_core.users (
        email,
        first_name,
        last_name,
        display_name,
        avatar_initial,
        timezone,
        primary_role,
        is_active,
        organization_id
      )
      VALUES ($1, $2, $3, $4, UPPER(LEFT($4, 1)), $5, $6, true, $7)
      RETURNING user_id::text
    `,
    [
      input.email.trim().toLowerCase(),
      input.firstName,
      input.lastName,
      displayName,
      input.timezone ?? 'America/Bogota',
      input.primaryRole,
      organizationId,
    ],
  );

  const userId = rows[0]?.user_id;
  if (!userId) {
    throw new Error('Failed to create user');
  }

  await client.query(
    `
      INSERT INTO app_auth.user_roles (user_id, role_code, is_default, assigned_by)
      VALUES ($1, $2, true, $3)
      ON CONFLICT (user_id, role_code) DO UPDATE
      SET is_default = EXCLUDED.is_default,
          assigned_by = EXCLUDED.assigned_by,
          assigned_at = now()
    `,
    [userId, input.primaryRole, actor.userId],
  );

  await client.query(
    `
      INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until)
      VALUES ($1, $2, 0, NULL)
      ON CONFLICT (user_id) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          failed_attempts = 0,
          locked_until = NULL,
          password_updated_at = now(),
          updated_at = now()
    `,
    [userId, passwordHash],
  );

  await client.query(
    `
      INSERT INTO app_core.user_profiles (
        user_id,
        profession,
        industry,
        plan_type,
        seniority_level,
        bio,
        location,
        country,
        job_role,
        gender,
        years_experience
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE
      SET profession = EXCLUDED.profession,
          industry = EXCLUDED.industry,
          plan_type = EXCLUDED.plan_type,
          seniority_level = EXCLUDED.seniority_level,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          country = EXCLUDED.country,
          job_role = EXCLUDED.job_role,
          gender = EXCLUDED.gender,
          years_experience = EXCLUDED.years_experience,
          updated_at = now()
    `,
    [
      userId,
      input.profession ?? null,
      input.industry ?? null,
      resolvedPlanType,
      input.seniorityLevel ?? null,
      input.bio ?? null,
      input.location ?? null,
      normalizedCountry,
      normalizedJobRole,
      normalizedGender,
      normalizedYearsExperience,
    ],
  );

  await ensureLeaderProgramPurchase(client, userId, {
    role: input.primaryRole,
    planType: resolvedPlanType,
  });

  return getUserById(client, userId);
}

export async function updateUser(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
  input: UpdateUserInput,
): Promise<UserRecord> {
  await requireModulePermission(client, 'usuarios', 'update');
  const currentUserState = await getUserRoleAndPlan(client, userId);
  const resolvedPlanType = resolvePlanTypeForUpdate(currentUserState, input);
  const nextRole = input.primaryRole ?? currentUserState.primaryRole;
  const shouldUpdatePlanType = resolvedPlanType !== undefined;
  const shouldPersistProfile =
    shouldUpdatePlanType ||
    input.profession !== undefined ||
    input.industry !== undefined ||
    input.seniorityLevel !== undefined ||
    input.bio !== undefined ||
    input.location !== undefined ||
    input.country !== undefined ||
    input.jobRole !== undefined ||
    input.gender !== undefined ||
    input.yearsExperience !== undefined;
  const normalizedCountry = input.country === undefined ? null : normalizeCountry(input.country);
  const normalizedJobRole = input.jobRole === undefined ? null : normalizeJobRole(input.jobRole);
  const normalizedGender = input.gender === undefined ? null : normalizeGender(input.gender);
  const normalizedYearsExperience =
    input.yearsExperience === undefined ? null : normalizeYearsExperience(input.yearsExperience);
  const shouldUpdateCountry = input.country !== undefined;
  const shouldUpdateJobRole = input.jobRole !== undefined;
  const shouldUpdateGender = input.gender !== undefined;
  const shouldUpdateYearsExperience = input.yearsExperience !== undefined;

  await client.query(
    `
      UPDATE app_core.users
      SET
        email = COALESCE($2, email),
        first_name = COALESCE($3, first_name),
        last_name = COALESCE($4, last_name),
        display_name = COALESCE($5, display_name),
        avatar_initial = UPPER(LEFT(COALESCE($5, display_name), 1)),
        timezone = COALESCE($6, timezone),
        primary_role = COALESCE($7, primary_role),
        organization_id = COALESCE($8, organization_id),
        is_active = COALESCE($9, is_active),
        updated_at = now()
      WHERE user_id = $1
    `,
    [
      userId,
      input.email ? input.email.trim().toLowerCase() : null,
      input.firstName ?? null,
      input.lastName ?? null,
      input.displayName ?? null,
      input.timezone ?? null,
      input.primaryRole ?? null,
      input.organizationId ?? null,
      input.isActive ?? null,
    ],
  );

  if (input.primaryRole) {
    await client.query(
      `
        UPDATE app_auth.user_roles
        SET is_default = false
        WHERE user_id = $1
      `,
      [userId],
    );

    await client.query(
      `
        INSERT INTO app_auth.user_roles (user_id, role_code, is_default, assigned_by)
        VALUES ($1, $2, true, $3)
        ON CONFLICT (user_id, role_code) DO UPDATE
        SET is_default = true,
            assigned_by = EXCLUDED.assigned_by,
            assigned_at = now()
      `,
      [userId, input.primaryRole, actor.userId],
    );
  }

  if (input.password) {
    const passwordHash = await hashPassword(input.password);
    await client.query(
      `
        UPDATE app_auth.user_credentials
        SET
          password_hash = $2,
          failed_attempts = 0,
          locked_until = NULL,
          password_updated_at = now(),
          updated_at = now()
        WHERE user_id = $1
      `,
      [userId, passwordHash],
    );
  }

  if (shouldPersistProfile) {
    const { rows: existingRows } = await client.query<{
      country: string | null;
      job_role: JobRole | null;
      gender: string | null;
      years_experience: number | null;
    }>(
      `
        SELECT
          country,
          job_role,
          gender,
          years_experience
        FROM app_core.user_profiles
        WHERE user_id = $1::uuid
        LIMIT 1
      `,
      [userId],
    );
    const existing = existingRows[0];

    const existingCountry = normalizeCountry(existing?.country ?? null);
    const existingJobRole = normalizeJobRole(existing?.job_role ?? null);
    const existingGender = normalizeGender(existing?.gender ?? null);
    const existingYearsExperience = normalizeYearsExperience(existing?.years_experience ?? null);

    const effectiveCountry = (shouldUpdateCountry ? normalizedCountry : existingCountry) ?? USER_PROFILE_DEFAULTS.country;
    const effectiveJobRole = (shouldUpdateJobRole ? normalizedJobRole : existingJobRole) ?? USER_PROFILE_DEFAULTS.jobRole;
    const effectiveGender = (shouldUpdateGender ? normalizedGender : existingGender) ?? USER_PROFILE_DEFAULTS.gender;
    const effectiveYearsExperience = shouldUpdateYearsExperience
      ? normalizedYearsExperience
      : existingYearsExperience ?? USER_PROFILE_DEFAULTS.yearsExperience;

    assertRequiredDemographics({
      country: effectiveCountry,
      jobRole: effectiveJobRole,
      gender: effectiveGender,
      yearsExperience: effectiveYearsExperience,
    });

    await client.query(
      `
        INSERT INTO app_core.user_profiles (
          user_id,
          profession,
          industry,
          plan_type,
          seniority_level,
          bio,
          location,
          country,
          job_role,
          gender,
          years_experience
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $9, $10, $11, $12)
        ON CONFLICT (user_id) DO UPDATE
        SET
          profession = COALESCE($2, app_core.user_profiles.profession),
          industry = COALESCE($3, app_core.user_profiles.industry),
          plan_type = CASE
            WHEN $8::boolean THEN $4
            ELSE app_core.user_profiles.plan_type
          END,
          seniority_level = COALESCE($5, app_core.user_profiles.seniority_level),
          bio = COALESCE($6, app_core.user_profiles.bio),
          location = COALESCE($7, app_core.user_profiles.location),
          country = CASE
            WHEN $13::boolean THEN $9
            ELSE COALESCE(NULLIF(BTRIM(app_core.user_profiles.country), ''), $9)
          END,
          job_role = CASE
            WHEN $14::boolean THEN $10
            ELSE COALESCE(app_core.user_profiles.job_role, $10)
          END,
          gender = CASE
            WHEN $15::boolean THEN $11
            ELSE COALESCE(app_core.user_profiles.gender, $11)
          END,
          years_experience = CASE
            WHEN $16::boolean THEN $12
            ELSE COALESCE(app_core.user_profiles.years_experience, $12)
          END,
          updated_at = now()
      `,
      [
        userId,
        input.profession ?? null,
        input.industry ?? null,
        resolvedPlanType,
        input.seniorityLevel ?? null,
        input.bio ?? null,
        input.location ?? null,
        shouldUpdatePlanType,
        effectiveCountry,
        effectiveJobRole,
        effectiveGender,
        effectiveYearsExperience,
        shouldUpdateCountry,
        shouldUpdateJobRole,
        shouldUpdateGender,
        shouldUpdateYearsExperience,
      ],
    );
  }

  if (input.subscriptionPlanId !== undefined) {
    if (input.subscriptionPlanId === null) {
      await client.query(
        `UPDATE app_core.user_profiles
         SET subscription_plan_id = NULL,
             subscription_started_at = NULL,
             subscription_expires_at = NULL,
             updated_at = now()
         WHERE user_id = $1::uuid`,
        [userId],
      );
    } else {
      const { rows: planRows } = await client.query<{ duration_days: number }>(
        `SELECT duration_days
         FROM app_billing.subscription_plans
         WHERE plan_id = $1::uuid AND is_active = true
         LIMIT 1`,
        [input.subscriptionPlanId],
      );
      if (!planRows[0]) {
        throw new Error('El plan seleccionado no existe o está inactivo.');
      }
      const durationDays = Number(planRows[0].duration_days ?? 0);
      const { rowCount: updated } = await client.query(
        `UPDATE app_core.user_profiles
         SET subscription_plan_id = $2::uuid,
             subscription_started_at = now(),
             subscription_expires_at = now() + ($3::int || ' days')::interval,
             updated_at = now()
         WHERE user_id = $1::uuid`,
        [userId, input.subscriptionPlanId, durationDays],
      );
      if (!updated) {
        throw new Error('No se pudo asignar el plan: el perfil del usuario no existe todavía.');
      }
    }
  }

  await ensureLeaderProgramPurchase(client, userId, {
    role: nextRole,
    planType: resolvedPlanType ?? currentUserState.planType,
    source: 'manual_user_update',
  });

  return getUserById(client, userId);
}

export async function resetUserPassword(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
): Promise<ResetUserPasswordResult> {
  await requireModulePermission(client, 'usuarios', 'update');

  const user = await getUserById(client, userId);
  if (!hasUsableEmail(user.email)) {
    throw new Error('El usuario no tiene un correo válido para reseteo de contraseña');
  }

  const outboundConfig = await resolveOutboundConfig(client, user.organizationId);
  if (!outboundConfig) {
    throw new Error('No hay configuración de correo saliente habilitada para enviar el reset');
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const credentialsResult = await client.query<{ password_updated_at: string }>(
    `
      INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until)
      VALUES ($1, $2, 0, NULL)
      ON CONFLICT (user_id) DO UPDATE
      SET
        password_hash = EXCLUDED.password_hash,
        failed_attempts = 0,
        locked_until = NULL,
        password_updated_at = now(),
        updated_at = now()
      RETURNING password_updated_at::text
    `,
    [user.userId, passwordHash],
  );

  const passwordUpdatedAt = credentialsResult.rows[0]?.password_updated_at;
  if (!passwordUpdatedAt) {
    throw new Error('No fue posible actualizar la contraseña');
  }

  const { rows: brandingRows } = await client.query<{ platform_name: string; logo_url: string | null }>(
    `SELECT platform_name, logo_url FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`,
  );
  const branding: EmailBranding = {
    platformName: brandingRows[0]?.platform_name || '4Shine',
    logoUrl: brandingRows[0]?.logo_url ?? null,
  };

  const payload = buildPasswordResetPayload(outboundConfig, user.email, user.displayName, temporaryPassword, branding);
  const messageId = await sendOutboundEmail(outboundConfig, payload);

  await client.query(
    `
      INSERT INTO app_admin.audit_logs (
        actor_user_id,
        action,
        module_code,
        entity_table,
        entity_id,
        change_summary
      )
      VALUES ($1, 'user_password_reset_email_sent', 'usuarios', 'app_auth.user_credentials', $2, $3::jsonb)
    `,
    [actor.userId, user.userId, JSON.stringify({ recipient: user.email, messageId })],
  );

  return {
    userId: user.userId,
    recipient: user.email,
    messageId,
    passwordUpdatedAt,
  };
}

export async function sendUserDirectMessage(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
  messageText: string,
): Promise<SendUserMessageResult> {
  await requireModulePermission(client, 'usuarios', 'update');

  if (actor.userId === userId) {
    throw new Error('No puedes enviarte un mensaje directo a ti mismo desde esta acción');
  }

  const trimmedMessage = messageText.trim();
  if (!trimmedMessage) {
    throw new Error('El mensaje no puede estar vacío');
  }

  await getUserById(client, userId);

  const thread = await createDirectThread(client, actor, {
    participantUserId: userId,
    title: 'Mensaje administrativo',
  });

  const message = await sendMessage(client, actor, {
    threadId: thread.threadId,
    messageText: trimmedMessage,
  });

  return {
    threadId: thread.threadId,
    messageId: message.messageId,
  };
}

export async function hardDeleteUser(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
): Promise<{ userId: string }> {
  await requireModulePermission(client, 'usuarios', 'delete');

  if (actor.userId === userId) {
    throw new Error('No puedes eliminar tu propio usuario desde la sesión actual');
  }

  await client.query(
    `
      DELETE FROM app_learning.content_reviews
      WHERE reviewer_user_id = $1
    `,
    [userId],
  );

  await client.query(
    `
      DELETE FROM app_learning.content_items
      WHERE created_by = $1
    `,
    [userId],
  );

  await client.query(
    `
      DELETE FROM app_mentoring.mentorship_sessions
      WHERE created_by = $1
         OR mentor_user_id = $1
    `,
    [userId],
  );

  const { rows } = await client.query<{ user_id: string }>(
    `
      DELETE FROM app_core.users
      WHERE user_id = $1
      RETURNING user_id::text
    `,
    [userId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('User not found');
  }

  return {
    userId: deleted.user_id,
  };
}

export interface SelfRegisterInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  profession?: string | null;
  industry?: string | null;
  country: string;
  jobRole: string;
}

export async function selfRegisterUser(
  client: PoolClient,
  input: SelfRegisterInput,
): Promise<UserRecord> {
  const email = input.email.trim().toLowerCase();

  const { rows: existing } = await client.query<{ user_id: string }>(
    `SELECT user_id FROM app_core.users WHERE email = $1 LIMIT 1`,
    [email],
  );
  if (existing.length > 0) {
    throw new Error('Este correo ya está registrado.');
  }

  const rawPassword = input.password ?? randomBytes(32).toString('hex');
  const passwordHash = await hashPassword(rawPassword);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const displayName = `${firstName} ${lastName}`.trim();

  const normalizedCountry = normalizeCountry(input.country);
  const normalizedJobRole = normalizeJobRole(input.jobRole);

  if (!normalizedCountry) throw new Error('País inválido.');
  if (!normalizedJobRole) throw new Error('Cargo inválido.');

  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.organizations ORDER BY created_at LIMIT 1`,
  );
  const organizationId = orgRows[0]?.organization_id ?? null;

  // Enable the self-registration RLS policy for this transaction only.
  await client.query(`SELECT set_config('app.allow_self_register', '1', true)`);

  const { rows } = await client.query<{ user_id: string }>(
    `
      INSERT INTO app_core.users (
        email, first_name, last_name, display_name, avatar_initial,
        timezone, primary_role, is_active, organization_id
      )
      VALUES ($1, $2, $3, $4, UPPER(LEFT($4, 1)), $5, 'lider', true, $6)
      RETURNING user_id::text
    `,
    [email, firstName, lastName, displayName, 'America/Bogota', organizationId],
  );

  const userId = rows[0]?.user_id;
  if (!userId) throw new Error('Error al crear la cuenta.');

  await client.query(
    `
      INSERT INTO app_auth.user_roles (user_id, role_code, is_default, assigned_by)
      VALUES ($1, 'lider', true, $1)
      ON CONFLICT (user_id, role_code) DO UPDATE
      SET is_default = EXCLUDED.is_default, assigned_at = now()
    `,
    [userId],
  );

  await client.query(
    `
      INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until)
      VALUES ($1, $2, 0, NULL)
      ON CONFLICT (user_id) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          failed_attempts = 0,
          locked_until = NULL,
          password_updated_at = now(),
          updated_at = now()
    `,
    [userId, passwordHash],
  );

  await client.query(
    `
      INSERT INTO app_core.user_profiles (
        user_id, profession, industry, plan_type, seniority_level,
        bio, location, country, job_role, gender, years_experience
      )
      VALUES ($1, $2, $3, NULL, NULL, NULL, NULL, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE
      SET profession = EXCLUDED.profession,
          industry = EXCLUDED.industry,
          country = EXCLUDED.country,
          job_role = EXCLUDED.job_role,
          gender = EXCLUDED.gender,
          years_experience = EXCLUDED.years_experience,
          updated_at = now()
    `,
    [
      userId,
      input.profession?.trim() || null,
      input.industry?.trim() || null,
      normalizedCountry,
      normalizedJobRole,
      'Prefiero no decirlo',
      0,
    ],
  );

  return getUserById(client, userId);
}
