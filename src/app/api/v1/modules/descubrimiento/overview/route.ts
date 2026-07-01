import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { authenticateRequest } from "@/server/auth/request-auth";
import { withClient, withRoleContext } from "@/server/db/pool";
import {
  getDiscoveryOverview,
  drainStuckDiscoveryAiJobs,
} from "@/features/descubrimiento/service";
import {
  errorResponse,
  logModuleAudit,
  unauthorizedResponse,
} from "../../_utils";

// waitUntil puede lanzar la regeneración de IA (varios minutos) en background.
export const maxDuration = 300;

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
    gender: url.searchParams.get("gender")?.trim() || undefined,
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

    // Respaldo del cron: como el cron de Vercel puede quedar bloqueado por el
    // redirect de dominio, aprovechamos que un admin abrió el panel (petición a
    // www, autenticada) para drenar en background los análisis de IA huérfanos.
    // Solo admins (gestor puede no tener permiso 'update' para regenerar).
    if (identity.role === "admin") {
      waitUntil(
        drainStuckDiscoveryAiJobs(identity, { limit: 1 }).catch((error) => {
          console.error("[Discovery] drainStuckDiscoveryAiJobs falló", error);
        }),
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Failed to load discovery overview");
  }
}
