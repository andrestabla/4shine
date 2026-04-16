import { NextResponse } from "next/server";
import { withClient } from "@/server/db/pool";
import { errorResponse, parseJsonBody } from "@/app/api/v1/modules/_utils";
import { sendDiscoveryResultsEmailViaAdmin } from "@/features/descubrimiento/service";

interface ShareResultsEmailBody {
  publicId: string;
  emails: string[];
}

export async function POST(request: Request) {
  const body = await parseJsonBody<ShareResultsEmailBody>(request);

  if (!body?.publicId) {
    return NextResponse.json({ ok: false, error: "Falta publicId" }, { status: 400 });
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return NextResponse.json({ ok: false, error: "Lista de correos inválida" }, { status: 400 });
  }

  try {
    await withClient(async (client) => {
      await sendDiscoveryResultsEmailViaAdmin(client, body.publicId, body.emails);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Error al enviar el correo de resultados");
  }
}
