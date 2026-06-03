/* eslint-disable */
const { Pool } = require('pg');

const ORG_ID = '7aaf257c-64eb-4ec1-b91e-675137a332c6';
const EVENT_KEY = 'auth.account_created_by_admin';
const MODULE_CODE = 'usuarios';

const SUBJECT = 'Bienvenido a {{plataforma}}, {{nombre}}';

const BODY_HTML = `
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>{{nombre}}</strong>,</p>

<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
  Te creamos una cuenta en <strong>{{plataforma}}</strong>. A partir de ahora puedes
  iniciar sesión con las siguientes credenciales:
</p>

<div style="margin:0 0 24px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">
    Tu correo
  </p>
  <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f172a;word-break:break-all;">
    {{correo}}
  </p>
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">
    Contraseña inicial
  </p>
  <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:.06em;color:#0f172a;font-family:'SF Mono','Menlo','Monaco',monospace;">
    {{contrasena}}
  </p>
</div>

<p style="margin:0 0 20px;text-align:center;">
  <a href="{{enlace_plataforma}}">Iniciar sesión</a>
</p>

<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">
  <strong>Recomendación de seguridad:</strong> cambia tu contraseña en cuanto ingreses por
  primera vez, desde tu perfil o usando la opción &quot;¿Olvidé mi contraseña?&quot; en la
  pantalla de acceso.
</p>

<p style="margin:0;font-size:13px;color:#94a3b8;">
  Si no esperabas este correo, contacta a {{remitente_nombre}} o a soporte de
  {{plataforma}}.
</p>
`.trim();

const BODY_TEXT = `Hola {{nombre}},

Te creamos una cuenta en {{plataforma}}. Inicia sesión con:

Correo: {{correo}}
Contraseña inicial: {{contrasena}}

Inicia sesión aquí: {{enlace_plataforma}}

Recomendación: cambia tu contraseña en cuanto ingreses por primera vez.

Si no esperabas este correo, contacta a {{remitente_nombre}} o al soporte de {{plataforma}}.`;

const IN_APP_TITLE = 'Bienvenido a {{plataforma}}';
const IN_APP_BODY = 'Tu cuenta fue creada. Revisa tu correo {{correo}} para ver tus credenciales.';
const IN_APP_ACTION_URL = '{{enlace_plataforma}}';

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
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
          'Bienvenida con credenciales',
          'Correo que se envía al usuario cuando un admin/gestor crea su cuenta manualmente y marca "Enviar correo de bienvenida". Incluye email + contraseña inicial.',
          EVENT_KEY,
          MODULE_CODE,
          true,
          true,
          SUBJECT,
          BODY_HTML,
          BODY_TEXT,
          IN_APP_TITLE,
          IN_APP_BODY,
          'success',
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
