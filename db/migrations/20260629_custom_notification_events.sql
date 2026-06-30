-- Eventos de notificación personalizados (creados desde el admin) + registro de
-- disparos para idempotencia y para encadenar eventos por dependencia.
--
-- Los eventos del catálogo de código siguen existiendo; estos son adicionales.
-- La plantilla y canales de cada evento (custom o de catálogo) se siguen
-- configurando en app_admin.notification_event_configs por event_key.

CREATE TABLE IF NOT EXISTS app_admin.notification_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  event_key text NOT NULL,
  module_code text NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Disparador:
  --   'manual'           → se envía manualmente (no lo dispara el cron).
  --   'date_anchor'      → N días/horas antes/después de una fecha ancla del usuario.
  --   'event_dependency' → N días/horas después de que ocurrió otro evento para ese usuario.
  trigger_type text NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'date_anchor', 'event_dependency')),
  trigger_anchor text,            -- date_anchor: 'registration' | 'subscription_expiry'
  trigger_parent_event text,      -- event_dependency: event_key del evento padre
  offset_value integer NOT NULL DEFAULT 0,
  offset_unit text NOT NULL DEFAULT 'days' CHECK (offset_unit IN ('days', 'hours')),
  offset_direction text NOT NULL DEFAULT 'after' CHECK (offset_direction IN ('after', 'before')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_events_org_active
  ON app_admin.notification_events (organization_id, is_active);

-- Idempotencia: un (evento, usuario, fire_key) se envía una sola vez.
-- fire_key codifica la ocurrencia (p. ej. la fecha objetivo o el id del evento padre).
CREATE TABLE IF NOT EXISTS app_admin.notification_event_sends (
  send_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  event_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  fire_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_key, user_id, fire_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_event_sends_lookup
  ON app_admin.notification_event_sends (organization_id, event_key, user_id);

-- RLS + grants (el rol de runtime opera bajo el contexto de rol; admin gestiona).
ALTER TABLE app_admin.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.notification_event_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_events_read ON app_admin.notification_events;
CREATE POLICY notification_events_read ON app_admin.notification_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS notification_events_write ON app_admin.notification_events;
CREATE POLICY notification_events_write ON app_admin.notification_events
  FOR ALL USING (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS notification_event_sends_all ON app_admin.notification_event_sends;
CREATE POLICY notification_event_sends_all ON app_admin.notification_event_sends
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.notification_events TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.notification_event_sends TO app_runtime;
