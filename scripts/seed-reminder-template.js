/* eslint-disable */
const { Pool } = require('pg');

const ORG_ID = '7aaf257c-64eb-4ec1-b91e-675137a332c6';
const EVENT_KEY = 'descubrimiento.reminder';
const MODULE_CODE = 'descubrimiento';

const SUBJECT = '{{nombre}}, tu diagnóstico {{plataforma}} sigue pendiente';

const BODY_HTML = `
<p style="margin:0 0 16px;font-size:15px;color:#0f172a;">Hola <strong>{{nombre}}</strong>,</p>

<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
  Notamos que aún no has terminado tu diagnóstico de liderazgo en <strong>{{plataforma}}</strong>.
  Esta evaluación toma entre 20 y 25 minutos y al finalizar recibirás tu lectura ejecutiva 4Shine personalizada,
  con tus 4 pilares (Within, Out, Up y Beyond) y un plan de aceleración accionable.
</p>

<p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
  Continúa exactamente donde lo dejaste haciendo clic en el botón:
</p>

<p style="margin:0 0 24px;text-align:center;">
  <a href="{{enlace_invitacion}}">Continuar mi diagnóstico</a>
</p>

<p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
  Si el botón no funciona, copia y pega este enlace en tu navegador:
</p>
<p style="margin:0 0 24px;font-size:12px;color:#94a3b8;word-break:break-all;">
  {{enlace_invitacion}}
</p>

<p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
  Equipo {{plataforma}}
</p>
`.trim();

const BODY_TEXT = `Hola {{nombre}},

Notamos que aún no has terminado tu diagnóstico de liderazgo en {{plataforma}}.
La evaluación toma entre 20 y 25 minutos y al finalizar recibirás tu lectura ejecutiva 4Shine personalizada.

Continúa donde lo dejaste:
{{enlace_invitacion}}

Equipo {{plataforma}}`;

const IN_APP_TITLE = 'Tu diagnóstico {{plataforma}} sigue pendiente';
const IN_APP_BODY = '{{nombre}}, retoma tu diagnóstico para recibir tu lectura ejecutiva 4Shine personalizada.';
const IN_APP_ACTION_URL = '{{enlace_invitacion}}';

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const { rows: tplRows } = await pool.query(
      `INSERT INTO app_admin.notification_templates
         (organization_id, name, description, event_key, module_code,
          channel_email, channel_in_app, subject_template, body_html_template, body_text_template,
          in_app_title_template, in_app_body_template, in_app_type, in_app_action_url_template,
          is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING template_id::text, name, event_key, is_active`,
      [
        ORG_ID,
        'Recordatorio diagnóstico Descubrimiento',
        'Correo enviado manualmente al participante que aún no termina su diagnóstico de Descubrimiento. Incluye su enlace personalizado para retomar.',
        EVENT_KEY,
        MODULE_CODE,
        true,  // channel_email
        true,  // channel_in_app
        SUBJECT,
        BODY_HTML,
        BODY_TEXT,
        IN_APP_TITLE,
        IN_APP_BODY,
        'alert',
        IN_APP_ACTION_URL,
        true,  // is_active
      ],
    );
    const tpl = tplRows[0];
    console.log('Template created:', tpl);

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
      [ORG_ID, EVENT_KEY, MODULE_CODE, tpl.template_id, true, true, true],
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
