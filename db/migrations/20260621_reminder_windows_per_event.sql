-- ============================================================
-- Generaliza las ventanas de recordatorio a POR EVENTO:
-- app_admin.group_reminder_windows pasa de (org, window) a
-- (org, event_key, window). Habilita ventanas configurables también
-- para el recordatorio de sesión 1:1 (mentorias.session_reminder).
-- ============================================================
-- Idempotente.

ALTER TABLE app_admin.group_reminder_windows
  ADD COLUMN IF NOT EXISTS event_key text NOT NULL DEFAULT 'mentorias.group_session_reminder';

-- Reemplaza la PK (org, window) por (org, event_key, window).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'group_reminder_windows_pkey'
      AND conrelid = 'app_admin.group_reminder_windows'::regclass
  ) THEN
    ALTER TABLE app_admin.group_reminder_windows DROP CONSTRAINT group_reminder_windows_pkey;
  END IF;
  ALTER TABLE app_admin.group_reminder_windows
    ADD CONSTRAINT group_reminder_windows_pkey PRIMARY KEY (organization_id, event_key, window_minutes);
END $$;

-- Seed de las 7 ventanas para el recordatorio 1:1 (24h y 1h activas por defecto,
-- igual que el comportamiento anterior fijo).
INSERT INTO app_admin.group_reminder_windows (organization_id, event_key, window_minutes, label, is_enabled)
SELECT o.organization_id, 'mentorias.session_reminder', v.minutes, v.label, v.enabled
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
ON CONFLICT (organization_id, event_key, window_minutes) DO NOTHING;
