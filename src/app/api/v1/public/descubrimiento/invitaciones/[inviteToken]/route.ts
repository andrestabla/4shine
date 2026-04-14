import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { getDiscoveryInvitationPublicInfo } from "@/features/descubrimiento/service";

interface RouteParams {
  params: Promise<{ inviteToken: string }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  const { inviteToken } = await params;

  try {
    const data = await withClient((client) =>
      getDiscoveryInvitationPublicInfo(client, inviteToken),
    );

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load invitation",
        detail,
      },
      { status: 500 },
    );
  }
}
