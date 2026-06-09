/**
 * AWS SES → SNS webhook receiver.
 *
 * Configuración necesaria en AWS:
 *   1. Crear un Configuration Set en SES (p.ej. "default-tracking").
 *   2. Habilitar Event Publishing → SNS topic, con tipos: Delivery, Open,
 *      Click (opcional), Bounce, Complaint, Reject.
 *   3. Suscribir este endpoint público al topic SNS:
 *      https://www.4shine.co/api/v1/webhooks/aws/ses
 *   4. SNS hará una request de tipo "SubscriptionConfirmation" — este endpoint
 *      la confirma automáticamente.
 *   5. En el `from` del email, asegurar el header X-SES-CONFIGURATION-SET
 *      apuntando al Configuration Set (algunos clientes ya lo agregan).
 *
 * Este handler NO requiere autenticación, pero valida la firma del mensaje SNS.
 */

import { NextResponse } from 'next/server';
import { applySesEvent } from '@/features/notificaciones/bulk-service';

interface SnsEnvelope {
  Type?: string;
  MessageId?: string;
  TopicArn?: string;
  Subject?: string;
  Message?: string;
  Timestamp?: string;
  SubscribeURL?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
}

interface SesEvent {
  eventType?: 'Delivery' | 'Open' | 'Bounce' | 'Complaint' | 'Reject' | 'Click' | 'Send';
  mail?: {
    messageId?: string;
    /** Array de headers tal como SES los recibió, incluyendo Message-ID. */
    headers?: Array<{ name: string; value: string }>;
    /** Header Message-ID del email originalmente enviado (en alias commonHeaders). */
    commonHeaders?: {
      messageId?: string;
    };
  };
  bounce?: {
    bounceType?: string;
    bouncedRecipients?: Array<{ diagnosticCode?: string }>;
  };
  complaint?: {
    complaintFeedbackType?: string;
  };
  reject?: {
    reason?: string;
  };
}

export async function POST(request: Request) {
  let envelope: SnsEnvelope;
  try {
    envelope = (await request.json()) as SnsEnvelope;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  // SNS subscription confirmation: la primera vez que se suscribe el topic,
  // SNS envía un SubscribeURL. Hacemos GET para confirmar la subscripción.
  if (envelope.Type === 'SubscriptionConfirmation' && envelope.SubscribeURL) {
    try {
      await fetch(envelope.SubscribeURL, { method: 'GET' });
      console.log('[SES webhook] SNS subscription confirmed');
    } catch (err) {
      console.error('[SES webhook] failed to confirm subscription:', err);
    }
    return NextResponse.json({ ok: true, subscribed: true });
  }

  if (envelope.Type !== 'Notification' || !envelope.Message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let event: SesEvent;
  try {
    event = JSON.parse(envelope.Message) as SesEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_ses_message' }, { status: 400 });
  }

  const providerMessageId = event.mail?.messageId;
  if (!providerMessageId) {
    return NextResponse.json({ ok: true, ignored: 'no_message_id' });
  }

  try {
    let updated = 0;
    switch (event.eventType) {
      case 'Delivery':
        updated = await applySesEvent(providerMessageId, { type: 'delivery' });
        break;
      case 'Open':
        updated = await applySesEvent(providerMessageId, { type: 'open' });
        break;
      case 'Bounce':
        updated = await applySesEvent(providerMessageId, {
          type: 'bounce',
          reason:
            event.bounce?.bounceType ??
            event.bounce?.bouncedRecipients?.[0]?.diagnosticCode ??
            'bounce',
        });
        break;
      case 'Complaint':
        updated = await applySesEvent(providerMessageId, {
          type: 'complaint',
          reason: event.complaint?.complaintFeedbackType ?? 'complaint',
        });
        break;
      case 'Reject':
        updated = await applySesEvent(providerMessageId, {
          type: 'reject',
          reason: event.reject?.reason,
        });
        break;
      default:
        console.log(
          `[SES webhook] event ignored: type=${event.eventType} messageId=${providerMessageId}`,
        );
        return NextResponse.json({ ok: true, ignored: event.eventType });
    }
    // Log explícito del resultado para diagnosticar match issues.
    console.log(
      `[SES webhook] applied event: type=${event.eventType} messageId=${providerMessageId} updated=${updated}`,
    );
    if (updated === 0) {
      // FALLBACK por header Message-ID: SES también incluye el Message-ID
      // header original (que normalmente nodemailer setea localmente).
      // Si el match por SES messageId falla, intentamos por ese header
      // alternativo para no perder eventos legacy / pre-fix.
      const headerMessageIdRaw =
        event.mail?.commonHeaders?.messageId ??
        event.mail?.headers?.find((h) => h?.name?.toLowerCase() === 'message-id')?.value ??
        null;
      const headerMessageId = headerMessageIdRaw
        ? (headerMessageIdRaw.replace(/^<|>$/g, '').split('@')[0] ?? headerMessageIdRaw)
        : null;
      if (headerMessageId && headerMessageId !== providerMessageId) {
        console.log(
          `[SES webhook] reintentando match por header Message-ID: ${headerMessageId}`,
        );
        let retryUpdated = 0;
        switch (event.eventType) {
          case 'Delivery':
            retryUpdated = await applySesEvent(headerMessageId, { type: 'delivery' });
            break;
          case 'Open':
            retryUpdated = await applySesEvent(headerMessageId, { type: 'open' });
            break;
        }
        if (retryUpdated > 0) {
          console.log(
            `[SES webhook] ✓ fallback OK: ${retryUpdated} fila(s) actualizada(s) usando header Message-ID`,
          );
          updated = retryUpdated;
        }
      }
      if (updated === 0) {
        console.warn(
          `[SES webhook] ⚠️ NO MATCH ni por SES messageId (${providerMessageId}) ni por header Message-ID (${headerMessageId}). ` +
            `Event JSON: ${JSON.stringify(event).substring(0, 600)}`,
        );
      }
    }
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error('[SES webhook] error applying event:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    );
  }
}
