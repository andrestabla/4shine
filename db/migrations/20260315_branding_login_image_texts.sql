-- =========================================================
-- BRANDING LOGIN TEXT SPLIT (FORM VS IMAGE PANEL)
-- =========================================================

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS image_welcome_message text NOT NULL DEFAULT 'Bienvenidos a esta experiencia de transformación 4Shine.',
  ADD COLUMN IF NOT EXISTS image_login_headline text NOT NULL DEFAULT 'Bienvenidos a una nueva experiencia de aprendizaje',
  ADD COLUMN IF NOT EXISTS image_login_support_message text NOT NULL DEFAULT 'Pensado para plataforma web y app móvil.',
  ADD COLUMN IF NOT EXISTS show_image_welcome_message boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_image_login_headline boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_image_login_support_message boolean NOT NULL DEFAULT true;

UPDATE app_admin.branding_settings
SET
  image_welcome_message = COALESCE(
    NULLIF(image_welcome_message, ''),
    NULLIF(login_welcome_message, ''),
    'Bienvenidos a esta experiencia de transformación 4Shine.'
  ),
  image_login_headline = COALESCE(
    NULLIF(image_login_headline, ''),
    NULLIF(login_headline, ''),
    'Bienvenidos a una nueva experiencia de aprendizaje'
  ),
  image_login_support_message = COALESCE(
    NULLIF(image_login_support_message, ''),
    NULLIF(login_support_message, ''),
    'Pensado para plataforma web y app móvil.'
  ),
  show_image_welcome_message = COALESCE(show_image_welcome_message, show_welcome_message, true),
  show_image_login_headline = COALESCE(show_image_login_headline, show_login_headline, true),
  show_image_login_support_message = COALESCE(show_image_login_support_message, show_login_support_message, true);

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
  bs.image_welcome_message,
  bs.image_login_headline,
  bs.image_login_support_message,
  bs.login_background_image_url,
  bs.show_platform_name,
  bs.show_welcome_message,
  bs.show_login_headline,
  bs.show_login_support_message,
  bs.show_image_welcome_message,
  bs.show_image_login_headline,
  bs.show_image_login_support_message,
  bs.show_loader_text,
  bs.custom_css,
  bs.preset_code,
  bs.updated_at
FROM app_admin.branding_settings bs;

GRANT SELECT ON app_admin.v_branding_tokens_public TO app_runtime;

UPDATE app_admin.branding_revisions br
SET snapshot = COALESCE(br.snapshot, '{}'::jsonb) || jsonb_build_object(
  'imageWelcomeMessage',
    COALESCE(
      NULLIF(br.snapshot->>'imageWelcomeMessage', ''),
      NULLIF(br.snapshot->>'welcomeMessage', ''),
      bs.image_welcome_message,
      bs.login_welcome_message,
      'Bienvenidos a esta experiencia de transformación 4Shine.'
    ),
  'imageLoginHeadline',
    COALESCE(
      NULLIF(br.snapshot->>'imageLoginHeadline', ''),
      NULLIF(br.snapshot->>'loginHeadline', ''),
      bs.image_login_headline,
      bs.login_headline,
      'Bienvenidos a una nueva experiencia de aprendizaje'
    ),
  'imageLoginSupportMessage',
    COALESCE(
      NULLIF(br.snapshot->>'imageLoginSupportMessage', ''),
      NULLIF(br.snapshot->>'loginSupportMessage', ''),
      bs.image_login_support_message,
      bs.login_support_message,
      'Pensado para plataforma web y app móvil.'
    ),
  'showImageWelcomeMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageWelcomeMessage')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showWelcomeMessage')::boolean
      ELSE COALESCE(bs.show_image_welcome_message, bs.show_welcome_message, true)
    END,
  'showImageLoginHeadline',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageLoginHeadline')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginHeadline')::boolean
      ELSE COALESCE(bs.show_image_login_headline, bs.show_login_headline, true)
    END,
  'showImageLoginSupportMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageLoginSupportMessage')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginSupportMessage')::boolean
      ELSE COALESCE(bs.show_image_login_support_message, bs.show_login_support_message, true)
    END
)
FROM app_admin.branding_settings bs
WHERE bs.organization_id = br.organization_id;

UPDATE app_admin.branding_revisions br
SET snapshot = COALESCE(br.snapshot, '{}'::jsonb) || jsonb_build_object(
  'imageWelcomeMessage',
    COALESCE(
      NULLIF(br.snapshot->>'imageWelcomeMessage', ''),
      NULLIF(br.snapshot->>'welcomeMessage', ''),
      'Bienvenidos a esta experiencia de transformación 4Shine.'
    ),
  'imageLoginHeadline',
    COALESCE(
      NULLIF(br.snapshot->>'imageLoginHeadline', ''),
      NULLIF(br.snapshot->>'loginHeadline', ''),
      'Bienvenidos a una nueva experiencia de aprendizaje'
    ),
  'imageLoginSupportMessage',
    COALESCE(
      NULLIF(br.snapshot->>'imageLoginSupportMessage', ''),
      NULLIF(br.snapshot->>'loginSupportMessage', ''),
      'Pensado para plataforma web y app móvil.'
    ),
  'showImageWelcomeMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageWelcomeMessage')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showWelcomeMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showWelcomeMessage')::boolean
      ELSE true
    END,
  'showImageLoginHeadline',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageLoginHeadline')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showLoginHeadline', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginHeadline')::boolean
      ELSE true
    END,
  'showImageLoginSupportMessage',
    CASE
      WHEN lower(COALESCE(br.snapshot->>'showImageLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showImageLoginSupportMessage')::boolean
      WHEN lower(COALESCE(br.snapshot->>'showLoginSupportMessage', '')) IN ('true', 'false') THEN
        (br.snapshot->>'showLoginSupportMessage')::boolean
      ELSE true
    END
)
WHERE NOT EXISTS (
  SELECT 1
  FROM app_admin.branding_settings bs
  WHERE bs.organization_id = br.organization_id
);
