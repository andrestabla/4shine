import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type WorkMode = 'presencial' | 'hibrido' | 'remoto' | 'voluntariado';

export interface JobPostRecord {
  jobPostId: string;
  title: string;
  companyName: string;
  organizationId: string | null;
  location: string | null;
  workMode: WorkMode | null;
  description: string;
  postedBy: string | null;
  postedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  applicants: number;
}

export interface CreateJobPostInput {
  title: string;
  companyName: string;
  organizationId?: string | null;
  location?: string | null;
  workMode?: WorkMode | null;
  description: string;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UpdateJobPostInput {
  title?: string;
  companyName?: string;
  organizationId?: string | null;
  location?: string | null;
  workMode?: WorkMode | null;
  description?: string;
  expiresAt?: string | null;
  isActive?: boolean;
}

interface JobPostRow {
  job_post_id: string;
  title: string;
  company_name: string;
  organization_id: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  description: string;
  posted_by: string | null;
  posted_at: string;
  expires_at: string | null;
  is_active: boolean;
  applicants: number;
}

function mapRow(row: JobPostRow): JobPostRecord {
  return {
    jobPostId: row.job_post_id,
    title: row.title,
    companyName: row.company_name,
    organizationId: row.organization_id,
    location: row.location,
    workMode: row.work_mode,
    description: row.description,
    postedBy: row.posted_by,
    postedAt: row.posted_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    applicants: Number(row.applicants ?? 0),
  };
}

const BASE_SELECT = `
  SELECT
    jp.job_post_id::text,
    jp.title,
    jp.company_name,
    jp.organization_id::text,
    jp.location,
    jp.work_mode,
    jp.description,
    jp.posted_by::text,
    jp.posted_at::text,
    jp.expires_at::text,
    jp.is_active,
    COUNT(ja.application_id)::int AS applicants
  FROM app_networking.job_posts jp
  LEFT JOIN app_networking.job_applications ja ON ja.job_post_id = jp.job_post_id
`;

export async function listJobPosts(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<JobPostRecord[]> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<JobPostRow>(
    `${BASE_SELECT}
     GROUP BY jp.job_post_id
     ORDER BY jp.posted_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function createJobPost(
  client: PoolClient,
  actor: AuthUser,
  input: CreateJobPostInput,
): Promise<JobPostRecord> {
  await requireModulePermission(client, 'convocatorias', 'create');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ job_post_id: string }>(
    `
      INSERT INTO app_networking.job_posts (
        title,
        company_name,
        organization_id,
        location,
        work_mode,
        description,
        posted_by,
        expires_at,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9)
      RETURNING job_post_id::text
    `,
    [
      input.title,
      input.companyName,
      input.organizationId ?? null,
      input.location ?? null,
      input.workMode ?? null,
      input.description,
      actor.userId,
      input.expiresAt ?? null,
      input.isActive ?? true,
    ],
  );

  const jobPostId = rows[0]?.job_post_id;
  if (!jobPostId) {
    throw new Error('Failed to create job post');
  }

  const all = await listJobPosts(client, actor, 500);
  const created = all.find((item) => item.jobPostId === jobPostId);
  if (!created) {
    throw new Error('Created job post not found');
  }

  return created;
}

export async function updateJobPost(
  client: PoolClient,
  actor: AuthUser,
  jobPostId: string,
  input: UpdateJobPostInput,
): Promise<JobPostRecord> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rowCount } = await client.query(
    `
      UPDATE app_networking.job_posts
      SET
        title = COALESCE($2, title),
        company_name = COALESCE($3, company_name),
        organization_id = COALESCE($4, organization_id),
        location = COALESCE($5, location),
        work_mode = COALESCE($6, work_mode),
        description = COALESCE($7, description),
        expires_at = COALESCE($8::timestamptz, expires_at),
        is_active = COALESCE($9, is_active)
      WHERE job_post_id = $1
    `,
    [
      jobPostId,
      input.title ?? null,
      input.companyName ?? null,
      input.organizationId ?? null,
      input.location ?? null,
      input.workMode ?? null,
      input.description ?? null,
      input.expiresAt ?? null,
      input.isActive ?? null,
    ],
  );

  if (!rowCount) {
    throw new Error('Job post not found');
  }

  const all = await listJobPosts(client, actor, 500);
  const updated = all.find((item) => item.jobPostId === jobPostId);
  if (!updated) {
    throw new Error('Job post not found');
  }

  return updated;
}

export async function deleteJobPost(
  client: PoolClient,
  actor: AuthUser,
  jobPostId: string,
): Promise<{ jobPostId: string }> {
  await requireModulePermission(client, 'convocatorias', 'delete');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ job_post_id: string }>(
    `
      DELETE FROM app_networking.job_posts
      WHERE job_post_id = $1
      RETURNING job_post_id::text
    `,
    [jobPostId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Job post not found');
  }

  return {
    jobPostId: deleted.job_post_id,
  };
}
