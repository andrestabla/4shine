import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  getOrCreateDiscoverySession,
  resetDiscoverySession,
  updateDiscoverySession,
} from "@/features/descubrimiento/service";
import type { UpdateDiscoverySessionInput } from "@/features/descubrimiento/types";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../_utils";

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getOrCreateDiscoverySession(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "query_discovery_session",
          entityTable: "app_assessment.discovery_sessions",
          entityId: result.sessionId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery session");
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateDiscoverySessionInput>(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateDiscoverySession(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "update_discovery_session",
          entityTable: "app_assessment.discovery_sessions",
          entityId: result.sessionId,
          changeSummary: {
            status: result.status,
            completionPercent: result.completionPercent,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to update discovery session");
  }
}

export async function DELETE(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await resetDiscoverySession(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "reset_discovery_session",
          entityTable: "app_assessment.discovery_sessions",
          entityId: result.sessionId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to reset discovery session");
  }
}

