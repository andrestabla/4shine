-- Permite enviar mensajes/notificaciones a emails externos que no tienen
-- cuenta en la plataforma (user_id NULL). Para esos casos, el destinatario
-- queda identificado solo por recipient_email.

ALTER TABLE app_core.notifications
  ALTER COLUMN user_id DROP NOT NULL;

-- Aseguramos que siempre haya al menos una forma de identificar al destinatario.
ALTER TABLE app_core.notifications
  ADD CONSTRAINT chk_notifications_has_recipient
  CHECK (user_id IS NOT NULL OR recipient_email IS NOT NULL);
