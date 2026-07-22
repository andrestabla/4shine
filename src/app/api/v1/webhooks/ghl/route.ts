/**
 * GoHighLevel → 4Shine webhook receiver.
 *
 * URL a configurar en GHL (Workflow → Webhook, método POST):
 *   https://www.4shine.co/api/v1/webhooks/ghl
 *
 * Autenticación: secreto compartido que se genera en
 * Administración → Integraciones → GoHighLevel. En GHL se envía de una de
 * estas dos formas (cualquiera sirve):
 *   • Header  x-4shine-token: <secreto>
 *   • Header  x-4shine-signature: sha256=<HMAC-SHA256 del cuerpo crudo>
 *
 * Cuerpo esperado (customData del workflow, plano o anidado):
 *   transaction_id, event_type, program_id, product_name, email,
 *   first_name, last_name, phone, country, amount, currency, mode
 *
 * event_type: purchase_completed | subscription_renewed |
 *             subscription_cancelled | payment_failed | refund_issued
 *
 * Respuesta (siempre JSON):
 *   { ok, status, message, transactionId, eventId, userId, planId, expiresAt }
 * status ∈ created | updated | renewed | cancel_scheduled | suspended |
 *          access_revoked | duplicate_ignored | unknown_program |
 *          invalid_signature | invalid_payload | error
 *
 * Idempotente: reintentos de GHL con el mismo (transaction_id, event_type)
 * responden 200 con status=duplicate_ignored sin volver a provisionar.
 */

import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { processGhlWebhook } from '@/features/ghl/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // El cuerpo debe leerse crudo: el HMAC se calcula sobre los bytes exactos.
  const rawBody = await request.text();

  try {
    const result = await withClient((client) =>
      processGhlWebhook(client, rawBody, request.headers),
    );

    return NextResponse.json(
      {
        ok: result.httpStatus < 400,
        status: result.status,
        message: result.message,
        eventId: result.eventId,
        userId: result.userId,
        planId: result.planId,
        expiresAt: result.expiresAt,
      },
      { status: result.httpStatus },
    );
  } catch (error) {
    console.error('[webhooks/ghl] unhandled error:', error);
    return NextResponse.json(
      { ok: false, status: 'error', message: 'Error interno procesando el webhook.' },
      { status: 500 },
    );
  }
}

/** Ping de diagnóstico para verificar que la URL responde desde GHL. */
export async function GET() {
  return NextResponse.json(
    { ok: true, message: 'Endpoint de webhooks GHL activo. Usa POST con el cuerpo del workflow.' },
    { status: 200 },
  );
}
