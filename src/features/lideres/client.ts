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
