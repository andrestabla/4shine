import nodemailer from 'nodemailer';
import type { PoolClient } from 'pg';
import { buildBrandedEmailHtml } from '@/lib/email-template';
import type { AuthUser } from '@/server/auth/types';
import type { GroupSessionEventRecord, MentorshipRecord } from './service';

interface OutboundConfigRow {
  organization_id: string;
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
}

interface OutboundEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

function hasUsableEmail(value: string): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function buildFromHeader(config: OutboundConfigRow): string {
  const fromEmail = config.from_email.trim();
  const fromName = config.from_name.trim();
  if (!fromName) return fromEmail;
  return `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`;
}

async function resolveOutboundConfig(
  client: PoolClient,
  organizationId: string,
): Promise<OutboundConfigRow | null> {
  const { rows } = await client.query<OutboundConfigRow>(
    `SELECT organization_id::text, enabled, provider, from_name, from_email, reply_to,
            smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, api_key
     FROM app_admin.outbound_email_configs
     WHERE organization_id = $1
     ORDER BY enabled DESC, updated_at DESC
     LIMIT 1`,
    [organizationId],
  );
  if (rows[0] && hasUsableEmail(rows[0].from_email)) return rows[0];

  const { rows: fallback } = await client.query<OutboundConfigRow>(
    `SELECT organization_id::text, enabled, provider, from_name, from_email, reply_to,
            smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, api_key
     FROM app_admin.outbound_email_configs
     ORDER BY enabled DESC, updated_at DESC
     LIMIT 1`,
  );
  return fallback[0] && hasUsableEmail(fallback[0].from_email) ? fallback[0] : null;
}

async function sendEmail(config: OutboundConfigRow, payload: OutboundEmailPayload): Promise<void> {
  if (config.provider === 'sendgrid') {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.api_key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { email: config.from_email.trim(), name: config.from_name.trim() || undefined },
        personalizations: [{ to: [{ email: payload.to }] }],
        subject: payload.subject,
        content: [{ type: 'text/plain', value: payload.text }, { type: 'text/html', value: payload.html }],
        ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {}),
      }),
    });
    return;
  }

  if (config.provider === 'resend') {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.api_key.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: buildFromHeader(config),
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });
    return;
  }

  const smtpPort = Number(config.smtp_port);
  const secure = smtpPort === 465 ? true : config.smtp_secure && smtpPort !== 587;
  const transporter = nodemailer.createTransport({
    host: config.smtp_host.trim(),
    port: smtpPort,
    secure,
    requireTLS: smtpPort === 587 || !secure,
    auth: { user: config.smtp_user.trim(), pass: config.smtp_password.trim() },
  });
  await transporter.sendMail({
    from: buildFromHeader(config),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: payload.replyTo,
  });
}

export async function sendGroupSessionJoinedEmail(
  client: PoolClient,
  actor: AuthUser,
  event: GroupSessionEventRecord,
): Promise<void> {
  const { rows: userRows } = await client.query<{
    email: string;
    display_name: string;
    organization_id: string;
  }>(
    `SELECT email::text, display_name, organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [actor.userId],
  );
  const user = userRows[0];
  if (!user) return;

  const config = await resolveOutboundConfig(client, user.organization_id);
  if (!config) return;

  const { rows: brandingRows } = await client.query<{ platform_name: string; logo_url: string | null }>(
    `SELECT platform_name, logo_url FROM app_admin.branding_settings
     WHERE organization_id = $1 LIMIT 1`,
    [user.organization_id],
  );
  const branding = {
    platformName: brandingRows[0]?.platform_name || '4Shine',
    logoUrl: brandingRows[0]?.logo_url ?? null,
  };

  const firstName = user.display_name.split(' ')[0] || 'Líder';
  const platformName = branding.platformName;
  const sessionDate = new Date(event.startsAt).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://www.4shine.co').replace(/\/$/, '');
  const icsUrl = `${appUrl}/api/v1/modules/mentorias/group-sessions/${event.eventId}/ics`;

  const gcalStart = new Date(event.startsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const gcalEnd = new Date(event.endsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${gcalStart}/${gcalEnd}${event.zoomJoinUrl ? `&location=${encodeURIComponent(event.zoomJoinUrl)}` : ''}`;

  const calendarSection = `
    <p style="margin:16px 0 8px;font-size:13px;color:#64748b;">Agregar a tu calendario:</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:8px;">
        <a href="${gcalUrl}" style="display:inline-block;background-color:#ffffff;color:#334155;font-weight:600;font-size:13px;padding:8px 16px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Google Calendar</a>
      </td>
      <td>
        <a href="${icsUrl}" style="display:inline-block;background-color:#ffffff;color:#334155;font-weight:600;font-size:13px;padding:8px 16px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Apple / Outlook (.ics)</a>
      </td>
    </tr></table>`;

  const zoomSection = event.zoomJoinUrl
    ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;">Tu enlace de acceso a la sesión:</p>
       <a href="${event.zoomJoinUrl}" style="display:inline-block;background-color:#2D8CFF;color:#ffffff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">Unirse a Zoom</a>${calendarSection}`
    : `<p style="margin:0;font-size:14px;color:#64748b;">El enlace de conexión estará disponible pronto.</p>${calendarSection}`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
      Tu participación en la sesión grupal ha sido confirmada.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Sesión</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">${event.title}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Fecha y hora</p>
          <p style="margin:0;font-size:15px;color:#1e293b;">${sessionDate}</p>
        </td>
      </tr>
    </table>
    <div style="margin-bottom:24px;">${zoomSection}</div>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Recibirás un recordatorio antes de que inicie la sesión. Puedes ver tus sesiones en la plataforma de ${platformName}.
    </p>
  `;

  const textBody = [
    `Hola ${firstName},`,
    '',
    `Tu participación en "${event.title}" ha sido confirmada.`,
    `Fecha: ${sessionDate}`,
    '',
    event.zoomJoinUrl ? `Enlace Zoom: ${event.zoomJoinUrl}` : 'El enlace de conexión estará disponible pronto.',
    '',
    `Accede a la plataforma de ${platformName} para más detalles.`,
  ].join('\n');

  await sendEmail(config, {
    to: user.email,
    subject: `${platformName} · Participación confirmada: ${event.title}`,
    text: textBody,
    html: buildBrandedEmailHtml(bodyHtml, branding),
    replyTo: config.reply_to.trim() || undefined,
  });
}

export async function sendMentorshipScheduledEmail(
  client: PoolClient,
  actor: AuthUser,
  session: MentorshipRecord,
): Promise<void> {
  const { rows: userRows } = await client.query<{
    user_id: string;
    email: string;
    display_name: string;
    organization_id: string;
  }>(
    `SELECT user_id::text, email::text, display_name, organization_id::text
     FROM app_core.users
     WHERE user_id = ANY($1::uuid[])`,
    [[actor.userId, session.mentorUserId]],
  );
  const lider = userRows.find((u) => u.user_id === actor.userId);
  const adviser = userRows.find((u) => u.user_id === session.mentorUserId);
  if (!lider) return;

  const config = await resolveOutboundConfig(client, lider.organization_id);
  if (!config) return;

  const { rows: brandingRows } = await client.query<{ platform_name: string; logo_url: string | null }>(
    `SELECT platform_name, logo_url FROM app_admin.branding_settings
     WHERE organization_id = $1 LIMIT 1`,
    [lider.organization_id],
  );
  const branding = {
    platformName: brandingRows[0]?.platform_name || '4Shine',
    logoUrl: brandingRows[0]?.logo_url ?? null,
  };

  const platformName = branding.platformName;
  const sessionDate = new Date(session.startsAt).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const gcalStart = new Date(session.startsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const gcalEnd = new Date(session.endsAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&dates=${gcalStart}/${gcalEnd}${session.meetingUrl ? `&location=${encodeURIComponent(session.meetingUrl)}` : ''}`;

  const calendarSection = `
    <p style="margin:16px 0 8px;font-size:13px;color:#64748b;">Agregar a tu calendario:</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:8px;">
        <a href="${gcalUrl}" style="display:inline-block;background-color:#ffffff;color:#334155;font-weight:600;font-size:13px;padding:8px 16px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Google Calendar</a>
      </td>
    </tr></table>`;

  const meetingSection = session.meetingUrl
    ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;">Tu enlace de acceso:</p>
       <a href="${session.meetingUrl}" style="display:inline-block;background-color:#2D8CFF;color:#ffffff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">Unirse a la sesión</a>${calendarSection}`
    : `<p style="margin:0;font-size:14px;color:#64748b;">El enlace de conexión estará disponible pronto.</p>${calendarSection}`;

  function buildSessionDetailsTable(counterpartLabel: string, counterpartName: string) {
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Sesión</p>
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">${session.title}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${counterpartLabel}</p>
          <p style="margin:0 0 12px;font-size:15px;color:#1e293b;">${counterpartName}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Fecha y hora</p>
          <p style="margin:0;font-size:15px;color:#1e293b;">${sessionDate}</p>
        </td>
      </tr>
    </table>`;
  }

  // Email to lider
  const liderFirstName = lider.display_name.split(' ')[0] || 'Líder';
  const liderHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${liderFirstName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
      Tu mentoría ha sido agendada exitosamente.
    </p>
    ${buildSessionDetailsTable('Adviser', session.mentorName)}
    <div style="margin-bottom:24px;">${meetingSection}</div>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Puedes ver y gestionar tus mentorías en la plataforma de ${platformName}.
    </p>
  `;
  const liderText = [
    `Hola ${liderFirstName},`,
    '',
    `Tu mentoría "${session.title}" ha sido agendada.`,
    `Adviser: ${session.mentorName}`,
    `Fecha: ${sessionDate}`,
    '',
    session.meetingUrl ? `Enlace de sesión: ${session.meetingUrl}` : 'El enlace de conexión estará disponible pronto.',
    '',
    `Accede a la plataforma de ${platformName} para más detalles.`,
  ].join('\n');

  await sendEmail(config, {
    to: lider.email,
    subject: `${platformName} · Mentoría agendada: ${session.title}`,
    text: liderText,
    html: buildBrandedEmailHtml(liderHtml, branding),
    replyTo: config.reply_to.trim() || undefined,
  });

  // Email to adviser
  if (adviser && hasUsableEmail(adviser.email)) {
    const adviserFirstName = adviser.display_name.split(' ')[0] || 'Adviser';
    const liderName = lider.display_name || 'un líder';
    const adviserHtml = `
      <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${adviserFirstName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
        Tienes una nueva mentoría agendada.
      </p>
      ${buildSessionDetailsTable('Líder', liderName)}
      <div style="margin-bottom:24px;">${meetingSection}</div>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        Puedes ver y gestionar tus mentorías en la plataforma de ${platformName}.
      </p>
    `;
    const adviserText = [
      `Hola ${adviserFirstName},`,
      '',
      `Tienes una nueva mentoría "${session.title}" agendada con ${liderName}.`,
      `Fecha: ${sessionDate}`,
      '',
      session.meetingUrl ? `Enlace de sesión: ${session.meetingUrl}` : 'El enlace de conexión estará disponible pronto.',
      '',
      `Accede a la plataforma de ${platformName} para más detalles.`,
    ].join('\n');

    await sendEmail(config, {
      to: adviser.email,
      subject: `${platformName} · Nueva mentoría agendada: ${session.title}`,
      text: adviserText,
      html: buildBrandedEmailHtml(adviserHtml, branding),
      replyTo: config.reply_to.trim() || undefined,
    });
  }
}

export async function sendMentorshipCancelledEmail(
  client: PoolClient,
  actor: AuthUser,
  session: MentorshipRecord,
  details: { reason: string; proposedStartsAt: string | null },
): Promise<void> {
  // Find the lider (mentee) — they need to be notified
  const menteeId = session.menteeUserId;
  if (!menteeId) return;

  const { rows: userRows } = await client.query<{
    email: string;
    display_name: string;
    organization_id: string;
  }>(
    `SELECT email::text, display_name, organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [menteeId],
  );
  const lider = userRows[0];
  if (!lider || !hasUsableEmail(lider.email)) return;

  const config = await resolveOutboundConfig(client, lider.organization_id);
  if (!config) return;

  const { rows: brandingRows } = await client.query<{ platform_name: string; logo_url: string | null }>(
    `SELECT platform_name, logo_url FROM app_admin.branding_settings WHERE organization_id = $1 LIMIT 1`,
    [lider.organization_id],
  );
  const branding = {
    platformName: brandingRows[0]?.platform_name || '4Shine',
    logoUrl: brandingRows[0]?.logo_url ?? null,
  };

  const firstName = lider.display_name.split(' ')[0] || 'Líder';
  const platformName = branding.platformName;
  const originalDate = new Date(session.startsAt).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });

  const proposedSection = details.proposedStartsAt
    ? (() => {
        const proposed = new Date(details.proposedStartsAt).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
        return `
          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background-color:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #bbf7d0;">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Nuevo horario propuesto</p>
                <p style="margin:0;font-size:15px;color:#15803d;font-weight:600;">${proposed}</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 20px;font-size:14px;color:#334155;">
            Para confirmar el nuevo horario, accede a la plataforma y agenda tu sesión en el tiempo propuesto.
          </p>`;
      })()
    : `<p style="margin:0 0 20px;font-size:14px;color:#334155;">
         El Adviser te contactará pronto para coordinar una nueva fecha.
       </p>`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
      Tu sesión ha sido cancelada por el Adviser. A continuación encontrarás los detalles y el nuevo horario propuesto.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#fff1f2;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #fecdd3;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9f1239;text-transform:uppercase;letter-spacing:0.5px;">Sesión cancelada</p>
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a;">${session.title}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#9f1239;text-transform:uppercase;letter-spacing:0.5px;">Fecha original</p>
          <p style="margin:0 0 12px;font-size:14px;color:#1e293b;">${originalDate}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#9f1239;text-transform:uppercase;letter-spacing:0.5px;">Motivo</p>
          <p style="margin:0;font-size:14px;color:#1e293b;">${details.reason || 'No especificado'}</p>
        </td>
      </tr>
    </table>
    ${proposedSection}
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Puedes gestionar tus mentorías en la plataforma de ${platformName}.
    </p>
  `;

  const textBody = [
    `Hola ${firstName},`,
    '',
    `Tu sesión "${session.title}" del ${originalDate} ha sido cancelada.`,
    `Motivo: ${details.reason || 'No especificado'}`,
    '',
    details.proposedStartsAt
      ? `Nuevo horario propuesto: ${new Date(details.proposedStartsAt).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}`
      : 'El Adviser te contactará para coordinar una nueva fecha.',
    '',
    `Accede a la plataforma de ${platformName} para más detalles.`,
  ].join('\n');

  await sendEmail(config, {
    to: lider.email,
    subject: `${platformName} · Mentoría cancelada: ${session.title}`,
    text: textBody,
    html: buildBrandedEmailHtml(bodyHtml, branding),
    replyTo: config.reply_to.trim() || undefined,
  });
}
