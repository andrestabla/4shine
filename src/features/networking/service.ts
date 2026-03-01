import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

export type ConnectionStatus = 'pending' | 'connected' | 'blocked' | 'rejected';

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
  connectionStatus: ConnectionStatus | 'none';
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
  connection_status: ConnectionStatus | null;
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
    connectionStatus: row.connection_status ?? 'none',
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

  const { rows } = await client.query<NetworkPersonRow>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.primary_role,
        o.name AS organization_name,
        p.location,
        p.industry,
        c.status AS connection_status
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
      ORDER BY u.display_name
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapPerson);
}

export async function createConnection(
  client: PoolClient,
  actor: AuthUser,
  input: CreateConnectionInput,
): Promise<ConnectionRecord> {
  await requireModulePermission(client, 'networking', 'create');

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
