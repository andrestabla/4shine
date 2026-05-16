-- ============================================================
-- Notification Templates & Event Configuration System
-- ============================================================

-- Extend existing notifications with routing metadata
ALTER TABLE app_core.notifications
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS action_url text;

-- --------------------------------------------------------
-- Templates: reusable message blueprints with variables
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.notification_templates (
  template_id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,

  -- Identity
  name              text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description       text        NOT NULL DEFAULT '',
  event_key         text        NOT NULL,   -- e.g. 'mentorias.session_scheduled_mentee'
  module_code       text        NOT NULL,   -- e.g. 'mentorias'

  -- Channels
  channel_email     boolean     NOT NULL DEFAULT true,
  channel_in_app    boolean     NOT NULL DEFAULT true,

  -- Email content (Mustache-style {{variable}} placeholders)
  subject_template          text NOT NULL DEFAULT '',
  body_html_template        text NOT NULL DEFAULT '',
  body_text_template        text NOT NULL DEFAULT '',

  -- In-app notification content
  in_app_title_template     text NOT NULL DEFAULT '',
  in_app_body_template      text NOT NULL DEFAULT '',
  in_app_type               text NOT NULL DEFAULT 'info'
                              CHECK (in_app_type IN ('message', 'alert', 'success', 'info')),
  in_app_action_url_template text NOT NULL DEFAULT '',

  -- Status
  is_active         boolean     NOT NULL DEFAULT true,
  is_system         boolean     NOT NULL DEFAULT false,  -- platform defaults, cannot be deleted

  created_by        uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_templates_org
  ON app_admin.notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notif_templates_event_key
  ON app_admin.notification_templates(organization_id, event_key);

-- --------------------------------------------------------
-- Event configs: per-org override of template, channels, enabled state
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.notification_event_configs (
  config_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,

  event_key         text        NOT NULL,
  module_code       text        NOT NULL,

  -- Which template to use (NULL = use system default / built-in behavior)
  template_id       uuid        REFERENCES app_admin.notification_templates(template_id) ON DELETE SET NULL,

  -- Channel overrides
  channel_email     boolean     NOT NULL DEFAULT true,
  channel_in_app    boolean     NOT NULL DEFAULT true,

  is_enabled        boolean     NOT NULL DEFAULT true,

  updated_by        uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organization_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_notif_event_configs_org
  ON app_admin.notification_event_configs(organization_id, event_key);

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
ALTER TABLE app_admin.notification_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.notification_event_configs ENABLE ROW LEVEL SECURITY;

-- Templates: admin & gestor can fully manage; runtime service reads all for the org
DROP POLICY IF EXISTS notif_templates_admin_all   ON app_admin.notification_templates;
CREATE POLICY notif_templates_admin_all ON app_admin.notification_templates
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

-- Event configs: same access as templates
DROP POLICY IF EXISTS notif_event_configs_admin_all ON app_admin.notification_event_configs;
CREATE POLICY notif_event_configs_admin_all ON app_admin.notification_event_configs
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

-- --------------------------------------------------------
-- Runtime grants
-- --------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.notification_templates     TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.notification_event_configs TO app_runtime;
