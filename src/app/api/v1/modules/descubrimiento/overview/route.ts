import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import { getDiscoveryOverview } from "@/features/descubrimiento/service";
import {
  errorResponse,
  logModuleAudit,
  unauthorizedResponse,
} from "../../_utils";

function parseNumeric(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const filters = {
    userId: url.searchParams.get("userId")?.trim() || undefined,
    country: url.searchParams.get("country")?.trim() || undefined,
    jobRole: url.searchParams.get("jobRole")?.trim() || undefined,
    ageMin: parseNumeric(url.searchParams.get("ageMin")),
    ageMax: parseNumeric(url.searchParams.get("ageMax")),
    yearsExperienceMin: parseNumeric(url.searchParams.get("yearsExperienceMin")),
    yearsExperienceMax: parseNumeric(url.searchParams.get("yearsExperienceMax")),
  };

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getDiscoveryOverview(client, identity, filters);
        await logModuleAudit(client, request, identity, {
          moduleCode: "descubrimiento",
          action: "query_discovery_overview",
          entityTable: "app_assessment.discovery_sessions",
          changeSummary: {
            rows: result.rows.length,
            filters,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery overview");
  }
}
