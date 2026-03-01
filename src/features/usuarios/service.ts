import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import type { Role } from '@/server/bootstrap/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { hashPassword } from '@/server/auth/password';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';

export interface UserRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  primaryRole: Role;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  profession: string | null;
  industry: string | null;
  planType: PlanType | null;
  seniorityLevel: SeniorityLevel | null;
  bio: string | null;
  location: string | null;
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
}

export interface UpdateUserInput {
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
  seniorityLevel?: SeniorityLevel | null;
  bio?: string | null;
  location?: string | null;
}

interface UserRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  timezone: string;
  primary_role: Role;
  is_active: boolean;
  organization_id: string | null;
  organization_name: string | null;
  profession: string | null;
  industry: string | null;
  plan_type: PlanType | null;
  seniority_level: SeniorityLevel | null;
  bio: string | null;
  location: string | null;
}

function mapUser(row: UserRow): UserRecord {
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    timezone: row.timezone,
    primaryRole: row.primary_role,
    isActive: row.is_active,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    profession: row.profession,
    industry: row.industry,
    planType: row.plan_type,
    seniorityLevel: row.seniority_level,
    bio: row.bio,
    location: row.location,
  };
}

const BASE_SELECT = `
  SELECT
    u.user_id::text,
    u.email::text,
    u.first_name,
    u.last_name,
    u.display_name,
    u.timezone,
    u.primary_role,
    u.is_active,
    u.organization_id::text,
    o.name AS organization_name,
    p.profession,
    p.industry,
    p.plan_type,
    p.seniority_level,
    p.bio,
    p.location
  FROM app_core.users u
  LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
  LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
`;

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

export async function listUsers(client: PoolClient, limit = 200): Promise<UserRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');

  const { rows } = await client.query<UserRow>(
    `${BASE_SELECT}
     ORDER BY u.created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 1000)],
  );

  return rows.map(mapUser);
}

export async function createUser(
  client: PoolClient,
  actor: AuthUser,
  input: CreateUserInput,
): Promise<UserRecord> {
  await requireModulePermission(client, 'usuarios', 'create');

  const passwordHash = await hashPassword(input.password);
  const displayName = input.displayName ?? `${input.firstName} ${input.lastName}`.trim();

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
      input.organizationId ?? null,
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
        location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE
      SET profession = EXCLUDED.profession,
          industry = EXCLUDED.industry,
          plan_type = EXCLUDED.plan_type,
          seniority_level = EXCLUDED.seniority_level,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          updated_at = now()
    `,
    [
      userId,
      input.profession ?? null,
      input.industry ?? null,
      input.planType ?? null,
      input.seniorityLevel ?? null,
      input.bio ?? null,
      input.location ?? null,
    ],
  );

  return getUserById(client, userId);
}

export async function updateUser(
  client: PoolClient,
  actor: AuthUser,
  userId: string,
  input: UpdateUserInput,
): Promise<UserRecord> {
  await requireModulePermission(client, 'usuarios', 'update');

  await client.query(
    `
      UPDATE app_core.users
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        display_name = COALESCE($4, display_name),
        avatar_initial = UPPER(LEFT(COALESCE($4, display_name), 1)),
        timezone = COALESCE($5, timezone),
        primary_role = COALESCE($6, primary_role),
        organization_id = COALESCE($7, organization_id),
        is_active = COALESCE($8, is_active),
        updated_at = now()
      WHERE user_id = $1
    `,
    [
      userId,
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

  await client.query(
    `
      INSERT INTO app_core.user_profiles (
        user_id,
        profession,
        industry,
        plan_type,
        seniority_level,
        bio,
        location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE
      SET
        profession = COALESCE($2, app_core.user_profiles.profession),
        industry = COALESCE($3, app_core.user_profiles.industry),
        plan_type = COALESCE($4, app_core.user_profiles.plan_type),
        seniority_level = COALESCE($5, app_core.user_profiles.seniority_level),
        bio = COALESCE($6, app_core.user_profiles.bio),
        location = COALESCE($7, app_core.user_profiles.location),
        updated_at = now()
    `,
    [
      userId,
      input.profession ?? null,
      input.industry ?? null,
      input.planType ?? null,
      input.seniorityLevel ?? null,
      input.bio ?? null,
      input.location ?? null,
    ],
  );

  return getUserById(client, userId);
}

export async function deactivateUser(client: PoolClient, userId: string): Promise<{ userId: string }> {
  await requireModulePermission(client, 'usuarios', 'delete');

  const { rows } = await client.query<{ user_id: string }>(
    `
      UPDATE app_core.users
      SET is_active = false,
          updated_at = now()
      WHERE user_id = $1
      RETURNING user_id::text
    `,
    [userId],
  );

  const deactivated = rows[0];
  if (!deactivated) {
    throw new Error('User not found');
  }

  await client.query(
    `
      UPDATE app_auth.refresh_sessions
      SET revoked_at = now()
      WHERE user_id = $1
        AND revoked_at IS NULL
    `,
    [userId],
  );

  return {
    userId: deactivated.user_id,
  };
}
