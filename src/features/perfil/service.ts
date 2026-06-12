import type { PoolClient } from 'pg';
import JSZip from 'jszip';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import {
  USER_COUNTRY_SET,
  USER_GENDER_SET,
  USER_JOB_ROLE_OPTIONS,
  type UserJobRoleOption,
} from '@/lib/user-demographics';
import { listUserPurchases } from '@/features/access/service';
import type { UserPurchaseRecord } from '@/features/access/types';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';
type JobRole = UserJobRoleOption;

export interface ProfileProjectRecord {
  projectId: string;
  title: string;
  description: string | null;
  projectRole: string | null;
  imageUrl: string | null;
}

export type AdviserPillarCode = 'shine_within' | 'shine_out' | 'shine_up' | 'shine_beyond';

export interface AdviserTopicRecord {
  topicId: string;
  topicLabel: string;
  pillarCode: AdviserPillarCode;
}

export interface AdviserProfileRecord {
  experiencia: string | null;
  precioSesion: number | null;
  currencyCode: string;
  temas: AdviserTopicRecord[];
}

export interface AdviserTopicInput {
  topicLabel: string;
  pillarCode: AdviserPillarCode;
}

export interface AdviserProfileInput {
  experiencia?: string | null;
  precioSesion?: number | null;
  temas?: AdviserTopicInput[];
}

const ADVISER_PILLAR_SET = new Set<AdviserPillarCode>([
  'shine_within',
  'shine_out',
  'shine_up',
  'shine_beyond',
]);

const ADVISER_PRECIO_MIN = 180000;
const ADVISER_PRECIO_MAX = 500000;

export interface MyProfileRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarInitial: string | null;
  avatarUrl: string | null;
  timezone: string;
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
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  interests: string[];
  projects: ProfileProjectRecord[];
  purchases: UserPurchaseRecord[];
  adviserProfile: AdviserProfileRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileProjectInput {
  title: string;
  description?: string | null;
  projectRole?: string | null;
  imageUrl?: string | null;
}

export interface UpdateMyProfileInput {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  profession?: string | null;
  industry?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  interests?: string[];
  projects?: ProfileProjectInput[];
  adviserProfile?: AdviserProfileInput;
}

export interface ExtractProfileFromCvInput {
  fileUrl: string;
}

export interface ExtractedCvProject {
  title: string;
  description: string;
  projectRole: string;
}

export interface ExtractedAdviserTopic {
  topicLabel: string;
  pillarCode: 'shine_within' | 'shine_out' | 'shine_up' | 'shine_beyond';
}

export interface ExtractProfileFromCvResult {
  firstName: string;
  lastName: string;
  profession: string;
  industry: string;
  location: string;
  bio: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  interests: string[];
  country: string;
  jobRole: JobRole | '';
  gender: 'Hombre' | 'Mujer' | 'Prefiero no decirlo' | '';
  yearsExperience: number | null;
  timezone: string;
  projects: ExtractedCvProject[];
  adviserExperiencia: string;
  adviserTemas: ExtractedAdviserTopic[];
}

interface ProfileRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_initial: string | null;
  avatar_url: string | null;
  timezone: string;
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
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

interface InterestRow {
  name: string;
}

interface ProjectRow {
  project_id: string;
  title: string;
  description: string | null;
  project_role: string | null;
  image_url: string | null;
}

const JOB_ROLE_SET = new Set<JobRole>(USER_JOB_ROLE_OPTIONS);

function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined) return null;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredText(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.length > 0) return trimmed;
  return fallback;
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
  const normalized = normalizeText(value);
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

function splitDisplayName(displayName: string, fallbackFirstName: string, fallbackLastName: string): {
  firstName: string;
  lastName: string;
} {
  const clean = displayName.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ').filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? fallbackFirstName,
      lastName: fallbackLastName,
    };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function normalizeInterests(input: string[] | undefined): string[] | null {
  if (!input) return null;

  const unique = new Set<string>();
  for (const raw of input) {
    const clean = raw.trim();
    if (!clean) continue;
    unique.add(clean);
    if (unique.size >= 20) break;
  }

  return Array.from(unique);
}

function normalizeProjects(input: ProfileProjectInput[] | undefined): ProfileProjectInput[] | null {
  if (!input) return null;

  const projects = input
    .map((item) => ({
      title: item.title.trim(),
      description: normalizeText(item.description ?? null),
      projectRole: normalizeText(item.projectRole ?? null),
      imageUrl: normalizeText(item.imageUrl ?? null),
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, 8);

  return projects;
}

function sanitizeOpenAiBaseUrl(value: string | null | undefined): string {
  const candidate = (value ?? '').trim();
  if (!candidate) return 'https://api.openai.com/v1';
  return candidate.replace(/\/+$/, '');
}

function parseOpenAiContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        const row = item as { type?: string; text?: string };
        return row.type === 'text' && typeof row.text === 'string' ? row.text : '';
      })
      .join('')
      .trim();
  }
  return '';
}

async function extractTextFromDocx(raw: Uint8Array): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(raw);
    const documentXml = await zip.file('word/document.xml')?.async('text');
    if (!documentXml) return null;
    const text = documentXml
      .replace(/<w:br\s*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 0 ? text.slice(0, 20000) : null;
  } catch {
    return null;
  }
}

async function extractTextFromFileUrl(fileUrl: string): Promise<string | null> {
  const response = await fetch(fileUrl, { cache: 'no-store' });
  if (!response.ok) return null;
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  const raw = new Uint8Array(await response.arrayBuffer());
  if (raw.length === 0) return null;

  if (contentType.includes('wordprocessingml.document') || fileUrl.toLowerCase().endsWith('.docx')) {
    return extractTextFromDocx(raw);
  }

  if (
    contentType.startsWith('text/') ||
    contentType.includes('json') ||
    fileUrl.toLowerCase().endsWith('.txt')
  ) {
    return new TextDecoder('utf-8').decode(raw).replace(/\s+/g, ' ').trim().slice(0, 20000);
  }

  return null;
}

function extractYearsExperienceFromText(text: string): number | null {
  const normalized = text.toLowerCase();
  const match = normalized.match(/(\d{1,2})\s*\+?\s*años?\s+de\s+experiencia/);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(80, Math.floor(parsed)));
}

function normalizePrecioSesion(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value)) return null;
  const intValue = Math.round(Number(value));
  if (intValue < ADVISER_PRECIO_MIN || intValue > ADVISER_PRECIO_MAX) {
    throw new Error(
      `Precio sesión debe estar entre ${ADVISER_PRECIO_MIN.toLocaleString('es-CO')} y ${ADVISER_PRECIO_MAX.toLocaleString('es-CO')} COP.`,
    );
  }
  return intValue;
}

function normalizeAdviserTopics(
  input: AdviserTopicInput[] | undefined,
): AdviserTopicInput[] | null {
  if (!input) return null;
  const cleaned: AdviserTopicInput[] = [];
  for (const raw of input) {
    const label = (raw?.topicLabel ?? '').trim();
    const pillarCode = (raw?.pillarCode ?? '') as AdviserPillarCode;
    if (!label) continue;
    if (!ADVISER_PILLAR_SET.has(pillarCode)) {
      throw new Error(`Pilar inválido para el tema "${label}".`);
    }
    cleaned.push({ topicLabel: label, pillarCode });
    if (cleaned.length >= 20) break;
  }
  return cleaned;
}

interface AdviserMentorRow {
  experiencia: string | null;
  precio_sesion: number | null;
  currency_code: string | null;
}

interface AdviserTopicRow {
  topic_id: string;
  topic_label: string;
  pillar_code: AdviserPillarCode;
}

async function getAdviserProfile(
  client: PoolClient,
  userId: string,
): Promise<AdviserProfileRecord | null> {
  const { rows } = await client.query<AdviserMentorRow>(
    `
      SELECT m.experiencia, m.precio_sesion, m.currency_code
      FROM app_mentoring.mentors m
      JOIN app_core.users u ON u.user_id = m.mentor_user_id
      WHERE m.mentor_user_id = $1::uuid
        AND u.primary_role = 'mentor'
      LIMIT 1
    `,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;

  const { rows: topicRows } = await client.query<AdviserTopicRow>(
    `
      SELECT topic_id::text, topic_label, pillar_code
      FROM app_mentoring.mentor_topics
      WHERE mentor_user_id = $1::uuid
      ORDER BY sort_order, created_at
    `,
    [userId],
  );

  return {
    experiencia: row.experiencia,
    precioSesion: row.precio_sesion === null ? null : Number(row.precio_sesion),
    currencyCode: row.currency_code ?? 'COP',
    temas: topicRows.map((topic) => ({
      topicId: topic.topic_id,
      topicLabel: topic.topic_label,
      pillarCode: topic.pillar_code,
    })),
  };
}

async function upsertAdviserProfile(
  client: PoolClient,
  userId: string,
  input: AdviserProfileInput,
): Promise<void> {
  // Ensure mentor row exists (trigger usually handles this, but be defensive)
  await client.query(
    `
      INSERT INTO app_mentoring.mentors (mentor_user_id)
      VALUES ($1::uuid)
      ON CONFLICT (mentor_user_id) DO NOTHING
    `,
    [userId],
  );

  const experiencia = input.experiencia === undefined ? undefined : normalizeText(input.experiencia);
  const precioSesion =
    input.precioSesion === undefined ? undefined : normalizePrecioSesion(input.precioSesion);

  if (experiencia !== undefined || precioSesion !== undefined) {
    await client.query(
      `
        UPDATE app_mentoring.mentors
        SET
          experiencia   = COALESCE($2, experiencia),
          precio_sesion = CASE WHEN $3::boolean THEN $4 ELSE precio_sesion END,
          updated_at    = now()
        WHERE mentor_user_id = $1::uuid
      `,
      [
        userId,
        experiencia === undefined ? null : experiencia,
        precioSesion !== undefined,
        precioSesion ?? null,
      ],
    );

    // experiencia: when explicitly nullified, set to null
    if (experiencia === null) {
      await client.query(
        `UPDATE app_mentoring.mentors SET experiencia = NULL, updated_at = now() WHERE mentor_user_id = $1::uuid`,
        [userId],
      );
    }
  }

  if (input.temas !== undefined) {
    const normalizedTopics = normalizeAdviserTopics(input.temas) ?? [];
    await client.query(
      `DELETE FROM app_mentoring.mentor_topics WHERE mentor_user_id = $1::uuid`,
      [userId],
    );
    for (let index = 0; index < normalizedTopics.length; index++) {
      const topic = normalizedTopics[index];
      await client.query(
        `
          INSERT INTO app_mentoring.mentor_topics (mentor_user_id, topic_label, pillar_code, sort_order)
          VALUES ($1::uuid, $2, $3, $4)
        `,
        [userId, topic.topicLabel, topic.pillarCode, index],
      );
    }
  }
}

function mapProfile(
  row: ProfileRow,
  interests: string[],
  projects: ProfileProjectRecord[],
  purchases: UserPurchaseRecord[],
  adviserProfile: AdviserProfileRecord | null,
): MyProfileRecord {
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    avatarInitial: row.avatar_initial,
    avatarUrl: row.avatar_url,
    timezone: row.timezone,
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
    linkedinUrl: row.linkedin_url,
    twitterUrl: row.twitter_url,
    websiteUrl: row.website_url,
    interests,
    projects,
    purchases,
    adviserProfile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getProfileRow(client: PoolClient, userId: string): Promise<ProfileRow> {
  const { rows } = await client.query<ProfileRow>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.first_name,
        u.last_name,
        u.display_name,
        u.avatar_initial::text,
        u.avatar_url,
        u.timezone,
        u.organization_id::text,
        o.name AS organization_name,
        up.profession,
        up.industry,
        up.plan_type,
        up.subscription_plan_id::text AS subscription_plan_id,
        sp.plan_code AS subscription_plan_code,
        sp.name AS subscription_plan_name,
        sp.plan_group::text AS subscription_plan_group,
        sp.highlight_label AS subscription_plan_highlight_label,
        sp.price_amount AS subscription_plan_price_amount,
        sp.currency_code AS subscription_plan_currency_code,
        up.subscription_expires_at::text AS subscription_expires_at,
        up.seniority_level,
        up.bio,
        up.location,
        up.country,
        up.job_role,
        up.gender,
        up.years_experience,
        up.linkedin_url,
        up.twitter_url,
        up.website_url,
        u.created_at::text,
        u.updated_at::text
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
      WHERE u.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Profile not found');
  }

  return row;
}

async function listInterests(client: PoolClient, userId: string): Promise<string[]> {
  const { rows } = await client.query<InterestRow>(
    `
      SELECT i.name
      FROM app_core.user_interests ui
      JOIN app_core.interests i ON i.interest_id = ui.interest_id
      WHERE ui.user_id = $1
      ORDER BY i.name
    `,
    [userId],
  );

  return rows.map((row) => row.name);
}

async function listProjects(client: PoolClient, userId: string): Promise<ProfileProjectRecord[]> {
  const { rows } = await client.query<ProjectRow>(
    `
      SELECT
        project_id::text,
        title,
        description,
        project_role,
        image_url
      FROM app_core.user_projects
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 8
    `,
    [userId],
  );

  return rows.map((row) => ({
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    projectRole: row.project_role,
    imageUrl: row.image_url,
  }));
}

async function syncInterests(client: PoolClient, userId: string, interests: string[]) {
  await client.query(
    `
      DELETE FROM app_core.user_interests
      WHERE user_id = $1
    `,
    [userId],
  );

  for (const interestName of interests) {
    const interest = await client.query<{ interest_id: string }>(
      `
        INSERT INTO app_core.interests (name)
        VALUES ($1)
        ON CONFLICT (name) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING interest_id::text
      `,
      [interestName],
    );

    const interestId = interest.rows[0]?.interest_id;
    if (!interestId) continue;

    await client.query(
      `
        INSERT INTO app_core.user_interests (user_id, interest_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, interest_id) DO NOTHING
      `,
      [userId, interestId],
    );
  }
}

async function syncProjects(client: PoolClient, userId: string, projects: ProfileProjectInput[]) {
  await client.query(
    `
      DELETE FROM app_core.user_projects
      WHERE user_id = $1
    `,
    [userId],
  );

  for (const project of projects) {
    await client.query(
      `
        INSERT INTO app_core.user_projects (
          user_id,
          title,
          description,
          project_role,
          image_url
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        userId,
        project.title,
        project.description ?? null,
        project.projectRole ?? null,
        project.imageUrl ?? null,
      ],
    );
  }
}

export async function getMyProfile(client: PoolClient, actor: AuthUser): Promise<MyProfileRecord> {
  await requireModulePermission(client, 'perfil', 'view');

  // El perfil de adviser (experiencia, precio de sesión, etc.) solo aplica
  // si el usuario es actualmente mentor. Si fue mentor antes y ahora es otro
  // rol (ej. líder), la fila en app_mentoring.mentors puede seguir existiendo
  // como dato histórico, pero NO debe filtrarse al perfil actual del usuario.
  // El rol viene de authenticateRequest, que ya lee primary_role vigente del DB.
  const adviserProfilePromise =
    actor.role === 'mentor'
      ? getAdviserProfile(client, actor.userId)
      : Promise.resolve(null);

  const [row, interests, projects, purchases, adviserProfile] = await Promise.all([
    getProfileRow(client, actor.userId),
    listInterests(client, actor.userId),
    listProjects(client, actor.userId),
    listUserPurchases(client, actor.userId),
    adviserProfilePromise,
  ]);

  return mapProfile(row, interests, projects, purchases, adviserProfile);
}

export async function updateMyProfile(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateMyProfileInput,
): Promise<MyProfileRecord> {
  await requireModulePermission(client, 'perfil', 'update');

  const current = await getMyProfile(client, actor);

  const nextDisplayName = normalizeRequiredText(input.displayName ?? current.displayName, current.displayName);
  const splitName = splitDisplayName(nextDisplayName, current.firstName, current.lastName);

  const nextFirstName = normalizeRequiredText(input.firstName ?? splitName.firstName, current.firstName);
  const nextLastName = normalizeRequiredText(input.lastName ?? splitName.lastName, current.lastName);

  const nextTimezone = normalizeRequiredText(input.timezone ?? current.timezone, current.timezone);
  const nextAvatarUrl = input.avatarUrl === undefined ? current.avatarUrl : normalizeText(input.avatarUrl);

  const nextProfile = {
    profession: input.profession === undefined ? current.profession : normalizeText(input.profession),
    industry: input.industry === undefined ? current.industry : normalizeText(input.industry),
    planType: current.planType,
    seniorityLevel: current.seniorityLevel,
    bio: input.bio === undefined ? current.bio : normalizeText(input.bio),
    location: input.location === undefined ? current.location : normalizeText(input.location),
    country: input.country === undefined ? current.country : normalizeCountry(input.country),
    jobRole: input.jobRole === undefined ? current.jobRole : normalizeJobRole(input.jobRole),
    gender: input.gender === undefined ? current.gender : normalizeGender(input.gender),
    yearsExperience:
      input.yearsExperience === undefined
        ? current.yearsExperience
        : normalizeYearsExperience(input.yearsExperience),
    linkedinUrl: input.linkedinUrl === undefined ? current.linkedinUrl : normalizeText(input.linkedinUrl),
    twitterUrl: input.twitterUrl === undefined ? current.twitterUrl : normalizeText(input.twitterUrl),
    websiteUrl: input.websiteUrl === undefined ? current.websiteUrl : normalizeText(input.websiteUrl),
  };

  assertRequiredDemographics({
    country: nextProfile.country,
    jobRole: nextProfile.jobRole,
    gender: nextProfile.gender,
    yearsExperience: nextProfile.yearsExperience,
  });

  await client.query(
    `
      UPDATE app_core.users
      SET
        first_name = $2,
        last_name = $3,
        display_name = $4,
        avatar_initial = UPPER(LEFT($4, 1)),
        timezone = $5,
        avatar_url = $6,
        updated_at = now()
      WHERE user_id = $1
    `,
    [actor.userId, nextFirstName, nextLastName, nextDisplayName, nextTimezone, nextAvatarUrl],
  );

  const profileExists = (
    await client.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM app_core.user_profiles
          WHERE user_id = $1
        ) AS exists
      `,
      [actor.userId],
    )
  ).rows[0]?.exists;

  if (!profileExists) {
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
          years_experience,
          linkedin_url,
          twitter_url,
          website_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        actor.userId,
        nextProfile.profession,
        nextProfile.industry,
        nextProfile.planType,
        nextProfile.seniorityLevel,
        nextProfile.bio,
        nextProfile.location,
        nextProfile.country,
        nextProfile.jobRole,
        nextProfile.gender,
        nextProfile.yearsExperience,
        nextProfile.linkedinUrl,
        nextProfile.twitterUrl,
        nextProfile.websiteUrl,
      ],
    );
  } else {
    await client.query(
      `
        UPDATE app_core.user_profiles
        SET
          profession = $2,
          industry = $3,
          seniority_level = $4,
          bio = $5,
          location = $6,
          country = $7,
          job_role = $8,
          gender = $9,
          years_experience = $10,
          linkedin_url = $11,
          twitter_url = $12,
          website_url = $13,
          updated_at = now()
        WHERE user_id = $1
      `,
      [
        actor.userId,
        nextProfile.profession,
        nextProfile.industry,
        nextProfile.seniorityLevel,
        nextProfile.bio,
        nextProfile.location,
        nextProfile.country,
        nextProfile.jobRole,
        nextProfile.gender,
        nextProfile.yearsExperience,
        nextProfile.linkedinUrl,
        nextProfile.twitterUrl,
        nextProfile.websiteUrl,
      ],
    );
  }

  const normalizedInterests = normalizeInterests(input.interests);
  if (normalizedInterests) {
    await syncInterests(client, actor.userId, normalizedInterests);
  }

  const normalizedProjects = normalizeProjects(input.projects);
  if (normalizedProjects) {
    await syncProjects(client, actor.userId, normalizedProjects);
  }

  if (input.adviserProfile !== undefined && actor.role === 'mentor') {
    await upsertAdviserProfile(client, actor.userId, input.adviserProfile);
  }

  return getMyProfile(client, actor);
}

export async function extractProfileFromCv(
  client: PoolClient,
  actor: AuthUser,
  input: ExtractProfileFromCvInput,
): Promise<ExtractProfileFromCvResult> {
  await requireModulePermission(client, 'perfil', 'update');
  const current = await getMyProfile(client, actor);
  const text = (await extractTextFromFileUrl(input.fileUrl)) ?? '';

  const fallback: ExtractProfileFromCvResult = {
    firstName: current.firstName,
    lastName: current.lastName,
    profession: current.profession ?? '',
    industry: current.industry ?? '',
    location: current.location ?? '',
    bio: current.bio ?? '',
    linkedinUrl: current.linkedinUrl ?? '',
    twitterUrl: current.twitterUrl ?? '',
    websiteUrl: current.websiteUrl ?? '',
    interests: current.interests ?? [],
    country: current.country ?? '',
    jobRole: (current.jobRole ?? '') as JobRole | '',
    gender: (current.gender as ExtractProfileFromCvResult['gender']) ?? '',
    yearsExperience: current.yearsExperience ?? extractYearsExperienceFromText(text),
    timezone: '',
    projects: [],
    adviserExperiencia: '',
    adviserTemas: [],
  };

  if (!text) return fallback;

  try {
    const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, 'openai');
    if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) return fallback;

    const endpoint = `${sanitizeOpenAiBaseUrl(openAiIntegration.wizardData.baseUrl)}/chat/completions`;
    const systemPrompt = [
      'Extrae datos de perfil de un CV y devuelve SOLO JSON válido (un único objeto).',
      'Haz lectura semántica: infiere datos faltantes con alta probabilidad según experiencia, sector, responsabilidades y contexto.',
      'Campos: firstName, lastName, profession, industry, location, bio, linkedinUrl, twitterUrl, websiteUrl, interests, country, jobRole, gender, yearsExperience, timezone, projects, adviserExperiencia, adviserTemas.',
      `jobRole permitido: ${USER_JOB_ROLE_OPTIONS.join(' | ')}`,
      'gender permitido: Hombre | Mujer | Prefiero no decirlo',
      `country permitido: ${Array.from(USER_COUNTRY_SET).join(' | ')}`,
      'bio: redacta 2 a 4 frases en primera persona y en español que resuman el perfil profesional (trayectoria, foco y fortalezas), a partir de todo el CV. Escríbela siempre que haya información suficiente.',
      'profession: el título profesional principal (ej. "Consultor en transformación digital"). industry: sector(es) principal(es).',
      'location: ciudad de residencia si aparece o se infiere. timezone: zona horaria IANA inferida del país/ciudad (ej. America/Bogota, America/Mexico_City, America/Argentina/Buenos_Aires, Europe/Madrid); si no es inferible, string vacío.',
      'interests: infiere SIEMPRE entre 4 y 8 intereses profesionales concretos en español. No te limites a lo que el CV liste de forma explícita: dedúcelos del sector, las herramientas, los temas recurrentes, las certificaciones y el tipo de proyectos (ej. "Transformación digital", "Liderazgo de equipos", "Educación corporativa").',
      'projects: genera UN registro por CADA experiencia laboral y por CADA proyecto relevante del CV (hasta 12 registros, ordenados del más reciente al más antiguo). Cada registro: {title (nombre del proyecto, o cargo + empresa para experiencias laborales), description (1-3 frases con responsabilidades y logros concretos), projectRole (rol o cargo desempeñado)}. No omitas experiencias: cada empleo del CV debe producir su registro.',
      'adviserExperiencia: párrafo de 2 a 4 frases, en primera persona y en español, que resuma la experiencia de la persona como mentor, docente, consultor o asesor de otros profesionales (si el CV lo evidencia; si no, string vacío).',
      'adviserTemas: arreglo de hasta 5 temas en los que la persona puede mentorear a otros líderes, cada uno {topicLabel (tema corto en español), pillarCode}. pillarCode permitido: shine_within (autoliderazgo, identidad, propósito, inteligencia emocional) | shine_out (comunicación, influencia, presencia ejecutiva, relaciones) | shine_up (estrategia, visión, toma de decisiones, gestión) | shine_beyond (equipos, cultura, transformación organizacional, legado).',
      'Si un dato no se puede inferir de forma confiable, devuelve string vacío, null o arreglo vacío según corresponda.',
    ].join('\n');
    const userPrompt = `CV:\n${text.slice(0, 16000)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiIntegration.secretValue}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAiIntegration.wizardData.model?.trim() || 'gpt-4.1',
        temperature: 0.1,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as unknown;
    const raw = parseOpenAiContent(payload);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ExtractProfileFromCvResult>;

    const country = normalizeCountry(parsed.country ?? null) ?? fallback.country;
    const jobRole = normalizeJobRole(parsed.jobRole ?? null) ?? fallback.jobRole;
    const gender = normalizeGender(parsed.gender ?? null) ?? fallback.gender;
    const yearsExperience = normalizeYearsExperience(parsed.yearsExperience ?? null) ?? fallback.yearsExperience;
    const firstName = normalizeRequiredText(parsed.firstName ?? fallback.firstName, fallback.firstName);
    const lastName = normalizeRequiredText(parsed.lastName ?? fallback.lastName, fallback.lastName);

    const profession = normalizeText(parsed.profession ?? null) ?? fallback.profession;
    const industry = normalizeText(parsed.industry ?? null) ?? fallback.industry;
    const location = normalizeText(parsed.location ?? null) ?? fallback.location;
    const bio = normalizeText(parsed.bio ?? null) ?? fallback.bio;
    const linkedinUrl = normalizeText(parsed.linkedinUrl ?? null) ?? fallback.linkedinUrl;
    const twitterUrl = normalizeText(parsed.twitterUrl ?? null) ?? fallback.twitterUrl;
    const websiteUrl = normalizeText(parsed.websiteUrl ?? null) ?? fallback.websiteUrl;
    const interests = Array.isArray(parsed.interests)
      ? parsed.interests
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
          .slice(0, 8)
      : fallback.interests;

    const timezoneRaw = typeof parsed.timezone === 'string' ? parsed.timezone.trim() : '';
    const timezone = /^[A-Za-z_]+\/[A-Za-z0-9_+\-/]+$/.test(timezoneRaw) ? timezoneRaw : '';

    const projects: ExtractedCvProject[] = Array.isArray(parsed.projects)
      ? (parsed.projects as unknown[])
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item) => ({
            title: typeof item.title === 'string' ? item.title.trim().slice(0, 160) : '',
            description: typeof item.description === 'string' ? item.description.trim().slice(0, 600) : '',
            projectRole: typeof item.projectRole === 'string' ? item.projectRole.trim().slice(0, 120) : '',
          }))
          .filter((item) => item.title.length > 0)
          .slice(0, 12)
      : [];

    const adviserExperiencia =
      typeof parsed.adviserExperiencia === 'string' ? parsed.adviserExperiencia.trim().slice(0, 2000) : '';

    const ADVISER_PILLARS = new Set(['shine_within', 'shine_out', 'shine_up', 'shine_beyond']);
    const adviserTemas: ExtractedAdviserTopic[] = Array.isArray(parsed.adviserTemas)
      ? (parsed.adviserTemas as unknown[])
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item) => ({
            topicLabel: typeof item.topicLabel === 'string' ? item.topicLabel.trim().slice(0, 80) : '',
            pillarCode: typeof item.pillarCode === 'string' ? item.pillarCode.trim() : '',
          }))
          .filter(
            (item): item is ExtractedAdviserTopic =>
              item.topicLabel.length > 0 && ADVISER_PILLARS.has(item.pillarCode),
          )
          .slice(0, 5)
      : [];

    return {
      firstName,
      lastName,
      profession,
      industry,
      location,
      bio,
      linkedinUrl,
      twitterUrl,
      websiteUrl,
      interests,
      country: country ?? '',
      jobRole: jobRole ?? '',
      gender: (gender ?? '') as ExtractProfileFromCvResult['gender'],
      yearsExperience,
      timezone,
      projects,
      adviserExperiencia,
      adviserTemas,
    };
  } catch {
    return fallback;
  }
}
