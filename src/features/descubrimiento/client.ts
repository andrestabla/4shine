import { requestApi } from "@/lib/api-client";
import type {
  DiscoveryExperienceSurvey,
  DiscoveryFeedbackSettingsRecord,
  DiscoveryInvitationAccessPayload,
  DiscoveryInvitationBatchResult,
  DiscoveryInvitationRecord,
  DiscoveryInvitationRequest,
  DiscoveryInvitationWithCode,
  DiscoveryOverviewDetailPayload,
  DiscoveryOverviewFilters,
  DiscoveryOverviewPayload,
  DiscoveryReportFilter,
  DiscoveryScoreResult,
  DiscoverySessionRecord,
  DiscoveryUserState,
  UpdateDiscoverySessionInput,
} from "./types";

export type {
  DiscoveryFeedbackSettingsRecord,
  DiscoveryInvitationAccessPayload,
  DiscoveryInvitationBatchResult,
  DiscoveryInvitationRecord,
  DiscoveryInvitationRequest,
  DiscoveryOverviewDetailPayload,
  DiscoveryOverviewFilters,
  DiscoveryOverviewPayload,
  DiscoverySessionRecord,
  DiscoveryUserState,
  UpdateDiscoverySessionInput,
} from "./types";

export async function getDiscoverySession(userId?: string): Promise<DiscoverySessionRecord> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return requestApi<DiscoverySessionRecord>(`/api/v1/modules/descubrimiento/session${query}`);
}

export async function updateDiscoverySessionRequest(
  input: UpdateDiscoverySessionInput,
): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/session",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function resetDiscoverySessionRequest(): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/session",
    {
      method: "DELETE",
    },
  );
}

export async function shareDiscoverySessionRequest(
  input: UpdateDiscoverySessionInput,
): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/share",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getDiscoveryFeedbackSettings(): Promise<DiscoveryFeedbackSettingsRecord> {
  return requestApi<DiscoveryFeedbackSettingsRecord>(
    "/api/v1/modules/descubrimiento/settings",
  );
}

export async function updateDiscoveryFeedbackSettings(input: {
  aiFeedbackInstructions?: string;
  contextDocuments?: DiscoveryFeedbackSettingsRecord["contextDocuments"];
  inviteEmailSubject?: string;
  inviteEmailHtml?: string;
  inviteEmailText?: string;
}): Promise<DiscoveryFeedbackSettingsRecord> {
  return requestApi<DiscoveryFeedbackSettingsRecord>(
    "/api/v1/modules/descubrimiento/settings",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function createDiscoveryInvitations(
  input: DiscoveryInvitationRequest,
): Promise<DiscoveryInvitationBatchResult> {
  return requestApi<DiscoveryInvitationBatchResult>(
    "/api/v1/modules/descubrimiento/invitations",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function listDiscoveryInvitations(
  sessionId?: string,
): Promise<DiscoveryInvitationRecord[]> {
  const query = sessionId
    ? `?sessionId=${encodeURIComponent(sessionId)}`
    : "";
  return requestApi<DiscoveryInvitationRecord[]>(
    `/api/v1/modules/descubrimiento/invitations${query}`,
  );
}

export async function getDiscoveryOverview(
  filters: DiscoveryOverviewFilters = {},
): Promise<DiscoveryOverviewPayload> {
  const searchParams = new URLSearchParams();

  if (filters.userId) searchParams.set("userId", filters.userId);
  if (filters.country) searchParams.set("country", filters.country);
  if (filters.jobRole) searchParams.set("jobRole", filters.jobRole);
  if (filters.gender) searchParams.set("gender", filters.gender);
  if (Number.isFinite(filters.yearsExperienceMin)) {
    searchParams.set("yearsExperienceMin", String(filters.yearsExperienceMin));
  }
  if (Number.isFinite(filters.yearsExperienceMax)) {
    searchParams.set("yearsExperienceMax", String(filters.yearsExperienceMax));
  }

  const query = searchParams.toString();
  return requestApi<DiscoveryOverviewPayload>(
    `/api/v1/modules/descubrimiento/overview${query ? `?${query}` : ""}`,
  );
}

export async function getDiscoveryOverviewDetail(
  sessionId: string,
): Promise<DiscoveryOverviewDetailPayload> {
  const query = new URLSearchParams({ sessionId }).toString();
  return requestApi<DiscoveryOverviewDetailPayload>(
    `/api/v1/modules/descubrimiento/overview/detail?${query}`,
  );
}

export async function resetDiscoveryOverviewAttempt(
  sessionId: string,
): Promise<{ sessionId: string }> {
  return requestApi<{ sessionId: string }>(
    "/api/v1/modules/descubrimiento/overview/reset",
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    },
  );
}

export async function regenerateDiscoveryReport(
  sessionId: string,
): Promise<{ sessionId: string }> {
  return requestApi<{ sessionId: string }>(
    "/api/v1/modules/descubrimiento/overview/regenerate",
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    },
  );
}

export async function sendDiscoveryReportEmail(
  sessionId: string,
): Promise<{ ok: true }> {
  return requestApi<{ ok: true }>(
    "/api/v1/modules/descubrimiento/overview/send-report",
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    },
  );
}

export async function verifyInvitationAccess(input: {
  inviteToken: string;
  accessCode: string;
}): Promise<DiscoveryInvitationAccessPayload> {
  return requestApi<DiscoveryInvitationAccessPayload>(
    "/api/v1/public/descubrimiento/invitaciones/verify",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getInvitationPublicInfo(inviteToken: string): Promise<{
  inviteToken: string;
  invitedEmailMasked: string;
  openedAt: string | null;
  externalProgressStatus?: string | null;
}> {
  return requestApi<{ inviteToken: string; invitedEmailMasked: string; openedAt: string | null; externalProgressStatus?: string | null }>(
    `/api/v1/public/descubrimiento/invitaciones/${encodeURIComponent(inviteToken)}`,
  );
}

export async function saveInvitationSurvey(input: {
  inviteToken: string;
  accessCode: string;
  survey: DiscoveryExperienceSurvey;
}): Promise<{ ok: true; survey: DiscoveryExperienceSurvey }> {
  return requestApi<{ ok: true; survey: DiscoveryExperienceSurvey }>(
    "/api/v1/public/descubrimiento/invitaciones/survey",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function resendDiscoveryInvitationRequest(
  invitationId: string,
): Promise<DiscoveryInvitationWithCode> {
  return requestApi<DiscoveryInvitationWithCode>(
    `/api/v1/modules/descubrimiento/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST" },
  );
}

export async function deleteDiscoveryInvitationRequest(
  invitationId: string,
): Promise<void> {
  await requestApi<void>(
    `/api/v1/modules/descubrimiento/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
  );
}

export async function saveInvitationProgress(input: {
  inviteToken: string;
  accessCode: string;
  state: DiscoveryUserState;
  survey?: DiscoveryUserState["experienceSurvey"];
}): Promise<DiscoveryInvitationAccessPayload> {
  return requestApi<DiscoveryInvitationAccessPayload>(
    "/api/v1/public/descubrimiento/invitaciones/progress",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function analyzeDiscoveryReport(input: {
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
  pillar: DiscoveryReportFilter;
  fallbackReport?: string;
}): Promise<{ report: string; source: "ai" | "fallback" }> {
  return requestApi<{ report: string; source: "ai" | "fallback" }>(
    "/api/diagnostics/analyze",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function analyzeDiscoveryReportBatch(input: {
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
}): Promise<{ reports: Partial<Record<DiscoveryReportFilter, string>> }> {
  return requestApi<{ reports: Partial<Record<DiscoveryReportFilter, string>> }>(
    "/api/diagnostics/analyze/batch",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function analyzeInvitationDiscoveryReport(input: {
  inviteToken: string;
  accessCode: string;
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
  pillar: DiscoveryReportFilter;
  fallbackReport?: string;
}): Promise<{ report: string; source: "ai" | "fallback" }> {
  const { inviteToken, accessCode, username, role, scores, pillar, fallbackReport } = input;
  return requestApi<{ report: string; source: "ai" | "fallback" }>(
    "/api/diagnostics/analyze",
    {
      method: "POST",
      body: JSON.stringify({
        inviteToken,
        accessCode,
        username,
        role,
        scores,
        pillar,
        fallbackReport,
      }),
    },
  );
}

export async function analyzeInvitationDiscoveryReportBatch(input: {
  inviteToken: string;
  accessCode: string;
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
}): Promise<{ reports: Partial<Record<DiscoveryReportFilter, string>> }> {
  const { inviteToken, accessCode, username, role, scores } = input;
  return requestApi<{ reports: Partial<Record<DiscoveryReportFilter, string>> }>(
    "/api/diagnostics/analyze/batch",
    {
      method: "POST",
      body: JSON.stringify({
        inviteToken,
        accessCode,
        username,
        role,
        scores,
      }),
    },
  );
}
