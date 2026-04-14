import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  getDiscoveryFeedbackSettings,
  updateDiscoveryFeedbackSettings,
} from "@/features/descubrimiento/service";
import type { DiscoveryContextDocument } from "@/features/descubrimiento/types";
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from "../../_utils";

interface UpdateDiscoverySettingsInput {
  aiFeedbackInstructions?: string;
  contextDocuments?: DiscoveryContextDocument[];
  inviteEmailSubject?: string;
  inviteEmailHtml?: string;
  inviteEmailText?: string;
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getDiscoveryFeedbackSettings(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "query_discovery_settings",
          entityTable: "app_assessment.discovery_feedback_settings",
          entityId: result.settingsId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery settings");
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateDiscoverySettingsInput>(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateDiscoveryFeedbackSettings(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "update_discovery_settings",
          entityTable: "app_assessment.discovery_feedback_settings",
          entityId: result.settingsId,
          changeSummary: {
            contextDocuments: result.contextDocuments.length,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to update discovery settings");
  }
}
