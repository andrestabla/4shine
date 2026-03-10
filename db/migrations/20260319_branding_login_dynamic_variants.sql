-- =========================================================
-- BRANDING LOGIN DYNAMIC VARIANTS (RANDOM BACKGROUNDS + MESSAGES)
-- =========================================================

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS login_background_image_urls text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS login_image_urls text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_welcome_messages text[] NOT NULL DEFAULT '{}'::text[];

UPDATE app_admin.branding_settings bs
SET
  login_background_image_urls = COALESCE(
    (
      SELECT ARRAY(
        SELECT DISTINCT cleaned.value
        FROM (
          SELECT NULLIF(BTRIM(item), '') AS value
          FROM unnest(
            CASE
              WHEN COALESCE(array_length(bs.login_background_image_urls, 1), 0) > 0
                THEN bs.login_background_image_urls
              ELSE ARRAY[bs.login_background_image_url]
            END
          ) AS item
        ) cleaned
        WHERE cleaned.value IS NOT NULL
        LIMIT 20
      )
    ),
    '{}'::text[]
  ),
  login_image_urls = COALESCE(
    (
      SELECT ARRAY(
        SELECT DISTINCT cleaned.value
        FROM (
          SELECT NULLIF(BTRIM(item), '') AS value
          FROM unnest(
            CASE
              WHEN COALESCE(array_length(bs.login_image_urls, 1), 0) > 0
                THEN bs.login_image_urls
              WHEN COALESCE(array_length(bs.login_background_image_urls, 1), 0) > 0
                THEN bs.login_background_image_urls
              ELSE ARRAY[bs.login_background_image_url]
            END
          ) AS item
        ) cleaned
        WHERE cleaned.value IS NOT NULL
        LIMIT 20
      )
    ),
    '{}'::text[]
  ),
  image_welcome_messages = COALESCE(
    (
      SELECT ARRAY(
        SELECT DISTINCT cleaned.value
        FROM (
          SELECT NULLIF(BTRIM(item), '') AS value
          FROM unnest(
            CASE
              WHEN COALESCE(array_length(bs.image_welcome_messages, 1), 0) > 0
                THEN bs.image_welcome_messages
              ELSE ARRAY[bs.image_welcome_message]
            END
          ) AS item
        ) cleaned
        WHERE cleaned.value IS NOT NULL
        LIMIT 20
      )
    ),
    '{}'::text[]
  );

UPDATE app_admin.branding_settings bs
SET
  login_background_image_url = COALESCE(
    NULLIF(bs.login_background_image_url, ''),
    bs.login_background_image_urls[1],
    bs.login_image_urls[1],
    ''
  ),
  image_welcome_message = COALESCE(
    NULLIF(bs.image_welcome_message, ''),
    bs.image_welcome_messages[1],
    'Bienvenidos a esta experiencia de transformación 4Shine.'
  );

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
  bs.login_background_image_urls,
  bs.login_image_urls,
  bs.image_welcome_messages,
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
  'loginBackgroundImageUrls',
    CASE
      WHEN jsonb_typeof(br.snapshot->'loginBackgroundImageUrls') = 'array' THEN br.snapshot->'loginBackgroundImageUrls'
      WHEN COALESCE(br.snapshot->>'loginBackgroundImageUrl', '') <> '' THEN jsonb_build_array(br.snapshot->>'loginBackgroundImageUrl')
      WHEN COALESCE(array_length(bs.login_background_image_urls, 1), 0) > 0 THEN to_jsonb(bs.login_background_image_urls)
      WHEN COALESCE(bs.login_background_image_url, '') <> '' THEN jsonb_build_array(bs.login_background_image_url)
      ELSE '[]'::jsonb
    END,
  'loginImageUrls',
    CASE
      WHEN jsonb_typeof(br.snapshot->'loginImageUrls') = 'array' THEN br.snapshot->'loginImageUrls'
      WHEN COALESCE(array_length(bs.login_image_urls, 1), 0) > 0 THEN to_jsonb(bs.login_image_urls)
      WHEN COALESCE(array_length(bs.login_background_image_urls, 1), 0) > 0 THEN to_jsonb(bs.login_background_image_urls)
      WHEN COALESCE(bs.login_background_image_url, '') <> '' THEN jsonb_build_array(bs.login_background_image_url)
      ELSE '[]'::jsonb
    END,
  'imageWelcomeMessages',
    CASE
      WHEN jsonb_typeof(br.snapshot->'imageWelcomeMessages') = 'array' THEN br.snapshot->'imageWelcomeMessages'
      WHEN COALESCE(br.snapshot->>'imageWelcomeMessage', '') <> '' THEN jsonb_build_array(br.snapshot->>'imageWelcomeMessage')
      WHEN COALESCE(array_length(bs.image_welcome_messages, 1), 0) > 0 THEN to_jsonb(bs.image_welcome_messages)
      WHEN COALESCE(bs.image_welcome_message, '') <> '' THEN jsonb_build_array(bs.image_welcome_message)
      ELSE '[]'::jsonb
    END
)
FROM app_admin.branding_settings bs
WHERE bs.organization_id = br.organization_id;

UPDATE app_admin.branding_revisions br
SET snapshot = COALESCE(br.snapshot, '{}'::jsonb) || jsonb_build_object(
  'loginBackgroundImageUrls',
    CASE
      WHEN jsonb_typeof(br.snapshot->'loginBackgroundImageUrls') = 'array' THEN br.snapshot->'loginBackgroundImageUrls'
      WHEN COALESCE(br.snapshot->>'loginBackgroundImageUrl', '') <> '' THEN jsonb_build_array(br.snapshot->>'loginBackgroundImageUrl')
      ELSE '[]'::jsonb
    END,
  'loginImageUrls',
    CASE
      WHEN jsonb_typeof(br.snapshot->'loginImageUrls') = 'array' THEN br.snapshot->'loginImageUrls'
      WHEN COALESCE(br.snapshot->>'loginBackgroundImageUrl', '') <> '' THEN jsonb_build_array(br.snapshot->>'loginBackgroundImageUrl')
      ELSE '[]'::jsonb
    END,
  'imageWelcomeMessages',
    CASE
      WHEN jsonb_typeof(br.snapshot->'imageWelcomeMessages') = 'array' THEN br.snapshot->'imageWelcomeMessages'
      WHEN COALESCE(br.snapshot->>'imageWelcomeMessage', '') <> '' THEN jsonb_build_array(br.snapshot->>'imageWelcomeMessage')
      ELSE '[]'::jsonb
    END
)
WHERE NOT EXISTS (
  SELECT 1
  FROM app_admin.branding_settings bs
  WHERE bs.organization_id = br.organization_id
);
