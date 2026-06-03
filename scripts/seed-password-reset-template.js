/* eslint-disable */
const { Pool } = require('pg');

const ORG_ID = '7aaf257c-64eb-4ec1-b91e-675137a332c6';
const EVENT_KEY = 'auth.password_reset';
const MODULE_CODE = 'usuarios';

const SUBJECT = '{{plataforma}} · Restablecer tu contraseña';

const BODY_HTML = `
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>{{nombre}}</strong>,</p>

<p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
  Recibimos una solicitud para restablecer tu contraseña en <strong>{{plataforma}}</strong>.
  Si fuiste tú, abre el siguiente enlace para definir una nueva contraseña.
  El enlace expira en <strong>1 hora</strong>.
</p>

<p style="margin:0 0 24px;text-align:center;">
  <a href="{{enlace_reset}}">Restablecer mi contraseña</a>
</p>

<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:0 0 24px;font-size:12px;color:#94a3b8;word-break:break-all;">{{enlace_reset}}</p>

<p style="margin:0;font-size:13px;color:#94a3b8;">
  Si no solicitaste este cambio, puedes ignorar este mensaje y tu contraseña seguirá igual.
</p>
`.trim();

const BODY_TEXT = `Hola {{nombre}},

Recibimos una solicitud para restablecer tu contraseña en {{plataforma}}.
Si fuiste tú, abre el siguiente enlace para definir una nueva contraseña (expira en 1 hora):

{{enlace_reset}}

Si no solicitaste este cambio, puedes ignorar este mensaje.`;

const IN_APP_TITLE = 'Solicitud de restablecimiento de contraseña';
const IN_APP_BODY = '{{nombre}}, recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este aviso.';
const IN_APP_ACTION_URL = '{{enlace_reset}}';

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Solo crea la plantilla si todavía no existe ninguna para este evento.
    const { rows: existing } = await pool.query(
      `SELECT template_id::text FROM app_admin.notification_templates
       WHERE organization_id = $1 AND event_key = $2`,
      [ORG_ID, EVENT_KEY],
    );

    let templateId;
    if (existing.length > 0) {
      templateId = existing[0].template_id;
      console.log('Template already exists, reusing:', templateId);
    } else {
      const { rows: tplRows } = await pool.query(
        `INSERT INTO app_admin.notification_templates
           (organization_id, name, description, event_key, module_code,
            channel_email, channel_in_app, subject_template, body_html_template, body_text_template,
            in_app_title_template, in_app_body_template, in_app_type, in_app_action_url_template,
            is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING template_id::text`,
        [
          ORG_ID,
          'Restablecimiento de contraseña',
          'Correo enviado al usuario cuando solicita restablecer su contraseña desde la pantalla de acceso. Incluye el enlace seguro con token.',
          EVENT_KEY,
          MODULE_CODE,
          true,
          true,
          SUBJECT,
          BODY_HTML,
          BODY_TEXT,
          IN_APP_TITLE,
          IN_APP_BODY,
          'alert',
          IN_APP_ACTION_URL,
          true,
        ],
      );
      templateId = tplRows[0].template_id;
      console.log('Template created:', templateId);
    }

    const { rows: cfgRows } = await pool.query(
      `INSERT INTO app_admin.notification_event_configs
         (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (organization_id, event_key) DO UPDATE SET
         template_id   = EXCLUDED.template_id,
         channel_email = EXCLUDED.channel_email,
         channel_in_app= EXCLUDED.channel_in_app,
         is_enabled    = EXCLUDED.is_enabled,
         updated_at    = now()
       RETURNING config_id::text, event_key, template_id::text, is_enabled`,
      [ORG_ID, EVENT_KEY, MODULE_CODE, templateId, true, true, true],
    );
    console.log('Event config:', cfgRows[0]);

    console.log('\nDone.');
  } finally {
    await pool.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
