-- Kicker del banner: la línea superior pequeña en mayúsculas de los heros
-- (p. ej. "BIENVENIDO, ANDRÉS"). Los textos del banner aceptan el token
-- {{nombre}}, que el runtime sustituye por el nombre del usuario.
-- Idempotente.

ALTER TABLE app_admin.popups
  ADD COLUMN IF NOT EXISTS banner_kicker text NOT NULL DEFAULT '';
