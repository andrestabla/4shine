import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { regenerateDiscoveryReportByManager } from "@/features/descubrimiento/service";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../../_utils";

interface RegenerateReportBody {
  sessionId?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<RegenerateReportBody>(request);
  const sessionId = body?.sessionId?.trim() || "";
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await regenerateDiscoveryReportByManager(client, identity, sessionId);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "regenerate_discovery_report",
          entityTable: "app_assessment.discovery_sessions",
          entityId: sessionId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to regenerate discovery report");
  }
}
