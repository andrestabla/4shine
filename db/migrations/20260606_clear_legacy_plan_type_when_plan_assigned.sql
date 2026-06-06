-- Limpia plan_type legacy en líderes que ya tienen subscription_plan_id
-- asignado. La fuente de verdad para el acceso pasa a ser
-- app_billing.subscription_plans + plan_module_features, y plan_type
-- contaminaba la decisión de grants legacy en getViewerAccessState.
--
-- Líderes sin subscription_plan_id mantienen su plan_type como hasta
-- ahora (fallback legacy hasta migración manual del admin).

BEGIN;

UPDATE app_core.user_profiles up
SET plan_type = NULL,
    updated_at = now()
WHERE up.subscription_plan_id IS NOT NULL
  AND up.plan_type IS NOT NULL;

COMMIT;
