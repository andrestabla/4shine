import { NextResponse } from "next/server";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  getOrCreateDiscoverySession,
  updateDiscoverySession,
  verifyDiscoveryInvitationAccessAndProvisionInvitedUser,
} from "@/features/descubrimiento/service";
import { setAuthCookies } from "@/server/auth/cookies";
import { issueAuthTokens } from "@/server/auth/session";

interface VerifyBody {
  inviteToken?: string;
  accessCode?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (!fwd) return null;
  return fwd.split(",")[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: VerifyBody | null = null;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();

  if (!inviteToken || !accessCode) {
    return NextResponse.json(
      { ok: false, error: "inviteToken and accessCode are required" },
      { status: 400 },
    );
  }

  try {
    const result = await withClient(async (client) => {
      const provisioned = await verifyDiscoveryInvitationAccessAndProvisionInvitedUser(
        client,
        inviteToken,
        accessCode,
      );
      const session = await withRoleContext(
        client,
        provisioned.authUser.userId,
        provisioned.authUser.role,
        async () => {
          let currentSession = await getOrCreateDiscoverySession(client, provisioned.authUser);
          if (
            provisioned.access.externalProgress &&
            Object.keys(currentSession.answers).length === 0 &&
            provisioned.access.externalProgress.status !== "intro"
          ) {
            currentSession = await updateDiscoverySession(client, provisioned.authUser, {
              status: provisioned.access.externalProgress.status,
              answers: provisioned.access.externalProgress.answers,
              currentIdx: provisioned.access.externalProgress.currentIdx,
              profile: provisioned.access.externalProgress.profile,
              experienceSurvey:
                provisioned.access.externalSurvey ??
                provisioned.access.externalProgress.experienceSurvey ??
                null,
              markCompleted:
                provisioned.access.externalProgress.status === "results" ||
                provisioned.access.alreadyCompleted,
            });
          }
          await client.query(
            `
              UPDATE app_assessment.discovery_invitations
              SET session_id = $2::uuid,
                  updated_at = now()
              WHERE invitation_id = $1::uuid
            `,
            [provisioned.access.invitation.invitationId, currentSession.sessionId],
          );
          return currentSession;
        },
      );
      const tokens = await issueAuthTokens(
        client,
        provisioned.authUser,
        request.headers.get("user-agent"),
        getIpAddress(request),
      );
      return {
        data: {
          ...provisioned.access,
          session,
          accessMode:
            session.status === "results" || session.completionPercent >= 100
              ? "results"
              : "diagnostic",
          alreadyCompleted:
            provisioned.access.alreadyCompleted ||
            session.status === "results" ||
            session.completionPercent >= 100,
          externalProgress: provisioned.access.externalProgress,
          externalSurvey: provisioned.access.externalSurvey ?? session.experienceSurvey,
        },
        tokens,
      };
    });
    const response = NextResponse.json({ ok: true, data: result.data }, { status: 200 });
    setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = detail.includes("invalido") || detail.includes("no encontrada") ? 400 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to verify invitation access",
        detail,
      },
      { status },
    );
  }
}
