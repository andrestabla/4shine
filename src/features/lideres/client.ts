import { requestApi } from '@/lib/api-client';
import type { Leader360Snapshot } from './service';

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

export async function getLeader360(userId: string): Promise<Leader360Snapshot> {
    return requestApi<Leader360Snapshot>(`/api/v1/modules/lideres/${encodeURIComponent(userId)}/snapshot`, {
        timeoutMs: 30000,
    });
}
