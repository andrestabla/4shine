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
  planType?: PlanType | null;
  seniorityLevel?: SeniorityLevel | null;
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
}

export interface ExtractProfileFromCvInput {
  fileUrl: string;
}

export interface ExtractProfileFromCvResult {
  firstName: string;
  lastName: string;
  country: string;
  jobRole: JobRole | '';
  gender: 'Hombre' | 'Mujer' | 'Prefiero no decirlo' | '';
  yearsExperience: number | null;
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

function mapProfile(row: ProfileRow, interests: string[], projects: ProfileProjectRecord[]): MyProfileRecord {
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

  const [row, interests, projects] = await Promise.all([
    getProfileRow(client, actor.userId),
    listInterests(client, actor.userId),
    listProjects(client, actor.userId),
  ]);

  return mapProfile(row, interests, projects);
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
    planType: input.planType === undefined ? current.planType : input.planType,
    seniorityLevel: input.seniorityLevel === undefined ? current.seniorityLevel : input.seniorityLevel,
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
          ${input.planType !== undefined ? ', plan_type = $14' : ''}
        WHERE user_id = $1
      `,
      input.planType !== undefined
        ? [
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
            nextProfile.planType,
          ]
        : [
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
    country: current.country ?? '',
    jobRole: (current.jobRole ?? '') as JobRole | '',
    gender: (current.gender as ExtractProfileFromCvResult['gender']) ?? '',
    yearsExperience: current.yearsExperience ?? extractYearsExperienceFromText(text),
  };

  if (!text) return fallback;

  try {
    const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, 'openai');
    if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) return fallback;

    const endpoint = `${sanitizeOpenAiBaseUrl(openAiIntegration.wizardData.baseUrl)}/chat/completions`;
    const systemPrompt = [
      'Extrae datos de perfil de un CV y devuelve SOLO JSON válido.',
      'Campos: firstName, lastName, country, jobRole, gender, yearsExperience.',
      `jobRole permitido: ${USER_JOB_ROLE_OPTIONS.join(' | ')}`,
      'gender permitido: Hombre | Mujer | Prefiero no decirlo',
      `country permitido: ${Array.from(USER_COUNTRY_SET).join(' | ')}`,
      'Si no estás seguro, devuelve string vacío o null.',
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
        max_tokens: 400,
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

    return { firstName, lastName, country: country ?? '', jobRole: jobRole ?? '', gender: (gender ?? '') as ExtractProfileFromCvResult['gender'], yearsExperience };
  } catch {
    return fallback;
  }
}
