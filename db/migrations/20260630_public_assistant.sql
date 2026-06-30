-- Asistente del SITIO PÚBLICO ("Tatiana") — distinto del chatbot interno.
-- No consulta la base de datos del sistema: saluda, ofrece asesoría sobre
-- programas/planes mediante botones configurables y, al interactuar, redirige
-- la conversación al WhatsApp de la asesora humana con todo el contexto.

CREATE TABLE IF NOT EXISTS app_admin.public_assistant_settings (
  organization_id uuid PRIMARY KEY REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  assistant_name text NOT NULL DEFAULT 'Tatiana',
  avatar_url text NOT NULL DEFAULT '',
  greeting text NOT NULL DEFAULT '¡Hola! Soy Tatiana 👋 Estoy aquí para asesorarte sobre nuestros programas y planes.',
  intro text NOT NULL DEFAULT '¿Sobre qué te gustaría recibir asesoría? Elige una opción o escríbeme y te conecto por WhatsApp.',
  whatsapp_number text NOT NULL DEFAULT '',
  whatsapp_intro text NOT NULL DEFAULT 'Hola Tatiana, vengo del sitio web de 4Shine y me gustaría recibir asesoría.',
  -- options: array de { label, message } — cada botón de programa/plan.
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_admin.public_assistant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_assistant_read ON app_admin.public_assistant_settings;
CREATE POLICY public_assistant_read ON app_admin.public_assistant_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS public_assistant_write ON app_admin.public_assistant_settings;
CREATE POLICY public_assistant_write ON app_admin.public_assistant_settings
  FOR ALL USING (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.public_assistant_settings TO app_runtime;
