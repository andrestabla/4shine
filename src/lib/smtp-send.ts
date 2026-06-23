/**
 * Helper compartido para envío SMTP con tracking SES.
 *
 * CRÍTICO: este es el ÚNICO punto donde se debe construir un transporter
 * + sendMail. Los 4 paths de envío (descubrimiento, usuarios, admin,
 * notificaciones/engine) deben pasar por aquí para garantizar:
 *
 * 1. Header X-SES-CONFIGURATION-SET → habilita event publishing de SES.
 * 2. Parse de result.response → extrae el SES Message-ID real, único ID
 *    que SES usa para reportar Delivery / Open / Bounce eventos.
 *
 * Sin (1) SES no manda eventos. Sin (2) los eventos llegan pero el
 * webhook no encuentra match. Cualquier código que arme su propio
 * transporter rompe el tracking — siempre usar este helper.
 */

import nodemailer from 'nodemailer';

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: number | string;
  smtp_user: string;
  smtp_password: string;
  smtp_secure?: boolean;
  provider?: string | null;
}

export interface SmtpPayload {
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  /** Cabeceras extra (p. ej. List-Unsubscribe en envíos masivos). */
  headers?: Record<string, string>;
}

export interface SmtpSendResult {
  /**
   * Para SES: el Message-ID real de SES (parseado de result.response).
   * Es el ID que viaja en mail.messageId del JSON de eventos publicado al SNS.
   * Para otros providers: el header Message-ID normalizado.
   */
  providerMessageId: string | null;
  /** True si el envío fue por SES SMTP (detectado por host o provider). */
  isSesSmtp: boolean;
  /** True si se agregó el header X-SES-CONFIGURATION-SET. */
  configurationSetApplied: boolean;
}

export async function smtpSend(
  config: SmtpConfig,
  payload: SmtpPayload,
): Promise<SmtpSendResult> {
  const smtpPort = Number(config.smtp_port);
  if (!Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new Error('SMTP configuration is incomplete (port)');
  }
  const smtpHost = config.smtp_host.trim();
  const smtpUser = config.smtp_user.trim();
  const smtpPassword = config.smtp_password.trim();
  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('SMTP configuration is incomplete');
  }

  const secure = smtpPort === 465 ? true : (config.smtp_secure ?? false) && smtpPort !== 587;
  const requireTLS = smtpPort === 587 || !secure;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    auth: { user: smtpUser, pass: smtpPassword },
  });

  // Detección SES por provider explícito o por host SMTP regional.
  const isSesSmtp =
    config.provider === 'ses' ||
    /email-smtp\.[a-z0-9-]+\.amazonaws\.com$/i.test(smtpHost);

  const configurationSet = process.env.AWS_SES_CONFIGURATION_SET?.trim();
  const configurationSetApplied = Boolean(isSesSmtp && configurationSet);
  // Mezcla las cabeceras del caller (p. ej. List-Unsubscribe en envíos masivos)
  // con la cabecera de tracking de SES.
  const headers: Record<string, string> = {
    ...(payload.headers ?? {}),
    ...(configurationSetApplied
      ? { 'X-SES-CONFIGURATION-SET': configurationSet as string }
      : {}),
  };
  const hasHeaders = Object.keys(headers).length > 0;

  const result = await transporter.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    ...(hasHeaders ? { headers } : {}),
  });

  // Parse del SES Message-ID desde el SMTP response.
  // Formato típico: "250 2.0.0 Ok 0100019eaec8b171-e3166ee7-..."
  let providerMessageId: string | null = null;
  if (isSesSmtp && typeof result.response === 'string') {
    const matches = Array.from(
      result.response.matchAll(/\bOk\b[\s:]+([0-9a-f][\w-]{30,})/gi),
    );
    const last = matches[matches.length - 1];
    if (last?.[1]) providerMessageId = last[1].trim();
  }
  // Fallback: header Message-ID (UUID local en SES o id de otro provider).
  if (!providerMessageId && typeof result.messageId === 'string') {
    providerMessageId =
      result.messageId.replace(/^<|>$/g, '').split('@')[0] ?? result.messageId;
  }

  console.log(
    '[smtp-send] sendMail OK',
    JSON.stringify({
      isSesSmtp,
      configurationSetApplied,
      to: payload.to,
      response:
        typeof result.response === 'string' ? result.response.substring(0, 160) : null,
      headerMessageIdRaw: result.messageId ?? null,
      providerMessageId,
    }),
  );

  if (configurationSetApplied && !providerMessageId) {
    console.warn(
      '[smtp-send] SES: regex no matcheó. Response capturado arriba. Revisa el formato y ajusta el regex.',
    );
  }

  return {
    providerMessageId,
    isSesSmtp,
    configurationSetApplied: Boolean(headers),
  };
}
