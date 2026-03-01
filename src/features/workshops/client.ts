import { requestApi } from '@/lib/api-client';

export type WorkshopType = 'relacionamiento' | 'formacion' | 'innovacion' | 'wellbeing' | 'otro';
export type WorkshopStatus = 'upcoming' | 'completed' | 'cancelled';

export interface WorkshopRecord {
  workshopId: string;
  title: string;
  description: string | null;
  workshopType: WorkshopType;
  status: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId: string | null;
  facilitatorName: string | null;
  meetingUrl: string | null;
  attendees: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string | null;
  workshopType: WorkshopType;
  status?: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

export interface UpdateWorkshopInput {
  title?: string;
  description?: string | null;
  workshopType?: WorkshopType;
  status?: WorkshopStatus;
  startsAt?: string;
  endsAt?: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

export async function listWorkshops(): Promise<WorkshopRecord[]> {
  return requestApi<WorkshopRecord[]>('/api/v1/modules/workshops');
}

export async function createWorkshop(input: CreateWorkshopInput): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>('/api/v1/modules/workshops', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateWorkshop(workshopId: string, input: UpdateWorkshopInput): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(`/api/v1/modules/workshops/${workshopId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteWorkshop(workshopId: string): Promise<{ workshopId: string }> {
  return requestApi<{ workshopId: string }>(`/api/v1/modules/workshops/${workshopId}`, {
    method: 'DELETE',
  });
}
