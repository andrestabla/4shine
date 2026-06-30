/**
 * Notification Engine
 *
 * Resolves the active template for an event, renders variable placeholders,
 * and dispatches to the configured channels (email and/or in-app).
 *
 * Usage in feature service layers:
 *   await dispatchNotification(client, {
 *     organizationId,
 *     recipientUserId,
 *     recipientEmail,
 *     eventKey: 'mentorias.session_scheduled_mentee',
 *     variables: { nombre: 'Ana', titulo: 'Sesión de coaching', ... },
 *   });
 */

import type { PoolClient } from 'pg';
import { buildBrandedEmailHtml } from '@/lib/email-template';
import type { DispatchContext, VariableKey } from './types';
import { EVENTS_BY_KEY } from './events-catalog';
import { resolveEventConfig, insertUserNotification, getNotificationSettingsByOrg } from './service';

// ─── Template rendering ───────────────────────────────────────────────────────

/**
 * Replace {{var}} placeholders with values from `vars`. If a placeholder has
 * no matching value (or its value is null/undefined/empty), it is REMOVED
 * from the output instead of being left literal, so end users never see
 * raw {{key}} fragments in their notifications.
 *
 * The function also trims double-spaces and stray "  ,  " that may result
 * from missing variables embedded mid-sentence.
 */
function renderTemplate(template: string, vars: Partial<Record<VariableKey, string>>): string {
  const missing: string[] = [];
  const replaced = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const raw = vars[key as VariableKey];
    if (raw === undefined || raw === null || raw === '') {
      missing.push(key);
      return '';
    }
    return String(raw);
  });
  if (missing.length > 0) {
    console.warn(
      `[notifications] Missing template variables in render: ${Array.from(new Set(missing)).join(', ')}`,
    );
  }
  // Clean up artefacts caused by removed variables.
  return replaced
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
}

// ─── Email sender (reuses existing outbound config logic) ─────────────────────

async function fetchOutboundConfig(client: PoolClient, organizationId: string) {
  const { rows } = await client.query<{
    enabled: boolean;
    provider: string;
    from_name: string;
    from_email: string;
    reply_to: string;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_secure: boolean;
    api_key: string;
  }>(
    `SELECT enabled, provider, from_name, from_email, reply_to,
            smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, api_key
     FROM app_admin.outbound_email_configs
     WHERE organization_id = $1
     ORDER BY enabled DESC, updated_at DESC LIMIT 1`,
    [organizationId],
  );
  return rows[0] ?? null;
}

async function fetchBranding(client: PoolClient, organizationId: string) {
  const { rows } = await client.query<{
    platform_name: string;
    logo_url: string | null;
    logo_dark_url: string | null;
    primary_color: string | null;
    accent_color: string | null;
    typography: string | null;
  }>(
    `SELECT platform_name, logo_url, logo_dark_url, primary_color, accent_color, typography
     FROM app_admin.branding_settings
     WHERE organization_id = $1 LIMIT 1`,
    [organizationId],
  );
  return {
    platformName: rows[0]?.platform_name ?? '4Shine',
    logoUrl: rows[0]?.logo_url ?? null,
    logoDarkUrl: rows[0]?.logo_dark_url ?? null,
    primaryColor: rows[0]?.primary_color ?? null,
    accentColor: rows[0]?.accent_color ?? null,
    typography: rows[0]?.typography ?? null,
  };
}

async function fetchEmailBranding(client: PoolClient, organizationId: string) {
  const [base, settings] = await Promise.all([
    fetchBranding(client, organizationId),
    getNotificationSettingsByOrg(client, organizationId),
  ]);
  // Branding del email tomado directamente de app_admin.branding_settings:
  // primary_color → header, accent_color → botones pill, typography → font-family.
  // logo_dark_url se prefiere sobre logo_url para garantizar contraste.
  return {
    platformName: settings.varPlatformName || base.platformName,
    logoUrl: base.logoUrl,
    logoDarkUrl: base.logoDarkUrl,
    primaryColor: base.primaryColor,
    accentColor: base.accentColor,
    typography: base.typography,
    headerBg: settings.emailHeaderBg || undefined,
    footerTagline: settings.emailFooterTagline || undefined,
    footerSupport: settings.emailFooterSupport || undefined,
    footerLegal: settings.emailFooterLegal || undefined,
  };
}

/** Devuelve el messageId del proveedor (para correlacionar webhooks), o null si no aplica. */
async function sendTemplateEmail(
  config: Awaited<ReturnType<typeof fetchOutboundConfig>>,
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo?: string,
  extraHeaders?: Record<string, string>,
): Promise<string | null> {
  if (!config || !config.enabled) return null;

  const fromEmail = config.from_email.trim();
  const fromName = config.from_name.trim();
  const from = fromName ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>` : fromEmail;

  if (config.provider === 'sendgrid') {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.api_key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName || undefined },
        personalizations: [{ to: [{ email: to }] }],
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
        ...(extraHeaders ? { headers: extraHeaders } : {}),
      }),
    });
    return res.headers.get('x-message-id');
  }

  if (config.provider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.api_key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(extraHeaders ? { headers: extraHeaders } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return typeof body?.id === 'string' ? body.id : null;
  }

  // SMTP fallback (incluye AWS SES SMTP). Delegamos en smtpSend que:
  //  - Aplica header X-SES-CONFIGURATION-SET cuando corresponde.
  //  - Parsea el SES Message-ID real de result.response.
  //  - Loggea diagnóstico estructurado.
  // Mantener este path delgado es crítico: hay 4 sitios en el monorepo que
  // antes duplicaban este código, varios sin los fixes. Hoy todos pasan por
  // src/lib/smtp-send.ts y el comportamiento es consistente.
  const { smtpSend } = await import('@/lib/smtp-send');
  const result = await smtpSend(config, {
    from,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(extraHeaders ? { headers: extraHeaders } : {}),
  });
  return result.providerMessageId;
}

// ─── Main dispatch function ───────────────────────────────────────────────────

export async function dispatchNotification(
  client: PoolClient,
  ctx: DispatchContext,
): Promise<void> {
  const eventDef = EVENTS_BY_KEY[ctx.eventKey];
  if (!eventDef) {
    // Eventos personalizados (definidos en BD por el admin) no están en el
    // catálogo de código; se permiten si existen para la organización.
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM app_admin.notification_events
         WHERE organization_id = $1::uuid AND event_key = $2
       ) AS exists`,
      [ctx.organizationId, ctx.eventKey],
    );
    if (!rows[0]?.exists) return;
  }

  const resolved = await resolveEventConfig(client, ctx.organizationId, ctx.eventKey);
  if (!resolved.isEnabled || !resolved.template) return;

  const tmpl = resolved.template;

  // Merge global variable defaults with dispatch-provided vars (dispatch vars win)
  const globalSettings = await getNotificationSettingsByOrg(client, ctx.organizationId);
  const vars: Partial<Record<VariableKey, string>> = {
    ...(globalSettings.varPlatformName ? { plataforma: globalSettings.varPlatformName } : {}),
    ...(globalSettings.varPlatformUrl ? { enlace_plataforma: globalSettings.varPlatformUrl } : {}),
    ...ctx.variables,
  };

  // ── In-app notification ──────────────────────────────────────────────────
  if (
    resolved.channelInApp &&
    tmpl.channelInApp &&
    tmpl.inAppTitleTemplate &&
    ctx.recipientUserId
  ) {
    const title = renderTemplate(tmpl.inAppTitleTemplate, vars);
    const body = renderTemplate(tmpl.inAppBodyTemplate, vars);
    const actionUrl = tmpl.inAppActionUrlTemplate
      ? renderTemplate(tmpl.inAppActionUrlTemplate, vars)
      : undefined;

    await insertUserNotification(client, {
      organizationId: ctx.organizationId,
      userId: ctx.recipientUserId,
      type: tmpl.inAppType,
      title,
      message: body,
      eventKey: ctx.eventKey,
      actionUrl,
    });
  }

  // ── Email notification ───────────────────────────────────────────────────
  if (resolved.channelEmail && tmpl.channelEmail && tmpl.subjectTemplate && ctx.recipientEmail) {
    const subject = renderTemplate(tmpl.subjectTemplate, vars);
    const bodyHtml = renderTemplate(tmpl.bodyHtmlTemplate, vars);
    const bodyText = renderTemplate(tmpl.bodyTextTemplate, vars);
    const actionUrl = tmpl.inAppActionUrlTemplate
      ? renderTemplate(tmpl.inAppActionUrlTemplate, vars)
      : undefined;

    const [emailConfig, branding] = await Promise.all([
      fetchOutboundConfig(client, ctx.organizationId),
      fetchEmailBranding(client, ctx.organizationId),
    ]);

    const fullHtml = buildBrandedEmailHtml(bodyHtml, branding);
    const providerMessageId = await sendTemplateEmail(
      emailConfig,
      ctx.recipientEmail,
      subject,
      fullHtml,
      bodyText,
      emailConfig?.reply_to?.trim() || undefined,
    );

    // Registra el envío en app_core.notifications para que aparezca en el
    // historial. Try/catch porque un fallo de registro no debe abortar el
    // envío exitoso del correo.
    try {
      await insertUserNotification(client, {
        organizationId: ctx.organizationId,
        userId: ctx.recipientUserId ?? null,
        type: tmpl.inAppType,
        title: subject,
        message: bodyText || subject,
        eventKey: ctx.eventKey,
        actionUrl,
        payload: {
          channel: 'email',
          html_snapshot: fullHtml,
          text_snapshot: bodyText,
          is_external: !ctx.recipientUserId,
        },
        channel: 'email',
        recipientEmail: ctx.recipientEmail,
        providerMessageId,
        deliveredAt: null,
      });
    } catch (err) {
      console.error('[engine] no se pudo registrar email en historial:', err);
    }
  }
}

// ─── Convenience: dispatch an in-app notification to a single user ───────────
// Resolves the organization from actorUserId and never throws — a notification
// failure must not break the operation that triggered it. The email channel is
// skipped (recipientEmail empty) since modules send their own transactional
// emails; this only creates the in-app notification row.
export async function notifyUser(
  client: PoolClient,
  params: {
    actorUserId: string;
    recipientUserId: string;
    eventKey: string;
    variables?: Partial<Record<VariableKey, string>>;
  },
): Promise<void> {
  try {
    const { rows } = await client.query<{ organization_id: string }>(
      `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
      [params.actorUserId],
    );
    const organizationId = rows[0]?.organization_id;
    if (!organizationId) return;
    await dispatchNotification(client, {
      organizationId,
      recipientUserId: params.recipientUserId,
      recipientEmail: '',
      eventKey: params.eventKey,
      variables: params.variables ?? {},
    });
  } catch (err) {
    console.error('[notify] dispatch failed:', err);
  }
}

// ─── Convenience: dispatch in-app + email to a single user ───────────────────
// Resolves recipient email and organization from the recipient userId. Used by
// modules that DO want the configurable email path (not just in-app).
// Never throws — failure must not break the calling operation.
export async function notifyUserFull(
  client: PoolClient,
  params: {
    recipientUserId: string;
    eventKey: string;
    variables?: Partial<Record<VariableKey, string>>;
  },
): Promise<void> {
  try {
    const { rows } = await client.query<{ organization_id: string; email: string | null }>(
      `SELECT organization_id::text, email::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
      [params.recipientUserId],
    );
    const row = rows[0];
    if (!row?.organization_id) return;
    await dispatchNotification(client, {
      organizationId: row.organization_id,
      recipientUserId: params.recipientUserId,
      recipientEmail: row.email ?? '',
      eventKey: params.eventKey,
      variables: params.variables ?? {},
    });
  } catch (err) {
    console.error('[notify] full dispatch failed:', err);
  }
}

// ─── Direct email sender (uses sample vars, no dispatch context needed) ─────
// Por defecto registra el envío en app_core.notifications para que aparezca
// en el historial. El test-send de plantillas pasa record:false para evitar
// contaminar el historial con pruebas.

export async function sendEmailToAddress(
  client: PoolClient,
  organizationId: string,
  toEmail: string,
  subject: string,
  bodyHtml: string,
  bodyText: string,
  options: {
    record?: boolean;
    eventKey?: string;
    recipientUserId?: string | null;
    senderUserId?: string | null;
    actionUrl?: string;
    /** Agrega cabecera List-Unsubscribe (solo para envíos masivos). */
    listUnsubscribe?: boolean;
  } = {},
): Promise<string | null> {
  const [emailConfig, branding] = await Promise.all([
    fetchOutboundConfig(client, organizationId),
    fetchEmailBranding(client, organizationId),
  ]);
  // List-Unsubscribe (RFC 2369) solo en envíos masivos: mejora la entregabilidad
  // y la señal de confianza con Yahoo/Gmail. Apunta al reply_to (o al from) para
  // que las bajas lleguen a un buzón monitoreado. NO se aplica a correos
  // transaccionales/de seguridad (reset de contraseña, verificación).
  const unsubscribeTarget =
    emailConfig?.reply_to?.trim() || emailConfig?.from_email?.trim() || '';
  const extraHeaders =
    options.listUnsubscribe && unsubscribeTarget
      ? {
          'List-Unsubscribe': `<mailto:${unsubscribeTarget}?subject=Baja%20de%20notificaciones>`,
        }
      : undefined;
  const fullHtml = buildBrandedEmailHtml(bodyHtml, branding);
  const providerMessageId = await sendTemplateEmail(
    emailConfig,
    toEmail,
    subject,
    fullHtml,
    bodyText,
    emailConfig?.reply_to?.trim() || undefined,
    extraHeaders,
  );

  const shouldRecord = options.record !== false;
  if (shouldRecord) {
    try {
      await insertUserNotification(client, {
        organizationId,
        userId: options.recipientUserId ?? null,
        type: 'info',
        title: subject,
        message: bodyText || subject,
        eventKey: options.eventKey ?? 'manual.direct_email',
        actionUrl: options.actionUrl,
        payload: {
          channel: 'email',
          html_snapshot: fullHtml,
          text_snapshot: bodyText,
          is_external: !options.recipientUserId,
        },
        senderUserId: options.senderUserId ?? null,
        channel: 'email',
        recipientEmail: toEmail,
        providerMessageId,
        deliveredAt: null,
      });
    } catch (err) {
      console.error('[engine] no se pudo registrar email directo en historial:', err);
    }
  }

  return providerMessageId;
}

// ─── Preview rendering (no DB side-effects) ───────────────────────────────────

export function renderTemplatePreview(
  subject: string,
  bodyHtml: string,
  bodyText: string,
  inAppTitle: string,
  inAppBody: string,
  vars: Partial<Record<VariableKey, string>>,
) {
  return {
    subject: renderTemplate(subject, vars),
    bodyHtml: renderTemplate(bodyHtml, vars),
    bodyText: renderTemplate(bodyText, vars),
    inAppTitle: renderTemplate(inAppTitle, vars),
    inAppBody: renderTemplate(inAppBody, vars),
  };
}
