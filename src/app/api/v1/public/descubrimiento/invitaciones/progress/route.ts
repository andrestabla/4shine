import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { saveDiscoveryInvitationProgress } from "@/features/descubrimiento/service";
import type { DiscoveryExperienceSurvey, DiscoveryUserState } from "@/features/descubrimiento/types";

interface SaveProgressBody {
  inviteToken?: string;
  accessCode?: string;
  state?: DiscoveryUserState;
  survey?: DiscoveryExperienceSurvey | null;
}

export async function PATCH(request: Request) {
  let body: SaveProgressBody | null = null;
  try {
    body = (await request.json()) as SaveProgressBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();
  const state = body?.state;

  if (!inviteToken || !accessCode || !state) {
    return NextResponse.json(
      { ok: false, error: "inviteToken, accessCode and state are required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      saveDiscoveryInvitationProgress(client, {
        inviteToken,
        accessCode,
        state,
        survey: body?.survey ?? null,
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = detail.includes("invalido") || detail.includes("no encontrada") ? 400 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save invitation progress",
        detail,
      },
      { status },
    );
  }
}
