-- Personalización visual de banners: colores propios, imagen de fondo y altura.
--
-- banner_style gana la variante 'custom' (usa los colores banner_*); con
-- banner_image_url la imagen va de fondo (cover) con un velo del degradado
-- para legibilidad. banner_min_height en px (0 = altura automática).
--
-- Idempotente.

ALTER TABLE app_admin.popups
  ADD COLUMN IF NOT EXISTS banner_bg_start text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_bg_end text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_text_color text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_cta_color text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_min_height int NOT NULL DEFAULT 0
    CHECK (banner_min_height >= 0 AND banner_min_height <= 640);

ALTER TABLE app_admin.popups DROP CONSTRAINT IF EXISTS popups_banner_style_check;
ALTER TABLE app_admin.popups ADD CONSTRAINT popups_banner_style_check
  CHECK (banner_style IN ('brand', 'gold', 'navy', 'light', 'custom'));
