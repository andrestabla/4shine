import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { generateDiscoveryInvitationAnalysisContract } from "@/features/descubrimiento/service";
import type { DiscoveryReportFilter, DiscoveryScoreResult } from "@/features/descubrimiento/types";

export const maxDuration = 300;

interface PublicAnalyzeBody {
  inviteToken?: string;
  accessCode?: string;
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
  pillar?: DiscoveryReportFilter;
  fallbackReport?: string;
  force?: boolean;
}

export async function POST(request: Request) {
  let body: PublicAnalyzeBody | null = null;
  try {
    body = (await request.json()) as PublicAnalyzeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();
  const username = body?.username?.trim();
  const scores = body?.scores;

  if (!inviteToken || !accessCode || !username || !scores?.pillarMetrics) {
    return NextResponse.json(
      { ok: false, error: "inviteToken, accessCode, username and scores are required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      generateDiscoveryInvitationAnalysisContract(client, {
        inviteToken,
        accessCode,
        username,
        role: body?.role ?? "Invitado",
        scores,
        pillar: body?.pillar ?? "all",
        fallbackReport: body?.fallbackReport,
        force: body?.force,
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = detail.toLowerCase().includes("invit") || detail.toLowerCase().includes("codigo") ? 401 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to analyze invitation discovery report",
        detail,
      },
      { status },
    );
  }
}
