import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';

export interface ThreadRecord {
  threadId: string;
  threadType: 'direct' | 'group';
  title: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageRecord {
  messageId: string;
  threadId: string;
  senderUserId: string;
  senderName: string;
  messageText: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface CreateDirectThreadInput {
  participantUserId: string;
  title?: string;
}

export interface SendMessageInput {
  threadId: string;
  messageText: string;
}

export interface UpdateMessageInput {
  messageText: string;
}

export interface MessageParticipantRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
}

interface ThreadRow {
  thread_id: string;
  thread_type: 'direct' | 'group';
  title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface MessageRow {
  message_id: string;
  thread_id: string;
  sender_user_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

interface ParticipantRow {
  user_id: string;
  display_name: string;
  primary_role: string;
  organization_name: string | null;
}

function mapThread(row: ThreadRow): ThreadRecord {
  return {
    threadId: row.thread_id,
    threadType: row.thread_type,
    title: row.title,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count ?? 0),
  };
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    messageId: row.message_id,
    threadId: row.thread_id,
    senderUserId: row.sender_user_id,
    senderName: row.sender_name,
    messageText: row.message_text,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
  };
}

function mapParticipant(row: ParticipantRow): MessageParticipantRecord {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    primaryRole: row.primary_role,
    organizationName: row.organization_name,
  };
}

async function assertThreadParticipant(client: PoolClient, threadId: string, userId: string): Promise<void> {
  const { rows } = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM app_networking.thread_participants
        WHERE thread_id = $1
          AND user_id = $2
      ) AS exists
    `,
    [threadId, userId],
  );

  if (!rows[0]?.exists) {
    throw new Error('Thread not found or access denied');
  }
}

export async function listThreads(client: PoolClient, actor: AuthUser, limit = 100): Promise<ThreadRecord[]> {
  await requireModulePermission(client, 'mensajes', 'view');
  await requireCommunityAccess(client, actor, 'Mensajes');

  const { rows } = await client.query<ThreadRow>(
    `
      SELECT
        ct.thread_id::text,
        ct.thread_type,
        ct.title,
        last_msg.message_text AS last_message,
        last_msg.created_at::text AS last_message_at,
        (
          SELECT COUNT(*)::int
          FROM app_networking.messages m
          WHERE m.thread_id = ct.thread_id
            AND m.deleted_at IS NULL
            AND m.sender_user_id <> $1
            AND m.created_at > COALESCE(tp.last_read_at, 'epoch'::timestamptz)
        ) AS unread_count
      FROM app_networking.thread_participants tp
      JOIN app_networking.chat_threads ct ON ct.thread_id = tp.thread_id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at
        FROM app_networking.messages m
        WHERE m.thread_id = ct.thread_id
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE tp.user_id = $1
      ORDER BY COALESCE(last_msg.created_at, ct.created_at) DESC
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapThread);
}

export async function listMessageParticipants(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<MessageParticipantRecord[]> {
  await requireModulePermission(client, 'mensajes', 'view');
  await requireCommunityAccess(client, actor, 'Mensajes');

  const { rows } = await client.query<ParticipantRow>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.primary_role,
        o.name AS organization_name
      FROM app_core.users u
      LEFT JOIN app_core.organizations o ON o.organization_id = u.organization_id
      WHERE u.user_id <> $1::uuid
        AND u.is_active = true
      ORDER BY u.display_name
      LIMIT $2
    `,
    [actor.userId, Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapParticipant);
}

export async function createDirectThread(
  client: PoolClient,
  actor: AuthUser,
  input: CreateDirectThreadInput,
): Promise<ThreadRecord> {
  await requireModulePermission(client, 'mensajes', 'create');
  await requireCommunityAccess(client, actor, 'Mensajes');

  if (input.participantUserId === actor.userId) {
    throw new Error('Cannot create direct thread with yourself');
  }

  const existing = await client.query<{ thread_id: string }>(
    `
      SELECT ct.thread_id::text
      FROM app_networking.chat_threads ct
      JOIN app_networking.thread_participants tp ON tp.thread_id = ct.thread_id
      WHERE ct.thread_type = 'direct'
        AND tp.user_id IN ($1, $2)
      GROUP BY ct.thread_id
      HAVING COUNT(DISTINCT tp.user_id) = 2
      LIMIT 1
    `,
    [actor.userId, input.participantUserId],
  );

  const existingThreadId = existing.rows[0]?.thread_id;
  if (existingThreadId) {
    const threads = await listThreads(client, actor, 500);
    const found = threads.find((thread) => thread.threadId === existingThreadId);
    if (found) return found;
  }

  const created = await client.query<{ thread_id: string }>(
    `
      INSERT INTO app_networking.chat_threads (thread_type, title, created_by)
      VALUES ('direct', $1, $2)
      RETURNING thread_id::text
    `,
    [input.title ?? null, actor.userId],
  );

  const threadId = created.rows[0]?.thread_id;
  if (!threadId) {
    throw new Error('Failed to create thread');
  }

  await client.query(
    `
      INSERT INTO app_networking.thread_participants (thread_id, user_id)
      VALUES ($1, $2), ($1, $3)
      ON CONFLICT (thread_id, user_id) DO NOTHING
    `,
    [threadId, actor.userId, input.participantUserId],
  );

  const threads = await listThreads(client, actor, 500);
  const found = threads.find((thread) => thread.threadId === threadId);
  if (!found) {
    throw new Error('Failed to load created thread');
  }

  return found;
}

export async function listMessages(
  client: PoolClient,
  actor: AuthUser,
  threadId: string,
  limit = 100,
): Promise<MessageRecord[]> {
  await requireModulePermission(client, 'mensajes', 'view');
  await requireCommunityAccess(client, actor, 'Mensajes');
  await assertThreadParticipant(client, threadId, actor.userId);

  const { rows } = await client.query<MessageRow>(
    `
      SELECT
        m.message_id::text,
        m.thread_id::text,
        m.sender_user_id::text,
        u.display_name AS sender_name,
        m.message_text,
        m.created_at::text,
        m.edited_at::text,
        m.deleted_at::text
      FROM app_networking.messages m
      JOIN app_core.users u ON u.user_id = m.sender_user_id
      WHERE m.thread_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `,
    [threadId, Math.min(Math.max(limit, 1), 500)],
  );

  await client.query(
    `
      UPDATE app_networking.thread_participants
      SET last_read_at = now()
      WHERE thread_id = $1
        AND user_id = $2
    `,
    [threadId, actor.userId],
  );

  return rows.reverse().map(mapMessage);
}

export async function sendMessage(
  client: PoolClient,
  actor: AuthUser,
  input: SendMessageInput,
): Promise<MessageRecord> {
  await requireModulePermission(client, 'mensajes', 'create');
  await requireCommunityAccess(client, actor, 'Mensajes');
  await assertThreadParticipant(client, input.threadId, actor.userId);

  const { rows } = await client.query<MessageRow>(
    `
      INSERT INTO app_networking.messages (thread_id, sender_user_id, message_text)
      SELECT
        $1,
        $2,
        $3
      FROM app_networking.thread_participants tp
      JOIN app_core.users u ON u.user_id = $2
      WHERE tp.thread_id = $1
        AND tp.user_id = $2
      LIMIT 1
      RETURNING
        message_id::text,
        thread_id::text,
        sender_user_id::text,
        (SELECT display_name FROM app_core.users WHERE user_id = sender_user_id) AS sender_name,
        message_text,
        created_at::text,
        edited_at::text,
        deleted_at::text
    `,
    [input.threadId, actor.userId, input.messageText],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to send message');
  }

  return mapMessage(row);
}

export async function updateMessage(
  client: PoolClient,
  actor: AuthUser,
  messageId: string,
  input: UpdateMessageInput,
): Promise<MessageRecord> {
  await requireModulePermission(client, 'mensajes', 'update');
  await requireCommunityAccess(client, actor, 'Mensajes');

  const { rows } = await client.query<MessageRow>(
    `
      UPDATE app_networking.messages m
      SET
        message_text = $2,
        edited_at = now()
      FROM app_core.users u
      WHERE m.message_id = $1
        AND m.sender_user_id = $3
        AND m.deleted_at IS NULL
        AND u.user_id = m.sender_user_id
      RETURNING
        m.message_id::text,
        m.thread_id::text,
        m.sender_user_id::text,
        u.display_name AS sender_name,
        m.message_text,
        m.created_at::text,
        m.edited_at::text,
        m.deleted_at::text
    `,
    [messageId, input.messageText, actor.userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Message not found');
  }

  return mapMessage(row);
}

export async function deleteMessage(
  client: PoolClient,
  actor: AuthUser,
  messageId: string,
): Promise<{ messageId: string }> {
  await requireModulePermission(client, 'mensajes', 'delete');
  await requireCommunityAccess(client, actor, 'Mensajes');

  const { rows } = await client.query<{ message_id: string }>(
    `
      UPDATE app_networking.messages
      SET deleted_at = now()
      WHERE message_id = $1
        AND sender_user_id = $2
        AND deleted_at IS NULL
      RETURNING message_id::text
    `,
    [messageId, actor.userId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Message not found');
  }

  return {
    messageId: row.message_id,
  };
}
