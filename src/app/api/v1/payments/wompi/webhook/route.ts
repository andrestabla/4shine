import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withClient, withRoleContext } from '@/server/db/pool';
import { markOrderAsFailed, markOrderAsPaid } from '@/features/payments/service';

export const runtime = 'nodejs';

interface WompiTransaction {
  id: string;
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  amount_in_cents: number;
  currency: string;
}

interface WompiEvent {
  event: string;
  data?: { transaction?: WompiTransaction };
  signature?: { checksum?: string; properties?: string[] };
  timestamp?: number;
  environment?: string;
}

/**
 * Wompi events webhook receiver.
 *
 * The signed checksum is SHA256 of <concatenated property values><timestamp><events secret>.
 * The events secret is provisioned in the Wompi merchant panel and stored in
 * app_admin.integration_configs.wizard_data.eventsSecret (or env WOMPI_EVENTS_SECRET).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let event: WompiEvent;
  try {
    event = JSON.parse(rawBody) as WompiEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  // Resolve events secret from env or DB-level integration config (best effort).
  const eventsSecret = await resolveWompiEventsSecret();
  if (!eventsSecret) {
    console.error('[Wompi webhook] No events secret configured.');
    return NextResponse.json({ ok: false, error: 'Webhook not configured.' }, { status: 500 });
  }

  if (!verifyChecksum(event, eventsSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 });
  }

  const tx = event.data?.transaction;
  if (!tx) {
    return NextResponse.json({ ok: true, ignored: 'no transaction' });
  }

  const reference = tx.reference;
  if (!reference || !reference.startsWith('mentorship_')) {
    return NextResponse.json({ ok: true, ignored: 'not a mentorship reference' });
  }

  // Resolve ownerUserId by looking up the order before mutating it.
  try {
    const orderInfo = await withClient(async (client) => {
      const { rows } = await client.query<{ owner_user_id: string }>(
        `
          SELECT owner_user_id::text
          FROM app_mentoring.additional_mentorship_orders
          WHERE payment_provider = 'wompi' AND payment_reference = $1
          LIMIT 1
        `,
        [reference],
      );
      return rows[0] ?? null;
    });
    if (!orderInfo) {
      return NextResponse.json({ ok: true, ignored: 'reference not found' });
    }

    const ownerUserId = orderInfo.owner_user_id;
    await withClient(async (client) => {
      await withRoleContext(client, ownerUserId, 'lider', async () => {
        if (tx.status === 'APPROVED') {
          await markOrderAsPaid(client, { provider: 'wompi', reference });
        } else if (tx.status === 'DECLINED' || tx.status === 'ERROR' || tx.status === 'VOIDED') {
          await markOrderAsFailed(client, {
            provider: 'wompi',
            reference,
            reason: tx.status,
          });
        }
      });
    });
  } catch (error) {
    console.error('[Wompi webhook] Error processing event:', error);
    return NextResponse.json({ ok: false, error: 'Error processing event.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function verifyChecksum(event: WompiEvent, secret: string): boolean {
  const checksum = event.signature?.checksum;
  const properties = event.signature?.properties ?? [];
  const timestamp = event.timestamp;
  if (!checksum || !properties.length || !timestamp) return false;

  let payload = '';
  for (const propPath of properties) {
    const value = readPath(event, propPath);
    if (value === undefined || value === null) continue;
    payload += String(value);
  }
  payload += String(timestamp);
  payload += secret;
  const expected = createHash('sha256').update(payload).digest('hex');
  return safeEqual(expected, checksum.toLowerCase());
}

function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function resolveWompiEventsSecret(): Promise<string | null> {
  if (process.env.WOMPI_EVENTS_SECRET) return process.env.WOMPI_EVENTS_SECRET;
  try {
    const secret = await withClient(async (client) => {
      const { rows } = await client.query<{ wizard_data: Record<string, unknown> | null }>(
        `
          SELECT wizard_data
          FROM app_admin.integration_configs
          WHERE integration_key = 'wompi' AND enabled = true
          LIMIT 1
        `,
      );
      const wizard = rows[0]?.wizard_data;
      if (wizard && typeof wizard === 'object' && 'eventsSecret' in wizard) {
        const value = (wizard as Record<string, unknown>).eventsSecret;
        return typeof value === 'string' && value.trim() ? value.trim() : null;
      }
      return null;
    });
    return secret;
  } catch {
    return null;
  }
}
