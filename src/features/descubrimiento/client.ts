import { requestApi } from "@/lib/api-client";
import type {
  DiscoveryFeedbackSettingsRecord,
  DiscoveryInvitationAccessPayload,
  DiscoveryInvitationBatchResult,
  DiscoveryInvitationRecord,
  DiscoveryInvitationRequest,
  DiscoveryOverviewFilters,
  DiscoveryOverviewPayload,
  DiscoverySessionRecord,
  UpdateDiscoverySessionInput,
} from "./types";

export type {
  DiscoveryFeedbackSettingsRecord,
  DiscoveryInvitationAccessPayload,
  DiscoveryInvitationBatchResult,
  DiscoveryInvitationRecord,
  DiscoveryInvitationRequest,
  DiscoveryOverviewFilters,
  DiscoveryOverviewPayload,
  DiscoverySessionRecord,
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
  sessionId: string,
): Promise<DiscoveryInvitationRecord[]> {
  return requestApi<DiscoveryInvitationRecord[]>(
    `/api/v1/modules/descubrimiento/invitations?sessionId=${encodeURIComponent(sessionId)}`,
  );
}

export async function getDiscoveryOverview(
  filters: DiscoveryOverviewFilters = {},
): Promise<DiscoveryOverviewPayload> {
  const searchParams = new URLSearchParams();

  if (filters.userId) searchParams.set("userId", filters.userId);
  if (filters.country) searchParams.set("country", filters.country);
  if (filters.jobRole) searchParams.set("jobRole", filters.jobRole);
  if (Number.isFinite(filters.ageMin)) searchParams.set("ageMin", String(filters.ageMin));
  if (Number.isFinite(filters.ageMax)) searchParams.set("ageMax", String(filters.ageMax));
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
}> {
  return requestApi<{ inviteToken: string; invitedEmailMasked: string; openedAt: string | null }>(
    `/api/v1/public/descubrimiento/invitaciones/${encodeURIComponent(inviteToken)}`,
  );
}
