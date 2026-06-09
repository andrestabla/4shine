/**
 * Sincroniza los event_configs para todos los eventos del módulo mentorias.*
 *
 * 1) Habilita email + in-app en los configs existentes (session_scheduled_*,
 *    session_cancelled_mentee) que hoy estaban solo con in-app.
 * 2) Crea configs faltantes para eventos que ya tenían plantilla pero no
 *    estaban "activados" en el panel de Notificaciones:
 *      - mentorias.session_reminder
 *      - mentorias.group_session_joined
 *      - mentorias.group_session_published
 *
 * Idempotente: usa INSERT ... ON CONFLICT.
 */

import pg from 'pg';

const { Pool } = pg;
const ORG_ID = '7aaf257c-64eb-4ec1-b91e-675137a332c6';
const MODULE_CODE = 'mentorias';

// Eventos a sincronizar y si deben llevar email habilitado.
const EVENTS = [
  { key: 'mentorias.session_scheduled_mentee', channelEmail: true, channelInApp: true },
  { key: 'mentorias.session_scheduled_mentor', channelEmail: true, channelInApp: true },
  { key: 'mentorias.session_cancelled_mentee', channelEmail: true, channelInApp: true },
  { key: 'mentorias.session_reminder', channelEmail: true, channelInApp: true },
  { key: 'mentorias.group_session_joined', channelEmail: true, channelInApp: true },
  { key: 'mentorias.group_session_published', channelEmail: false, channelInApp: true },
  // Los de payment ya están bien configurados pero los incluyo para idempotencia.
  { key: 'mentorias.payment_confirmed', channelEmail: true, channelInApp: true },
  { key: 'mentorias.payment_refunded', channelEmail: true, channelInApp: true },
];

async function syncEvent(pool, eventKey, channelEmail, channelInApp) {
  // Find an active template for the event in the org.
  const { rows: tplRows } = await pool.query(
    `SELECT template_id::text
       FROM app_admin.notification_templates
       WHERE organization_id = $1
         AND event_key = $2
         AND is_active = true
       ORDER BY updated_at DESC
       LIMIT 1`,
    [ORG_ID, eventKey],
  );
  const templateId = tplRows[0]?.template_id ?? null;
  if (!templateId) {
    console.log(`  ⚠ ${eventKey} — sin plantilla activa, se skipea.`);
    return;
  }

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
     RETURNING config_id::text, channel_email, channel_in_app, is_enabled`,
    [ORG_ID, eventKey, MODULE_CODE, templateId, channelEmail, channelInApp, true],
  );
  const c = cfg[0];
  console.log(
    `  ✓ ${eventKey} → tpl ${templateId.slice(0, 8)}… email=${c.channel_email} in_app=${c.channel_in_app} enabled=${c.is_enabled}`,
  );
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`\nSincronizando event_configs de mentorias para org ${ORG_ID}\n`);
    for (const e of EVENTS) {
      await syncEvent(pool, e.key, e.channelEmail, e.channelInApp);
    }
    console.log('\n✅ Done.\n');
  } finally {
    await pool.end();
  }
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
