-- ============================================================
-- Forzar cambio de contraseña en el próximo ingreso.
-- Flag en las credenciales del usuario; el login/me lo exponen y
-- el dashboard redirige a /cambiar-clave hasta que se restablezca.
-- ============================================================
-- Idempotente.

ALTER TABLE app_auth.user_credentials
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
