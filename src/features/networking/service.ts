import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type ConnectionStatus = 'pending' | 'connected' | 'blocked' | 'rejected';
export type CommunityVisibility = 'open' | 'closed';

export interface ConnectionRecord {
  connectionId: string;
  requesterUserId: string;
  addresseeUserId: string;
  counterpartUserId: string;
  counterpartName: string;
  status: ConnectionStatus;
  requestedAt: string;
  respondedAt: string | null;
}

export interface CreateConnectionInput {
  addresseeUserId: string;
}

export interface UpdateConnectionInput {
  status: ConnectionStatus;
}

export interface NetworkPersonRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
  location: string | null;
  industry: string | null;
  profession: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  connectionStatus: ConnectionStatus | 'none';
}

export interface FollowRecord {
  followedUserId: string;
  followedAt: string;
}

export interface CommunityRecord {
  groupId: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: CommunityVisibility;
  isActive: boolean;
  memberCount: number;
  createdByUserId: string | null;
  createdByName: string | null;
  isMember: boolean;
  membershipRole: 'owner' | 'moderator' | 'member' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostRecord {
  postId: string;
  groupId: string;
  groupName: string;
  authorUserId: string;
  authorName: string;
  title: string;
  body: string;
  resourceUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityInput {
  name: string;
  description?: string | null;
  category?: string | null;
  visibility?: CommunityVisibility;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  visibility?: CommunityVisibility;
  isActive?: boolean;
}

export interface CreateCommunityPostInput {
  title: string;
  body: string;
  resourceUrl?: string | null;
  isPinned?: boolean;
}

interface ConnectionRow {
  connection_id: string;
  requester_user_id: string;
  addressee_user_id: string;
  counterpart_user_id: string;
  counterpart_name: string;
  status: ConnectionStatus;
  requested_at: string;
  responded_at: string | null;
}

interface NetworkPersonRow {
  user_id: string;
  display_name: string;
  primary_role: string;
  organization_name: string | null;
  location: string | null;
  industry: string | null;
  profession: string | null;
  bio: string | null;
  avatar_url: string | null;
  connection_status: ConnectionStatus | null;
  is_following: boolean;
}

interface CommunityRow {
  group_id: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: CommunityVisibility;
  is_active: boolean;
  member_count: number;
  created_by_user_id: string | null;
  created_by_name: string | null;
  is_member: boolean;
  membership_role: 'owner' | 'moderator' | 'member' | null;
  created_at: string;
  updated_at: string;
}

interface CommunityPostRow {
  post_id: string;
  group_id: string;
  group_name: string;
  author_user_id: string;
  author_name: string;
  title: string;
  body: string;
  resource_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ConnectionRow): ConnectionRecord {
  return {
    connectionId: row.connection_id,
    requesterUserId: row.requester_user_id,
    addresseeUserId: row.addressee_user_id,
    counterpartUserId: row.counterpart_user_id,
    counterpartName: row.counterpart_name,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
  };
}

function mapPerson(row: NetworkPersonRow): NetworkPersonRecord {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    primaryRole: row.primary_role,
    organizationName: row.organization_name,
    location: row.location,
    industry: row.industry,
    profession: row.profession,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isFollowing: row.is_following,
    connectionStatus: row.connection_status ?? 'none',
  };
}

function mapCommunity(row: CommunityRow): CommunityRecord {
  return {
    groupId: row.group_id,
    name: row.name,
    description: row.description,
    category: row.category,
    visibility: row.visibility,
    isActive: row.is_active,
    memberCount: Number(row.member_count ?? 0),
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    isMember: row.is_member,
    membershipRole: row.membership_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCommunityPost(row: CommunityPostRow): CommunityPostRecord {
  return {
    postId: row.post_id,
    groupId: row.group_id,
    groupName: row.group_name,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    resourceUrl: row.resource_url,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT
    c.connection_id::text,
    c.requester_user_id::text,
    c.addressee_user_id::text,
    CASE
      WHEN c.requester_user_id = $1::uuid THEN c.addressee_user_id::text
      ELSE c.requester_user_id::text
    END AS counterpart_user_id,
    CASE
      WHEN c.requester_user_id = $1::uuid THEN addressee.display_name
      ELSE requester.display_name
    END AS counterpart_name,
    c.status,
    c.requested_at::text,
    c.responded_at::text
  FROM app_networking.connections c
  JOIN app_core.users requester ON requester.user_id = c.requester_user_id
  JOIN app_core.users addressee ON addressee.user_id = c.addressee_user_id
`;

export async function listConnections(client: PoolClient, actor: AuthUser, limit = 100): Promise<ConnectionRecord[]> {
  await requireModulePermission(client, 'networking', 'view');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rows } = await client.query<ConnectionRow>(
    `${BASE_SELECT}
     WHERE c.requester_user_id = $1::uuid OR c.addressee_user_id = $1::uuid
     ORDER BY c.requested_at DESC
     LIMIT $2`,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapRow);
}

export async function listNetworkPeople(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<NetworkPersonRecord[]> {
  await requireModulePermission(client, 'networking', 'view');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rows } = await client.query<NetworkPersonRow>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.primary_role,
        o.name AS organization_name,
        p.location,
        p.industry,
        p.profession,
        p.bio,
        u.avatar_url,
        c.status AS connection_status,
        EXISTS (
          SELECT 1
          FROM app_networking.user_follows f
          WHERE f.follower_user_id = $1::uuid
            AND f.followed_user_id = u.user_id
        ) AS is_following
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
      LEFT JOIN app_networking.connections c
        ON (
          (c.requester_user_id = $1::uuid AND c.addressee_user_id = u.user_id)
          OR (c.requester_user_id = u.user_id AND c.addressee_user_id = $1::uuid)
        )
      WHERE u.user_id <> $1::uuid
        AND u.is_active = true
        AND u.primary_role = 'lider'
        AND app_mentoring.user_has_program_access(u.user_id)
      ORDER BY u.display_name
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapPerson);
}

export async function followUser(client: PoolClient, actor: AuthUser, followedUserId: string): Promise<FollowRecord> {
  await requireModulePermission(client, 'networking', 'create');
  await requireCommunityAccess(client, actor, 'Networking');

  if (followedUserId === actor.userId) {
    throw new Error('No puedes seguir tu propio perfil.');
  }

  const existsTarget = await client.query<{ user_id: string }>(
    `
      SELECT u.user_id::text
      FROM app_core.users u
      WHERE u.user_id = $1::uuid
        AND u.is_active = true
        AND u.primary_role = 'lider'
        AND app_mentoring.user_has_program_access(u.user_id)
      LIMIT 1
    `,
    [followedUserId],
  );

  if (!existsTarget.rows[0]?.user_id) {
    throw new Error('Solo puedes seguir perfiles públicos de líderes con suscripción.');
  }

  const { rows } = await client.query<{ followed_user_id: string; followed_at: string }>(
    `
      INSERT INTO app_networking.user_follows (follower_user_id, followed_user_id)
      VALUES ($1::uuid, $2::uuid)
      ON CONFLICT (follower_user_id, followed_user_id)
      DO UPDATE SET followed_at = now()
      RETURNING followed_user_id::text, followed_at::text
    `,
    [actor.userId, followedUserId],
  );

  return {
    followedUserId: rows[0].followed_user_id,
    followedAt: rows[0].followed_at,
  };
}

export async function unfollowUser(client: PoolClient, actor: AuthUser, followedUserId: string): Promise<{ followedUserId: string }> {
  await requireModulePermission(client, 'networking', 'delete');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rowCount } = await client.query(
    `
      DELETE FROM app_networking.user_follows
      WHERE follower_user_id = $1::uuid
        AND followed_user_id = $2::uuid
    `,
    [actor.userId, followedUserId],
  );

  if (!rowCount) {
    throw new Error('Seguimiento no encontrado.');
  }

  return { followedUserId };
}

export async function createConnection(
  client: PoolClient,
  actor: AuthUser,
  input: CreateConnectionInput,
): Promise<ConnectionRecord> {
  await requireModulePermission(client, 'networking', 'create');
  await requireCommunityAccess(client, actor, 'Networking');

  if (input.addresseeUserId === actor.userId) {
    throw new Error('Cannot connect with yourself');
  }

  const { rows } = await client.query<{ connection_id: string }>(
    `
      INSERT INTO app_networking.connections (
        requester_user_id,
        addressee_user_id,
        status,
        requested_at,
        responded_at
      )
      VALUES ($1, $2, 'pending', now(), NULL)
      ON CONFLICT ((LEAST(requester_user_id, addressee_user_id)), (GREATEST(requester_user_id, addressee_user_id)))
      DO UPDATE
      SET
        requester_user_id = EXCLUDED.requester_user_id,
        addressee_user_id = EXCLUDED.addressee_user_id,
        status = 'pending',
        requested_at = now(),
        responded_at = NULL
      RETURNING connection_id::text
    `,
    [actor.userId, input.addresseeUserId],
  );

  const connectionId = rows[0]?.connection_id;
  if (!connectionId) {
    throw new Error('Failed to create connection');
  }

  const full = await client.query<ConnectionRow>(
    `${BASE_SELECT}
     WHERE c.connection_id = $2::uuid
     LIMIT 1`,
    [actor.userId, connectionId],
  );

  return mapRow(full.rows[0]);
}

export async function updateConnection(
  client: PoolClient,
  actor: AuthUser,
  connectionId: string,
  input: UpdateConnectionInput,
): Promise<ConnectionRecord> {
  await requireModulePermission(client, 'networking', 'update');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rowCount } = await client.query(
    `
      UPDATE app_networking.connections
      SET
        status = $2,
        responded_at = CASE WHEN $2 = 'pending' THEN NULL ELSE now() END
      WHERE connection_id = $1
        AND (
          requester_user_id = $3
          OR addressee_user_id = $3
          OR app_auth.has_permission('networking', 'manage')
        )
    `,
    [connectionId, input.status, actor.userId],
  );

  if (!rowCount) {
    throw new Error('Connection not found');
  }

  const { rows } = await client.query<ConnectionRow>(
    `${BASE_SELECT}
     WHERE c.connection_id = $2::uuid
     LIMIT 1`,
    [actor.userId, connectionId],
  );

  return mapRow(rows[0]);
}

export async function deleteConnection(
  client: PoolClient,
  actor: AuthUser,
  connectionId: string,
): Promise<{ connectionId: string }> {
  await requireModulePermission(client, 'networking', 'delete');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rows } = await client.query<{ connection_id: string }>(
    `
      DELETE FROM app_networking.connections
      WHERE connection_id = $1
        AND (
          requester_user_id = $2
          OR addressee_user_id = $2
          OR app_auth.has_permission('networking', 'manage')
        )
      RETURNING connection_id::text
    `,
    [connectionId, actor.userId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Connection not found');
  }

  return {
    connectionId: deleted.connection_id,
  };
}

export async function listCommunities(client: PoolClient, actor: AuthUser, limit = 100): Promise<CommunityRecord[]> {
  await requireModulePermission(client, 'networking', 'view');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rows } = await client.query<CommunityRow>(
    `
      SELECT
        g.group_id::text,
        g.name,
        g.description,
        g.category,
        COALESCE(g.visibility, 'open')::text AS visibility,
        g.is_active,
        COALESCE(m.member_count, 0) AS member_count,
        g.created_by::text AS created_by_user_id,
        owner.display_name AS created_by_name,
        gm.user_id IS NOT NULL AS is_member,
        gm.membership_role,
        g.created_at::text,
        g.updated_at::text
      FROM app_networking.interest_groups g
      LEFT JOIN (
        SELECT group_id, COUNT(*)::int AS member_count
        FROM app_networking.group_memberships
        GROUP BY group_id
      ) m ON m.group_id = g.group_id
      LEFT JOIN app_networking.group_memberships gm
        ON gm.group_id = g.group_id
       AND gm.user_id = $1::uuid
      LEFT JOIN app_core.users owner ON owner.user_id = g.created_by
      WHERE g.is_active = true OR app_auth.has_permission('networking', 'manage')
      ORDER BY g.created_at DESC
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapCommunity);
}

export async function createCommunity(client: PoolClient, actor: AuthUser, input: CreateCommunityInput): Promise<CommunityRecord> {
  await requireModulePermission(client, 'networking', 'create');
  await requireModulePermission(client, 'networking', 'manage');

  const name = input.name.trim();
  if (!name) throw new Error('El nombre de la comunidad es obligatorio.');

  const visibility = input.visibility === 'closed' ? 'closed' : 'open';

  const created = await client.query<{ group_id: string }>(
    `
      INSERT INTO app_networking.interest_groups (
        name,
        description,
        category,
        visibility,
        created_by,
        is_active
      )
      VALUES ($1, NULLIF(BTRIM($2), ''), NULLIF(BTRIM($3), ''), $4, $5::uuid, true)
      RETURNING group_id::text
    `,
    [name, input.description ?? null, input.category ?? null, visibility, actor.userId],
  );

  const groupId = created.rows[0]?.group_id;
  if (!groupId) throw new Error('No se pudo crear la comunidad.');

  await client.query(
    `
      INSERT INTO app_networking.group_memberships (group_id, user_id, membership_role)
      VALUES ($1::uuid, $2::uuid, 'owner')
      ON CONFLICT (group_id, user_id) DO NOTHING
    `,
    [groupId, actor.userId],
  );

  const list = await listCommunities(client, actor, 500);
  const found = list.find((item) => item.groupId === groupId);
  if (!found) throw new Error('No se pudo recuperar la comunidad creada.');
  return found;
}

export async function updateCommunity(
  client: PoolClient,
  actor: AuthUser,
  groupId: string,
  input: UpdateCommunityInput,
): Promise<CommunityRecord> {
  await requireModulePermission(client, 'networking', 'update');
  await requireModulePermission(client, 'networking', 'manage');

  const { rowCount } = await client.query(
    `
      UPDATE app_networking.interest_groups
      SET
        name = COALESCE(NULLIF(BTRIM($2), ''), name),
        description = CASE WHEN $3::text IS NULL THEN description ELSE NULLIF(BTRIM($3), '') END,
        category = CASE WHEN $4::text IS NULL THEN category ELSE NULLIF(BTRIM($4), '') END,
        visibility = COALESCE($5, visibility),
        is_active = COALESCE($6, is_active),
        updated_at = now()
      WHERE group_id = $1::uuid
    `,
    [
      groupId,
      input.name ?? null,
      input.description ?? null,
      input.category ?? null,
      input.visibility ?? null,
      input.isActive ?? null,
    ],
  );

  if (!rowCount) throw new Error('Comunidad no encontrada.');

  const list = await listCommunities(client, actor, 500);
  const found = list.find((item) => item.groupId === groupId);
  if (!found) throw new Error('No se pudo recuperar la comunidad actualizada.');
  return found;
}

export async function deleteCommunity(client: PoolClient, actor: AuthUser, groupId: string): Promise<{ groupId: string }> {
  await requireModulePermission(client, 'networking', 'delete');
  await requireModulePermission(client, 'networking', 'manage');

  const { rowCount } = await client.query(
    `
      DELETE FROM app_networking.interest_groups
      WHERE group_id = $1::uuid
    `,
    [groupId],
  );

  if (!rowCount) throw new Error('Comunidad no encontrada.');
  return { groupId };
}

export async function joinCommunity(client: PoolClient, actor: AuthUser, groupId: string): Promise<{ groupId: string; membershipRole: 'owner' | 'moderator' | 'member' }> {
  await requireModulePermission(client, 'networking', 'create');
  await requireCommunityAccess(client, actor, 'Networking');

  const group = await client.query<{ group_id: string; visibility: CommunityVisibility; is_active: boolean }>(
    `
      SELECT group_id::text, COALESCE(visibility, 'open')::text AS visibility, is_active
      FROM app_networking.interest_groups
      WHERE group_id = $1::uuid
      LIMIT 1
    `,
    [groupId],
  );

  const currentGroup = group.rows[0];
  if (!currentGroup || !currentGroup.is_active) throw new Error('Comunidad no disponible.');
  if (currentGroup.visibility === 'closed' && !['admin', 'gestor'].includes(actor.role)) {
    throw new Error('La comunidad está cerrada. Solo Admin o Gestor pueden gestionar membresías.');
  }

  const joined = await client.query<{ membership_role: 'owner' | 'moderator' | 'member' }>(
    `
      INSERT INTO app_networking.group_memberships (group_id, user_id, membership_role)
      VALUES ($1::uuid, $2::uuid, 'member')
      ON CONFLICT (group_id, user_id)
      DO UPDATE SET membership_role = app_networking.group_memberships.membership_role
      RETURNING membership_role
    `,
    [groupId, actor.userId],
  );

  return { groupId, membershipRole: joined.rows[0].membership_role };
}

export async function leaveCommunity(client: PoolClient, actor: AuthUser, groupId: string): Promise<{ groupId: string }> {
  await requireModulePermission(client, 'networking', 'delete');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rowCount } = await client.query(
    `
      DELETE FROM app_networking.group_memberships
      WHERE group_id = $1::uuid
        AND user_id = $2::uuid
        AND membership_role <> 'owner'
    `,
    [groupId, actor.userId],
  );

  if (!rowCount) throw new Error('No puedes salir de esta comunidad o no eres miembro.');
  return { groupId };
}

export async function listCommunityPosts(client: PoolClient, actor: AuthUser, limit = 100): Promise<CommunityPostRecord[]> {
  await requireModulePermission(client, 'networking', 'view');
  await requireCommunityAccess(client, actor, 'Networking');

  const { rows } = await client.query<CommunityPostRow>(
    `
      SELECT
        p.post_id::text,
        p.group_id::text,
        g.name AS group_name,
        p.author_user_id::text,
        u.display_name AS author_name,
        p.title,
        p.body,
        p.resource_url,
        p.is_pinned,
        p.created_at::text,
        p.updated_at::text
      FROM app_networking.community_posts p
      JOIN app_networking.interest_groups g ON g.group_id = p.group_id
      JOIN app_core.users u ON u.user_id = p.author_user_id
      LEFT JOIN app_networking.group_memberships gm
        ON gm.group_id = p.group_id
       AND gm.user_id = $1::uuid
      WHERE g.is_active = true
        AND (
          COALESCE(g.visibility, 'open') = 'open'
          OR gm.user_id IS NOT NULL
          OR app_auth.has_permission('networking', 'manage')
        )
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapCommunityPost);
}

export async function createCommunityPost(
  client: PoolClient,
  actor: AuthUser,
  groupId: string,
  input: CreateCommunityPostInput,
): Promise<CommunityPostRecord> {
  await requireModulePermission(client, 'networking', 'create');
  await requireCommunityAccess(client, actor, 'Networking');

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) throw new Error('El título del recurso es obligatorio.');
  if (!body) throw new Error('La descripción del recurso es obligatoria.');

  const membership = await client.query<{ allowed: boolean }>(
    `
      SELECT (
        EXISTS (
          SELECT 1
          FROM app_networking.group_memberships gm
          WHERE gm.group_id = $1::uuid
            AND gm.user_id = $2::uuid
        )
        OR app_auth.has_permission('networking', 'manage')
      ) AS allowed
    `,
    [groupId, actor.userId],
  );

  if (!membership.rows[0]?.allowed) {
    throw new Error('Debes unirte a la comunidad antes de compartir recursos.');
  }

  const created = await client.query<{ post_id: string }>(
    `
      INSERT INTO app_networking.community_posts (
        group_id,
        author_user_id,
        title,
        body,
        resource_url,
        is_pinned
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, NULLIF(BTRIM($5), ''), COALESCE($6, false))
      RETURNING post_id::text
    `,
    [groupId, actor.userId, title, body, input.resourceUrl ?? null, input.isPinned ?? false],
  );

  const postId = created.rows[0]?.post_id;
  if (!postId) throw new Error('No se pudo crear la publicación.');

  const post = await client.query<CommunityPostRow>(
    `
      SELECT
        p.post_id::text,
        p.group_id::text,
        g.name AS group_name,
        p.author_user_id::text,
        u.display_name AS author_name,
        p.title,
        p.body,
        p.resource_url,
        p.is_pinned,
        p.created_at::text,
        p.updated_at::text
      FROM app_networking.community_posts p
      JOIN app_networking.interest_groups g ON g.group_id = p.group_id
      JOIN app_core.users u ON u.user_id = p.author_user_id
      WHERE p.post_id = $1::uuid
      LIMIT 1
    `,
    [postId],
  );

  return mapCommunityPost(post.rows[0]);
}
