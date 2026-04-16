import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { getDiscoveryOverviewDetail } from "@/features/descubrimiento/service";
import {
  errorResponse,
  logModuleAudit,
  unauthorizedResponse,
} from "../../../_utils";

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() || "";
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getDiscoveryOverviewDetail(client, identity, sessionId);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "query_discovery_overview_detail",
          entityTable: "app_assessment.discovery_sessions",
          entityId: sessionId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery overview detail");
  }
}
