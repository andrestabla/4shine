import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  generateDiscoveryAnalysis,
} from "@/features/descubrimiento/service";
import type {
  DiscoveryReportFilter,
  DiscoveryScoreResult,
} from "@/features/descubrimiento/types";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../_utils";

interface AnalyzeDiscoveryInput {
  username?: string;
  role?: string;
  scores?: DiscoveryScoreResult;
  pillar?: DiscoveryReportFilter;
  fallbackReport?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<AnalyzeDiscoveryInput>(request);
  if (!body?.scores || !body.username) {
    return NextResponse.json(
      { ok: false, error: "username and scores are required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await generateDiscoveryAnalysis(client, identity, {
          username: body.username ?? "Usuario",
          role: body.role ?? "Lider",
          scores: body.scores as DiscoveryScoreResult,
          pillar: body.pillar ?? "all",
          fallbackReport: body.fallbackReport,
        });

        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "generate_discovery_analysis",
          entityTable: "app_assessment.discovery_sessions",
          changeSummary: {
            pillar: body.pillar ?? "all",
            source: result.source,
          },
        });

        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to analyze discovery report");
  }
}
