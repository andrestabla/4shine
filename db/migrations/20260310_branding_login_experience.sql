-- =========================================================
-- BRANDING LOGIN EXPERIENCE (3 LAYOUTS + BACKGROUND + MESSAGES)
-- =========================================================

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS login_headline text NOT NULL DEFAULT 'Bienvenidos a una nueva experiencia de aprendizaje',
  ADD COLUMN IF NOT EXISTS login_support_message text NOT NULL DEFAULT 'Pensado para plataforma web y app móvil.',
  ADD COLUMN IF NOT EXISTS login_background_image_url text;

UPDATE app_admin.branding_settings
SET
  login_headline = COALESCE(NULLIF(login_headline, ''), 'Bienvenidos a una nueva experiencia de aprendizaje'),
  login_support_message = COALESCE(NULLIF(login_support_message, ''), 'Pensado para plataforma web y app móvil.'),
  login_background_image_url = NULLIF(login_background_image_url, '');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_login_background_image_url_len_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      ADD CONSTRAINT branding_settings_login_background_image_url_len_chk
      CHECK (
        login_background_image_url IS NULL
        OR char_length(login_background_image_url) <= 2000
      );
  END IF;
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
  bs.login_welcome_message,
  bs.login_headline,
  bs.login_support_message,
  bs.login_background_image_url,
  bs.custom_css,
  bs.preset_code,
  bs.updated_at
FROM app_admin.branding_settings bs;

GRANT SELECT ON app_admin.v_branding_tokens_public TO app_runtime;

-- Make old revision snapshots compatible with new login fields.
UPDATE app_admin.branding_revisions br
SET snapshot =
  br.snapshot ||
  jsonb_build_object(
    'loginHeadline', COALESCE(NULLIF(br.snapshot->>'loginHeadline', ''), bs.login_headline, 'Bienvenidos a una nueva experiencia de aprendizaje'),
    'loginSupportMessage', COALESCE(NULLIF(br.snapshot->>'loginSupportMessage', ''), bs.login_support_message, 'Pensado para plataforma web y app móvil.'),
    'loginBackgroundImageUrl', COALESCE(br.snapshot->>'loginBackgroundImageUrl', COALESCE(bs.login_background_image_url, ''))
  )
FROM app_admin.branding_settings bs
WHERE bs.organization_id = br.organization_id;

UPDATE app_admin.branding_revisions br
SET snapshot =
  br.snapshot ||
  jsonb_build_object(
    'loginHeadline', COALESCE(NULLIF(br.snapshot->>'loginHeadline', ''), 'Bienvenidos a una nueva experiencia de aprendizaje'),
    'loginSupportMessage', COALESCE(NULLIF(br.snapshot->>'loginSupportMessage', ''), 'Pensado para plataforma web y app móvil.'),
    'loginBackgroundImageUrl', COALESCE(br.snapshot->>'loginBackgroundImageUrl', '')
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM app_admin.branding_settings bs
  WHERE bs.organization_id = br.organization_id
);
