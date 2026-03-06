-- =========================================================
-- BRANDING REAL-TIME EXTENSIONS (WEB + APP READY)
-- =========================================================

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS institution_timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#475569',
  ADD COLUMN IF NOT EXISTS border_radius_rem numeric(4,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS page_max_width text NOT NULL DEFAULT '1260px',
  ADD COLUMN IF NOT EXISTS login_layout text NOT NULL DEFAULT 'split',
  ADD COLUMN IF NOT EXISTS login_welcome_message text NOT NULL DEFAULT 'Inicia sesión con tu cuenta corporativa.',
  ADD COLUMN IF NOT EXISTS loader_asset_url text,
  ADD COLUMN IF NOT EXISTS custom_css text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS preset_code text NOT NULL DEFAULT 'corporativo';

UPDATE app_admin.branding_settings
SET
  institution_timezone = COALESCE(NULLIF(institution_timezone, ''), 'UTC'),
  secondary_color = COALESCE(NULLIF(secondary_color, ''), '#475569'),
  border_radius_rem = COALESCE(border_radius_rem, 1.00),
  page_max_width = COALESCE(NULLIF(page_max_width, ''), '1260px'),
  login_layout = COALESCE(NULLIF(login_layout, ''), 'split'),
  login_welcome_message = COALESCE(NULLIF(login_welcome_message, ''), 'Inicia sesión con tu cuenta corporativa.'),
  custom_css = COALESCE(custom_css, ''),
  preset_code = COALESCE(NULLIF(preset_code, ''), 'corporativo');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_secondary_color_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_secondary_color_chk
      CHECK (secondary_color ~* '^#[0-9a-f]{6}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_border_radius_rem_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_border_radius_rem_chk
      CHECK (border_radius_rem >= 0.00 AND border_radius_rem <= 3.00);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_layout_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_login_layout_chk
      CHECK (login_layout IN ('split', 'centered', 'minimal'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_preset_code_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_preset_code_chk
      CHECK (preset_code IN ('corporativo', 'energetico', 'tech', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_page_max_width_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_page_max_width_chk
      CHECK (page_max_width ~* '^[0-9]+(px|rem|vw|%)$');
  END IF;
END $$;

CREATE OR REPLACE VIEW app_admin.v_branding_tokens_public AS
SELECT
  bs.branding_id,
  bs.organization_id,
  bs.platform_name,
  bs.institution_timezone,
  bs.primary_color,
  bs.secondary_color,
  bs.accent_color,
  bs.logo_url,
  bs.favicon_url,
  bs.loader_text,
  bs.loader_asset_url,
  bs.typography,
  bs.border_radius_rem,
  bs.page_max_width,
  bs.login_layout,
  bs.login_welcome_message,
  bs.custom_css,
  bs.preset_code,
  bs.updated_at
FROM app_admin.branding_settings bs;

GRANT SELECT ON app_admin.v_branding_tokens_public TO app_runtime;

DROP POLICY IF EXISTS branding_settings_select_manage ON app_admin.branding_settings;
DROP POLICY IF EXISTS branding_settings_select_public ON app_admin.branding_settings;
CREATE POLICY branding_settings_select_public ON app_admin.branding_settings
FOR SELECT
USING (true);
