import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

export const runtime = 'nodejs';

async function getZoomWebhookSecret(client: import('pg').PoolClient): Promise<string | null> {
  const { rows } = await client.query<{ wizard_data: Record<string, string> | null }>(
    `SELECT ic.wizard_data
     FROM app_admin.integration_configs ic
     JOIN organizations o ON o.organization_id = ic.organization_id
     WHERE ic.integration_key = 'zoom'
     LIMIT 1`,
  );
  return rows[0]?.wizard_data?.webhookSecretToken?.trim() || null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Zoom Challenge-Response Check (CRC) — validates endpoint ownership
  if (
    body.event === 'endpoint.url_validation' &&
    body.payload &&
    typeof (body.payload as Record<string, unknown>).plainToken === 'string'
  ) {
    const plainToken = (body.payload as Record<string, string>).plainToken;

    const secret = await withClient((client) => getZoomWebhookSecret(client));
    if (!secret) {
      return NextResponse.json({ error: 'Zoom webhook secret not configured' }, { status: 500 });
    }

    const encryptedToken = createHmac('sha256', secret).update(plainToken).digest('hex');
    return NextResponse.json({ plainToken, encryptedToken }, { status: 200 });
  }

  // Actual webhook events — verify x-zm-signature before processing
  const zmSignature = request.headers.get('x-zm-signature');
  const zmTimestamp = request.headers.get('x-zm-request-timestamp');
  if (zmSignature && zmTimestamp) {
    const secret = await withClient((client) => getZoomWebhookSecret(client));
    if (secret) {
      const rawBody = JSON.stringify(body);
      const message = `v0:${zmTimestamp}:${rawBody}`;
      const hash = 'v0=' + createHmac('sha256', secret).update(message).digest('hex');
      if (hash !== zmSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
  }

  // Events are received here — extend this handler as Zoom features are built out
  return NextResponse.json({ ok: true }, { status: 200 });
}
