-- Logo alternativo para fondos oscuros (heros, sidebar dark, footer dark, etc).
-- El logoUrl existente se usa sobre fondos claros; logo_dark_url sobre oscuros.

ALTER TABLE app_admin.branding_settings
  ADD COLUMN IF NOT EXISTS logo_dark_url text NOT NULL DEFAULT '';

-- Sembrar el logo amarillo como default solo si todavía no hay nada y la org
-- está en preset 4shine (preserva customizaciones de otras orgs).
UPDATE app_admin.branding_settings
SET logo_dark_url = '/branding/4shine-logo-amarillo.png'
WHERE (logo_dark_url IS NULL OR logo_dark_url = '')
  AND preset_code IN ('4shine_premium', '4shine_dark');
