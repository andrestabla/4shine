-- Add new fields to convocatoria_requests
ALTER TABLE app_networking.convocatoria_requests
  ADD COLUMN IF NOT EXISTS objetivo text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'otra'
    CHECK (tipo IN ('laboral', 'proyecto_social', 'proveedor', 'convenio', 'otra')),
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin date,
  ADD COLUMN IF NOT EXISTS requisitos text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS enlaces_complementarios text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS numero_contacto text NOT NULL DEFAULT '';

-- Notification interest (leaders subscribe to receive notifications about new convocatorias)
CREATE TABLE IF NOT EXISTS app_networking.convocatoria_notification_interests (
  user_id uuid PRIMARY KEY REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON app_networking.convocatoria_notification_interests TO app_runtime;
