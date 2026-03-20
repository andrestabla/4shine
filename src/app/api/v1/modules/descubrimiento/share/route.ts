import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { shareDiscoverySession } from "@/features/descubrimiento/service";
import type { UpdateDiscoverySessionInput } from "@/features/descubrimiento/types";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../_utils";

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body =
    (await parseJsonBody<UpdateDiscoverySessionInput>(request)) ?? {};

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await shareDiscoverySession(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "share_discovery_session",
          entityTable: "app_assessment.discovery_sessions",
          entityId: result.sessionId,
          changeSummary: {
            publicId: result.publicId,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to share discovery session");
  }
}

