-- ============================================================
-- Avatar configurable para el Asistente IA (chatbot_settings).
-- ============================================================
-- Idempotente.

ALTER TABLE app_admin.chatbot_settings
  ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';
