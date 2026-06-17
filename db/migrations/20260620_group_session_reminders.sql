-- ============================================================
-- Recordatorios de sesiones grupales: ventanas configurables
-- (72h/24h/12h/6h/3h/1h/30m), idempotencia de envío y plantilla
-- por defecto del evento mentorias.group_session_reminder.
-- ============================================================
-- Idempotente.

-- --------------------------------------------------------
-- Ventanas de recordatorio configurables (por organización)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.group_reminder_windows (
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  window_minutes   int         NOT NULL,
  label            text        NOT NULL DEFAULT '',
  is_enabled       boolean     NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, window_minutes)
);

ALTER TABLE app_admin.group_reminder_windows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_reminder_windows_read ON app_admin.group_reminder_windows;
CREATE POLICY group_reminder_windows_read ON app_admin.group_reminder_windows FOR SELECT USING (true);
DROP POLICY IF EXISTS group_reminder_windows_write ON app_admin.group_reminder_windows;
CREATE POLICY group_reminder_windows_write ON app_admin.group_reminder_windows
  FOR ALL USING (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.group_reminder_windows TO app_runtime;

-- Seed de las 7 ventanas por organización (24h y 1h habilitadas por defecto).
INSERT INTO app_admin.group_reminder_windows (organization_id, window_minutes, label, is_enabled)
SELECT o.organization_id, v.minutes, v.label, v.enabled
FROM app_core.organizations o
CROSS JOIN (VALUES
  (4320, '72 horas antes', false),
  (1440, '24 horas antes', true),
  (720,  '12 horas antes', false),
  (360,  '6 horas antes',  false),
  (180,  '3 horas antes',  false),
  (60,   '1 hora antes',   true),
  (30,   '30 minutos antes', false)
) AS v(minutes, label, enabled)
ON CONFLICT (organization_id, window_minutes) DO NOTHING;

-- --------------------------------------------------------
-- Idempotencia: una notificación por (evento, usuario, ventana)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_mentoring.group_session_reminders_sent (
  event_id        uuid        NOT NULL REFERENCES app_mentoring.group_session_events(event_id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  window_minutes  int         NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id, window_minutes)
);

ALTER TABLE app_mentoring.group_session_reminders_sent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_session_reminders_sent_all ON app_mentoring.group_session_reminders_sent;
CREATE POLICY group_session_reminders_sent_all ON app_mentoring.group_session_reminders_sent
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_reminders_sent TO app_runtime;

-- --------------------------------------------------------
-- Plantilla por defecto + activación del evento
-- mentorias.group_session_reminder (por organización)
-- --------------------------------------------------------
DO $$
DECLARE
  org   RECORD;
  tpl   uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP
    INSERT INTO app_admin.notification_templates (
      organization_id, name, description,
      event_key, module_code,
      channel_email, channel_in_app,
      subject_template,
      body_html_template,
      body_text_template,
      in_app_title_template, in_app_body_template,
      in_app_type, in_app_action_url_template,
      is_active, is_system
    ) VALUES (
      org.organization_id,
      'Recordatorio de sesión grupal',
      'Recordatorio automático antes de una sesión grupal, según las ventanas configuradas.',
      'mentorias.group_session_reminder',
      'mentorias',
      true, true,
      'Recordatorio: «{{titulo}}» {{tiempo_restante}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Te recordamos la sesión grupal <strong>«{{titulo}}»</strong>, que comienza <strong>{{tiempo_restante}}</strong> ({{fecha}} a las {{hora}}).</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">Te esperamos. Puedes ingresar desde el siguiente enlace:</p>
<p style="margin:0;"><a href="{{enlace_sesion}}">Entrar a la sesión</a></p>',
      'Hola {{nombre}},

Te recordamos la sesión grupal «{{titulo}}», que comienza {{tiempo_restante}} ({{fecha}} a las {{hora}}).

Entrar a la sesión: {{enlace_sesion}}

— {{plataforma}}',
      'Recordatorio: «{{titulo}}»',
      'Comienza {{tiempo_restante}} ({{fecha}}, {{hora}}). Toca para entrar.',
      'info',
      '{{enlace_sesion}}',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl;

    IF tpl IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'mentorias.group_session_reminder', 'mentorias', tpl, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;
  END LOOP;
END $$;
