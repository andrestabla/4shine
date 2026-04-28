import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { updateCertificateTemplate, type UpdateCertificateTemplateInput } from "@/features/aprendizaje/service";
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from "../../../_utils";

export const runtime = "nodejs";

interface ContextParams {
  params: Promise<{ templateId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateCertificateTemplateInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { templateId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateCertificateTemplate(client, identity, templateId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: "aprendizaje",
          action: "update_certificate_template",
          entityTable: "app_learning.certificate_templates",
          entityId: templateId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to update certificate template");
  }
}
