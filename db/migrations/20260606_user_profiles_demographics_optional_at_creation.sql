-- Permite crear usuarios manualmente con país/cargo/género/años_experiencia
-- en NULL. La obligación se traslada al onboarding del primer ingreso
-- (dashboard/layout.tsx) y al asistente de actualización de perfil, no al
-- nivel de fila en la base.
--
-- Contexto: 20260415_user_profiles_demographics_required.sql instalaba un
-- trigger BEFORE INSERT OR UPDATE que rechazaba toda fila con esos campos
-- en NULL. Eso impedía que el admin creara cuentas desde /usuarios/nuevo
-- sin pedir información demográfica que es propia del usuario.

BEGIN;

DROP TRIGGER IF EXISTS trg_user_profiles_require_demographics
  ON app_core.user_profiles;

DROP FUNCTION IF EXISTS app_core.enforce_user_profile_demographics_required();

COMMENT ON COLUMN app_core.user_profiles.country IS
  'Opcional al crear; obligatorio en el onboarding del primer ingreso.';
COMMENT ON COLUMN app_core.user_profiles.job_role IS
  'Opcional al crear; obligatorio en el onboarding del primer ingreso.';
COMMENT ON COLUMN app_core.user_profiles.gender IS
  'Opcional al crear; obligatorio en el onboarding del primer ingreso.';
COMMENT ON COLUMN app_core.user_profiles.years_experience IS
  'Opcional al crear; obligatorio en el onboarding del primer ingreso.';

COMMIT;
