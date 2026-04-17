import { requestApi } from '@/lib/api-client';

export type AppRole = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';
type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type JobRole =
  | 'Director/C-Level'
  | 'Gerente/Mando medio'
  | 'Coordinador'
  | 'Lider de proyecto con equipo a cargo'
  | 'Especialista sin personal a cargo';
type PolicyStatus = 'accepted' | 'pending';

export interface UserRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarInitial: string | null;
  timezone: string;
  primaryRole: AppRole;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  planType: PlanType | null;
  country: string | null;
  jobRole: JobRole | null;
  gender: string | null;
  yearsExperience: number | null;
  policyStatus: PolicyStatus;
  policyCode: string | null;
  policyVersion: string | null;
  policyAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsRecord {
  projectsCount: number;
  contentCreatedCount: number;
  commentsCount: number;
  messagesSentCount: number;
  mentorshipSessionsCount: number;
  navigationEventsCount: number;
}

export interface UserPolicyAcceptanceRecord {
  acceptanceId: string;
  policyCode: string;
  policyVersion: string;
  acceptedAt: string;
  acceptanceSource: string;
  metadata: Record<string, unknown>;
}

export interface RolePermissionRecord {
  moduleCode: string;
  moduleName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canModerate: boolean;
  canManage: boolean;
}

export interface UserDetailRecord extends UserRecord {
  passwordUpdatedAt: string | null;
  lastSessionAt: string | null;
  stats: UserStatsRecord;
  rolePermissions: RolePermissionRecord[];
  policyHistory: UserPolicyAcceptanceRecord[];
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

export interface ListUsersInput {
  limit?: number;
  search?: string;
  role?: AppRole | 'all';
  status?: 'all' | 'active' | 'inactive';
  policyStatus?: 'all' | PolicyStatus;
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
  planType?: PlanType | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone?: string;
  primaryRole?: AppRole;
  organizationId?: string | null;
  isActive?: boolean;
  password?: string;
  planType?: PlanType | null;
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
}

function buildQuery(input: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listUsers(input: ListUsersInput = {}): Promise<UserRecord[]> {
  const query = buildQuery({
    limit: input.limit,
    search: input.search,
    role: input.role,
    status: input.status,
    policyStatus: input.policyStatus,
  });
  return requestApi<UserRecord[]>(`/api/v1/modules/usuarios${query}`);
}

export async function getUserDetail(userId: string): Promise<UserDetailRecord> {
  return requestApi<UserDetailRecord>(`/api/v1/modules/usuarios/${userId}`);
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

export async function hardDeleteUser(userId: string): Promise<{ userId: string }> {
  return requestApi<{ userId: string }>(`/api/v1/modules/usuarios/${userId}`, {
    method: 'DELETE',
  });
}

export async function listUserNavigationLogs(input: { limit?: number; userId?: string } = {}): Promise<AuditLogRecord[]> {
  const query = buildQuery({
    limit: input.limit,
    userId: input.userId,
  });

  return requestApi<AuditLogRecord[]>(`/api/v1/modules/usuarios/audit-logs${query}`);
}

export async function listUserAuditLogs(userId: string, limit?: number): Promise<AuditLogRecord[]> {
  const query = buildQuery({ limit });
  return requestApi<AuditLogRecord[]>(`/api/v1/modules/usuarios/${userId}/audit-logs${query}`);
}

export async function resetUserPassword(userId: string): Promise<{
  userId: string;
  recipient: string;
  messageId: string | null;
  passwordUpdatedAt: string;
}> {
  return requestApi(`/api/v1/modules/usuarios/${userId}/reset-password`, {
    method: 'POST',
  });
}

export async function sendUserDirectMessage(userId: string, messageText: string): Promise<{
  threadId: string;
  messageId: string;
}> {
  return requestApi(`/api/v1/modules/usuarios/${userId}/send-message`, {
    method: 'POST',
    body: JSON.stringify({ messageText }),
  });
}
