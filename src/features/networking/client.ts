import { requestApi } from '@/lib/api-client';

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

export interface NetworkPersonRecord {
  userId: string;
  displayName: string;
  primaryRole: string;
  organizationName: string | null;
  location: string | null;
  industry: string | null;
  connectionStatus: ConnectionStatus | 'none';
}

export interface CreateConnectionInput {
  addresseeUserId: string;
}

export interface UpdateConnectionInput {
  status: ConnectionStatus;
}

export async function listConnections(): Promise<ConnectionRecord[]> {
  return requestApi<ConnectionRecord[]>('/api/v1/modules/networking/connections');
}

export async function listNetworkPeople(): Promise<NetworkPersonRecord[]> {
  return requestApi<NetworkPersonRecord[]>('/api/v1/modules/networking/people');
}

export async function createConnection(input: CreateConnectionInput): Promise<ConnectionRecord> {
  return requestApi<ConnectionRecord>('/api/v1/modules/networking/connections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateConnection(
  connectionId: string,
  input: UpdateConnectionInput,
): Promise<ConnectionRecord> {
  return requestApi<ConnectionRecord>(`/api/v1/modules/networking/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteConnection(connectionId: string): Promise<{ connectionId: string }> {
  return requestApi<{ connectionId: string }>(`/api/v1/modules/networking/connections/${connectionId}`, {
    method: 'DELETE',
  });
}
