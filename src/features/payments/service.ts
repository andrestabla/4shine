import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import Stripe from 'stripe';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
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
  return { publicKey, integritySecret, baseUrl };
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

async function createStripeCheckoutForOrder(
  client: PoolClient,
  actorUserId: string,
  order: OrderForCheckout,
): Promise<PaymentInitiationResult> {
  const credentials = await resolveStripeCredentials(client, actorUserId);
  if (!credentials) {
    throw new Error('Stripe no está configurado.');
  }
  const stripe = new Stripe(credentials.secretKey, { apiVersion: '2026-04-22.dahlia' });
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

/**
 * Mark an order as paid via webhook. Idempotent: no-op if already paid.
 */
export async function markOrderAsPaid(
  client: PoolClient,
  params: { provider: PaymentProviderKey; reference: string },
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
  return { orderId: row.order_id, alreadyPaid: false };
}

export async function markOrderAsFailed(
  client: PoolClient,
  params: { provider: PaymentProviderKey; reference: string; reason?: string },
): Promise<void> {
  await client.query(
    `
      UPDATE app_mentoring.additional_mentorship_orders
      SET payment_status = 'failed', updated_at = now()
      WHERE payment_provider = $1 AND payment_reference = $2 AND payment_status NOT IN ('paid', 'refunded')
    `,
    [params.provider, params.reference],
  );
}
