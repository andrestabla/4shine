-- Tracking extendido para notificaciones / mensajes enviados.
-- Habilita:
--  - distinguir envíos manuales (sender_user_id) de los automáticos del sistema (NULL)
--  - separar canal email vs in-app
--  - registrar delivery / open / bounce / complaint reportados por SES via SNS webhook
--  - mantener message_id del proveedor para hacer match con webhooks

ALTER TABLE app_core.notifications
  ADD COLUMN IF NOT EXISTS sender_user_id       UUID REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel              TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  ADD COLUMN IF NOT EXISTS recipient_email      TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id  TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complaint_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason       TEXT,
  ADD COLUMN IF NOT EXISTS batch_id             UUID;

-- Backfill: las filas existentes en app_core.notifications son todas in-app
-- ya entregadas (el insert es la entrega) y read_at es equivalente a opened_at.
UPDATE app_core.notifications
SET delivered_at = COALESCE(delivered_at, created_at),
    opened_at    = COALESCE(opened_at, read_at)
WHERE delivered_at IS NULL OR (read_at IS NOT NULL AND opened_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_notifications_sender         ON app_core.notifications(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_batch          ON app_core.notifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_provider_msgid ON app_core.notifications(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_channel_event  ON app_core.notifications(channel, event_key, created_at DESC);

GRANT INSERT (
  sender_user_id, channel, recipient_email, provider_message_id, batch_id
), UPDATE (
  delivered_at, opened_at, bounced_at, complaint_at, failed_at, failure_reason, provider_message_id
) ON app_core.notifications TO app_runtime;
