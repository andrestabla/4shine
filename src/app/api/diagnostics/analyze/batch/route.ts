import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  generateDiscoveryAnalysisBundleContract,
  generateDiscoveryGuestSessionAnalysisBundleContract,
  generateDiscoveryInvitationAnalysisBundleContract,
} from "@/features/descubrimiento/service";
import type { DiscoveryScoreResult } from "@/features/descubrimiento/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface DiagnosticsAnalyzeBatchBody {
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
}

export async function POST(request: Request) {
  let body: DiagnosticsAnalyzeBatchBody | null = null;
  try {
    body = (await request.json()) as DiagnosticsAnalyzeBatchBody;
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
        return generateDiscoveryGuestSessionAnalysisBundleContract(client, {
          inviteToken: identity.inviteToken,
          username,
          role: body?.role ?? "Invitado",
          scores,
        });
      }

      if (identity?.role === "invitado") {
        return withRoleContext(client, identity.userId, identity.role, async () =>
          generateDiscoveryAnalysisBundleContract(client, identity, {
            username,
            role: body?.role ?? "Invitado",
            scores,
          }),
        );
      }

      if (inviteToken && accessCode) {
        return generateDiscoveryInvitationAnalysisBundleContract(client, {
          inviteToken,
          accessCode,
          username,
          role: body?.role ?? "Invitado",
          scores,
        });
      }

      if (!identity) {
        throw new Error("Unauthorized");
      }

      return withRoleContext(client, identity.userId, identity.role, async () =>
        generateDiscoveryAnalysisBundleContract(client, identity, {
          username,
          role: body?.role ?? "Lider",
          scores,
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
      { ok: false, error: "Failed to analyze diagnostics bundle", detail },
      { status: 500 },
    );
  }
}
