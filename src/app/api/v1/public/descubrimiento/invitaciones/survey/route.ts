import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { saveDiscoveryInvitationSurvey } from "@/features/descubrimiento/service";
import type { DiscoveryExperienceSurvey } from "@/features/descubrimiento/types";

interface SurveyBody {
  inviteToken?: string;
  accessCode?: string;
  survey?: DiscoveryExperienceSurvey;
}

export async function POST(request: Request) {
  let body: SurveyBody | null = null;
  try {
    body = (await request.json()) as SurveyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();
  const survey = body?.survey;

  if (!inviteToken || !accessCode || !survey) {
    return NextResponse.json(
      { ok: false, error: "inviteToken, accessCode and survey are required" },
      { status: 400 },
    );
  }

  try {
    const result = await withClient((client) =>
      saveDiscoveryInvitationSurvey(client, { inviteToken, accessCode, survey }),
    );
    return NextResponse.json({ ok: true, data: result }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = detail.includes("invalido") || detail.includes("no encontrada") ? 400 : 500;
    return NextResponse.json({ ok: false, error: "Failed to save survey", detail }, { status });
  }
}
