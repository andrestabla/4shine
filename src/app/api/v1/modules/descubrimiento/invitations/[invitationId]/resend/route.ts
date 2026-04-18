import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { resendDiscoveryInvitation } from "@/features/descubrimiento/service";
import {
  errorResponse,
  logModuleAudit,
  unauthorizedResponse,
} from "../../../../_utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { invitationId } = await params;
  if (!invitationId) {
    return NextResponse.json({ ok: false, error: "invitationId is required" }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await resendDiscoveryInvitation(client, identity, invitationId);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "resend_discovery_invitation",
          entityTable: "app_assessment.discovery_invitations",
          entityId: invitationId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to resend discovery invitation");
  }
}
