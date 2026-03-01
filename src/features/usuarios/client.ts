import { requestApi } from '@/lib/api-client';

export type AppRole = 'lider' | 'mentor' | 'gestor' | 'admin';
type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';

export interface UserRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  primaryRole: AppRole;
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

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  timezone?: string;
  primaryRole: AppRole;
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
  primaryRole?: AppRole;
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

export async function listUsers(): Promise<UserRecord[]> {
  return requestApi<UserRecord[]>('/api/v1/modules/usuarios');
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  return requestApi<UserRecord>('/api/v1/modules/usuarios', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<UserRecord> {
  return requestApi<UserRecord>(`/api/v1/modules/usuarios/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deactivateUser(userId: string): Promise<{ userId: string }> {
  return requestApi<{ userId: string }>(`/api/v1/modules/usuarios/${userId}`, {
    method: 'DELETE',
  });
}

export async function listUserNavigationLogs(): Promise<AuditLogRecord[]> {
  return requestApi<AuditLogRecord[]>('/api/v1/modules/usuarios/audit-logs');
}
