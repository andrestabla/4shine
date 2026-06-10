// Workshops orders — replica del modelo de "additional_mentorship_orders"
// pero para el dominio de workshops.
//
// Flujo:
//   1. Líder ve un workshop con price > 0 y le da "Comprar".
//   2. UI llama POST /api/v1/modules/workshops/[id]/orders → createWorkshopOrder
//      crea fila en workshop_orders con status='pending_payment' y snapshot
//      del precio.
//   3. UI llama POST /api/v1/payments/workshops/checkout con (orderId, provider)
//      → payments/service.createWorkshopCheckout genera la sesión de Stripe
//      o la URL de Wompi.
//   4. Cuando el webhook confirma el pago → markWorkshopOrderAsPaid:
//        - Marca la orden como paid.
//        - Inserta/actualiza workshop_attendees con status='registered' si
//          aún hay cupo, o 'waitlist' si max_attendees está lleno.
//
// Workshops gratis (price = 0 o NULL) NO usan este módulo: siguen el flujo
// directo de workshops/service.applyToWorkshop.

import type { PoolClient } from 'pg';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';

export type WorkshopOrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';
export type WorkshopPaymentStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';
export type WorkshopPaymentProvider = 'stripe' | 'wompi' | 'manual';

export interface WorkshopOrderRecord {
  orderId: string;
  workshopId: string;
  workshopTitle: string;
  ownerUserId: string;
  priceAmount: number;
  currencyCode: string;
  status: WorkshopOrderStatus;
  paymentProvider: WorkshopPaymentProvider | null;
  paymentReference: string | null;
  paymentStatus: WorkshopPaymentStatus;
  paymentRedirectUrl: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundReference: string | null;
  refundReason: string | null;
  attendanceStatus: 'registered' | 'waitlist' | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderRow {
  order_id: string;
  workshop_id: string;
  workshop_title: string;
  owner_user_id: string;
  price_amount: string | number;
  currency_code: string;
  status: WorkshopOrderStatus;
  payment_provider: WorkshopPaymentProvider | null;
  payment_reference: string | null;
  payment_status: WorkshopPaymentStatus;
  payment_redirect_url: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_reference: string | null;
  refund_reason: string | null;
  attendance_status: 'registered' | 'waitlist' | null;
  created_at: string;
  updated_at: string;
}

const ORDER_SELECT = `
  SELECT
    wo.order_id::text,
    wo.workshop_id::text,
    w.title AS workshop_title,
    wo.owner_user_id::text,
    wo.price_amount,
    wo.currency_code,
    wo.status,
    wo.payment_provider,
    wo.payment_reference,
    wo.payment_status,
    wo.payment_redirect_url,
    wo.paid_at::text,
    wo.refunded_at::text,
    wo.refund_reference,
    wo.refund_reason,
    wa.attendance_status,
    wo.created_at::text,
    wo.updated_at::text
  FROM app_networking.workshop_orders wo
  JOIN app_networking.workshops w ON w.workshop_id = wo.workshop_id
  LEFT JOIN app_networking.workshop_attendees wa
    ON wa.workshop_id = wo.workshop_id
   AND wa.user_id = wo.owner_user_id
`;

function mapOrder(row: OrderRow): WorkshopOrderRecord {
  return {
    orderId: row.order_id,
    workshopId: row.workshop_id,
    workshopTitle: row.workshop_title,
    ownerUserId: row.owner_user_id,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    status: row.status,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    paymentStatus: row.payment_status,
    paymentRedirectUrl: row.payment_redirect_url,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    refundReference: row.refund_reference,
    refundReason: row.refund_reason,
    attendanceStatus: row.attendance_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Crear orden ─────────────────────────────────────────────────────────────

export interface CreateWorkshopOrderResult {
  order: WorkshopOrderRecord;
  /** Si la orden ya existía en pending_payment, reutilizamos. */
  reused: boolean;
}

export async function createWorkshopOrder(
  client: PoolClient,
  actor: AuthUser,
  workshopId: string,
): Promise<CreateWorkshopOrderResult> {
  await requireModulePermission(client, 'workshops', 'view');

  // Buscamos el workshop y validamos:
  //  - existe
  //  - status='upcoming' (no se puede comprar uno completado o cancelado)
  //  - price > 0 (los gratis NO pasan por este flujo)
  const { rows: workshopRows } = await client.query<{
    workshop_id: string;
    status: string;
    price: string | number | null;
    currency: string | null;
  }>(
    `
      SELECT workshop_id::text, status, price, currency
      FROM app_networking.workshops
      WHERE workshop_id = $1::uuid
      LIMIT 1
    `,
    [workshopId],
  );
  const workshop = workshopRows[0];
  if (!workshop) {
    throw new ForbiddenError('Workshop no encontrado.');
  }
  if (workshop.status !== 'upcoming') {
    throw new ForbiddenError('Este workshop ya no admite inscripciones.');
  }
  const priceAmount = Number(workshop.price ?? 0);
  if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
    throw new ForbiddenError('Este workshop no requiere pago. Usa la inscripción directa.');
  }
  const currencyCode = (workshop.currency ?? 'USD').toUpperCase();

  // ¿Ya tiene una orden activa? Si está pagada, error. Si está pending,
  // la reutilizamos (devolvemos la existente para que la UI re-inicie el
  // checkout sin crear una segunda orden).
  const { rows: existingRows } = await client.query<{
    order_id: string;
    status: WorkshopOrderStatus;
  }>(
    `
      SELECT order_id::text, status
      FROM app_networking.workshop_orders
      WHERE workshop_id = $1::uuid
        AND owner_user_id = $2::uuid
        AND status IN ('pending_payment', 'paid')
      LIMIT 1
    `,
    [workshopId, actor.userId],
  );
  const existing = existingRows[0];
  if (existing) {
    if (existing.status === 'paid') {
      throw new ForbiddenError('Ya pagaste este workshop.');
    }
    // Reutilizar pending_payment
    const order = await getOrderById(client, existing.order_id);
    if (!order) {
      throw new Error('No se pudo cargar la orden existente.');
    }
    return { order, reused: true };
  }

  // Insertamos la orden nueva con snapshot del precio. Si admin sube el
  // precio después, esta fila NO cambia: el usuario paga lo que vio.
  const { rows } = await client.query<{ order_id: string }>(
    `
      INSERT INTO app_networking.workshop_orders (
        workshop_id,
        owner_user_id,
        price_amount,
        currency_code,
        status,
        payment_status
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, 'pending_payment', 'pending')
      RETURNING order_id::text
    `,
    [workshopId, actor.userId, priceAmount, currencyCode],
  );
  const created = rows[0];
  if (!created) {
    throw new Error('No se pudo crear la orden de workshop.');
  }
  const order = await getOrderById(client, created.order_id);
  if (!order) {
    throw new Error('No se pudo cargar la orden recién creada.');
  }
  return { order, reused: false };
}

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export async function getOrderById(
  client: PoolClient,
  orderId: string,
): Promise<WorkshopOrderRecord | null> {
  const { rows } = await client.query<OrderRow>(
    `${ORDER_SELECT} WHERE wo.order_id = $1::uuid LIMIT 1`,
    [orderId],
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export interface OrderForCheckoutSnapshot {
  orderId: string;
  ownerUserId: string;
  workshopId: string;
  title: string;
  priceAmount: number;
  currencyCode: string;
  startsAt: string | null;
}

/**
 * Helper que carga la orden + workshop para que payments/service genere la
 * sesión de Stripe o la URL de Wompi. Falla si la orden ya está pagada o
 * no pertenece al actor.
 */
export async function loadWorkshopOrderForCheckout(
  client: PoolClient,
  orderId: string,
  actorUserId: string,
): Promise<OrderForCheckoutSnapshot> {
  interface Row {
    order_id: string;
    owner_user_id: string;
    workshop_id: string;
    title: string;
    price_amount: string | number;
    currency_code: string;
    starts_at: string | null;
    payment_status: WorkshopPaymentStatus;
  }
  const { rows } = await client.query<Row>(
    `
      SELECT
        wo.order_id::text,
        wo.owner_user_id::text,
        wo.workshop_id::text,
        w.title,
        wo.price_amount,
        wo.currency_code,
        w.starts_at::text,
        wo.payment_status
      FROM app_networking.workshop_orders wo
      JOIN app_networking.workshops w ON w.workshop_id = wo.workshop_id
      WHERE wo.order_id = $1::uuid
        AND wo.owner_user_id = $2::uuid
      LIMIT 1
    `,
    [orderId, actorUserId],
  );
  const row = rows[0];
  if (!row) {
    throw new ForbiddenError('Orden no encontrada o sin permiso.');
  }
  if (row.payment_status === 'paid') {
    throw new ForbiddenError('Esta orden ya está pagada.');
  }
  return {
    orderId: row.order_id,
    ownerUserId: row.owner_user_id,
    workshopId: row.workshop_id,
    title: row.title,
    priceAmount: Number(row.price_amount),
    currencyCode: row.currency_code,
    startsAt: row.starts_at,
  };
}

// ─── Cambios de estado durante checkout ──────────────────────────────────────

/**
 * payments/service llama este helper cuando inicia el checkout: registra
 * el provider, la referencia (sesión Stripe o ref Wompi) y la URL a la que
 * redirige al usuario.
 */
export async function markWorkshopOrderPending(
  client: PoolClient,
  orderId: string,
  provider: WorkshopPaymentProvider,
  reference: string,
  redirectUrl: string,
): Promise<void> {
  await client.query(
    `
      UPDATE app_networking.workshop_orders
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

// ─── Webhook: marcar como pagado e inscribir al asistente ────────────────────

/**
 * Idempotente. Llamada por el webhook de Stripe/Wompi cuando confirman pago.
 *
 * Si hay cupo disponible (workshop.max_attendees > registrados actuales),
 * el asistente queda 'registered'. Si está lleno, 'waitlist'. El admin
 * decide después si lo asciende.
 */
export async function markWorkshopOrderAsPaid(
  client: PoolClient,
  params: {
    provider: WorkshopPaymentProvider;
    reference: string;
    rawPayload?: Record<string, unknown>;
  },
): Promise<{ orderId: string | null; alreadyPaid: boolean; attendance: 'registered' | 'waitlist' | null }> {
  // 1) Marcamos la orden como paid. La cláusula WHERE evita doble-procesado.
  const { rows } = await client.query<{
    order_id: string;
    workshop_id: string;
    owner_user_id: string;
  }>(
    `
      UPDATE app_networking.workshop_orders
      SET
        payment_status = 'paid',
        status = CASE WHEN status = 'pending_payment' THEN 'paid' ELSE status END,
        paid_at = COALESCE(paid_at, now()),
        updated_at = now()
      WHERE payment_provider = $1
        AND payment_reference = $2
        AND payment_status <> 'paid'
      RETURNING order_id::text, workshop_id::text, owner_user_id::text
    `,
    [params.provider, params.reference],
  );

  const row = rows[0];
  if (!row) {
    // ¿Ya estaba pagada?
    const { rows: existing } = await client.query<{ order_id: string }>(
      `
        SELECT order_id::text
        FROM app_networking.workshop_orders
        WHERE payment_provider = $1
          AND payment_reference = $2
          AND payment_status = 'paid'
        LIMIT 1
      `,
      [params.provider, params.reference],
    );
    if (existing[0]) {
      return { orderId: existing[0].order_id, alreadyPaid: true, attendance: null };
    }
    return { orderId: null, alreadyPaid: false, attendance: null };
  }

  // 2) Decide attendance status: registered o waitlist según cupo.
  //    Esto se hace dentro de una sola query atómica para evitar carrera
  //    con compras concurrentes.
  const { rows: attendanceRows } = await client.query<{ attendance_status: 'registered' | 'waitlist' }>(
    `
      WITH cupo AS (
        SELECT
          w.max_attendees,
          (
            SELECT COUNT(*)
            FROM app_networking.workshop_attendees existing
            WHERE existing.workshop_id = w.workshop_id
              AND existing.attendance_status IN ('registered', 'invited', 'attended')
          ) AS ocupados
        FROM app_networking.workshops w
        WHERE w.workshop_id = $1::uuid
      )
      INSERT INTO app_networking.workshop_attendees (
        workshop_id, user_id, attendance_status
      )
      SELECT
        $1::uuid,
        $2::uuid,
        CASE
          WHEN cupo.max_attendees IS NULL OR cupo.ocupados < cupo.max_attendees
            THEN 'registered'
          ELSE 'waitlist'
        END
      FROM cupo
      ON CONFLICT (workshop_id, user_id) DO UPDATE
        SET attendance_status = CASE
          WHEN app_networking.workshop_attendees.attendance_status = 'cancelled'
            THEN EXCLUDED.attendance_status
          ELSE app_networking.workshop_attendees.attendance_status
        END
      RETURNING attendance_status
    `,
    [row.workshop_id, row.owner_user_id],
  );

  const attendance = attendanceRows[0]?.attendance_status ?? null;

  // 3) Log del intento exitoso.
  await client.query(
    `
      INSERT INTO app_networking.workshop_payment_attempts
        (order_id, provider, status, reference, raw_payload)
      VALUES ($1::uuid, $2, 'succeeded', $3, $4::jsonb)
    `,
    [row.order_id, params.provider, params.reference, JSON.stringify(params.rawPayload ?? {})],
  );

  return { orderId: row.order_id, alreadyPaid: false, attendance };
}

export async function markWorkshopOrderAsFailed(
  client: PoolClient,
  params: {
    provider: WorkshopPaymentProvider;
    reference: string;
    reason: string;
    rawPayload?: Record<string, unknown>;
  },
): Promise<{ orderId: string | null }> {
  const { rows } = await client.query<{ order_id: string }>(
    `
      UPDATE app_networking.workshop_orders
      SET
        payment_status = 'failed',
        updated_at = now()
      WHERE payment_provider = $1
        AND payment_reference = $2
        AND payment_status IN ('pending', 'awaiting_payment')
      RETURNING order_id::text
    `,
    [params.provider, params.reference],
  );
  const row = rows[0];
  if (!row) return { orderId: null };
  await client.query(
    `
      INSERT INTO app_networking.workshop_payment_attempts
        (order_id, provider, status, reference, error_message, raw_payload)
      VALUES ($1::uuid, $2, 'failed', $3, $4, $5::jsonb)
    `,
    [
      row.order_id,
      params.provider,
      params.reference,
      params.reason,
      JSON.stringify(params.rawPayload ?? {}),
    ],
  );
  return { orderId: row.order_id };
}

// ─── Refunds (admin/gestor) ──────────────────────────────────────────────────

/**
 * Marca una orden como reembolsada en la BD. El llamado real a Stripe/Wompi
 * vive en payments/service (refundWorkshopOrder), análogo a mentorías. Aquí
 * solo persistimos el efecto en la BD y removemos al asistente.
 */
export async function applyWorkshopOrderRefundLocally(
  client: PoolClient,
  orderId: string,
  refundReference: string,
  reason: string,
): Promise<void> {
  const { rows } = await client.query<{
    workshop_id: string;
    owner_user_id: string;
  }>(
    `
      UPDATE app_networking.workshop_orders
      SET
        payment_status = 'refunded',
        status = 'refunded',
        refunded_at = COALESCE(refunded_at, now()),
        refund_reference = COALESCE(refund_reference, $2),
        refund_reason = COALESCE(refund_reason, $3),
        updated_at = now()
      WHERE order_id = $1::uuid
        AND payment_status = 'paid'
      RETURNING workshop_id::text, owner_user_id::text
    `,
    [orderId, refundReference, reason],
  );
  const row = rows[0];
  if (!row) return;

  // Quitar al asistente: lo marcamos como cancelled para preservar
  // historial. No borramos la fila para que admin pueda auditar.
  await client.query(
    `
      UPDATE app_networking.workshop_attendees
      SET attendance_status = 'cancelled'
      WHERE workshop_id = $1::uuid
        AND user_id = $2::uuid
        AND attendance_status IN ('registered', 'waitlist', 'invited')
    `,
    [row.workshop_id, row.owner_user_id],
  );

  await client.query(
    `
      INSERT INTO app_networking.workshop_payment_attempts
        (order_id, provider, status, reference, error_message, raw_payload)
      SELECT
        $1::uuid,
        wo.payment_provider,
        'refunded',
        $2,
        $3,
        '{}'::jsonb
      FROM app_networking.workshop_orders wo
      WHERE wo.order_id = $1::uuid
    `,
    [orderId, refundReference, reason],
  );
}

// ─── Listados ────────────────────────────────────────────────────────────────

export async function listMyWorkshopOrders(
  client: PoolClient,
  actor: AuthUser,
): Promise<WorkshopOrderRecord[]> {
  await requireModulePermission(client, 'workshops', 'view');
  const { rows } = await client.query<OrderRow>(
    `
      ${ORDER_SELECT}
      WHERE wo.owner_user_id = $1::uuid
      ORDER BY wo.created_at DESC
    `,
    [actor.userId],
  );
  return rows.map(mapOrder);
}
