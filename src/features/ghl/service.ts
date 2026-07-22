import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { withRoleContext } from '@/server/db/pool';
import { createUser } from '@/features/usuarios/service';
import type {
  GhlDashboardData,
  GhlEventStatus,
  GhlProgramMapRecord,
  GhlWebhookEventRecord,
  UpdateGhlProgramInput,
} from './types';
import { GHL_FAILURE_STATUSES } from './types';

const PLATFORM_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co';
export const GHL_WEBHOOK_URL = `${PLATFORM_URL}/api/v1/webhooks/ghl`;

// ─── Configuración (leída de app_admin.integration_configs) ──────────────────

export interface GhlConfig {
  enabled: boolean;
  /** Secreto compartido que 4Shine genera y se pega en GHL. */
  webhookSecret: string | null;
  /** Private Integration Token de GHL (opcional, para verificación saliente). */
  apiKey: string | null;
  locationId: string | null;
  /** live | test — en test se registra el evento pero no se provisiona. */
  mode: string;
  organizationId: string | null;
}

export async function loadGhlConfig(client: PoolClient): Promise<GhlConfig> {
  const { rows } = await client.query<{
    organization_id: string;
    enabled: boolean;
    secret_value: string | null;
    wizard_data: Record<string, string> | null;
  }>(
    `SELECT organization_id::text, enabled, secret_value, wizard_data
       FROM app_admin.integration_configs
      WHERE integration_key = 'ghl'
      ORDER BY updated_at DESC
      LIMIT 1`,
  );
  const row = rows[0];
  const wizard = row?.wizard_data ?? {};
  return {
    enabled: row?.enabled ?? false,
    webhookSecret: (row?.secret_value ?? wizard.webhookSecret ?? '').trim() || null,
    apiKey: (wizard.apiKey ?? '').trim() || null,
    locationId: (wizard.locationId ?? '').trim() || null,
    mode: (wizard.mode ?? 'live').trim().toLowerCase(),
    organizationId: row?.organization_id ?? null,
  };
}

/**
 * Verifica el secreto compartido. GHL permite dos formas de asegurar un
 * webhook saliente y aceptamos ambas:
 *   a) Header `x-4shine-signature: sha256=<hmac hex del cuerpo crudo>`
 *   b) Header `x-4shine-token: <secreto en claro>` (o el campo `secret`
 *      dentro de customData), que es lo único que GHL permite si no se
 *      dispone de un paso de código.
 * Ambas se comparan en tiempo constante.
 */
export function verifyGhlSignature(
  rawBody: string,
  headers: Headers,
  payloadSecret: string | null,
  secret: string | null,
): boolean {
  if (!secret) return false;

  const signature = headers.get('x-4shine-signature') ?? headers.get('x-ghl-signature');
  if (signature) {
    const provided = signature.replace(/^sha256=/i, '').trim();
    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    return safeEqual(provided, expected);
  }

  const token = (headers.get('x-4shine-token') ?? payloadSecret ?? '').trim();
  return token ? safeEqual(token, secret) : false;
}

/**
 * Encabezados de la petición listos para guardarse.
 *
 * Los que llevan credenciales se redactan AQUÍ, antes de tocar la base: de
 * ellos solo queda constancia de que llegaron y cuánto medían, nunca su valor.
 * Saber "llegó un token de 47 caracteres" cuando el secreto tiene 48 basta para
 * diagnosticar un recorte al copiar, sin exponer nada.
 */
const SENSITIVE_HEADERS = new Set([
  'x-4shine-token', 'x-4shine-signature', 'x-ghl-signature',
  'authorization', 'cookie', 'x-api-key',
]);

export function redactHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    const name = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(name)) {
      const trimmed = value.trim();
      output[name] = trimmed
        ? `‹presente · ${trimmed.length} caracteres›`
        : '‹presente pero vacío›';
      return;
    }
    output[name] = value.length > 200 ? `${value.slice(0, 200)}…` : value;
  });
  return output;
}

/**
 * Diagnóstico legible del fallo de firma. NUNCA incluye el secreto ni el valor
 * recibido: solo si el encabezado llegó y si coincidió.
 */
export function describeSignatureFailure(
  headers: Headers,
  payloadSecret: string | null,
  secret: string | null,
): string {
  if (!secret) {
    return 'No hay secreto configurado en Administración → Integraciones → GoHighLevel.';
  }
  const firma = headers.get('x-4shine-signature') ?? headers.get('x-ghl-signature');
  if (firma) {
    return 'Llegó x-4shine-signature pero el HMAC no coincide. Verifica que el secreto en GHL sea idéntico al de 4Shine y que la firma se calcule sobre el cuerpo sin modificar.';
  }
  const token = (headers.get('x-4shine-token') ?? '').trim();
  if (token) {
    return 'Llegó x-4shine-token pero su valor no coincide con el secreto configurado. Revisa que esté copiado completo, sin espacios ni saltos de línea.';
  }
  if ((payloadSecret ?? '').trim()) {
    return 'El secreto llegó dentro del cuerpo pero no coincide con el configurado.';
  }
  return 'No llegó ningún encabezado de autenticación. En GHL, en la acción Webhook, sección ENCABEZADOS, agrega la clave x-4shine-token con el secreto compartido.';
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ─── Normalización del payload ───────────────────────────────────────────────

export interface GhlNormalizedPayload {
  transactionId: string;
  eventType: string;
  programId: string;
  productName: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  country: string | null;
  amount: number | null;
  currency: string | null;
  mode: string;
  secret: string | null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

/**
 * Nombres que GHL usa para el mismo evento según el disparador del workflow.
 * Se traducen a los cinco tipos canónicos para que el admin no tenga que
 * escribirlos exactos en "Datos personalizados".
 *
 * OJO con order_submitted: en GHL dispara al enviarse el formulario de orden.
 * Solo debe usarse en workflows cuyo disparador exija pago aprobado; de lo
 * contrario se provisionaría acceso a una compra sin cobrar.
 */
const EVENT_TYPE_ALIASES: Record<string, string> = {
  order_submitted: 'purchase_completed',
  order_completed: 'purchase_completed',
  purchase: 'purchase_completed',
  payment_received: 'purchase_completed',
  invoice_paid: 'purchase_completed',
  subscription_renewal: 'subscription_renewed',
  renewal: 'subscription_renewed',
  subscription_cancel: 'subscription_cancelled',
  cancellation: 'subscription_cancelled',
  payment_failure: 'payment_failed',
  refund: 'refund_issued',
  refunded: 'refund_issued',
};

function normalizeEventType(raw: string): string {
  const key = raw.trim().toLowerCase();
  return EVENT_TYPE_ALIASES[key] ?? key;
}

/**
 * GHL envía los campos de `customData` o bien anidados o bien aplanados en la
 * raíz según cómo se configure el workflow; aceptamos ambos. Las claves se
 * buscan además en minúsculas sin guion bajo (firstname, lastname), que es como
 * las nombra el editor de GHL por defecto.
 */
export function normalizeGhlPayload(body: unknown): GhlNormalizedPayload | null {
  return parseGhlPayload(body).payload;
}

/**
 * Igual que normalizeGhlPayload pero explicando POR QUÉ falló: qué campo falta
 * y si llegó como etiqueta sin resolver. Sin esto, el mensaje de error obliga a
 * adivinar cuál de los tres campos obligatorios es el que viene vacío.
 */
export function parseGhlPayload(body: unknown): {
  payload: GhlNormalizedPayload | null;
  missing: string[];
  unresolved: string[];
} {
  if (!body || typeof body !== 'object') return { payload: null, missing: ['body'], unresolved: [] };
  const root = body as Record<string, unknown>;
  const custom =
    root.customData && typeof root.customData === 'object'
      ? (root.customData as Record<string, unknown>)
      : {};

  const unresolved: string[] = [];
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const value = str(custom[key]) || str(root[key]);
      if (!value) continue;
      // GHL envía la etiqueta literal cuando el workflow no tiene ese dato en
      // contexto (p. ej. {{payment.transaction_id}} en un disparador sin pago).
      // Tomarla como válida guardaría basura y rompería la idempotencia.
      if (/^\{\{.*\}\}$/.test(value)) {
        unresolved.push(`${keys[0]} = ${value}`);
        continue;
      }
      return value;
    }
    return '';
  };

  const transactionId = pick(
    'transaction_id', 'transactionId', 'transactionid',
    'order_id', 'orderId', 'payment_id', 'invoice_id',
  );
  const eventType = normalizeEventType(pick('event_type', 'eventType', 'eventtype'));
  const email = pick('email', 'contact_email', 'contactEmail').toLowerCase();

  const missing: string[] = [];
  if (!transactionId) missing.push('transaction_id');
  if (!eventType) missing.push('event_type');
  if (!email) missing.push('email');
  if (missing.length > 0) return { payload: null, missing, unresolved };

  const amountRaw = pick('amount', 'price');
  const payload: GhlNormalizedPayload = {
    transactionId,
    eventType,
    programId: pick('program_id', 'programId', 'programid'),
    productName: pick('product_name', 'productName', 'productname') || null,
    email,
    firstName: pick('first_name', 'firstName', 'firstname') || email.split('@')[0],
    lastName: pick('last_name', 'lastName', 'lastname'),
    phone: pick('phone') || null,
    country: pick('country') || null,
    amount: amountRaw ? Number(amountRaw.replace(/[^\d.-]/g, '')) || null : null,
    currency: pick('currency') || null,
    mode: (pick('mode') || 'live').toLowerCase(),
    secret: pick('secret', 'webhook_secret') || null,
  };
  return { payload, missing: [], unresolved };
}

// ─── Procesamiento del webhook ───────────────────────────────────────────────

export interface GhlProcessResult {
  status: GhlEventStatus;
  message: string;
  eventId: string | null;
  userId: string | null;
  planId: string | null;
  expiresAt: string | null;
  httpStatus: number;
}

interface ProgramRow {
  program_id: string;
  kind: string;
  plan_id: string | null;
  duration_days: number | null;
  role_override: string | null;
  plan_type: string | null;
  product_code: string | null;
  is_active: boolean;
}

/**
 * Punto de entrada único del webhook. Registra SIEMPRE el evento (aunque
 * falle) y garantiza idempotencia vía UNIQUE (transaction_id, event_type).
 *
 * Todo corre bajo contexto de rol admin porque integration_configs,
 * ghl_webhook_events y ghl_program_map tienen FORCE ROW LEVEL SECURITY y el
 * webhook llega sin sesión de usuario (mismo patrón que los crons).
 */
export async function processGhlWebhook(
  client: PoolClient,
  rawBody: string,
  headers: Headers,
  options?: { inTransaction?: boolean },
): Promise<GhlProcessResult> {
  const adminUserId = await resolveSystemAdminId(client);
  const run = () => processGhlWebhookInner(client, adminUserId, rawBody, headers);
  return options?.inTransaction ? run() : withRoleContext(client, adminUserId, 'admin', run);
}

async function processGhlWebhookInner(
  client: PoolClient,
  adminUserId: string,
  rawBody: string,
  headers: Headers,
): Promise<GhlProcessResult> {
  const config = await loadGhlConfig(client);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    const eventId = await insertRawFailure(client, rawBody, 'Cuerpo no es JSON válido.', headers);
    return { status: 'invalid_payload', message: 'Cuerpo no es JSON válido.', eventId, userId: null, planId: null, expiresAt: null, httpStatus: 400 };
  }

  const { payload, missing, unresolved } = parseGhlPayload(parsed);
  if (!payload) {
    const detail = [
      `Faltan campos obligatorios: ${missing.join(', ')}.`,
      unresolved.length > 0
        ? `Etiquetas de GHL sin resolver (llegaron literales, el workflow no tiene ese dato en contexto): ${unresolved.join('; ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    // Se registra con el cuerpo crudo: sin esto no hay forma de ver qué envió
    // GHL realmente y el diagnóstico se vuelve adivinanza.
    const eventId = await insertRawFailure(client, rawBody, detail, headers);
    await notifyAdminsOfFailure(client, config, null, 'invalid_payload', detail);
    return { status: 'invalid_payload', message: detail, eventId, userId: null, planId: null, expiresAt: null, httpStatus: 400 };
  }

  const signatureOk = verifyGhlSignature(rawBody, headers, payload.secret, config.webhookSecret);
  if (!signatureOk) {
    // Se explica QUÉ falló sin revelar nunca el secreto: "token inválido" a
    // secas obliga a adivinar entre "no llegó el encabezado" y "llegó pero no
    // coincide", que se arreglan de formas distintas en GHL.
    const detalle = describeSignatureFailure(headers, payload.secret, config.webhookSecret);
    const eventId = await insertEvent(client, payload, false, 'invalid_signature', detalle, headers);
    await notifyAdminsOfFailure(client, config, payload, 'invalid_signature', detalle);
    return { status: 'invalid_signature', message: detalle, eventId, userId: null, planId: null, expiresAt: null, httpStatus: 401 };
  }

  const eventId = await insertEvent(client, payload, true, 'received', null, headers);
  if (!eventId) {
    return { status: 'duplicate_ignored', message: 'Evento ya procesado anteriormente.', eventId: null, userId: null, planId: null, expiresAt: null, httpStatus: 200 };
  }

  if (!config.enabled) {
    await finalizeEvent(client, eventId, 'error', 'La integración GHL está deshabilitada en Administración → Integraciones.', null, null, null);
    await notifyAdminsOfFailure(client, config, payload, 'error', 'Integración GHL deshabilitada.');
    return { status: 'error', message: 'Integración deshabilitada.', eventId, userId: null, planId: null, expiresAt: null, httpStatus: 503 };
  }

  const { rows: programRows } = await client.query<ProgramRow>(
    `SELECT program_id, kind, plan_id::text, duration_days, role_override, plan_type, product_code, is_active
       FROM app_billing.ghl_program_map WHERE program_id = $1`,
    [payload.programId],
  );
  const program = programRows[0];
  if (!program || !program.is_active) {
    // Se listan los válidos: el error casi siempre es una errata en GHL.
    const { rows: validRows } = await client.query<{ program_id: string }>(
      `SELECT program_id FROM app_billing.ghl_program_map WHERE is_active ORDER BY program_id`,
    );
    const valid = validRows.map((row) => row.program_id).join(', ');
    const message = `program_id "${payload.programId}" no está mapeado o está inactivo. Válidos: ${valid}.`;
    await finalizeEvent(client, eventId, 'unknown_program', message, null, null, null);
    await notifyAdminsOfFailure(client, config, payload, 'unknown_program', message);
    return { status: 'unknown_program', message, eventId, userId: null, planId: null, expiresAt: null, httpStatus: 422 };
  }

  // En modo test se registra el evento pero no se toca el estado de usuarios.
  if (config.mode === 'test' || payload.mode === 'test') {
    await finalizeEvent(client, eventId, 'updated', 'Modo test: evento validado sin provisionar.', null, program.plan_id, null);
    return { status: 'updated', message: 'Modo test: sin provisionar.', eventId, userId: null, planId: program.plan_id, expiresAt: null, httpStatus: 200 };
  }

  try {
    const outcome = await applyGhlEvent(client, adminUserId, payload, program);
    await finalizeEvent(client, eventId, outcome.status, outcome.message, outcome.userId, outcome.planId, outcome.expiresAt);
    if (outcome.status === 'error') {
      await notifyAdminsOfFailure(client, config, payload, 'error', outcome.message);
      return { ...outcome, eventId, httpStatus: 422 };
    }
    return { ...outcome, eventId, httpStatus: 200 };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al provisionar.';
    console.error('[ghl] provisioning failed:', error);
    await finalizeEvent(client, eventId, 'error', message, null, program.plan_id, null);
    await notifyAdminsOfFailure(client, config, payload, 'error', message);
    return { status: 'error', message, eventId, userId: null, planId: program.plan_id, expiresAt: null, httpStatus: 500 };
  }
}

async function insertEvent(
  client: PoolClient,
  payload: GhlNormalizedPayload,
  signatureOk: boolean,
  status: string,
  resultMessage: string | null,
  headers?: Headers,
): Promise<string | null> {
  const { rows } = await client.query<{ event_id: string }>(
    `INSERT INTO app_billing.ghl_webhook_events (
       transaction_id, event_type, program_id, product_name, email,
       first_name, last_name, mode, signature_ok, status, result_message, payload, headers
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
     ON CONFLICT (transaction_id, event_type) DO NOTHING
     RETURNING event_id::text`,
    [
      payload.transactionId,
      payload.eventType,
      payload.programId || null,
      payload.productName,
      payload.email,
      payload.firstName,
      payload.lastName,
      payload.mode,
      signatureOk,
      status,
      resultMessage,
      JSON.stringify(redactPayload(payload)),
      headers ? JSON.stringify(redactHeaders(headers)) : null,
    ],
  );
  return rows[0]?.event_id ?? null;
}

/**
 * Registra un intento cuyo cuerpo no se pudo interpretar, guardando el JSON tal
 * como llegó para poder verlo en el panel. La transacción sintética es un hash
 * del cuerpo: reintentos idénticos de GHL no llenan la bitácora de duplicados.
 */
async function insertRawFailure(
  client: PoolClient,
  rawBody: string,
  message: string,
  headers?: Headers,
): Promise<string | null> {
  const fingerprint = createHash('sha256').update(rawBody).digest('hex').slice(0, 24);
  let payloadJson: string;
  try {
    // Se guarda el cuerpo tal cual si es JSON; si no, envuelto como texto.
    JSON.parse(rawBody);
    payloadJson = rawBody.slice(0, 20_000);
  } catch {
    payloadJson = JSON.stringify({ raw_body: rawBody.slice(0, 20_000) });
  }

  const { rows } = await client.query<{ event_id: string }>(
    `INSERT INTO app_billing.ghl_webhook_events
       (transaction_id, event_type, signature_ok, status, result_message, payload, headers, processed_at)
     VALUES ($1, 'invalid_payload', false, 'invalid_payload', $2, $3::jsonb, $4::jsonb, now())
     ON CONFLICT (transaction_id, event_type) DO UPDATE
       SET result_message = EXCLUDED.result_message,
           payload        = EXCLUDED.payload,
           headers        = EXCLUDED.headers,
           received_at    = now(),
           processed_at   = now()
     RETURNING event_id::text`,
    [`invalid-${fingerprint}`, message, payloadJson, headers ? JSON.stringify(redactHeaders(headers)) : null],
  );
  return rows[0]?.event_id ?? null;
}

/** Nunca persistimos el secreto compartido en la bitácora. */
function redactPayload(payload: GhlNormalizedPayload): Record<string, unknown> {
  const { secret, ...rest } = payload;
  void secret;
  return rest;
}

async function finalizeEvent(
  client: PoolClient,
  eventId: string,
  status: GhlEventStatus,
  message: string | null,
  userId: string | null,
  planId: string | null,
  expiresAt: string | null,
): Promise<void> {
  await client.query(
    `UPDATE app_billing.ghl_webhook_events
        SET status = $2, result_message = $3, user_id = $4::uuid,
            plan_id = $5::uuid, expires_at = $6::timestamptz, processed_at = now()
      WHERE event_id = $1::uuid`,
    [eventId, status, message, userId, planId, expiresAt],
  );
}

async function resolveSystemAdminId(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ user_id: string }>(
    `SELECT user_id::text FROM app_core.users
      WHERE primary_role = 'admin' AND is_active ORDER BY created_at LIMIT 1`,
  );
  const adminUserId = rows[0]?.user_id;
  if (!adminUserId) throw new Error('No hay un usuario admin para ejecutar el aprovisionamiento.');
  return adminUserId;
}

// ─── Aprovisionamiento ───────────────────────────────────────────────────────

interface ApplyOutcome {
  status: GhlEventStatus;
  message: string;
  userId: string | null;
  planId: string | null;
  expiresAt: string | null;
}

async function applyGhlEvent(
  client: PoolClient,
  adminUserId: string,
  payload: GhlNormalizedPayload,
  program: ProgramRow,
): Promise<ApplyOutcome> {
  switch (payload.eventType) {
    case 'purchase_completed':
    case 'subscription_renewed':
      return grantAccess(client, adminUserId, payload, program);
    case 'subscription_cancelled':
      // No se corta el acceso: el usuario mantiene lo pagado hasta su vencimiento.
      return markCancellation(client, payload, 'cancel_scheduled',
        'Suscripción cancelada en GHL: el acceso continúa hasta la fecha de vencimiento vigente.');
    case 'payment_failed':
      return markCancellation(client, payload, 'suspended',
        'Pago fallido reportado por GHL. Acceso marcado para revisión manual.');
    case 'refund_issued':
      return revokeAccess(client, payload);
    default:
      return { status: 'error', message: `event_type "${payload.eventType}" no reconocido.`, userId: null, planId: null, expiresAt: null };
  }
}

async function findUserByEmail(client: PoolClient, email: string): Promise<string | null> {
  const { rows } = await client.query<{ user_id: string }>(
    `SELECT user_id::text FROM app_core.users WHERE email = $1::citext LIMIT 1`,
    [email],
  );
  return rows[0]?.user_id ?? null;
}

async function grantAccess(
  client: PoolClient,
  adminUserId: string,
  payload: GhlNormalizedPayload,
  program: ProgramRow,
): Promise<ApplyOutcome> {
  const role = program.role_override ?? 'lider';
  const durationDays = program.duration_days ?? (await planDurationDays(client, program.plan_id)) ?? 365;

  let userId = await findUserByEmail(client, payload.email);
  let created = false;

  if (!userId) {
    // Contraseña temporal aleatoria; el usuario la recibe en el correo de
    // bienvenida (auth.account_created_by_admin) y la cambia al ingresar.
    const tempPassword = `4S-${randomBytes(6).toString('base64url')}`;
    const actor: AuthUser = {
      userId: adminUserId,
      email: 'sistema@4shine.co',
      name: 'Equipo 4Shine',
      role: 'admin',
    };
    const record = await createUser(client, actor, {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName || '',
      primaryRole: role as 'lider' | 'invitado',
      password: tempPassword,
      planType: (program.plan_type as 'premium' | 'vip' | 'empresa_elite' | null) ?? null,
      country: payload.country,
      sendWelcomeEmail: true,
    });
    userId = record.userId;
    created = true;
  } else {
    await client.query(
      `UPDATE app_core.users
          SET is_active = true, primary_role = $2, updated_at = now()
        WHERE user_id = $1::uuid AND primary_role IN ('lider','invitado')`,
      [userId, role],
    );
  }

  const verb = created ? 'creado' : payload.eventType === 'subscription_renewed' ? 'renovado' : 'actualizado';
  const status: GhlEventStatus = created
    ? 'created'
    : payload.eventType === 'subscription_renewed'
      ? 'renewed'
      : 'updated';

  // El diagnóstico no es una suscripción: es una compra puntual. Se registra en
  // user_purchases (product_group='discovery'), que es el grant que
  // readAccessStateForActor respeta aunque el líder no tenga plan y que
  // sobrevive si más adelante se le asigna uno.
  if (program.kind === 'diagnostico') {
    await grantDiscoveryPurchase(client, userId, program, payload);
    if (!created) {
      await notifyExistingUserPurchase(client, userId, payload, null);
    }
    return {
      status,
      message: `Usuario ${verb} como líder sin suscripción, con acceso a Descubrimiento por compra del diagnóstico.`,
      userId,
      planId: null,
      expiresAt: null,
    };
  }

  const expiresAt = await applySubscription(client, userId, program, durationDays);
  // Usuario nuevo → ya recibió credenciales (correo de bienvenida). Usuario
  // existente → NO se le mandan credenciales otra vez; se le avisa del producto.
  if (!created) {
    await notifyExistingUserPurchase(client, userId, payload, expiresAt);
  }
  return {
    status,
    message: `Usuario ${verb} con acceso a "${payload.productName ?? program.program_id}" hasta ${expiresAt?.slice(0, 10) ?? 'sin vencimiento'}.`,
    userId,
    planId: program.plan_id,
    expiresAt,
  };
}

/**
 * Registra la compra puntual del diagnóstico. Es idempotente por su cuenta: si
 * el líder ya tiene una compra activa del mismo producto no se duplica, así un
 * reenvío manual desde GHL no ensucia su historial de compras.
 */
async function grantDiscoveryPurchase(
  client: PoolClient,
  userId: string,
  program: ProgramRow,
  payload: GhlNormalizedPayload,
): Promise<void> {
  const productCode = program.product_code ?? program.program_id;
  const { rows: productRows } = await client.query<{ price_amount: string }>(
    `SELECT price_amount::text FROM app_billing.product_catalog
      WHERE product_code = $1 AND product_group = 'discovery' LIMIT 1`,
    [productCode],
  );
  if (productRows.length === 0) {
    throw new Error(
      `El producto "${productCode}" no existe en app_billing.product_catalog con product_group='discovery'.`,
    );
  }

  await client.query(
    `INSERT INTO app_billing.user_purchases
       (user_id, product_code, status, quantity, unit_price_amount, currency_code, metadata, activated_at)
     SELECT $1::uuid, $2, 'active', 1, $3::numeric, $4, $5::jsonb, now()
      WHERE NOT EXISTS (
        SELECT 1 FROM app_billing.user_purchases
         WHERE user_id = $1::uuid AND product_code = $2 AND status = 'active'
      )`,
    [
      userId,
      productCode,
      payload.amount ?? Number(productRows[0].price_amount ?? 0),
      (payload.currency ?? 'USD').toUpperCase(),
      JSON.stringify({ source: 'ghl', transaction_id: payload.transactionId, program_id: program.program_id }),
    ],
  );
}

async function planDurationDays(client: PoolClient, planId: string | null): Promise<number | null> {
  if (!planId) return null;
  const { rows } = await client.query<{ duration_days: number }>(
    `SELECT duration_days FROM app_billing.subscription_plans WHERE plan_id = $1::uuid LIMIT 1`,
    [planId],
  );
  const days = Number(rows[0]?.duration_days ?? 0);
  return days > 0 ? days : null;
}

/**
 * Asigna plan y vigencia. Si el usuario ya tiene el MISMO plan vigente, la
 * renovación se acumula desde la fecha de vencimiento actual en lugar de
 * reiniciarse desde hoy (así una renovación anticipada no regala días ni los
 * quita).
 */
async function applySubscription(
  client: PoolClient,
  userId: string,
  program: ProgramRow,
  durationDays: number,
): Promise<string | null> {
  const { rows } = await client.query<{ expires_at: string | null }>(
    `UPDATE app_core.user_profiles
        SET subscription_plan_id    = COALESCE($2::uuid, subscription_plan_id),
            plan_type               = COALESCE($4, plan_type),
            subscription_started_at = COALESCE(subscription_started_at, now()),
            subscription_expires_at = CASE
              WHEN subscription_plan_id IS NOT DISTINCT FROM $2::uuid
               AND subscription_expires_at IS NOT NULL
               AND subscription_expires_at > now()
              THEN subscription_expires_at + ($3::int || ' days')::interval
              ELSE now() + ($3::int || ' days')::interval
            END,
            updated_at = now()
      WHERE user_id = $1::uuid
      RETURNING subscription_expires_at::text AS expires_at`,
    [userId, program.plan_id, durationDays, program.plan_type],
  );

  if (rows.length === 0) {
    // Perfil inexistente (usuario legado): crear la fila mínima.
    const { rows: inserted } = await client.query<{ expires_at: string | null }>(
      `INSERT INTO app_core.user_profiles (user_id, plan_type, subscription_plan_id, subscription_started_at, subscription_expires_at)
       VALUES ($1::uuid, $4, $2::uuid, now(), now() + ($3::int || ' days')::interval)
       RETURNING subscription_expires_at::text AS expires_at`,
      [userId, program.plan_id, durationDays, program.plan_type],
    );
    return inserted[0]?.expires_at ?? null;
  }
  return rows[0]?.expires_at ?? null;
}

async function markCancellation(
  client: PoolClient,
  payload: GhlNormalizedPayload,
  status: GhlEventStatus,
  message: string,
): Promise<ApplyOutcome> {
  const userId = await findUserByEmail(client, payload.email);
  if (!userId) {
    return { status: 'error', message: `No existe un usuario con el correo ${payload.email}.`, userId: null, planId: null, expiresAt: null };
  }
  const { rows } = await client.query<{ expires_at: string | null }>(
    `SELECT subscription_expires_at::text AS expires_at FROM app_core.user_profiles WHERE user_id = $1::uuid`,
    [userId],
  );
  return { status, message, userId, planId: null, expiresAt: rows[0]?.expires_at ?? null };
}

async function revokeAccess(client: PoolClient, payload: GhlNormalizedPayload): Promise<ApplyOutcome> {
  const userId = await findUserByEmail(client, payload.email);
  if (!userId) {
    return { status: 'error', message: `No existe un usuario con el correo ${payload.email}.`, userId: null, planId: null, expiresAt: null };
  }
  await client.query(
    `UPDATE app_core.user_profiles
        SET subscription_expires_at = now(), updated_at = now()
      WHERE user_id = $1::uuid`,
    [userId],
  );
  return {
    status: 'access_revoked',
    message: 'Reembolso registrado en GHL: acceso revocado de inmediato.',
    userId,
    planId: null,
    expiresAt: new Date().toISOString(),
  };
}

// ─── Notificación de fallo al administrador ──────────────────────────────────

/**
 * Aviso a un usuario que YA tenía cuenta de que adquirió un producto nuevo.
 *
 * No lleva credenciales: la cuenta ya existe, reenviarlas sería confuso e
 * inseguro. Solo notifica el producto y, para las suscripciones, la vigencia.
 * Falla en silencio: un correo que no sale no debe tumbar el aprovisionamiento.
 */
async function notifyExistingUserPurchase(
  client: PoolClient,
  userId: string,
  payload: GhlNormalizedPayload,
  expiresAt: string | null,
): Promise<void> {
  try {
    const { dispatchNotification } = await import('@/features/notificaciones/engine');
    const { rows } = await client.query<{
      email: string;
      first_name: string | null;
      organization_id: string | null;
    }>(
      `SELECT email::text, first_name, organization_id::text
         FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
      [userId],
    );
    const user = rows[0];
    if (!user?.organization_id || !user.email) return;

    await dispatchNotification(client, {
      organizationId: user.organization_id,
      recipientUserId: userId,
      recipientEmail: user.email,
      eventKey: 'ghl.product_acquired',
      variables: {
        nombre: user.first_name ?? payload.firstName,
        titulo: payload.productName ?? 'tu nuevo producto',
        fecha: expiresAt ? expiresAt.slice(0, 10) : 'sin vencimiento',
        enlace_plataforma: `${PLATFORM_URL}/acceso`,
      },
    });
  } catch (error) {
    console.error('[ghl] product-acquired notification could not be sent:', error);
  }
}

async function notifyAdminsOfFailure(
  client: PoolClient,
  config: GhlConfig,
  payload: GhlNormalizedPayload | null,
  status: GhlEventStatus,
  message: string,
): Promise<void> {
  if (!GHL_FAILURE_STATUSES.includes(status)) return;
  try {
    const { dispatchNotification } = await import('@/features/notificaciones/engine');
    const { rows } = await client.query<{ user_id: string; email: string; organization_id: string | null }>(
      `SELECT user_id::text, email::text, organization_id::text
         FROM app_core.users WHERE primary_role = 'admin' AND is_active`,
    );
    for (const admin of rows) {
      const organizationId = admin.organization_id ?? config.organizationId;
      if (!organizationId) continue;
      await dispatchNotification(client, {
        organizationId,
        recipientUserId: admin.user_id,
        recipientEmail: admin.email,
        eventKey: 'ghl.webhook_failed',
        variables: {
          motivo: message,
          correo: payload?.email ?? 'desconocido',
          titulo: payload?.productName ?? payload?.programId ?? 'Producto desconocido',
          descripcion: `Transacción GHL: ${payload?.transactionId ?? 'desconocida'} · Evento: ${payload?.eventType ?? 'desconocido'}`,
          enlace_plataforma: `${PLATFORM_URL}/dashboard/administracion/ghl`,
        },
      });
    }
  } catch (error) {
    console.error('[ghl] admin failure notification could not be sent:', error);
  }
}

// ─── Lecturas para el panel de administración ────────────────────────────────

export async function getGhlDashboard(
  client: PoolClient,
  _actor: AuthUser,
  options?: { limit?: number; status?: string | null; search?: string | null },
): Promise<GhlDashboardData> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const status = options?.status?.trim() || null;
  const search = options?.search?.trim() || null;

  const { rows: eventRows } = await client.query(
    `SELECT e.event_id::text, e.transaction_id, e.event_type, e.program_id, e.product_name,
            e.email::text, e.first_name, e.last_name, e.mode, e.signature_ok, e.status,
            e.result_message, e.headers, e.user_id::text, u.display_name AS user_display_name,
            e.plan_id::text, p.name AS plan_name, e.expires_at::text, e.payload,
            e.received_at::text, e.processed_at::text
       FROM app_billing.ghl_webhook_events e
       LEFT JOIN app_core.users u ON u.user_id = e.user_id
       LEFT JOIN app_billing.subscription_plans p ON p.plan_id = e.plan_id
      WHERE ($1::text IS NULL OR e.status = $1)
        AND ($2::text IS NULL OR e.email::text ILIKE '%' || $2 || '%'
             OR e.transaction_id ILIKE '%' || $2 || '%'
             OR COALESCE(e.product_name, '') ILIKE '%' || $2 || '%')
      ORDER BY e.received_at DESC
      LIMIT $3`,
    [status, search, limit],
  );

  const { rows: programRows } = await client.query(
    `SELECT m.program_id, m.label, m.kind, m.plan_id::text, p.name AS plan_name,
            m.duration_days, m.role_override, m.plan_type, m.price_usd, m.is_active,
            m.updated_at::text
       FROM app_billing.ghl_program_map m
       LEFT JOIN app_billing.subscription_plans p ON p.plan_id = m.plan_id
      ORDER BY m.kind, m.label`,
    [],
  );

  const { rows: statRows } = await client.query<{
    total: string; last_24h: string; provisioned: string; failures: string;
  }>(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE received_at > now() - interval '24 hours') AS last_24h,
            COUNT(*) FILTER (WHERE status IN ('created','updated','renewed')) AS provisioned,
            COUNT(*) FILTER (WHERE status IN ('error','invalid_signature','invalid_payload','unknown_program')) AS failures
       FROM app_billing.ghl_webhook_events`,
  );

  const config = await loadGhlConfig(client);
  const programs = programRows.map(toProgramRecord);

  return {
    events: eventRows.map(toEventRecord),
    programs,
    stats: {
      total: Number(statRows[0]?.total ?? 0),
      last24h: Number(statRows[0]?.last_24h ?? 0),
      provisioned: Number(statRows[0]?.provisioned ?? 0),
      failures: Number(statRows[0]?.failures ?? 0),
      unmappedPrograms: programs.filter((p) => p.isActive && !p.planId && p.kind === 'plan').length,
    },
    configured: config.enabled && Boolean(config.webhookSecret),
    webhookUrl: GHL_WEBHOOK_URL,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toEventRecord(row: any): GhlWebhookEventRecord {
  return {
    eventId: row.event_id,
    transactionId: row.transaction_id,
    eventType: row.event_type,
    programId: row.program_id,
    productName: row.product_name,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    mode: row.mode,
    signatureOk: row.signature_ok,
    status: row.status,
    resultMessage: row.result_message,
    userId: row.user_id,
    userDisplayName: row.user_display_name,
    planId: row.plan_id,
    planName: row.plan_name,
    expiresAt: row.expires_at,
    payload: row.payload,
    headers: row.headers ?? null,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  };
}

function toProgramRecord(row: any): GhlProgramMapRecord {
  return {
    programId: row.program_id,
    label: row.label,
    kind: row.kind,
    planId: row.plan_id,
    planName: row.plan_name,
    durationDays: row.duration_days === null ? null : Number(row.duration_days),
    roleOverride: row.role_override,
    planType: row.plan_type,
    priceUsd: row.price_usd === null ? null : Number(row.price_usd),
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function updateGhlProgram(
  client: PoolClient,
  _actor: AuthUser,
  input: UpdateGhlProgramInput,
): Promise<GhlProgramMapRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows } = await client.query(
    `UPDATE app_billing.ghl_program_map m
        SET plan_id       = COALESCE($2::uuid, m.plan_id),
            duration_days = COALESCE($3::int, m.duration_days),
            role_override = COALESCE($4, m.role_override),
            plan_type     = COALESCE($5, m.plan_type),
            is_active     = COALESCE($6::boolean, m.is_active),
            updated_at    = now()
      WHERE m.program_id = $1
      RETURNING m.program_id, m.label, m.kind, m.plan_id::text,
                (SELECT name FROM app_billing.subscription_plans WHERE plan_id = m.plan_id) AS plan_name,
                m.duration_days, m.role_override, m.plan_type, m.price_usd, m.is_active,
                m.updated_at::text`,
    [
      input.programId,
      input.planId ?? null,
      input.durationDays ?? null,
      input.roleOverride ?? null,
      input.planType ?? null,
      input.isActive ?? null,
    ],
  );
  if (rows.length === 0) throw new Error(`Programa "${input.programId}" no encontrado.`);
  return toProgramRecord(rows[0]);
}

/** Reprocesa un evento fallido reutilizando el payload almacenado. */
export async function retryGhlEvent(
  client: PoolClient,
  actor: AuthUser,
  eventId: string,
): Promise<GhlProcessResult> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows } = await client.query<{ payload: unknown; transaction_id: string; event_type: string }>(
    `SELECT payload, transaction_id, event_type
       FROM app_billing.ghl_webhook_events WHERE event_id = $1::uuid`,
    [eventId],
  );
  const row = rows[0];
  if (!row) throw new Error('Evento no encontrado.');

  // Se borra la fila anterior para que el reintento pase el filtro de
  // idempotencia; queda una única entrada por (transaction_id, event_type).
  await client.query(`DELETE FROM app_billing.ghl_webhook_events WHERE event_id = $1::uuid`, [eventId]);

  const config = await loadGhlConfig(client);
  const rawBody = JSON.stringify(row.payload);
  const headers = new Headers({ 'x-4shine-token': config.webhookSecret ?? '' });
  void actor;
  // La ruta ya abrió su propia transacción con contexto de rol: no anidar otra.
  return processGhlWebhook(client, rawBody, headers, { inTransaction: true });
}
