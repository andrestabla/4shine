-- ============================================================
-- Recordatorio automático de diagnóstico (descubrimiento.reminder):
-- ventanas por "tiempo sin completar desde que obtuvo acceso" (en días)
-- + idempotencia por (usuario, ventana).
-- ============================================================
-- Idempotente. Reutiliza app_admin.group_reminder_windows (event-keyed).

INSERT INTO app_admin.group_reminder_windows (organization_id, event_key, window_minutes, label, is_enabled)
SELECT o.organization_id, 'descubrimiento.reminder', v.minutes, v.label, v.enabled
FROM app_core.organizations o
CROSS JOIN (VALUES
  (1440,  '1 día sin completar',   false),
  (4320,  '3 días sin completar',  true),
  (10080, '7 días sin completar',  true),
  (20160, '14 días sin completar', false),
  (43200, '30 días sin completar', false)
) AS v(minutes, label, enabled)
ON CONFLICT (organization_id, event_key, window_minutes) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_assessment.discovery_reminders_sent (
  user_id         uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  window_minutes  int         NOT NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, window_minutes)
);

ALTER TABLE app_assessment.discovery_reminders_sent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discovery_reminders_sent_all ON app_assessment.discovery_reminders_sent;
CREATE POLICY discovery_reminders_sent_all ON app_assessment.discovery_reminders_sent
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_reminders_sent TO app_runtime;
