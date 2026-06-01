-- Extiende los preset_code permitidos para incluir la identidad de marca 4Shine
-- (Dorado Premium, Champagne Soft, Azul Profundo, Azul Élite — Manrope / Outfit).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'branding_settings_preset_code_chk'
      AND conrelid = 'app_admin.branding_settings'::regclass
  ) THEN
    ALTER TABLE app_admin.branding_settings
      DROP CONSTRAINT branding_settings_preset_code_chk;
  END IF;

  ALTER TABLE app_admin.branding_settings
    ADD CONSTRAINT branding_settings_preset_code_chk
    CHECK (preset_code IN (
      '4shine_premium',
      '4shine_dark',
      'corporativo',
      'energetico',
      'tech',
      'custom'
    ));
END;
$$;

-- Sembrar / actualizar la fila de branding por defecto con la paleta 4Shine
-- siempre que el operador aún esté en valores stock (corporativo + slate).
UPDATE app_admin.branding_settings
SET
  preset_code      = '4shine_premium',
  primary_color    = '#0D1B2A',
  secondary_color  = '#1A1F2B',
  accent_color     = '#D4AF37',
  typography       = 'Manrope',
  border_radius_rem = 0.75,
  login_overlay_color = '#0D1B2A',
  login_overlay_opacity = 0.55,
  platform_name    = COALESCE(NULLIF(platform_name, ''), '4Shine'),
  logo_url         = COALESCE(NULLIF(logo_url, ''), '/branding/4shine-logo-blanco.png'),
  favicon_url      = COALESCE(NULLIF(favicon_url, ''), '/branding/4shine-isotipo-amarillo.png'),
  login_background_image_url = COALESCE(NULLIF(login_background_image_url, ''), '/branding/4shine-login-bg-manual.png'),
  login_background_image_urls = CASE
    WHEN login_background_image_urls IS NULL OR array_length(login_background_image_urls, 1) IS NULL
      THEN ARRAY['/branding/4shine-login-bg-manual.png']::text[]
    ELSE login_background_image_urls
  END,
  login_image_urls = CASE
    WHEN login_image_urls IS NULL OR array_length(login_image_urls, 1) IS NULL
      THEN ARRAY['/branding/4shine-login-bg-manual.png']::text[]
    ELSE login_image_urls
  END,
  updated_at       = NOW()
WHERE preset_code IN ('corporativo', 'custom')
  AND lower(primary_color) IN ('#0f172a', '#1e293b');
