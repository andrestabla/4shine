-- Restaura el reconocimiento del MODELO DINÁMICO de planes en
-- app_mentoring.user_has_program_access.
--
-- Problema: en producción la función quedó con la versión LEGACY-ONLY
-- (solo plan_type IN ('premium','vip','empresa_elite') o compras
-- product_group='program'). La migración 20260610 que agrega el branch de
-- subscription_plan_id nunca tomó efecto en prod (no hay tabla de tracking;
-- probablemente no se corrió). Resultado: líderes con plan dinámico que
-- incluye la feature `mentorias_1on1` (p. ej. Daniel Artico / "Programa CEO
-- Signature" con quota=10, y también Ana Milena, Diego, John) tenían
-- user_has_program_access = false y 0 filas en user_program_mentorships, por
-- lo que "Agendar mentoría 1:1 → Incluida del programa" salía deshabilitado
-- con "Este líder no tiene mentorías del programa disponibles".
--
-- Esta migración:
--   1. Redefine user_has_program_access con el branch del modelo nuevo
--      (subscription_plan_id → plan_module_features.mentorias_1on1 con
--      is_enabled y quota > 0, y suscripción vigente).
--   2. Re-sincroniza los entitlements de TODOS los líderes (idempotente:
--      sync_program_mentorships_for_user usa ON CONFLICT DO NOTHING y solo
--      borra los 'available' sin sesión agendada cuando ya no hay acceso).

BEGIN;

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
            -- Modelo nuevo: subscription_plan_id con mentorias_1on1 habilitado,
            -- quota > 0 y suscripción vigente.
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
'compra comercial, o subscription_plan_id con mentorias_1on1 habilitado (quota > 0).';

-- Backfill: re-sincroniza a todos los líderes existentes.
SELECT app_mentoring.sync_program_mentorships_for_user(u.user_id)
FROM app_core.users u
WHERE u.primary_role = 'lider';

COMMIT;
