import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { verifyDiscoveryInvitationAccess } from "@/features/descubrimiento/service";

interface VerifyBody {
  inviteToken?: string;
  accessCode?: string;
}

export async function POST(request: Request) {
  let body: VerifyBody | null = null;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const inviteToken = body?.inviteToken?.trim();
  const accessCode = body?.accessCode?.trim();

  if (!inviteToken || !accessCode) {
    return NextResponse.json(
      { ok: false, error: "inviteToken and accessCode are required" },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      verifyDiscoveryInvitationAccess(client, inviteToken, accessCode),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status = detail.includes("invalido") || detail.includes("no encontrada") ? 401 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to verify invitation access",
        detail,
      },
      { status },
    );
  }
}
