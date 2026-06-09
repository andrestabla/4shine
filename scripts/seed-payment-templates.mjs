/**
 * Seed templates for payment notifications:
 *   - mentorias.payment_confirmed (líder recibe confirmación de pago)
 *   - mentorias.payment_refunded   (líder recibe aviso de reembolso)
 *
 * Idempotente: si la plantilla ya existe (mismo nombre + event_key + org),
 * actualiza el contenido en vez de duplicar.
 */

import pg from 'pg';

const { Pool } = pg;
const ORG_ID = '7aaf257c-64eb-4ec1-b91e-675137a332c6';
const MODULE_CODE = 'mentorias';

const PAYMENT_CONFIRMED = {
  eventKey: 'mentorias.payment_confirmed',
  templateName: 'Pago confirmado — Mentoría adicional',
  description:
    'Email + in-app enviados al líder cuando el webhook del proveedor (Stripe / Wompi) confirma el pago de una sesión adicional.',
  subject: '✅ {{nombre}}, tu mentoría con {{adviser_nombre}} está pagada',
  bodyHtml: `
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>{{nombre}}</strong>,</p>

<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
  ¡Gracias por tu compra! Hemos confirmado el pago de tu sesión de mentoría con
  <strong>{{adviser_nombre}}</strong>.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;border-collapse:collapse;background:#f8fafc;border-radius:12px;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Detalle de la reserva</p>
      <p style="margin:0 0 4px;font-size:15px;color:#0f172a;font-weight:700;">{{titulo}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">📅 {{fecha}} · 🕒 {{hora}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">👤 Mentor: <strong>{{adviser_nombre}}</strong></p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">💳 Método: {{metodo_pago}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">💵 Monto: <strong>{{monto}}</strong></p>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;font-family:monospace;">Código de reserva: {{codigo_reserva}}</p>
    </td>
  </tr>
</table>

<p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
  Te enviaremos el enlace de la videollamada en cuanto se acerque la fecha. Mientras tanto puedes ver y gestionar tus sesiones desde tu panel:
</p>

<p style="margin:0 0 24px;text-align:center;">
  <a href="{{enlace_sesion}}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
    Ver mis mentorías
  </a>
</p>

<p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
  Si tienes dudas o necesitas reagendar, responde a este correo y te ayudamos.
</p>

<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
  Equipo {{plataforma}}
</p>
`.trim(),
  bodyText: `Hola {{nombre}},

¡Gracias por tu compra! Confirmamos el pago de tu sesión de mentoría con {{adviser_nombre}}.

Detalle de la reserva:
- Sesión: {{titulo}}
- Fecha: {{fecha}} a las {{hora}}
- Mentor: {{adviser_nombre}}
- Método de pago: {{metodo_pago}}
- Monto: {{monto}}
- Código de reserva: {{codigo_reserva}}

Te enviaremos el enlace de la videollamada en cuanto se acerque la fecha. Mientras tanto puedes ver y gestionar tus sesiones aquí:
{{enlace_sesion}}

Si tienes dudas, responde a este correo y te ayudamos.

Equipo {{plataforma}}`,
  inAppTitle: '✅ Pago confirmado: {{titulo}}',
  inAppBody:
    '{{nombre}}, recibimos tu pago de {{monto}} por la sesión con {{adviser_nombre}} ({{fecha}} a las {{hora}}).',
  inAppType: 'success',
  inAppActionUrl: '{{enlace_sesion}}',
};

const PAYMENT_REFUNDED = {
  eventKey: 'mentorias.payment_refunded',
  templateName: 'Reembolso procesado — Mentoría adicional',
  description:
    'Email + in-app enviados al líder cuando un administrador procesa el reembolso de una sesión adicional.',
  subject: '💸 {{nombre}}, procesamos el reembolso de tu mentoría',
  bodyHtml: `
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>{{nombre}}</strong>,</p>

<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
  Confirmamos que procesamos el reembolso de tu sesión de mentoría con
  <strong>{{adviser_nombre}}</strong>. La sesión asociada queda cancelada.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;border-collapse:collapse;background:#faf5ff;border-radius:12px;border:1px solid #e9d5ff;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 6px;font-size:12px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Detalle del reembolso</p>
      <p style="margin:0 0 4px;font-size:15px;color:#0f172a;font-weight:700;">{{titulo}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">👤 Mentor: {{adviser_nombre}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">💳 Método original: {{metodo_pago}}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">💵 Monto reembolsado: <strong>{{monto}}</strong></p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">📝 Motivo: {{motivo_reembolso}}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;font-family:monospace;">Código de reserva: {{codigo_reserva}}</p>
    </td>
  </tr>
</table>

<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
  Dependiendo del medio de pago original, el reembolso puede tardar entre 3 y 10 días hábiles en reflejarse en tu cuenta.
</p>

<p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
  Si tienes alguna duda sobre este movimiento, responde a este correo y te ayudamos.
</p>

<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
  Equipo {{plataforma}}
</p>
`.trim(),
  bodyText: `Hola {{nombre}},

Confirmamos el reembolso de tu sesión de mentoría con {{adviser_nombre}}. La sesión queda cancelada.

Detalle del reembolso:
- Sesión: {{titulo}}
- Mentor: {{adviser_nombre}}
- Método original: {{metodo_pago}}
- Monto reembolsado: {{monto}}
- Motivo: {{motivo_reembolso}}
- Código de reserva: {{codigo_reserva}}

El reembolso puede tardar entre 3 y 10 días hábiles en reflejarse en tu cuenta, dependiendo del medio de pago original.

Si tienes dudas, responde a este correo y te ayudamos.

Equipo {{plataforma}}`,
  inAppTitle: '💸 Reembolso procesado: {{titulo}}',
  inAppBody:
    '{{nombre}}, devolvimos {{monto}} de tu sesión con {{adviser_nombre}}. Motivo: {{motivo_reembolso}}',
  inAppType: 'info',
  inAppActionUrl: '',
};

async function upsertTemplate(pool, def) {
  // 1) Find existing template by (organization_id, event_key, name)
  const { rows: existing } = await pool.query(
    `SELECT template_id::text FROM app_admin.notification_templates
       WHERE organization_id = $1 AND event_key = $2 AND name = $3
       LIMIT 1`,
    [ORG_ID, def.eventKey, def.templateName],
  );

  let templateId;
  if (existing[0]) {
    templateId = existing[0].template_id;
    await pool.query(
      `UPDATE app_admin.notification_templates SET
         description = $2,
         module_code = $3,
         channel_email = true,
         channel_in_app = true,
         subject_template = $4,
         body_html_template = $5,
         body_text_template = $6,
         in_app_title_template = $7,
         in_app_body_template = $8,
         in_app_type = $9,
         in_app_action_url_template = $10,
         is_active = true,
         updated_at = now()
       WHERE template_id = $1`,
      [
        templateId,
        def.description,
        MODULE_CODE,
        def.subject,
        def.bodyHtml,
        def.bodyText,
        def.inAppTitle,
        def.inAppBody,
        def.inAppType,
        def.inAppActionUrl,
      ],
    );
    console.log(`  ✓ Updated template "${def.templateName}" (${templateId.slice(0, 8)}…)`);
  } else {
    const { rows: inserted } = await pool.query(
      `INSERT INTO app_admin.notification_templates
         (organization_id, name, description, event_key, module_code,
          channel_email, channel_in_app, subject_template, body_html_template, body_text_template,
          in_app_title_template, in_app_body_template, in_app_type, in_app_action_url_template,
          is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING template_id::text`,
      [
        ORG_ID,
        def.templateName,
        def.description,
        def.eventKey,
        MODULE_CODE,
        true,
        true,
        def.subject,
        def.bodyHtml,
        def.bodyText,
        def.inAppTitle,
        def.inAppBody,
        def.inAppType,
        def.inAppActionUrl,
        true,
      ],
    );
    templateId = inserted[0].template_id;
    console.log(`  ✓ Created template "${def.templateName}" (${templateId.slice(0, 8)}…)`);
  }

  // 2) Upsert event config (link template + enable)
  const { rows: cfg } = await pool.query(
    `INSERT INTO app_admin.notification_event_configs
       (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (organization_id, event_key) DO UPDATE SET
       module_code = EXCLUDED.module_code,
       template_id = EXCLUDED.template_id,
       channel_email = EXCLUDED.channel_email,
       channel_in_app = EXCLUDED.channel_in_app,
       is_enabled = EXCLUDED.is_enabled,
       updated_at = now()
     RETURNING config_id::text, is_enabled`,
    [ORG_ID, def.eventKey, MODULE_CODE, templateId, true, true, true],
  );
  console.log(
    `  ✓ Event config for ${def.eventKey}: enabled=${cfg[0].is_enabled} → template ${templateId.slice(
      0,
      8,
    )}…`,
  );
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`\nSeeding payment notification templates for org ${ORG_ID}\n`);

    console.log('[1/2] mentorias.payment_confirmed');
    await upsertTemplate(pool, PAYMENT_CONFIRMED);

    console.log('\n[2/2] mentorias.payment_refunded');
    await upsertTemplate(pool, PAYMENT_REFUNDED);

    console.log('\n✅ Done.\n');
  } finally {
    await pool.end();
  }
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
