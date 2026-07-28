-- Constructor de banners premium sobre el sistema de popups.
--
-- Un "banner" es el mismo registro de app_admin.popups con display_mode='banner':
-- en vez de un modal emergente, se muestra en línea en la parte superior del
-- módulo objetivo. Se agrega también la audiencia por estado de suscripción
-- (p. ej. "líderes SIN suscripción" para el banner de compra de sesiones),
-- que target_plans (planes concretos) no podía expresar.
--
-- Idempotente.

ALTER TABLE app_admin.popups
  ADD COLUMN IF NOT EXISTS display_mode text NOT NULL DEFAULT 'popup',
  ADD COLUMN IF NOT EXISTS banner_style text NOT NULL DEFAULT 'brand',
  ADD COLUMN IF NOT EXISTS target_subscription text NOT NULL DEFAULT 'any';

ALTER TABLE app_admin.popups DROP CONSTRAINT IF EXISTS popups_display_mode_check;
ALTER TABLE app_admin.popups ADD CONSTRAINT popups_display_mode_check
  CHECK (display_mode IN ('popup', 'banner'));

ALTER TABLE app_admin.popups DROP CONSTRAINT IF EXISTS popups_banner_style_check;
ALTER TABLE app_admin.popups ADD CONSTRAINT popups_banner_style_check
  CHECK (banner_style IN ('brand', 'gold', 'navy', 'light'));

ALTER TABLE app_admin.popups DROP CONSTRAINT IF EXISTS popups_target_subscription_check;
ALTER TABLE app_admin.popups ADD CONSTRAINT popups_target_subscription_check
  CHECK (target_subscription IN ('any', 'without_plan', 'with_plan'));
