import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  createDiscoveryInvitations,
  listDiscoveryInvitationsForSession,
} from "@/features/descubrimiento/service";
import type { DiscoveryInvitationRequest } from "@/features/descubrimiento/types";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../_utils";

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listDiscoveryInvitationsForSession(
          client,
          identity,
          sessionId,
        );
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "query_discovery_invitations",
          entityTable: "app_assessment.discovery_invitations",
          entityId: sessionId,
          changeSummary: {
            count: result.length,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery invitations");
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<DiscoveryInvitationRequest>(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createDiscoveryInvitations(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "create_discovery_invitations",
          entityTable: "app_assessment.discovery_invitations",
          entityId: result.session.sessionId,
          changeSummary: {
            sentCount: result.sentCount,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to send discovery invitations");
  }
}
