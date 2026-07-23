import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { PoolClient } from 'pg';
import { createDirectThread, sendMessage } from '@/features/mensajes/service';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { hashPassword } from '@/server/auth/password';
import { validatePassword } from '@/server/auth/password-policy';
import { revokeAllUserSessions } from '@/server/auth/session';
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
import { insertUserNotification } from '@/features/notificaciones/service';
import { listUserPurchases } from '@/features/access/service';
import type { UserPurchaseRecord } from '@/features/access/types';

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
  subscriptionPlanGroup: string | null;
  subscriptionPlanHighlightLabel: string | null;
  subscriptionPlanPriceAmount: number | null;
  subscriptionPlanCurrencyCode: string | null;
  subscriptionExpiresAt: string | null;
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
  purchases: UserPurchaseRecord[];
}

export interface UserSessionRecord {
  userId: string;
  displayName: string;
  email: string;
  primaryRole: Role;
  planType: PlanType | null;
  lastSessionAt: string | null;
  lastIpAddress: string | null;
  lastUserAgent: string | null;
  isOnline: boolean;
  activeSessionsCount: number;
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
  /** Plan de suscripción específico (solo aplica si primaryRole='lider' y planType es 'premium'/'vip'/'empresa_elite'). */
  subscriptionPlanId?: string | null;
  seniorityLevel?: SeniorityLevel | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
  /** Si true, dispara el evento de bienvenida con credenciales al correo del usuario. */
  sendWelcomeEmail?: boolean;
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
  /**
   * ISO 8601 (YYYY-MM-DD o full timestamp) para fijar manualmente la fecha
   * de vencimiento de la suscripción. Permite al admin extender, acortar o
   * validar licencias sin reasignar el plan. Si subscriptionPlanId se cambia
   * en la misma llamada, se aplica DESPUÉS del plan (puede sobrescribir el
   * `now() + duration_days` automático).
   * - null limpia la fecha (la suscripción queda sin vencimiento).
   * - undefined deja la fecha actual sin cambios.
   */
  subscriptionExpiresAt?: string | null;
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
  subscription_plan_group: string | null;
  subscription_plan_highlight_label: string | null;
  subscription_plan_price_amount: string | number | null;
  subscription_plan_currency_code: string | null;
  subscription_expires_at: string | null;
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

// ensureLeaderProgramPurchase eliminado.
//
// Esta función creaba una entrada sintética en app_billing.user_purchases
// con product_code='program_4shine' para todo líder con plan_type
// subscribed. Su razón de ser era detectar al líder como "subscriber" en
// el modelo previo (cuando todavía no existía
// app_billing.subscription_plans + plan_module_features).
//
// Hoy la fuente de verdad es user_profiles.subscription_plan_id, y el
// fallback legacy en features/access/service.ts deriva el acceso de
// plan_type directamente sin necesidad de la compra sintética. Mantenerla
// generaba ruido visual ("Reemplazado por plan · Legacy") en cada líder
// nuevo y confusión para el admin (parecía haber dos suscripciones).

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
    sp.plan_group::text AS subscription_plan_group,
    sp.highlight_label AS subscription_plan_highlight_label,
    sp.price_amount AS subscription_plan_price_amount,
    sp.currency_code AS subscription_plan_currency_code,
    p.subscription_expires_at::text AS subscription_expires_at,
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
    subscriptionPlanGroup: row.subscription_plan_group,
    subscriptionPlanHighlightLabel: row.subscription_plan_highlight_label,
    subscriptionPlanPriceAmount:
      row.subscription_plan_price_amount === null || row.subscription_plan_price_amount === undefined
        ? null
        : Number(row.subscription_plan_price_amount),
    subscriptionPlanCurrencyCode: row.subscription_plan_currency_code,
    subscriptionExpiresAt: row.subscription_expires_at,
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
  const { smtpSend } = await import('@/lib/smtp-send');
  const result = await smtpSend(config, {
    from: buildFromHeader(config),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: payload.replyTo,
  });
  return result.providerMessageId;
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

  const messageId = await sendViaSmtp(config, payload);
  const isSesSmtp =
    config.provider === 'ses' ||
    /email-smtp\.[a-z0-9-]+\.amazonaws\.com$/i.test(config.smtp_host.trim());
  if (isSesSmtp && messageId) {
    return messageId.replace(/^<|>$/g, '').split('@')[0] ?? messageId;
  }
  return messageId;
}

async function recordUsuariosEmail(
  client: PoolClient,
  params: {
    organizationId: string | null;
    recipientEmail: string;
    recipientUserId: string | null;
    senderUserId: string | null;
    eventKey: string;
    subject: string;
    htmlSnapshot: string;
    textSnapshot: string;
    actionUrl?: string;
    providerMessageId: string | null;
  },
): Promise<void> {
  if (!params.organizationId) return;
  try {
    await insertUserNotification(client, {
      organizationId: params.organizationId,
      userId: params.recipientUserId,
      type: 'info',
      title: params.subject,
      message: params.textSnapshot || params.subject,
      eventKey: params.eventKey,
      actionUrl: params.actionUrl,
      payload: {
        channel: 'email',
        html_snapshot: params.htmlSnapshot,
        text_snapshot: params.textSnapshot,
        is_external: !params.recipientUserId,
      },
      senderUserId: params.senderUserId,
      channel: 'email',
      recipientEmail: params.recipientEmail,
      providerMessageId: params.providerMessageId,
      deliveredAt: null,
    });
  } catch (err) {
    console.error('[usuarios] no se pudo registrar email en historial:', err);
  }
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

      const fullHtml = buildBrandedEmailHtml(bodyHtml, branding);
      const providerMessageId = await sendOutboundEmail(outboundConfig, {
        to: email,
        subject,
        text,
        html: fullHtml,
        replyTo: buildReplyTo(outboundConfig),
      });
      await recordUsuariosEmail(client, {
        organizationId: captured.organizationId,
        recipientEmail: email,
        recipientUserId: captured.userId,
        senderUserId: null,
        eventKey: 'auth.password_reset',
        subject,
        htmlSnapshot: fullHtml,
        textSnapshot: text,
        actionUrl: resetUrl,
        providerMessageId,
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
  let branding: {
    platformName: string;
    logoUrl: string | null;
    logoDarkUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    typography?: string | null;
  } = { platformName: '4Shine', logoUrl: null };
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

      // branding_settings has a public SELECT policy — no user context required.
      // Traemos también primary_color, accent_color, typography para que
      // buildBrandedEmailHtml respete las directivas del branding.
      const brandingCols =
        'platform_name, logo_url, logo_dark_url, primary_color, accent_color, typography';
      const brandingQuery = organizationId
        ? `SELECT ${brandingCols} FROM app_admin.branding_settings WHERE organization_id = $1::uuid LIMIT 1`
        : `SELECT ${brandingCols} FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`;
      const brandingParams = organizationId ? [organizationId] : [];
      const { rows: brandingRows } = await client.query<{
        platform_name: string;
        logo_url: string | null;
        logo_dark_url: string | null;
        primary_color: string | null;
        accent_color: string | null;
        typography: string | null;
      }>(brandingQuery, brandingParams);
      if (brandingRows[0]) {
        branding = {
          platformName: brandingRows[0].platform_name || '4Shine',
          logoUrl: brandingRows[0].logo_url ?? null,
          logoDarkUrl: brandingRows[0].logo_dark_url ?? null,
          primaryColor: brandingRows[0].primary_color ?? null,
          accentColor: brandingRows[0].accent_color ?? null,
          typography: brandingRows[0].typography ?? null,
        };
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
  const providerMessageId = await sendOutboundEmail(config, payload);
  await withClient(async (client) => {
    await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);
    await recordUsuariosEmail(client, {
      organizationId,
      recipientEmail: email,
      recipientUserId: userId,
      senderUserId: null,
      eventKey: 'auth.email_verification',
      subject: payload.subject,
      htmlSnapshot: payload.html,
      textSnapshot: payload.text,
      actionUrl: verificationUrl,
      providerMessageId,
    });
  });
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

  const [stats, rolePermissions, policyHistory, sessionMeta, purchases] = await Promise.all([
    getUserStats(client, userId),
    listRolePermissionMatrix(client, user.primaryRole),
    listUserPolicyAcceptances(client, userId, 30),
    getUserSessionMeta(client, userId),
    listUserPurchases(client, userId),
  ]);

  return {
    ...user,
    passwordUpdatedAt: sessionMeta.password_updated_at,
    lastSessionAt: sessionMeta.last_session_at,
    stats,
    rolePermissions,
    policyHistory,
    purchases,
  };
}

/**
 * Lista de usuarios con metadata de sesión (último acceso, online ahora).
 * Online = sesión refresh con last_used_at en los últimos N minutos.
 */
export async function listUserSessions(
  client: PoolClient,
  input: { onlyOnline?: boolean; limit?: number; onlineThresholdMinutes?: number } = {},
): Promise<UserSessionRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const limit = clampLimit(input.limit, 500);
  const threshold = Math.max(1, Math.min(input.onlineThresholdMinutes ?? 5, 60));

  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    email: string;
    primary_role: Role;
    plan_type: PlanType | null;
    last_session_at: string | null;
    last_ip_address: string | null;
    last_user_agent: string | null;
    active_sessions_count: number;
    is_online: boolean;
  }>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.email::text,
        u.primary_role,
        up.plan_type,
        latest.last_used_at::text   AS last_session_at,
        latest.ip_address::text     AS last_ip_address,
        latest.user_agent           AS last_user_agent,
        COALESCE(active.cnt, 0)::int AS active_sessions_count,
        (latest.last_used_at IS NOT NULL
         AND latest.last_used_at > now() - ($1 || ' minutes')::interval) AS is_online
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT rs.last_used_at, rs.ip_address, rs.user_agent
        FROM app_auth.refresh_sessions rs
        WHERE rs.user_id = u.user_id
        ORDER BY rs.last_used_at DESC NULLS LAST
        LIMIT 1
      ) latest ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM app_auth.refresh_sessions rs2
        WHERE rs2.user_id = u.user_id
          AND rs2.revoked_at IS NULL
          AND rs2.expires_at > now()
      ) active ON true
      WHERE u.is_active = true
        AND ($2::boolean = false OR (
          latest.last_used_at IS NOT NULL
          AND latest.last_used_at > now() - ($1 || ' minutes')::interval
        ))
      ORDER BY latest.last_used_at DESC NULLS LAST
      LIMIT $3
    `,
    [threshold, input.onlyOnline ?? false, limit],
  );

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    primaryRole: row.primary_role,
    planType: row.plan_type,
    lastSessionAt: row.last_session_at,
    lastIpAddress: row.last_ip_address,
    lastUserAgent: row.last_user_agent,
    activeSessionsCount: Number(row.active_sessions_count ?? 0),
    isOnline: row.is_online,
  }));
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
  // País, cargo, género y años de experiencia son opcionales al crear el
  // usuario manualmente (el propio usuario los completa en el onboarding
  // de su primer ingreso). Se preservan como NULL si no llegan en el input.
  const normalizedCountry = normalizeCountry(input.country ?? null);
  const normalizedJobRole = normalizeJobRole(input.jobRole ?? null);
  const normalizedGender = normalizeGender(input.gender ?? null);
  const normalizedYearsExperience = normalizeYearsExperience(input.yearsExperience ?? null);
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
      INSERT INTO app_auth.user_credentials (
        user_id, password_hash, failed_attempts, locked_until,
        must_change_password, email_verified_at
      )
      VALUES ($1, $2, 0, NULL, $3, now())
      ON CONFLICT (user_id) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          failed_attempts = 0,
          locked_until = NULL,
          must_change_password = EXCLUDED.must_change_password,
          email_verified_at = COALESCE(app_auth.user_credentials.email_verified_at, now()),
          password_updated_at = now(),
          updated_at = now()
    `,
    // email_verified_at = now(): la cuenta la crea un admin o el sistema (compra
    // GHL), no el propio usuario. La verificación por correo existe para que
    // quien SE REGISTRA pruebe que controla su bandeja; aquí un tercero de
    // confianza afirma el correo y las credenciales viajan a esa misma bandeja.
    // Sin esto el login bloqueaba con "correo pendiente de verificación" pese a
    // haber recibido la contraseña.
    //
    // must_change_password: si la contraseña se envió por correo, es temporal y
    // debe cambiarse en el primer ingreso.
    [userId, passwordHash, input.sendWelcomeEmail === true],
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

  // Antes aquí se llamaba ensureLeaderProgramPurchase, que insertaba un
  // user_purchases sintético con product_code='program_4shine' (legacy)
  // para todo líder con plan_type subscribed. Con el modelo nuevo de
  // subscription_plans esa inserción es redundante (la licencia ahora es
  // user_profiles.subscription_plan_id) y aparecía como "Reemplazado por
  // plan" en el perfil. Se elimina para no crear historial sintético.

  // Asignar plan de suscripción específico si vino en el input y aplica.
  if (
    input.subscriptionPlanId &&
    input.primaryRole === 'lider' &&
    resolvedPlanType &&
    SUBSCRIBED_LEADER_PLAN_TYPES.has(resolvedPlanType)
  ) {
    const { rows: planRows } = await client.query<{ duration_days: number }>(
      `SELECT duration_days FROM app_billing.subscription_plans
       WHERE plan_id = $1::uuid AND is_active = true LIMIT 1`,
      [input.subscriptionPlanId],
    );
    const durationDays = Number(planRows[0]?.duration_days ?? 0);
    if (durationDays > 0) {
      await client.query(
        `UPDATE app_core.user_profiles
         SET subscription_plan_id   = $2::uuid,
             subscription_started_at = now(),
             subscription_expires_at = now() + ($3::int || ' days')::interval,
             updated_at = now()
         WHERE user_id = $1::uuid`,
        [userId, input.subscriptionPlanId, durationDays],
      );
    }
  }

  // Email de bienvenida con credenciales (si el admin lo solicitó).
  if (input.sendWelcomeEmail) {
    try {
      const { dispatchNotification } = await import('@/features/notificaciones/engine');
      const { rows: orgRows } = await client.query<{ organization_id: string | null }>(
        `SELECT organization_id::text FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
        [userId],
      );
      const organizationId = orgRows[0]?.organization_id ?? null;
      const recipientEmail = input.email.trim();
      if (organizationId && recipientEmail) {
        const platformUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co';
        await dispatchNotification(client, {
          organizationId,
          recipientUserId: userId,
          recipientEmail,
          eventKey: 'auth.account_created_by_admin',
          variables: {
            nombre: input.firstName,
            nombre_completo: displayName,
            correo: recipientEmail,
            contrasena: input.password,
            enlace_plataforma: `${platformUrl}/acceso`,
            remitente_nombre: actor.name ?? actor.email ?? 'Equipo 4Shine',
          },
          senderUserId: actor.userId,
        });
      }
    } catch (err) {
      console.error('[createUser] welcome email dispatch failed:', err);
    }
  }

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

  // El permiso usuarios:update lo tiene también el gestor, así que por sí solo
  // no basta: con él, un gestor podía asignarse primaryRole='admin' y quedarse
  // con la plataforma, o cambiar el correo de un admin al suyo y pedir un
  // restablecimiento de contraseña.
  //
  // El corte es por PRIVILEGIO, no por "cualquier cambio de rol": el gestor
  // sigue administrando líderes e invitados con normalidad —incluida la
  // promoción invitado → líder al asignarle un plan—, que es justo su trabajo.
  const PRIVILEGED_ROLES = new Set(['admin', 'gestor']);
  const actorIsAdmin = actor.role === 'admin';

  if (!actorIsAdmin) {
    if (input.primaryRole !== undefined && PRIVILEGED_ROLES.has(input.primaryRole)) {
      throw new ForbiddenError('Solo un administrador puede otorgar el rol de administrador o gestor.');
    }
    if (PRIVILEGED_ROLES.has(currentUserState.primaryRole ?? '')) {
      throw new ForbiddenError('Solo un administrador puede modificar una cuenta de administrador o gestor.');
    }
  }

  // Ni siquiera un admin cambia su propio rol: evita la auto-degradación
  // accidental (quedarse sin ningún admin) y elimina el auto-ascenso como
  // vector si alguna cuenta admin queda comprometida a medias.
  if (
    input.primaryRole !== undefined &&
    input.primaryRole !== currentUserState.primaryRole &&
    userId === actor.userId
  ) {
    throw new ForbiddenError('No puedes cambiar tu propio rol. Pídeselo a otro administrador.');
  }

  const resolvedPlanType = resolvePlanTypeForUpdate(currentUserState, input);
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

  // Detectamos si efectivamente CAMBIÓ el rol (no solo si vino en el input).
  // Esto importa para decidir si invalidar las sesiones del usuario.
  const roleChanged =
    input.primaryRole !== undefined &&
    input.primaryRole !== currentUserState.primaryRole;
  const userDeactivated = input.isActive === false;

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

  // Si cambió el rol o se desactivó al usuario, revocamos TODAS sus sesiones
  // de refresh activas. Combinado con la re-lectura del rol en
  // authenticateRequest, esto garantiza que en el próximo request el usuario
  // sea forzado a hacer login y reciba un JWT con el rol nuevo, evitando
  // que siga viendo acciones/datos del rol anterior.
  if (roleChanged || userDeactivated) {
    await revokeAllUserSessions(client, userId);
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

  // Override manual de la fecha de vencimiento. Se aplica después de
  // subscriptionPlanId para permitir que admin extienda o acorte la
  // licencia. null limpia la fecha (sin vencimiento).
  if (input.subscriptionExpiresAt !== undefined) {
    if (input.subscriptionExpiresAt === null) {
      await client.query(
        `UPDATE app_core.user_profiles
         SET subscription_expires_at = NULL,
             updated_at = now()
         WHERE user_id = $1::uuid`,
        [userId],
      );
    } else {
      const parsed = new Date(input.subscriptionExpiresAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error('subscriptionExpiresAt debe ser una fecha ISO 8601 válida.');
      }
      await client.query(
        `UPDATE app_core.user_profiles
         SET subscription_expires_at = $2::timestamptz,
             updated_at = now()
         WHERE user_id = $1::uuid`,
        [userId, parsed.toISOString()],
      );
    }
  }

  // Idem createUser: ya no se crea / mantiene la compra sintética
  // program_4shine. La licencia vive en user_profiles.subscription_plan_id.

  return getUserById(client, userId);
}

export async function resetUserPassword(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
): Promise<ResetUserPasswordResult> {
  await requireModulePermission(client, 'usuarios', 'update');

  // Un gestor no restablece la contraseña de un administrador: sería la otra
  // mitad de la escalada (cambiar el correo del admin y luego pedir el reset).
  const targetState = await getUserRoleAndPlan(client, userId);
  if (targetState.primaryRole === 'admin' && actor.role !== 'admin') {
    throw new ForbiddenError(
      'Solo un administrador puede restablecer la contraseña de otro administrador.',
    );
  }

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
      -- must_change_password: la contraseña la generó un admin y viajó por
      -- correo, así que es una credencial temporal. Obliga a cambiarla en el
      -- primer ingreso en lugar de dejarla vigente indefinidamente.
      INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until, must_change_password)
      VALUES ($1, $2, 0, NULL, true)
      ON CONFLICT (user_id) DO UPDATE
      SET
        password_hash = EXCLUDED.password_hash,
        failed_attempts = 0,
        locked_until = NULL,
        must_change_password = true,
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

  const { rows: brandingRows } = await client.query<{
    platform_name: string;
    logo_url: string | null;
    logo_dark_url: string | null;
    primary_color: string | null;
    accent_color: string | null;
    typography: string | null;
  }>(
    `SELECT platform_name, logo_url, logo_dark_url, primary_color, accent_color, typography
     FROM app_admin.branding_settings ORDER BY updated_at DESC LIMIT 1`,
  );
  const branding: EmailBranding = {
    platformName: brandingRows[0]?.platform_name || '4Shine',
    logoUrl: brandingRows[0]?.logo_url ?? null,
    logoDarkUrl: brandingRows[0]?.logo_dark_url ?? null,
    primaryColor: brandingRows[0]?.primary_color ?? null,
    accentColor: brandingRows[0]?.accent_color ?? null,
    typography: brandingRows[0]?.typography ?? null,
  };

  const payload = buildPasswordResetPayload(outboundConfig, user.email, user.displayName, temporaryPassword, branding);
  const messageId = await sendOutboundEmail(outboundConfig, payload);
  await recordUsuariosEmail(client, {
    organizationId: user.organizationId,
    recipientEmail: user.email,
    recipientUserId: user.userId,
    senderUserId: actor.userId,
    eventKey: 'auth.password_reset_admin',
    subject: payload.subject,
    htmlSnapshot: payload.html,
    textSnapshot: payload.text,
    providerMessageId: messageId,
  });

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

/**
 * Snapshotea la identidad del usuario que está a punto de borrarse en
 * app_admin.deleted_users_log para que el admin pueda consultar el
 * reporte de bajas. Debe llamarse ANTES del DELETE FROM users porque
 * algunos campos (email, display_name, organization) viven en esa tabla.
 */
async function snapshotDeletedUser(
  client: PoolClient,
  userId: string,
  source: 'self' | 'admin',
  actor: AuthUser,
  reason?: string,
): Promise<void> {
  const { rows } = await client.query<{
    user_id: string;
    email: string;
    display_name: string;
    primary_role: string;
    organization_id: string | null;
    organization_name: string | null;
  }>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.display_name,
        u.primary_role::text,
        u.organization_id::text,
        o.name AS organization_name
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      WHERE u.user_id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );
  const target = rows[0];
  if (!target) return;

  await client.query(
    `
      INSERT INTO app_admin.deleted_users_log (
        user_id,
        email,
        display_name,
        primary_role,
        organization_id,
        organization_name,
        deleted_source,
        deleted_by_id,
        deleted_by_email,
        deleted_by_name,
        reason
      )
      VALUES ($1::uuid, $2, $3, $4, $5::uuid, $6, $7, $8::uuid, $9, $10, $11)
    `,
    [
      target.user_id,
      target.email,
      target.display_name,
      target.primary_role,
      target.organization_id,
      target.organization_name,
      source,
      source === 'self' ? null : actor.userId,
      source === 'self' ? null : (actor.email ?? null),
      source === 'self' ? null : (actor.name ?? null),
      reason ?? null,
    ],
  );
}

/**
 * Borra explícitamente todas las FK con ON DELETE RESTRICT antes del
 * DELETE FROM app_core.users para garantizar el borrado completo.
 * Compartido entre el flujo admin (hardDeleteUser) y el flujo de
 * auto-baja (deleteOwnAccount).
 */
async function purgeUserRestrictReferences(client: PoolClient, userId: string): Promise<void> {
  // --- Aprendizaje
  await client.query(
    `DELETE FROM app_learning.content_reviews WHERE reviewer_user_id = $1`,
    [userId],
  );
  await client.query(
    `DELETE FROM app_learning.content_items WHERE created_by = $1`,
    [userId],
  );

  // --- Mentoring
  await client.query(
    `DELETE FROM app_mentoring.mentorship_session_change_logs WHERE changed_by = $1`,
    [userId],
  );
  await client.query(
    `DELETE FROM app_mentoring.group_session_events WHERE created_by = $1`,
    [userId],
  );
  await client.query(
    `DELETE FROM app_mentoring.group_session_recordings WHERE created_by = $1`,
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
}

export async function hardDeleteUser(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
  reason?: string | null,
): Promise<{ userId: string }> {
  await requireModulePermission(client, 'usuarios', 'delete');

  if (actor.userId === userId) {
    throw new Error('No puedes eliminar tu propio usuario desde la sesión actual');
  }

  // Borrado completo. La mayoría de las FK a app_core.users.user_id tienen
  // ON DELETE CASCADE (workbooks, progreso, mensajes, conexiones, etc.) o
  // ON DELETE SET NULL (logs de auditoría, plantillas creadas por el
  // usuario, columnas como created_by en branding/integrations — preserva
  // el historial del sistema con el creador anonimizado).
  //
  // Pero quedan FK con ON DELETE RESTRICT que bloquearían el DELETE final
  // si el usuario tiene esos registros. Aquí los limpiamos explícitamente
  // antes del borrado del usuario para garantizar "se borran todos sus
  // datos e historial" sin dejar huérfanos ni bloquear el delete.

  await snapshotDeletedUser(client, userId, 'admin', actor, reason ?? undefined);
  await purgeUserRestrictReferences(client, userId);

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

/**
 * El propio usuario solicita la baja completa de su cuenta. Borra todos
 * sus datos e historial igual que el flujo admin (purgeUserRestrictReferences
 * + CASCADE en las FK). No requiere permiso de módulo `usuarios.delete`
 * porque el actor sólo se borra a sí mismo.
 */
export interface DeletedUserRecord {
  logId: string;
  userId: string;
  email: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
  deletedAt: string;
  deletedSource: 'self' | 'admin';
  deletedById: string | null;
  deletedByEmail: string | null;
  deletedByName: string | null;
  reason: string | null;
}

export async function listDeletedUsers(
  client: PoolClient,
  actor: AuthUser,
): Promise<DeletedUserRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');
  if (actor.role !== 'admin' && actor.role !== 'gestor') {
    throw new ForbiddenError('Sólo admin o gestor pueden consultar el reporte de bajas.');
  }

  const { rows } = await client.query<{
    log_id: string;
    user_id: string;
    email: string;
    display_name: string;
    primary_role: string;
    organization_name: string | null;
    deleted_at: string;
    deleted_source: 'self' | 'admin';
    deleted_by_id: string | null;
    deleted_by_email: string | null;
    deleted_by_name: string | null;
    reason: string | null;
  }>(
    `
      SELECT
        log_id::text,
        user_id::text,
        email,
        display_name,
        primary_role,
        organization_name,
        deleted_at::text,
        deleted_source,
        deleted_by_id::text,
        deleted_by_email,
        deleted_by_name,
        reason
      FROM app_admin.deleted_users_log
      ORDER BY deleted_at DESC
      LIMIT 500
    `,
  );

  return rows.map((row) => ({
    logId: row.log_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    primaryRole: row.primary_role,
    organizationName: row.organization_name,
    deletedAt: row.deleted_at,
    deletedSource: row.deleted_source,
    deletedById: row.deleted_by_id,
    deletedByEmail: row.deleted_by_email,
    deletedByName: row.deleted_by_name,
    reason: row.reason,
  }));
}

export async function deleteOwnAccount(
  client: PoolClient,
  actor: AuthUser,
  reason?: string | null,
): Promise<{ userId: string }> {
  const trimmed = reason?.trim() ?? '';
  await snapshotDeletedUser(
    client,
    actor.userId,
    'self',
    actor,
    trimmed.length > 0 ? trimmed : 'user_initiated_deletion',
  );
  await purgeUserRestrictReferences(client, actor.userId);

  const { rows } = await client.query<{ user_id: string }>(
    `
      DELETE FROM app_core.users
      WHERE user_id = $1
      RETURNING user_id::text
    `,
    [actor.userId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Cuenta no encontrada o ya fue eliminada.');
  }

  return { userId: deleted.user_id };
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

  // La política se aplica en el SERVICIO, no solo en la ruta: así cubre a
  // cualquier futuro llamador. Si no hay contraseña es un registro por Google y
  // se genera un secreto aleatorio inutilizable.
  if (input.password !== undefined) {
    const check = validatePassword(input.password);
    if (!check.ok) throw new Error(check.error ?? 'Contraseña inválida');
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

// ─── Acciones masivas (admin) ───────────────────────────────────────────────

export interface BulkActionResult {
  affected: number;
  errors: Array<{ userId: string; error: string }>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function bulkExtendSubscription(
  client: PoolClient,
  _actor: AuthUser,
  userIds: string[],
  days: number,
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'update');
  if (!Number.isFinite(days) || days <= 0) throw new Error('Número de días inválido');
  if (userIds.length === 0) return { affected: 0, errors: [] };
  const { rowCount } = await client.query(
    `UPDATE app_core.user_profiles
     SET subscription_expires_at = GREATEST(COALESCE(subscription_expires_at, now()), now()) + ($2 || ' days')::interval,
         updated_at = now()
     WHERE user_id = ANY($1::uuid[])`,
    [userIds, String(Math.floor(days))],
  );
  return { affected: rowCount ?? 0, errors: [] };
}

export async function bulkRevokeSessions(
  client: PoolClient,
  _actor: AuthUser,
  userIds: string[],
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (userIds.length === 0) return { affected: 0, errors: [] };
  await client.query(
    `UPDATE app_auth.refresh_sessions SET revoked_at = now()
     WHERE user_id = ANY($1::uuid[]) AND revoked_at IS NULL`,
    [userIds],
  );
  return { affected: userIds.length, errors: [] };
}

export async function bulkForcePasswordChange(
  client: PoolClient,
  _actor: AuthUser,
  userIds: string[],
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (userIds.length === 0) return { affected: 0, errors: [] };
  await client.query(
    `UPDATE app_auth.user_credentials SET must_change_password = true, updated_at = now()
     WHERE user_id = ANY($1::uuid[])`,
    [userIds],
  );
  // Revocamos sesiones para forzar el re-login y que pasen por el gate.
  await client.query(
    `UPDATE app_auth.refresh_sessions SET revoked_at = now()
     WHERE user_id = ANY($1::uuid[]) AND revoked_at IS NULL`,
    [userIds],
  );
  return { affected: userIds.length, errors: [] };
}

export async function bulkSendMessage(
  client: PoolClient,
  actor: AuthUser,
  userIds: string[],
  input: { title: string; body: string; channels: Array<'in_app' | 'email'> },
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (userIds.length === 0) return { affected: 0, errors: [] };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error('El título y el mensaje son obligatorios.');
  const channels = input.channels.length > 0 ? input.channels : (['in_app'] as Array<'in_app' | 'email'>);

  const { sendBulkMessage: sendBulk } = await import('@/features/notificaciones/bulk-service');
  const result = await sendBulk(client, actor, {
    recipientUserIds: userIds,
    channels,
    custom: {
      subject: title,
      bodyHtml: `<p>${escapeHtml(body).replace(/\n/g, '<br/>')}</p>`,
      bodyText: body,
      inAppTitle: title,
      inAppBody: body,
      inAppType: 'message',
    },
  });
  return { affected: result.totalRecipients, errors: result.errors };
}

// ─── Organizaciones (gestión solo admin) ─────────────────────────────────────

export interface OrganizationRecord {
  organizationId: string;
  name: string;
}

export async function listOrganizations(
  client: PoolClient,
  _actor: AuthUser,
): Promise<OrganizationRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');
  const { rows } = await client.query<{ organization_id: string; name: string }>(
    `SELECT organization_id::text, name FROM app_core.organizations ORDER BY name`,
  );
  return rows.map((r) => ({ organizationId: r.organization_id, name: r.name }));
}

export async function createOrganization(
  client: PoolClient,
  _actor: AuthUser,
  name: string,
): Promise<OrganizationRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const clean = name.trim();
  if (!clean) throw new Error('El nombre de la organización es obligatorio.');
  const { rows } = await client.query<{ organization_id: string; name: string }>(
    `INSERT INTO app_core.organizations (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET updated_at = now()
     RETURNING organization_id::text, name`,
    [clean],
  );
  return { organizationId: rows[0].organization_id, name: rows[0].name };
}

export async function bulkSetOrganization(
  client: PoolClient,
  _actor: AuthUser,
  userIds: string[],
  organizationId: string,
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (userIds.length === 0) return { affected: 0, errors: [] };
  const { rows: orgRows } = await client.query(
    `SELECT 1 FROM app_core.organizations WHERE organization_id = $1::uuid`,
    [organizationId],
  );
  if (orgRows.length === 0) throw new Error('Organización no encontrada.');
  await client.query(
    `UPDATE app_core.users SET organization_id = $2::uuid WHERE user_id = ANY($1::uuid[])`,
    [userIds, organizationId],
  );
  return { affected: userIds.length, errors: [] };
}

/**
 * Asigna (o cambia) un plan de suscripción a varios usuarios de golpe.
 *
 * Refleja el flujo de un solo usuario (updateUser con subscriptionPlanId): fija
 * subscription_plan_id + inicio + vigencia según duration_days del plan. El
 * acceso lo derivan las features del plan, no plan_type. Los invitados se
 * promueven a líder — un plan pagado no tiene sentido en un invitado.
 */
export async function bulkAssignPlan(
  client: PoolClient,
  _actor: AuthUser,
  userIds: string[],
  planId: string,
): Promise<BulkActionResult> {
  await requireModulePermission(client, 'usuarios', 'update');
  if (userIds.length === 0) return { affected: 0, errors: [] };

  const { rows: planRows } = await client.query<{ duration_days: number }>(
    `SELECT duration_days FROM app_billing.subscription_plans
     WHERE plan_id = $1::uuid AND is_active = true LIMIT 1`,
    [planId],
  );
  if (!planRows[0]) throw new Error('El plan seleccionado no existe o está inactivo.');
  const durationDays = Number(planRows[0].duration_days ?? 0);

  // Un invitado que recibe un plan pasa a líder (mismo criterio que el flujo
  // individual). No se tocan mentor/gestor/admin.
  await client.query(
    `UPDATE app_core.users SET primary_role = 'lider', updated_at = now()
     WHERE user_id = ANY($1::uuid[]) AND primary_role = 'invitado'`,
    [userIds],
  );

  const { rowCount } = await client.query(
    `UPDATE app_core.user_profiles
        SET subscription_plan_id    = $2::uuid,
            subscription_started_at = now(),
            subscription_expires_at = now() + ($3::int || ' days')::interval,
            updated_at = now()
      WHERE user_id = ANY($1::uuid[])`,
    [userIds, planId, durationDays],
  );
  return { affected: rowCount ?? 0, errors: [] };
}

// ─── Resumen de Networking de un usuario (para el detalle admin) ─────────────

export interface UserNetworkingCommunity {
  name: string;
  memberCount: number;
}

export interface UserNetworkingSummary {
  networkingEnabled: boolean;
  contacts: number;
  pending: number;
  communities: UserNetworkingCommunity[];
}

export async function getUserNetworkingSummary(
  client: PoolClient,
  targetUserId: string,
): Promise<UserNetworkingSummary> {
  await requireModulePermission(client, 'usuarios', 'view');

  const { rows: userRows } = await client.query<{ primary_role: string }>(
    `SELECT primary_role FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
    [targetUserId],
  );
  const role = userRows[0]?.primary_role ?? '';
  if (!role) {
    return { networkingEnabled: false, contacts: 0, pending: 0, communities: [] };
  }

  // Gating: roles operativos (admin/gestor/mentor) tienen networking; el
  // invitado no; el líder depende de las features de su plan activo.
  let networkingEnabled: boolean;
  if (role === 'invitado') {
    networkingEnabled = false;
  } else if (role !== 'lider') {
    networkingEnabled = true;
  } else {
    const { rows } = await client.query<{ is_enabled: boolean }>(
      `SELECT pmf.is_enabled
       FROM app_core.user_profiles up
       JOIN app_billing.subscription_plans sp
         ON sp.plan_id = up.subscription_plan_id AND sp.is_active = true
       JOIN app_billing.plan_module_features pmf
         ON pmf.plan_id = sp.plan_id AND pmf.feature_key = 'networking'
       WHERE up.user_id = $1::uuid
         AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
       LIMIT 1`,
      [targetUserId],
    );
    networkingEnabled = rows[0]?.is_enabled ?? false;
  }

  if (!networkingEnabled) {
    return { networkingEnabled: false, contacts: 0, pending: 0, communities: [] };
  }

  const [{ rows: contactRows }, { rows: pendingRows }, { rows: communityRows }] = await Promise.all([
    client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM app_networking.connections
       WHERE status = 'connected' AND (requester_user_id = $1::uuid OR addressee_user_id = $1::uuid)`,
      [targetUserId],
    ),
    client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM app_networking.connections
       WHERE status = 'pending' AND addressee_user_id = $1::uuid`,
      [targetUserId],
    ),
    client.query<{ name: string; member_count: number }>(
      `SELECT ig.name,
              (SELECT count(*)::int FROM app_networking.group_memberships gm2 WHERE gm2.group_id = ig.group_id) AS member_count
       FROM app_networking.group_memberships gm
       JOIN app_networking.interest_groups ig ON ig.group_id = gm.group_id
       WHERE gm.user_id = $1::uuid AND ig.is_active = true
       ORDER BY ig.is_general DESC, ig.created_at DESC
       LIMIT 50`,
      [targetUserId],
    ),
  ]);

  return {
    networkingEnabled: true,
    contacts: contactRows[0]?.n ?? 0,
    pending: pendingRows[0]?.n ?? 0,
    communities: communityRows.map((c) => ({ name: c.name, memberCount: c.member_count })),
  };
}
