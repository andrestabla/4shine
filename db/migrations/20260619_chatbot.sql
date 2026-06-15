-- ============================================================
-- Asistente IA de soporte 360: configuración admin, base de
-- conocimiento (FAQs) y persistencia de conversaciones.
-- ============================================================
-- Idempotente.

-- --------------------------------------------------------
-- Settings (singleton por organización)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.chatbot_settings (
  chatbot_settings_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  is_enabled           boolean     NOT NULL DEFAULT true,
  model                text        NOT NULL DEFAULT '',
  persona              text        NOT NULL DEFAULT 'Asistente 4Shine',
  system_prompt        text        NOT NULL DEFAULT '',
  welcome_message      text        NOT NULL DEFAULT '¡Hola! Soy tu asistente 4Shine. ¿En qué te ayudo hoy?',
  max_context_messages int         NOT NULL DEFAULT 12 CHECK (max_context_messages BETWEEN 1 AND 50),
  created_by           uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by           uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- --------------------------------------------------------
-- Base de conocimiento (FAQs)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.chatbot_faqs (
  faq_id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  question         text        NOT NULL DEFAULT '',
  answer           text        NOT NULL DEFAULT '',
  sort_order       int         NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_org_order
  ON app_admin.chatbot_faqs(organization_id, sort_order);

-- --------------------------------------------------------
-- Conversaciones y mensajes (por usuario)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_core.chatbot_conversations (
  conversation_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  title            text        NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user
  ON app_core.chatbot_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_org
  ON app_core.chatbot_conversations(organization_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS app_core.chatbot_messages (
  message_id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES app_core.chatbot_conversations(conversation_id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  role             text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content          text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation
  ON app_core.chatbot_messages(conversation_id, created_at);

-- --------------------------------------------------------
-- Triggers updated_at
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS trg_chatbot_settings_set_updated_at ON app_admin.chatbot_settings;
CREATE TRIGGER trg_chatbot_settings_set_updated_at
  BEFORE UPDATE ON app_admin.chatbot_settings
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_faqs_set_updated_at ON app_admin.chatbot_faqs;
CREATE TRIGGER trg_chatbot_faqs_set_updated_at
  BEFORE UPDATE ON app_admin.chatbot_faqs
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_conversations_set_updated_at ON app_core.chatbot_conversations;
CREATE TRIGGER trg_chatbot_conversations_set_updated_at
  BEFORE UPDATE ON app_core.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

-- --------------------------------------------------------
-- RLS
-- --------------------------------------------------------
ALTER TABLE app_admin.chatbot_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.chatbot_faqs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.chatbot_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.chatbot_messages       ENABLE ROW LEVEL SECURITY;

-- Config + FAQs: lectura para cualquier sesión autenticada (el runtime las
-- usa para responder), escritura solo admin/gestor.
DROP POLICY IF EXISTS chatbot_settings_read ON app_admin.chatbot_settings;
CREATE POLICY chatbot_settings_read ON app_admin.chatbot_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS chatbot_settings_write ON app_admin.chatbot_settings;
CREATE POLICY chatbot_settings_write ON app_admin.chatbot_settings
  FOR ALL USING (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS chatbot_faqs_read ON app_admin.chatbot_faqs;
CREATE POLICY chatbot_faqs_read ON app_admin.chatbot_faqs FOR SELECT USING (true);
DROP POLICY IF EXISTS chatbot_faqs_write ON app_admin.chatbot_faqs;
CREATE POLICY chatbot_faqs_write ON app_admin.chatbot_faqs
  FOR ALL USING (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

-- Conversaciones/mensajes: cada usuario gestiona lo suyo; admin/gestor leen
-- todo (revisión).
DROP POLICY IF EXISTS chatbot_conversations_self ON app_core.chatbot_conversations;
CREATE POLICY chatbot_conversations_self ON app_core.chatbot_conversations
  FOR ALL
  USING (user_id = app_auth.current_user_id() OR app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS chatbot_messages_self ON app_core.chatbot_messages;
CREATE POLICY chatbot_messages_self ON app_core.chatbot_messages
  FOR ALL
  USING (user_id = app_auth.current_user_id() OR app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (user_id = app_auth.current_user_id());

-- --------------------------------------------------------
-- Grants
-- --------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.chatbot_settings     TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.chatbot_faqs         TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_core.chatbot_conversations TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_core.chatbot_messages      TO app_runtime;

-- --------------------------------------------------------
-- Seed: settings singleton + FAQs base
-- --------------------------------------------------------
INSERT INTO app_admin.chatbot_settings (organization_id)
SELECT organization_id FROM app_core.organizations
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO app_admin.chatbot_faqs (organization_id, question, answer, sort_order)
SELECT o.organization_id, v.q, v.a, v.ord
FROM app_core.organizations o
CROSS JOIN (VALUES
  ('¿A qué servicios tengo acceso?', 'Tu acceso depende de tu plan. Puedes verlo en tu perfil y suscripción; el asistente también te lo resume con tus datos reales.', 1),
  ('¿Cuántos días me quedan de suscripción?', 'El asistente te lo dice según tu fecha de vencimiento; también lo ves en Mi suscripción (/dashboard/suscripcion).', 2),
  ('¿Cómo actualizo mi perfil?', 'Desde /dashboard/perfil puedes editar tu información profesional, foto, intereses y proyectos.', 3),
  ('¿Cómo elimino mi cuenta?', 'En /dashboard/perfil, al final, encuentras la opción "Eliminar mi cuenta". Es permanente.', 4)
) AS v(q, a, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM app_admin.chatbot_faqs f WHERE f.organization_id = o.organization_id AND f.question = v.q
);
