-- Flag para garantizar que el correo "Diagnóstico iniciado · alerta a
-- administradores" se dispare UNA sola vez, y sólo cuando el líder hace
-- clic en "Empezar diagnóstico" (no al cargar la página, que era el bug
-- reportado).

BEGIN;

ALTER TABLE app_assessment.discovery_sessions
  ADD COLUMN IF NOT EXISTS admin_started_alert_sent_at timestamptz;

COMMENT ON COLUMN app_assessment.discovery_sessions.admin_started_alert_sent_at IS
  'Timestamp del momento en que se envió el correo descubrimiento.started_admin_alert. NULL hasta que el líder pulsa "Empezar diagnóstico".';

COMMIT;
