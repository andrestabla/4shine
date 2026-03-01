import { requestApi } from '@/lib/api-client';

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

export interface MessageParticipantRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
}

export interface CreateDirectThreadInput {
  participantUserId: string;
  title?: string;
}

export interface SendMessageInput {
  messageText: string;
}

export interface UpdateMessageInput {
  messageText: string;
}

export async function listThreads(): Promise<ThreadRecord[]> {
  return requestApi<ThreadRecord[]>('/api/v1/modules/mensajes/threads');
}

export async function listParticipants(): Promise<MessageParticipantRecord[]> {
  return requestApi<MessageParticipantRecord[]>('/api/v1/modules/mensajes/participants');
}

export async function createDirectThread(input: CreateDirectThreadInput): Promise<ThreadRecord> {
  return requestApi<ThreadRecord>('/api/v1/modules/mensajes/threads', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listMessages(threadId: string): Promise<MessageRecord[]> {
  return requestApi<MessageRecord[]>(`/api/v1/modules/mensajes/threads/${threadId}/messages`);
}

export async function sendMessage(threadId: string, input: SendMessageInput): Promise<MessageRecord> {
  return requestApi<MessageRecord>(`/api/v1/modules/mensajes/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMessage(messageId: string, input: UpdateMessageInput): Promise<MessageRecord> {
  return requestApi<MessageRecord>(`/api/v1/modules/mensajes/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMessage(messageId: string): Promise<{ messageId: string }> {
  return requestApi<{ messageId: string }>(`/api/v1/modules/mensajes/messages/${messageId}`, {
    method: 'DELETE',
  });
}
