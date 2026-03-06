-- =========================================================
-- BRANDING LOGIN LAYOUTS + OVERLAY + TEXT VISIBILITY
-- =========================================================

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS login_overlay_color text NOT NULL DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS login_overlay_opacity numeric(4,2) NOT NULL DEFAULT 0.45,
  ADD COLUMN IF NOT EXISTS show_platform_name boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_welcome_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_login_headline boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_login_support_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_loader_text boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_layout_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      DROP CONSTRAINT branding_settings_login_layout_chk;
  END IF;
END $$;

UPDATE app_admin.branding_settings
SET
  login_layout = CASE
    WHEN login_layout = 'split' THEN 'image_left'
    WHEN login_layout IN ('centered', 'minimal') THEN 'centered_image'
    WHEN login_layout IN ('image_right', 'image_left', 'centered_image') THEN login_layout
    ELSE 'image_right'
  END,
  login_overlay_color = CASE
    WHEN login_overlay_color ~* '^#[0-9a-f]{6}$' THEN lower(login_overlay_color)
    ELSE '#0f172a'
  END,
  login_overlay_opacity = LEAST(1.00, GREATEST(0.00, COALESCE(login_overlay_opacity, 0.45))),
  show_platform_name = COALESCE(show_platform_name, true),
  show_welcome_message = COALESCE(show_welcome_message, true),
  show_login_headline = COALESCE(show_login_headline, true),
  show_login_support_message = COALESCE(show_login_support_message, true),
  show_loader_text = COALESCE(show_loader_text, true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_layout_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_login_layout_chk
      CHECK (login_layout IN ('image_right', 'image_left', 'centered_image'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_overlay_color_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      DROP CONSTRAINT branding_settings_login_overlay_color_chk;
  END IF;

  ALTER TABLE app_admin.branding_settings
    ADD CONSTRAINT branding_settings_login_overlay_color_chk
    CHECK (login_overlay_color ~* '^#[0-9a-f]{6}$');
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_overlay_opacity_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      DROP CONSTRAINT branding_settings_login_overlay_opacity_chk;
  END IF;

  ALTER TABLE app_admin.branding_settings
    ADD CONSTRAINT branding_settings_login_overlay_opacity_chk
    CHECK (login_overlay_opacity >= 0.00 AND login_overlay_opacity <= 1.00);
END $$;

DROP VIEW IF EXISTS app_admin.v_branding_tokens_public;

CREATE VIEW app_admin.v_branding_tokens_public AS
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
  bs.login_overlay_color,
  bs.login_overlay_opacity,
  bs.login_welcome_message,
  bs.login_headline,
  bs.login_support_message,
  bs.login_background_image_url,
  bs.show_platform_name,
  bs.show_welcome_message,
  bs.show_login_headline,
  bs.show_login_support_message,
  bs.show_loader_text,
  bs.custom_css,
  bs.preset_code,
  bs.updated_at
FROM app_admin.branding_settings bs;

GRANT SELECT ON app_admin.v_branding_tokens_public TO app_runtime;

UPDATE app_admin.branding_revisions br
SET snapshot = COALESCE(br.snapshot, '{}'::jsonb) || jsonb_build_object(
  'loginLayout',
    CASE COALESCE(br.snapshot->>'loginLayout', bs.login_layout)
      WHEN 'split' THEN 'image_left'
      WHEN 'centered' THEN 'centered_image'
      WHEN 'minimal' THEN 'centered_image'
      WHEN 'image_right' THEN 'image_right'
      WHEN 'image_left' THEN 'image_left'
      WHEN 'centered_image' THEN 'centered_image'
      ELSE 'image_right'
    END,
  'loginOverlayColor',
    COALESCE(
      NULLIF(br.snapshot->>'loginOverlayColor', ''),
      bs.login_overlay_color,
      '#0f172a'
    ),
  'loginOverlayOpacity',
    CASE
      WHEN COALESCE(br.snapshot->>'loginOverlayOpacity', '') ~ '^[0-9]+(\.[0-9]+)?$' THEN
        LEAST(1.00, GREATEST(0.00, (br.snapshot->>'loginOverlayOpacity')::numeric))
      ELSE COALESCE(bs.login_overlay_opacity, 0.45)
    END,
  'showPlatformName',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showPlatformName', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showPlatformName')::boolean
      ELSE COALESCE(bs.show_platform_name, true)
    END,
  'showWelcomeMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showWelcomeMessage')::boolean
      ELSE COALESCE(bs.show_welcome_message, true)
    END,
  'showLoginHeadline',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginHeadline')::boolean
      ELSE COALESCE(bs.show_login_headline, true)
    END,
  'showLoginSupportMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginSupportMessage')::boolean
      ELSE COALESCE(bs.show_login_support_message, true)
    END,
  'showLoaderText',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoaderText', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoaderText')::boolean
      ELSE COALESCE(bs.show_loader_text, true)
    END
)
FROM app_admin.branding_settings bs
WHERE bs.organization_id = br.organization_id;

UPDATE app_admin.branding_revisions br
SET snapshot = COALESCE(br.snapshot, '{}'::jsonb) || jsonb_build_object(
  'loginLayout',
    CASE COALESCE(br.snapshot->>'loginLayout', '')
      WHEN 'split' THEN 'image_left'
      WHEN 'centered' THEN 'centered_image'
      WHEN 'minimal' THEN 'centered_image'
      WHEN 'image_right' THEN 'image_right'
      WHEN 'image_left' THEN 'image_left'
      WHEN 'centered_image' THEN 'centered_image'
      ELSE 'image_right'
    END,
  'loginOverlayColor', COALESCE(NULLIF(br.snapshot->>'loginOverlayColor', ''), '#0f172a'),
  'loginOverlayOpacity',
    CASE
      WHEN COALESCE(br.snapshot->>'loginOverlayOpacity', '') ~ '^[0-9]+(\.[0-9]+)?$' THEN
        LEAST(1.00, GREATEST(0.00, (br.snapshot->>'loginOverlayOpacity')::numeric))
      ELSE 0.45
    END,
  'showPlatformName',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showPlatformName', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showPlatformName')::boolean
      ELSE true
    END,
  'showWelcomeMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showWelcomeMessage')::boolean
      ELSE true
    END,
  'showLoginHeadline',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginHeadline')::boolean
      ELSE true
    END,
  'showLoginSupportMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginSupportMessage')::boolean
      ELSE true
    END,
  'showLoaderText',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showLoaderText', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoaderText')::boolean
      ELSE true
    END
)
WHERE NOT EXISTS (
  SELECT 1
  FROM app_admin.branding_settings bs
  WHERE bs.organization_id = br.organization_id
);
