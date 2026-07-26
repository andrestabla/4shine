-- Garantiza que el aprovisionamiento de mentorías 1:1 del programa se dispare
-- SIEMPRE que se asigna o cambia un plan.
--
-- Problema: el trigger vivo en producción solo disparaba en UPDATE OF plan_type.
-- Pero asignar un plan (updateUser, bulkAssignPlan, webhook de GHL) actualiza
-- subscription_plan_id — NO necesariamente plan_type —, así que el trigger no
-- corría y el líder quedaba con acceso pero SIN sesiones que reservar (caso de
-- Carmenza Alarcón). La migración 20260610, que ampliaba las columnas, nunca se
-- aplicó en producción.
--
-- La función del trigger (sync_program_mentorships_for_user) ya se auto-limita:
-- crea las sesiones solo si user_has_program_access() es verdadero, y las borra
-- si no. Por eso es seguro dispararla de más — nunca da 1:1 a quien no lo tiene.

-- 1) Ampliar las columnas que disparan el trigger en user_profiles.
DROP TRIGGER IF EXISTS trg_sync_program_mentorships_on_profile ON app_core.user_profiles;
CREATE TRIGGER trg_sync_program_mentorships_on_profile
AFTER INSERT OR UPDATE OF plan_type, subscription_plan_id, subscription_expires_at
ON app_core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_program_mentorship_seed();

-- 2) Backfill: sincroniza a TODO líder activo. La función decide fila por fila
--    quién recibe sesiones (los que tienen mentorias_1on1) y a quién se le
--    limpian (los que no) — corrige los desfases históricos de una sola vez.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id FROM app_core.users WHERE primary_role = 'lider' AND is_active
  LOOP
    PERFORM app_mentoring.sync_program_mentorships_for_user(r.user_id);
  END LOOP;
END $$;
