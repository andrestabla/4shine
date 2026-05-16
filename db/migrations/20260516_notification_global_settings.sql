-- ============================================================
-- Notification Global Settings
-- Org-wide defaults for notification variables and
-- email header/footer customization.
-- ============================================================

CREATE TABLE IF NOT EXISTS app_admin.notification_global_settings (
  setting_id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid        NOT NULL UNIQUE
                          REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,

  -- Global variable defaults (auto-injected when dispatch context omits them)
  var_platform_name       text        NOT NULL DEFAULT '',
  var_platform_url        text        NOT NULL DEFAULT '',

  -- Email header
  email_header_bg         text        NOT NULL DEFAULT '#1e293b',

  -- Email footer
  email_footer_tagline    text        NOT NULL DEFAULT '',
  email_footer_support    text        NOT NULL DEFAULT '',
  email_footer_legal      text        NOT NULL DEFAULT '',

  updated_at              timestamptz NOT NULL DEFAULT NOW()
);

-- Seed existing organizations with a default row
INSERT INTO app_admin.notification_global_settings (organization_id)
SELECT organization_id FROM app_core.organizations
ON CONFLICT (organization_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON app_admin.notification_global_settings TO app_runtime;
