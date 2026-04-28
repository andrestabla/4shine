import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  generateDiscoveryAnalysisContract,
  generateDiscoveryGuestSessionAnalysisContract,
  generateDiscoveryInvitationAnalysisContract,
} from "@/features/descubrimiento/service";
import type {
  DiscoveryReportFilter,
  DiscoveryScoreResult,
} from "@/features/descubrimiento/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface DiagnosticsAnalyzeBody {
  sessionId?: string;
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
  pillar?: DiscoveryReportFilter;
  fallbackReport?: string;
}

export async function POST(request: Request) {
  let body: DiagnosticsAnalyzeBody | null = null;
  try {
    body = (await request.json()) as DiagnosticsAnalyzeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body?.username?.trim();
  const scores = body?.scores;
  if (!username || !scores?.pillarMetrics) {
    return NextResponse.json(
      { ok: false, error: "username and scores are required" },
      { status: 400 },
    );
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();

  try {
    const data = await withClient(async (client) => {
      const identity = await authenticateRequest(request);
      if (identity?.guestScope === "descubrimiento") {
        if (!identity.inviteToken) {
          throw new Error("Invitation access denied");
        }
        return generateDiscoveryGuestSessionAnalysisContract(client, {
          inviteToken: identity.inviteToken,
          username,
          role: body?.role ?? "Invitado",
          scores,
          pillar: body?.pillar ?? "all",
          fallbackReport: body?.fallbackReport,
        });
      }
      if (identity?.role === "invitado") {
        return withRoleContext(client, identity.userId, identity.role, async () =>
          generateDiscoveryAnalysisContract(client, identity, {
            sessionId: body?.sessionId,
            username,
            role: body?.role ?? "Invitado",
            scores,
            pillar: body?.pillar ?? "all",
            fallbackReport: body?.fallbackReport,
          }),
        );
      }

      if (inviteToken && accessCode) {
        return generateDiscoveryInvitationAnalysisContract(client, {
          inviteToken,
          accessCode,
          username,
          role: body?.role ?? "Invitado",
          scores,
          pillar: body?.pillar ?? "all",
          fallbackReport: body?.fallbackReport,
        });
      }

      if (!identity) {
        throw new Error("Unauthorized");
      }
      return withRoleContext(client, identity.userId, identity.role, async () =>
        generateDiscoveryAnalysisContract(client, identity, {
          sessionId: body?.sessionId,
          username,
          role: body?.role ?? "Lider",
          scores,
          pillar: body?.pillar ?? "all",
          fallbackReport: body?.fallbackReport,
        }),
      );
    });

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    if (detail.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (detail.toLowerCase().includes("invit") || detail.toLowerCase().includes("codigo")) {
      return NextResponse.json(
        { ok: false, error: "Invitation access denied", detail },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Failed to analyze diagnostics", detail },
      { status: 500 },
    );
  }
}
