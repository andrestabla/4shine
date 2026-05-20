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

function renderTemplate(template: string, vars: Partial<Record<VariableKey, string>>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key as VariableKey] ?? `{{${key}}}`);
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
  const { rows } = await client.query<{ platform_name: string; logo_url: string | null }>(
    `SELECT platform_name, logo_url FROM app_admin.branding_settings
     WHERE organization_id = $1 LIMIT 1`,
    [organizationId],
  );
  return { platformName: rows[0]?.platform_name ?? '4Shine', logoUrl: rows[0]?.logo_url ?? null };
}

async function fetchEmailBranding(client: PoolClient, organizationId: string) {
  const [base, settings] = await Promise.all([
    fetchBranding(client, organizationId),
    getNotificationSettingsByOrg(client, organizationId),
  ]);
  return {
    platformName: settings.varPlatformName || base.platformName,
    logoUrl: base.logoUrl,
    headerBg: settings.emailHeaderBg || undefined,
    footerTagline: settings.emailFooterTagline || undefined,
    footerSupport: settings.emailFooterSupport || undefined,
    footerLegal: settings.emailFooterLegal || undefined,
  };
}

async function sendTemplateEmail(
  config: Awaited<ReturnType<typeof fetchOutboundConfig>>,
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo?: string,
): Promise<void> {
  if (!config || !config.enabled) return;

  const fromEmail = config.from_email.trim();
  const fromName = config.from_name.trim();
  const from = fromName ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>` : fromEmail;

  if (config.provider === 'sendgrid') {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
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
      }),
    });
    return;
  }

  if (config.provider === 'resend') {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.api_key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return;
  }

  // SMTP fallback
  const { default: nodemailer } = await import('nodemailer');
  const smtpPort = Number(config.smtp_port);
  const secure = smtpPort === 465 ? true : config.smtp_secure && smtpPort !== 587;
  const transporter = nodemailer.createTransport({
    host: config.smtp_host.trim(),
    port: smtpPort,
    secure,
    requireTLS: smtpPort === 587 || !secure,
    auth: { user: config.smtp_user.trim(), pass: config.smtp_password.trim() },
  });
  await transporter.sendMail({ from, to, subject, text, html, replyTo });
}

// ─── Main dispatch function ───────────────────────────────────────────────────

export async function dispatchNotification(
  client: PoolClient,
  ctx: DispatchContext,
): Promise<void> {
  const eventDef = EVENTS_BY_KEY[ctx.eventKey];
  if (!eventDef) return;

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
  if (resolved.channelInApp && tmpl.channelInApp && tmpl.inAppTitleTemplate) {
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

    const [emailConfig, branding] = await Promise.all([
      fetchOutboundConfig(client, ctx.organizationId),
      fetchEmailBranding(client, ctx.organizationId),
    ]);

    const fullHtml = buildBrandedEmailHtml(bodyHtml, branding);
    await sendTemplateEmail(
      emailConfig,
      ctx.recipientEmail,
      subject,
      fullHtml,
      bodyText,
      emailConfig?.reply_to?.trim() || undefined,
    );
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

// ─── Test email sender (uses sample vars, no dispatch context needed) ─────────

export async function sendEmailToAddress(
  client: PoolClient,
  organizationId: string,
  toEmail: string,
  subject: string,
  bodyHtml: string,
  bodyText: string,
): Promise<void> {
  const [emailConfig, branding] = await Promise.all([
    fetchOutboundConfig(client, organizationId),
    fetchEmailBranding(client, organizationId),
  ]);
  const fullHtml = buildBrandedEmailHtml(bodyHtml, branding);
  await sendTemplateEmail(
    emailConfig,
    toEmail,
    subject,
    fullHtml,
    bodyText,
    emailConfig?.reply_to?.trim() || undefined,
  );
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
