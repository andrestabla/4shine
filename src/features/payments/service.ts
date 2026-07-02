import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import Stripe from 'stripe';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { dispatchNotification } from '@/features/notificaciones/engine';
import { formatDate } from '@/lib/format-date';
import type {
  EnabledPaymentProvidersResponse,
  PaymentInitiationResult,
  PaymentProviderInfo,
  PaymentProviderKey,
} from './types';

const PROVIDER_META: Record<PaymentProviderKey, Omit<PaymentProviderInfo, 'key'>> = {
  stripe: {
    label: 'Tarjeta crédito / débito (Stripe)',
    description: 'Pago internacional con tarjeta. Procesado por Stripe.',
    sortOrder: 1,
  },
  wompi: {
    label: 'Bancolombia / Nequi / PSE (Wompi)',
    description: 'Métodos locales en Colombia. Procesado por Wompi.',
    sortOrder: 2,
  },
};

const MANUAL_FALLBACK_LABEL = 'Coordinar pago con 4Shine';
const MANUAL_FALLBACK_DESCRIPTION =
  'Reservamos tu sesión y nuestro equipo te contactará para coordinar el pago.';

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    'https://www.4shine.co'
  );
}

interface StripeCredentials {
  secretKey: string;
}

async function resolveStripeCredentials(
  client: PoolClient,
  actorUserId: string,
): Promise<StripeCredentials | null> {
  if (process.env.STRIPE_SECRET_KEY) {
    return { secretKey: process.env.STRIPE_SECRET_KEY };
  }
  const config = await getIntegrationConfigForActor(client, actorUserId, 'stripe');
  if (!config?.enabled || !config.secretValue) return null;
  return { secretKey: config.secretValue };
}

interface WompiCredentials {
  publicKey: string;
  integritySecret: string;
  privateKey: string | null;
  apiBaseUrl: string;
  baseUrl: string;
}

async function resolveWompiCredentials(
  client: PoolClient,
  actorUserId: string,
): Promise<WompiCredentials | null> {
  const config = await getIntegrationConfigForActor(client, actorUserId, 'wompi');
  if (!config?.enabled || !config.secretValue) return null;
  const publicKey = config.wizardData.publicKey?.trim() ?? '';
  const integritySecret = config.secretValue.trim();
  if (!publicKey || !integritySecret) return null;
  const baseUrl =
    (config.wizardData.baseUrl?.trim() || 'https://checkout.wompi.co/p/').replace(/\/?$/, '/');
  const apiBaseUrl = (
    config.wizardData.apiBaseUrl?.trim() || 'https://production.wompi.co/v1'
  ).replace(/\/$/, '');
  const privateKey = config.wizardData.privateKey?.trim() || null;
  return { publicKey, integritySecret, privateKey, apiBaseUrl, baseUrl };
}

export async function listEnabledPaymentProviders(
  client: PoolClient,
  actorUserId: string,
): Promise<EnabledPaymentProvidersResponse> {
  const enabled: PaymentProviderInfo[] = [];

  const stripe = await resolveStripeCredentials(client, actorUserId);
  if (stripe) {
    enabled.push({ key: 'stripe', ...PROVIDER_META.stripe });
  }

  const wompi = await resolveWompiCredentials(client, actorUserId);
  if (wompi) {
    enabled.push({ key: 'wompi', ...PROVIDER_META.wompi });
  }

  enabled.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    providers: enabled,
    manualFallback: {
      enabled: enabled.length === 0,
      label: MANUAL_FALLBACK_LABEL,
      description: MANUAL_FALLBACK_DESCRIPTION,
    },
  };
}

interface OrderForCheckout {
  orderId: string;
  ownerUserId: string;
  title: string;
  priceAmount: number;
  currencyCode: string;
  mentorName: string | null;
  scheduledStartsAt: string | null;
}

async function loadOrderForCheckout(
  client: PoolClient,
  orderId: string,
  actorUserId: string,
): Promise<OrderForCheckout> {
  interface Row {
    order_id: string;
    owner_user_id: string;
    title: string;
    price_amount: string | number;
    currency_code: string;
    mentor_name: string | null;
    scheduled_starts_at: string | null;
    payment_status: string | null;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        amo.order_id::text,
        amo.owner_user_id::text,
        amo.title,
        amo.price_amount,
        amo.currency_code,
        u.display_name AS mentor_name,
        amo.scheduled_starts_at::text,
        amo.payment_status
      FROM app_mentoring.additional_mentorship_orders amo
      LEFT JOIN app_core.users u ON u.user_id = amo.mentor_user_id
      WHERE amo.order_id = $1::uuid
        AND amo.owner_user_id = $2::uuid
      LIMIT 1
    `,
    [orderId, actorUserId],
  );
  const row = rows[0];
  if (!row) throw new Error('Orden no encontrada o sin permiso.');
  if (row.payment_status === 'paid') {
    throw new Error('Esta orden ya está pagada.');
  }
  return {
    orderId: row.order_id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    mentorName: row.mentor_name,
    scheduledStartsAt: row.scheduled_starts_at,
  };
}

async function markOrderPending(
  client: PoolClient,
  orderId: string,
  provider: PaymentProviderKey,
  reference: string,
  redirectUrl: string,
): Promise<void> {
  await client.query(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET
        payment_provider = $2,
        payment_reference = $3,
        payment_redirect_url = $4,
        payment_status = 'awaiting_payment',
        updated_at = now()
      WHERE order_id = $1::uuid
    `,
    [orderId, provider, reference, redirectUrl],
  );
}

function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' });
}

interface RecordAttemptInput {
  orderId: string;
  provider: PaymentProviderKey | 'manual';
  status: 'initiated' | 'awaiting_payment' | 'succeeded' | 'failed' | 'refunded' | 'refund_failed';
  reference?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  rawPayload?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export async function recordPaymentAttempt(
  client: PoolClient,
  input: RecordAttemptInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO app_mentoring.payment_attempts (
        order_id, provider, status, reference, error_code, error_message, raw_payload, created_by
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8)
    `,
    [
      input.orderId,
      input.provider,
      input.status,
      input.reference ?? null,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      JSON.stringify(input.rawPayload ?? {}),
      input.createdBy ?? null,
    ],
  );
}

async function createStripeCheckoutForOrder(
  client: PoolClient,
  actorUserId: string,
  order: OrderForCheckout,
): Promise<PaymentInitiationResult> {
  const credentials = await resolveStripeCredentials(client, actorUserId);
  if (!credentials) {
    throw new Error('Stripe no está configurado.');
  }
  const stripe = getStripeClient(credentials.secretKey);
  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: order.orderId,
    metadata: {
      kind: 'mentorship_additional_order',
      orderId: order.orderId,
      userId: order.ownerUserId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currencyCode.toLowerCase(),
          unit_amount: Math.round(order.priceAmount * 100),
          product_data: {
            name: order.title,
            description: order.mentorName
              ? `Mentoría con ${order.mentorName}`
              : 'Sesión de mentoría 4Shine',
          },
        },
      },
    ],
    success_url: `${appUrl}/dashboard/mentorias/comprar?payment=success&order=${order.orderId}`,
    cancel_url: `${appUrl}/dashboard/mentorias/comprar?payment=cancel&order=${order.orderId}`,
  });
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout.');
  await markOrderPending(client, order.orderId, 'stripe', session.id, session.url);
  await recordPaymentAttempt(client, {
    orderId: order.orderId,
    provider: 'stripe',
    status: 'awaiting_payment',
    reference: session.id,
    createdBy: actorUserId,
    rawPayload: { sessionId: session.id, amount: session.amount_total, currency: session.currency },
  });
  return { redirectUrl: session.url, reference: session.id, provider: 'stripe' };
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

async function createWompiCheckoutForOrder(
  client: PoolClient,
  actorUserId: string,
  order: OrderForCheckout,
): Promise<PaymentInitiationResult> {
  const credentials = await resolveWompiCredentials(client, actorUserId);
  if (!credentials) {
    throw new Error('Wompi no está configurado.');
  }
  // Wompi expects amount in minor units (cents) and an integrity signature.
  const amountInCents = Math.round(order.priceAmount * 100);
  const currency = order.currencyCode.toUpperCase();
  // Use orderId as Wompi reference (unique).
  const reference = `mentorship_${order.orderId}`;
  const signaturePayload = `${reference}${amountInCents}${currency}${credentials.integritySecret}`;
  const integritySignature = sha256Hex(signaturePayload);
  const appUrl = getAppUrl();
  const redirectUrl = `${appUrl}/dashboard/mentorias/comprar?payment=success&order=${order.orderId}`;

  const params = new URLSearchParams({
    'public-key': credentials.publicKey,
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'redirect-url': redirectUrl,
    'signature:integrity': integritySignature,
  });
  const fullUrl = `${credentials.baseUrl}?${params.toString()}`;
  await markOrderPending(client, order.orderId, 'wompi', reference, fullUrl);
  await recordPaymentAttempt(client, {
    orderId: order.orderId,
    provider: 'wompi',
    status: 'awaiting_payment',
    reference,
    createdBy: actorUserId,
    rawPayload: { amountInCents, currency },
  });
  return { redirectUrl: fullUrl, reference, provider: 'wompi' };
}

export async function createCheckoutForOrder(
  client: PoolClient,
  actorUserId: string,
  orderId: string,
  provider: PaymentProviderKey,
): Promise<PaymentInitiationResult> {
  const order = await loadOrderForCheckout(client, orderId, actorUserId);
  if (provider === 'stripe') {
    return createStripeCheckoutForOrder(client, actorUserId, order);
  }
  if (provider === 'wompi') {
    return createWompiCheckoutForOrder(client, actorUserId, order);
  }
  throw new Error(`Proveedor no soportado: ${provider}`);
}

const PROVIDER_LABELS: Record<PaymentProviderKey | 'manual', string> = {
  stripe: 'Stripe (tarjeta)',
  wompi: 'Wompi (Bancolombia / Nequi / PSE)',
  manual: 'Coordinación manual',
};

function formatMontoCop(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
}

const PAYMENT_NOTIFICATION_DEFAULT_TZ = 'America/Bogota';

function formatFecha(value: string | null, timeZone: string = PAYMENT_NOTIFICATION_DEFAULT_TZ): string {
  if (!value) return 'Por coordinar';
  try {
    return formatDate(value, { timeZone });
  } catch {
    return value;
  }
}

function formatHora(value: string | null, timeZone: string = PAYMENT_NOTIFICATION_DEFAULT_TZ): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  } catch {
    return value;
  }
}

async function resolveOrgTimezoneById(
  client: PoolClient,
  organizationId: string,
): Promise<string> {
  try {
    const { rows } = await client.query<{ tz: string | null }>(
      `SELECT institution_timezone AS tz FROM app_admin.branding_settings WHERE organization_id = $1::uuid LIMIT 1`,
      [organizationId],
    );
    const tz = rows[0]?.tz?.trim();
    return tz && tz.length > 0 ? tz : PAYMENT_NOTIFICATION_DEFAULT_TZ;
  } catch {
    return PAYMENT_NOTIFICATION_DEFAULT_TZ;
  }
}

interface OrderForNotification {
  orderId: string;
  ownerUserId: string;
  organizationId: string;
  ownerEmail: string;
  ownerFirstName: string;
  title: string;
  mentorName: string | null;
  scheduledStartsAt: string | null;
  priceAmount: number;
  currencyCode: string;
  paymentProvider: PaymentProviderKey | 'manual' | null;
}

async function loadOrderForNotification(
  client: PoolClient,
  orderId: string,
): Promise<OrderForNotification | null> {
  interface Row {
    order_id: string;
    owner_user_id: string;
    organization_id: string | null;
    owner_email: string;
    owner_first_name: string | null;
    title: string;
    mentor_name: string | null;
    scheduled_starts_at: string | null;
    price_amount: string | number;
    currency_code: string;
    payment_provider: PaymentProviderKey | 'manual' | null;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        amo.order_id::text,
        amo.owner_user_id::text,
        u.organization_id::text,
        u.email::text AS owner_email,
        u.first_name AS owner_first_name,
        amo.title,
        mu.display_name AS mentor_name,
        amo.scheduled_starts_at::text,
        amo.price_amount,
        amo.currency_code,
        amo.payment_provider
      FROM app_mentoring.additional_mentorship_orders amo
      JOIN app_core.users u ON u.user_id = amo.owner_user_id
      LEFT JOIN app_core.users mu ON mu.user_id = amo.mentor_user_id
      WHERE amo.order_id = $1::uuid
      LIMIT 1
    `,
    [orderId],
  );
  const row = rows[0];
  if (!row || !row.organization_id || !row.owner_email) return null;
  return {
    orderId: row.order_id,
    ownerUserId: row.owner_user_id,
    organizationId: row.organization_id,
    ownerEmail: row.owner_email,
    ownerFirstName: (row.owner_first_name ?? '').trim() || row.owner_email,
    title: row.title,
    mentorName: row.mentor_name,
    scheduledStartsAt: row.scheduled_starts_at,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    paymentProvider: row.payment_provider,
  };
}

async function notifyOrderPaid(client: PoolClient, orderId: string): Promise<void> {
  try {
    const info = await loadOrderForNotification(client, orderId);
    if (!info) return;
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co';
    const tz = await resolveOrgTimezoneById(client, info.organizationId);
    await dispatchNotification(client, {
      organizationId: info.organizationId,
      recipientUserId: info.ownerUserId,
      recipientEmail: info.ownerEmail,
      eventKey: 'mentorias.payment_confirmed',
      variables: {
        nombre: info.ownerFirstName,
        titulo: info.title,
        fecha: formatFecha(info.scheduledStartsAt, tz),
        hora: formatHora(info.scheduledStartsAt, tz),
        adviser_nombre: info.mentorName ?? '',
        monto: formatMontoCop(info.priceAmount, info.currencyCode),
        metodo_pago: PROVIDER_LABELS[info.paymentProvider ?? 'manual'],
        codigo_reserva: info.orderId.slice(0, 8),
        enlace_sesion: `${platformUrl}/dashboard/mentorias`,
      },
    });
  } catch (err) {
    console.error('[payments] notifyOrderPaid failed:', err);
  }
}

// ─── Notificaciones de workshops ─────────────────────────────────────────────
//
// Mismo esquema que mentorías: cargamos los datos del workshop + comprador
// con un SELECT, formateamos y disparamos el evento. Los templates concretos
// (asunto, body) los configura admin en /dashboard/administracion/notificaciones/plantillas.
//
// Si admin no creó la plantilla para 'workshops.payment_confirmed' o
// 'workshops.payment_refunded', dispatchNotification es no-op (no rompe).

interface WorkshopOrderForNotification {
  orderId: string;
  ownerUserId: string;
  organizationId: string;
  ownerEmail: string;
  ownerFirstName: string;
  workshopId: string;
  workshopTitle: string;
  startsAt: string | null;
  priceAmount: number;
  currencyCode: string;
  paymentProvider: PaymentProviderKey | 'manual' | null;
  attendanceStatus: 'registered' | 'waitlist' | 'invited' | 'attended' | 'no_show' | 'cancelled' | null;
}

async function loadWorkshopOrderForNotification(
  client: PoolClient,
  orderId: string,
): Promise<WorkshopOrderForNotification | null> {
  interface Row {
    order_id: string;
    owner_user_id: string;
    organization_id: string | null;
    owner_email: string;
    owner_first_name: string | null;
    workshop_id: string;
    workshop_title: string;
    starts_at: string | null;
    price_amount: string | number;
    currency_code: string;
    payment_provider: PaymentProviderKey | 'manual' | null;
    attendance_status: WorkshopOrderForNotification['attendanceStatus'];
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        wo.order_id::text,
        wo.owner_user_id::text,
        u.organization_id::text,
        u.email::text AS owner_email,
        u.first_name AS owner_first_name,
        w.workshop_id::text,
        w.title AS workshop_title,
        w.starts_at::text,
        wo.price_amount,
        wo.currency_code,
        wo.payment_provider,
        wa.attendance_status
      FROM app_networking.workshop_orders wo
      JOIN app_networking.workshops w ON w.workshop_id = wo.workshop_id
      JOIN app_core.users u ON u.user_id = wo.owner_user_id
      LEFT JOIN app_networking.workshop_attendees wa
        ON wa.workshop_id = wo.workshop_id
       AND wa.user_id = wo.owner_user_id
      WHERE wo.order_id = $1::uuid
      LIMIT 1
    `,
    [orderId],
  );
  const row = rows[0];
  if (!row || !row.organization_id || !row.owner_email) return null;
  return {
    orderId: row.order_id,
    ownerUserId: row.owner_user_id,
    organizationId: row.organization_id,
    ownerEmail: row.owner_email,
    ownerFirstName: (row.owner_first_name ?? '').trim() || row.owner_email,
    workshopId: row.workshop_id,
    workshopTitle: row.workshop_title,
    startsAt: row.starts_at,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    paymentProvider: row.payment_provider,
    attendanceStatus: row.attendance_status,
  };
}

export async function notifyWorkshopOrderPaid(
  client: PoolClient,
  orderId: string,
): Promise<void> {
  try {
    const info = await loadWorkshopOrderForNotification(client, orderId);
    if (!info) return;
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co';
    const tz = await resolveOrgTimezoneById(client, info.organizationId);
    const estadoInscripcion =
      info.attendanceStatus === 'waitlist'
        ? 'En lista de espera'
        : 'Inscrito';
    await dispatchNotification(client, {
      organizationId: info.organizationId,
      recipientUserId: info.ownerUserId,
      recipientEmail: info.ownerEmail,
      eventKey: 'workshops.payment_confirmed',
      variables: {
        nombre: info.ownerFirstName,
        titulo: info.workshopTitle,
        fecha: formatFecha(info.startsAt, tz),
        hora: formatHora(info.startsAt, tz),
        monto: formatMontoCop(info.priceAmount, info.currencyCode),
        metodo_pago: PROVIDER_LABELS[info.paymentProvider ?? 'manual'],
        codigo_reserva: info.orderId.slice(0, 8),
        estado_inscripcion: estadoInscripcion,
        enlace_workshop: `${platformUrl}/dashboard/workshops/${info.workshopId}`,
      },
    });
  } catch (err) {
    console.error('[payments] notifyWorkshopOrderPaid failed:', err);
  }
}

async function notifyWorkshopOrderRefunded(
  client: PoolClient,
  orderId: string,
  reason: string,
): Promise<void> {
  try {
    const info = await loadWorkshopOrderForNotification(client, orderId);
    if (!info) return;
    await dispatchNotification(client, {
      organizationId: info.organizationId,
      recipientUserId: info.ownerUserId,
      recipientEmail: info.ownerEmail,
      eventKey: 'workshops.payment_refunded',
      variables: {
        nombre: info.ownerFirstName,
        titulo: info.workshopTitle,
        monto: formatMontoCop(info.priceAmount, info.currencyCode),
        metodo_pago: PROVIDER_LABELS[info.paymentProvider ?? 'manual'],
        codigo_reserva: info.orderId.slice(0, 8),
        motivo_reembolso: reason,
      },
    });
  } catch (err) {
    console.error('[payments] notifyWorkshopOrderRefunded failed:', err);
  }
}

async function notifyOrderRefunded(
  client: PoolClient,
  orderId: string,
  reason: string,
): Promise<void> {
  try {
    const info = await loadOrderForNotification(client, orderId);
    if (!info) return;
    await dispatchNotification(client, {
      organizationId: info.organizationId,
      recipientUserId: info.ownerUserId,
      recipientEmail: info.ownerEmail,
      eventKey: 'mentorias.payment_refunded',
      variables: {
        nombre: info.ownerFirstName,
        titulo: info.title,
        adviser_nombre: info.mentorName ?? '',
        monto: formatMontoCop(info.priceAmount, info.currencyCode),
        metodo_pago: PROVIDER_LABELS[info.paymentProvider ?? 'manual'],
        codigo_reserva: info.orderId.slice(0, 8),
        motivo_reembolso: reason,
      },
    });
  } catch (err) {
    console.error('[payments] notifyOrderRefunded failed:', err);
  }
}

/**
 * Mark an order as paid via webhook. Idempotent: no-op if already paid.
 */
export async function markOrderAsPaid(
  client: PoolClient,
  params: { provider: PaymentProviderKey; reference: string; rawPayload?: Record<string, unknown> },
): Promise<{ orderId: string | null; alreadyPaid: boolean }> {
  interface Row {
    order_id: string;
    payment_status: string | null;
  }
  const { rows } = await client.query<Row>(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET
        payment_status = 'paid',
        paid_at = COALESCE(paid_at, now()),
        status = CASE WHEN status = 'pending_payment' THEN 'scheduled' ELSE status END,
        updated_at = now()
      WHERE payment_provider = $1
        AND payment_reference = $2
        AND payment_status <> 'paid'
      RETURNING order_id::text, payment_status
    `,
    [params.provider, params.reference],
  );
  const row = rows[0];
  if (!row) {
    // Check if it was already paid
    const { rows: existing } = await client.query<{ order_id: string }>(
      `
        SELECT order_id::text FROM app_mentoring.additional_mentorship_orders
        WHERE payment_provider = $1 AND payment_reference = $2 AND payment_status = 'paid'
        LIMIT 1
      `,
      [params.provider, params.reference],
    );
    if (existing[0]) {
      return { orderId: existing[0].order_id, alreadyPaid: true };
    }
    return { orderId: null, alreadyPaid: false };
  }

  await recordPaymentAttempt(client, {
    orderId: row.order_id,
    provider: params.provider,
    status: 'succeeded',
    reference: params.reference,
    rawPayload: params.rawPayload ?? {},
  });
  await notifyOrderPaid(client, row.order_id);
  return { orderId: row.order_id, alreadyPaid: false };
}

export async function markOrderAsFailed(
  client: PoolClient,
  params: {
    provider: PaymentProviderKey;
    reference: string;
    reason?: string;
    rawPayload?: Record<string, unknown>;
  },
): Promise<void> {
  const { rows } = await client.query<{ order_id: string }>(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET payment_status = 'failed', updated_at = now()
      WHERE payment_provider = $1 AND payment_reference = $2 AND payment_status NOT IN ('paid', 'refunded')
      RETURNING order_id::text
    `,
    [params.provider, params.reference],
  );
  const row = rows[0];
  if (!row) return;
  await recordPaymentAttempt(client, {
    orderId: row.order_id,
    provider: params.provider,
    status: 'failed',
    reference: params.reference,
    errorCode: params.reason ?? null,
    rawPayload: params.rawPayload ?? {},
  });
}

// ─── Refunds (admin only) ────────────────────────────────────────────────────

interface RefundResult {
  orderId: string;
  provider: PaymentProviderKey | 'manual';
  refundReference: string | null;
  status: 'refunded' | 'manual_marked';
}

export async function refundOrder(
  client: PoolClient,
  actorUserId: string,
  orderId: string,
  reason: string,
): Promise<RefundResult> {
  interface Row {
    order_id: string;
    payment_provider: PaymentProviderKey | 'manual' | null;
    payment_reference: string | null;
    payment_status: string | null;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        order_id::text,
        payment_provider,
        payment_reference,
        payment_status
      FROM app_mentoring.additional_mentorship_orders
      WHERE order_id = $1::uuid
      LIMIT 1
    `,
    [orderId],
  );
  const order = rows[0];
  if (!order) throw new Error('Orden no encontrada.');
  if (order.payment_status === 'refunded') {
    throw new Error('Esta orden ya fue reembolsada.');
  }
  if (order.payment_status !== 'paid') {
    throw new Error('Solo se pueden reembolsar órdenes pagadas.');
  }

  const provider = order.payment_provider ?? 'manual';
  let refundReference: string | null = null;

  if (provider === 'stripe' && order.payment_reference) {
    try {
      const credentials = await resolveStripeCredentials(client, actorUserId);
      if (!credentials) throw new Error('Stripe no está configurado.');
      const stripe = getStripeClient(credentials.secretKey);
      const session = await stripe.checkout.sessions.retrieve(order.payment_reference);
      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      if (!paymentIntent) {
        throw new Error('No se pudo resolver el payment_intent de la sesión.');
      }
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent,
        metadata: { orderId: order.order_id, reason },
      });
      refundReference = refund.id;
    } catch (error) {
      await recordPaymentAttempt(client, {
        orderId: order.order_id,
        provider: 'stripe',
        status: 'refund_failed',
        reference: order.payment_reference,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        createdBy: actorUserId,
      });
      throw error;
    }
  } else if (provider === 'wompi' && order.payment_reference) {
    try {
      const credentials = await resolveWompiCredentials(client, actorUserId);
      if (!credentials?.privateKey) {
        throw new Error('Wompi requiere private key configurada para reembolsos.');
      }
      // Wompi: search transaction by reference, then POST to refunds endpoint.
      const txLookup = await fetch(
        `${credentials.apiBaseUrl}/transactions?reference=${encodeURIComponent(order.payment_reference)}`,
        { headers: { Authorization: `Bearer ${credentials.privateKey}` } },
      );
      if (!txLookup.ok) {
        throw new Error(`Wompi tx lookup falló: HTTP ${txLookup.status}`);
      }
      const txData = (await txLookup.json()) as {
        data?: Array<{ id?: string; status?: string }>;
      };
      const txId = txData.data?.find((t) => t.status === 'APPROVED')?.id;
      if (!txId) throw new Error('No se encontró transacción APROBADA en Wompi.');
      const refundResp = await fetch(`${credentials.apiBaseUrl}/refunds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: txId }),
      });
      if (!refundResp.ok) {
        throw new Error(`Wompi refund falló: HTTP ${refundResp.status}`);
      }
      const refundData = (await refundResp.json()) as { data?: { id?: string } };
      refundReference = refundData.data?.id ?? null;
    } catch (error) {
      await recordPaymentAttempt(client, {
        orderId: order.order_id,
        provider: 'wompi',
        status: 'refund_failed',
        reference: order.payment_reference,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        createdBy: actorUserId,
      });
      throw error;
    }
  }
  // For 'manual' or providers without payment_reference, we just flag the order.

  await client.query(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET
        payment_status = 'refunded',
        status = CASE WHEN status IN ('scheduled', 'pending_payment') THEN 'cancelled' ELSE status END,
        refunded_at = now(),
        refund_reference = $2,
        refund_reason = $3,
        updated_at = now()
      WHERE order_id = $1::uuid
    `,
    [orderId, refundReference, reason],
  );

  await recordPaymentAttempt(client, {
    orderId,
    provider,
    status: 'refunded',
    reference: refundReference,
    rawPayload: { reason, originalReference: order.payment_reference },
    createdBy: actorUserId,
  });

  await notifyOrderRefunded(client, orderId, reason);

  return {
    orderId,
    provider,
    refundReference,
    status: provider === 'manual' ? 'manual_marked' : 'refunded',
  };
}

// ─── Listing (admin panel) ───────────────────────────────────────────────────

export interface MentorshipPaymentRecord {
  orderId: string;
  ownerName: string;
  ownerEmail: string;
  mentorName: string | null;
  title: string;
  topic: string | null;
  scheduledStartsAt: string | null;
  priceAmount: number;
  currencyCode: string;
  paymentProvider: PaymentProviderKey | 'manual' | null;
  paymentStatus: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
}

export async function listMentorshipPayments(
  client: PoolClient,
): Promise<MentorshipPaymentRecord[]> {
  interface Row {
    order_id: string;
    owner_name: string;
    owner_email: string;
    mentor_name: string | null;
    title: string;
    topic: string | null;
    scheduled_starts_at: string | null;
    price_amount: string | number;
    currency_code: string;
    payment_provider: PaymentProviderKey | 'manual' | null;
    payment_status: string | null;
    payment_reference: string | null;
    paid_at: string | null;
    refunded_at: string | null;
    refund_reason: string | null;
    created_at: string;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        amo.order_id::text,
        u.display_name AS owner_name,
        u.email::text AS owner_email,
        mu.display_name AS mentor_name,
        amo.title,
        amo.topic,
        amo.scheduled_starts_at::text,
        amo.price_amount,
        amo.currency_code,
        amo.payment_provider,
        amo.payment_status,
        amo.payment_reference,
        amo.paid_at::text,
        amo.refunded_at::text,
        amo.refund_reason,
        amo.created_at::text
      FROM app_mentoring.additional_mentorship_orders amo
      JOIN app_core.users u ON u.user_id = amo.owner_user_id
      LEFT JOIN app_core.users mu ON mu.user_id = amo.mentor_user_id
      ORDER BY amo.created_at DESC
      LIMIT 500
    `,
  );
  return rows.map((row) => ({
    orderId: row.order_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    mentorName: row.mentor_name,
    title: row.title,
    topic: row.topic,
    scheduledStartsAt: row.scheduled_starts_at,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    paymentProvider: row.payment_provider,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    refundReason: row.refund_reason,
    createdAt: row.created_at,
  }));
}

export interface PaymentAttemptRecord {
  attemptId: string;
  orderId: string;
  provider: PaymentProviderKey | 'manual';
  status: string;
  reference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export async function listPaymentAttemptsForOrder(
  client: PoolClient,
  orderId: string,
): Promise<PaymentAttemptRecord[]> {
  interface Row {
    attempt_id: string;
    order_id: string;
    provider: PaymentProviderKey | 'manual';
    status: string;
    reference: string | null;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        attempt_id::text,
        order_id::text,
        provider,
        status,
        reference,
        error_code,
        error_message,
        created_at::text
      FROM app_mentoring.payment_attempts
      WHERE order_id = $1::uuid
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [orderId],
  );
  return rows.map((row) => ({
    attemptId: row.attempt_id,
    orderId: row.order_id,
    provider: row.provider,
    status: row.status,
    reference: row.reference,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// WORKSHOPS — checkout (espejo del de mentorías).
//
// El service de órdenes de workshop vive en src/features/workshops/orders-service
// para mantener la separación por dominio. Aquí solo orquestamos el handshake
// con Stripe / Wompi, igual que hacemos con mentorías.
//
// Las diferencias vs. mentorias son mínimas:
//   - metadata.kind = 'workshop_order' (para que el webhook enrute)
//   - reference de Wompi usa prefijo 'workshop_' (para que el webhook
//     filtre por dominio antes de tocar la tabla)
//   - success/cancel URL apuntan a /dashboard/workshops
//   - los helpers que persisten estado llaman al service de workshops, no
//     al de mentorías
// ════════════════════════════════════════════════════════════════════════════

import {
  applyWorkshopOrderRefundLocally,
  loadWorkshopOrderForCheckout,
  markWorkshopOrderPending,
  type OrderForCheckoutSnapshot as WorkshopOrderSnapshot,
} from '@/features/workshops/orders-service';

async function recordWorkshopPaymentAttempt(
  client: PoolClient,
  input: {
    orderId: string;
    provider: PaymentProviderKey | 'manual';
    status: 'initiated' | 'awaiting_payment' | 'succeeded' | 'failed' | 'refunded' | 'refund_failed';
    reference?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    rawPayload?: Record<string, unknown> | null;
    createdBy?: string | null;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO app_networking.workshop_payment_attempts (
        order_id, provider, status, reference, error_code, error_message, raw_payload, created_by
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8)
    `,
    [
      input.orderId,
      input.provider,
      input.status,
      input.reference ?? null,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      JSON.stringify(input.rawPayload ?? {}),
      input.createdBy ?? null,
    ],
  );
}

async function createStripeCheckoutForWorkshopOrder(
  client: PoolClient,
  actorUserId: string,
  order: WorkshopOrderSnapshot,
): Promise<PaymentInitiationResult> {
  const credentials = await resolveStripeCredentials(client, actorUserId);
  if (!credentials) {
    throw new Error('Stripe no está configurado.');
  }
  const stripe = getStripeClient(credentials.secretKey);
  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: order.orderId,
    metadata: {
      kind: 'workshop_order',
      orderId: order.orderId,
      userId: order.ownerUserId,
      workshopId: order.workshopId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currencyCode.toLowerCase(),
          unit_amount: Math.round(order.priceAmount * 100),
          product_data: {
            name: order.title,
            description: 'Workshop 4Shine',
          },
        },
      },
    ],
    // Volvemos al detalle del workshop, no al catálogo. Si no hay startsAt
    // tampoco lo necesitamos para la URL.
    success_url: `${appUrl}/dashboard/workshops/${order.workshopId}?payment=success&order=${order.orderId}`,
    cancel_url: `${appUrl}/dashboard/workshops/${order.workshopId}?payment=cancel&order=${order.orderId}`,
  });
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout.');
  await markWorkshopOrderPending(client, order.orderId, 'stripe', session.id, session.url);
  await recordWorkshopPaymentAttempt(client, {
    orderId: order.orderId,
    provider: 'stripe',
    status: 'awaiting_payment',
    reference: session.id,
    createdBy: actorUserId,
    rawPayload: { sessionId: session.id, amount: session.amount_total, currency: session.currency },
  });
  return { redirectUrl: session.url, reference: session.id, provider: 'stripe' };
}

async function createWompiCheckoutForWorkshopOrder(
  client: PoolClient,
  actorUserId: string,
  order: WorkshopOrderSnapshot,
): Promise<PaymentInitiationResult> {
  const credentials = await resolveWompiCredentials(client, actorUserId);
  if (!credentials) {
    throw new Error('Wompi no está configurado.');
  }
  const amountInCents = Math.round(order.priceAmount * 100);
  const currency = order.currencyCode.toUpperCase();
  // Prefijo distinto para que el webhook de Wompi pueda enrutar antes de
  // tocar tabla. mentorias usa 'mentorship_'.
  const reference = `workshop_${order.orderId}`;
  const signaturePayload = `${reference}${amountInCents}${currency}${credentials.integritySecret}`;
  const integritySignature = sha256Hex(signaturePayload);
  const appUrl = getAppUrl();
  const redirectUrl = `${appUrl}/dashboard/workshops/${order.workshopId}?payment=success&order=${order.orderId}`;

  const params = new URLSearchParams({
    'public-key': credentials.publicKey,
    currency,
    'amount-in-cents': String(amountInCents),
    reference,
    'redirect-url': redirectUrl,
    'signature:integrity': integritySignature,
  });
  const fullUrl = `${credentials.baseUrl}?${params.toString()}`;
  await markWorkshopOrderPending(client, order.orderId, 'wompi', reference, fullUrl);
  await recordWorkshopPaymentAttempt(client, {
    orderId: order.orderId,
    provider: 'wompi',
    status: 'awaiting_payment',
    reference,
    createdBy: actorUserId,
    rawPayload: { amountInCents, currency },
  });
  return { redirectUrl: fullUrl, reference, provider: 'wompi' };
}

export async function createWorkshopCheckoutForOrder(
  client: PoolClient,
  actorUserId: string,
  orderId: string,
  provider: PaymentProviderKey,
): Promise<PaymentInitiationResult> {
  const order = await loadWorkshopOrderForCheckout(client, orderId, actorUserId);
  if (provider === 'stripe') {
    return createStripeCheckoutForWorkshopOrder(client, actorUserId, order);
  }
  if (provider === 'wompi') {
    return createWompiCheckoutForWorkshopOrder(client, actorUserId, order);
  }
  throw new Error(`Proveedor no soportado: ${provider}`);
}

// ─── Refund de workshop (admin/gestor) ───────────────────────────────────────
//
// Replica refundOrder pero apunta a workshops. El gate de permisos se hace
// en el endpoint (requireModulePermission 'workshops', 'approve' o similar).

export async function refundWorkshopOrder(
  client: PoolClient,
  actorUserId: string,
  orderId: string,
  reason: string,
): Promise<RefundResult> {
  interface Row {
    order_id: string;
    payment_provider: PaymentProviderKey | 'manual' | null;
    payment_reference: string | null;
    payment_status: string | null;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT order_id::text, payment_provider, payment_reference, payment_status
      FROM app_networking.workshop_orders
      WHERE order_id = $1::uuid
      LIMIT 1
    `,
    [orderId],
  );
  const order = rows[0];
  if (!order) throw new Error('Orden de workshop no encontrada.');
  if (order.payment_status === 'refunded') {
    throw new Error('Esta orden ya fue reembolsada.');
  }
  if (order.payment_status !== 'paid') {
    throw new Error('Solo se pueden reembolsar órdenes pagadas.');
  }

  const provider = order.payment_provider ?? 'manual';
  let refundReference: string | null = null;

  if (provider === 'stripe' && order.payment_reference) {
    try {
      const credentials = await resolveStripeCredentials(client, actorUserId);
      if (!credentials) throw new Error('Stripe no está configurado.');
      const stripe = getStripeClient(credentials.secretKey);
      const session = await stripe.checkout.sessions.retrieve(order.payment_reference);
      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      if (!paymentIntent) {
        throw new Error('No se pudo resolver el payment_intent de la sesión.');
      }
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent,
        metadata: { orderId: order.order_id, reason, kind: 'workshop_order' },
      });
      refundReference = refund.id;
    } catch (error) {
      await recordWorkshopPaymentAttempt(client, {
        orderId: order.order_id,
        provider: 'stripe',
        status: 'refund_failed',
        reference: order.payment_reference,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        createdBy: actorUserId,
      });
      throw error;
    }
  } else if (provider === 'wompi' && order.payment_reference) {
    try {
      const credentials = await resolveWompiCredentials(client, actorUserId);
      if (!credentials?.privateKey) {
        throw new Error('Wompi requiere private key configurada para reembolsos.');
      }
      const txLookup = await fetch(
        `${credentials.apiBaseUrl}/transactions?reference=${encodeURIComponent(order.payment_reference)}`,
        { headers: { Authorization: `Bearer ${credentials.privateKey}` } },
      );
      if (!txLookup.ok) {
        throw new Error(`Wompi tx lookup falló: HTTP ${txLookup.status}`);
      }
      const txData = (await txLookup.json()) as {
        data?: Array<{ id?: string; status?: string }>;
      };
      const txId = txData.data?.find((t) => t.status === 'APPROVED')?.id;
      if (!txId) throw new Error('No se encontró transacción APROBADA en Wompi.');
      const refundResp = await fetch(`${credentials.apiBaseUrl}/refunds`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_id: txId }),
      });
      if (!refundResp.ok) {
        throw new Error(`Wompi refund falló: HTTP ${refundResp.status}`);
      }
      const refundData = (await refundResp.json()) as { data?: { id?: string } };
      refundReference = refundData.data?.id ?? null;
    } catch (error) {
      await recordWorkshopPaymentAttempt(client, {
        orderId: order.order_id,
        provider: 'wompi',
        status: 'refund_failed',
        reference: order.payment_reference,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        createdBy: actorUserId,
      });
      throw error;
    }
  }

  // Persistimos efecto en BD + quitamos al asistente.
  await applyWorkshopOrderRefundLocally(
    client,
    orderId,
    refundReference ?? `manual_${Date.now()}`,
    reason,
  );

  // Notificamos al líder. Best-effort: si falla no abortamos.
  await notifyWorkshopOrderRefunded(client, orderId, reason);

  return {
    orderId,
    provider,
    refundReference,
    status: provider === 'manual' ? 'manual_marked' : 'refunded',
  };
}
