import { requestApi } from '@/lib/api-client';
import type { Leader360Snapshot } from './service';
import type { LeaderSummary } from './summary-service';

export type {
    Leader360Snapshot,
    LeaderProfile,
    LeaderWorkbookSummary,
    LeaderDiagnosticSummary,
    LeaderDiagnosticPillarScore,
    LeaderMentorshipSummary,
    LeaderMentorshipAssignment,
    LeaderMentorshipSession,
    LeaderProgramNext,
    LeaderContentSummary,
    LeaderContentItem,
    LeaderNetworkingSummary,
    LeaderNetworkingConnection,
    LeaderConvocatoriaSummary,
    LeaderConvocatoriaItem,
    LeaderWorkshopSummary,
    LeaderWorkshopItem,
} from './service';
export type { LeaderSummary } from './summary-service';

export async function getLeader360(userId: string): Promise<Leader360Snapshot> {
    return requestApi<Leader360Snapshot>(`/api/v1/modules/lideres/${encodeURIComponent(userId)}/snapshot`, {
        timeoutMs: 30000,
    });
}

export async function listLeaderSummaries(): Promise<LeaderSummary[]> {
    return requestApi<LeaderSummary[]>(`/api/v1/modules/lideres/summary`, {
        timeoutMs: 30000,
    });
}

export interface ScheduleLeaderMentorshipInput {
    mode: 'program' | 'manual';
    mentorUserId: string;
    startsAt: string;
    durationMinutes?: number;
    title?: string;
    meetingUrl?: string | null;
    note?: string | null;
    entitlementId?: string | null;
}

export async function scheduleLeaderMentorship(userId: string, input: ScheduleLeaderMentorshipInput) {
    return requestApi(`/api/v1/modules/lideres/${encodeURIComponent(userId)}/schedule-mentorship`, {
        method: 'POST',
        body: JSON.stringify(input),
        timeoutMs: 30000,
    });
}

export interface AdviserOption {
    userId: string;
    name: string;
}

/** Lista de advisers (mentores) para el selector — usa el endpoint público. */
export async function listAdvisersForSelect(): Promise<AdviserOption[]> {
    const data = await requestApi<Array<{ userId: string; name: string }>>(`/api/v1/public/site/advisers`);
    return (data ?? []).map((a) => ({ userId: a.userId, name: a.name }));
}
