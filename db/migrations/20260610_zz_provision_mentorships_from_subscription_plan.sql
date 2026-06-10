-- Provisiona las mentorías del programa cuando un líder activa un plan del
-- modelo nuevo (`app_billing.subscription_plans`) cuya feature
-- `mentorias_1on1` tiene quota > 0.
--
-- Contexto: la función `app_mentoring.user_has_program_access` definida en
-- 20260320_zz_leader_creation_permissions_and_program_entitlements.sql solo
-- contempla el modelo legacy de acceso:
--     - up.plan_type IN ('premium', 'vip', 'empresa_elite')
--     - compras en app_billing.user_purchases con product_group = 'program'
--
-- A partir del modelo dinámico de planes (20260527_subscription_plans.sql)
-- los líderes activan una suscripción guardando `subscription_plan_id` en
-- `user_profiles`, y el catálogo decide qué módulos incluye via
-- `plan_module_features.feature_key = 'mentorias_1on1'`.
--
-- Sin este puente, suscribirse al plan NO disparaba la creación de las 10
-- filas en `app_mentoring.user_program_mentorships`, por lo que los líderes
-- veían 0 sesiones (caso reportado por john.viracacha@gmail.com en el
-- plan "Programa Marca Ejecutiva").
--
-- Esta migración:
--   1. Redefine `user_has_program_access` para reconocer el modelo nuevo.
--   2. Añade un trigger en `user_profiles.subscription_plan_id` /
--      `subscription_expires_at` para disparar el sync cuando cambian.
--   3. Re-ejecuta el sync para todos los líderes (backfill de John y
--      cualquier otro líder que ya esté suscrito pero sin entitlements).

BEGIN;

-- 1) Acceso al programa: agregamos el branch de subscription_plan_id.
--    Una suscripción está activa cuando subscription_expires_at es nulo
--    o aún no ha vencido. Si el plan tiene `mentorias_1on1` con quota > 0
--    y is_enabled = true, el líder queda con acceso al programa.
CREATE OR REPLACE FUNCTION app_mentoring.user_has_program_access(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM app_core.users u
        LEFT JOIN app_core.user_profiles up
          ON up.user_id = u.user_id
        WHERE u.user_id = target_user_id
          AND u.primary_role = 'lider'
          AND u.is_active = true
          AND (
            -- Modelo legacy: plan_type fijo
            up.plan_type IN ('premium', 'vip', 'empresa_elite')
            -- Modelo legacy: compras de producto "program"
            OR EXISTS (
                SELECT 1
                FROM app_billing.user_purchases purchase
                JOIN app_billing.product_catalog catalog
                  ON catalog.product_code = purchase.product_code
                WHERE purchase.user_id = u.user_id
                  AND purchase.status = 'active'
                  AND catalog.product_group = 'program'
            )
            -- Modelo nuevo: subscription_plan_id apuntando a un plan
            -- cuya feature mentorias_1on1 está habilitada con quota > 0
            -- y la suscripción no ha vencido.
            OR EXISTS (
                SELECT 1
                FROM app_billing.plan_module_features pmf
                WHERE pmf.plan_id = up.subscription_plan_id
                  AND pmf.feature_key = 'mentorias_1on1'
                  AND pmf.is_enabled = true
                  AND COALESCE(pmf.quota, 0) > 0
                  AND (
                    up.subscription_expires_at IS NULL
                    OR up.subscription_expires_at >= now()
                  )
            )
          )
    );
$$;

COMMENT ON FUNCTION app_mentoring.user_has_program_access(uuid) IS
'Determina si un líder tiene acceso activo al programa por plan_type legacy, '
'compra comercial, o subscription_plan_id con mentorias_1on1 habilitado.';

-- 2) Trigger nuevo: cuando cambia subscription_plan_id o
--    subscription_expires_at en user_profiles, re-sincronizamos las
--    mentorías. La función handle_user_profile_program_access_sync ya
--    existe (la creó la migración anterior), solo le ampliamos las
--    columnas que escucha.
DROP TRIGGER IF EXISTS trg_sync_program_mentorships_on_profile ON app_core.user_profiles;
CREATE TRIGGER trg_sync_program_mentorships_on_profile
AFTER INSERT OR UPDATE OF plan_type, subscription_plan_id, subscription_expires_at
ON app_core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_profile_program_access_sync();

-- 3) Backfill: re-sincroniza a todos los líderes ya existentes. La función
--    sync_program_mentorships_for_user es idempotente (usa
--    ON CONFLICT DO NOTHING) y limpia entitlements 'available' sin
--    sesión agendada cuando el acceso ya no aplica. Es seguro re-correr
--    cada vez que se aplica esta migración.
SELECT app_mentoring.sync_program_mentorships_for_user(u.user_id)
FROM app_core.users u
WHERE u.primary_role = 'lider';

COMMIT;
