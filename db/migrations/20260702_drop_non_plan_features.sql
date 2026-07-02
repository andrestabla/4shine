-- Limpia las features que NO dependen del plan (están disponibles para todos
-- los líderes): 'aprendizaje_recursos_free' (recursos free siempre libres) y
-- 'mentorias_comprar' (comprar mentorías extra siempre disponible). Eran toggles
-- inertes en /administracion/planes (ningún código los consultaba). Se quitaron
-- del catálogo en features-catalog.ts; aquí borramos las filas huérfanas.

BEGIN;

DELETE FROM app_billing.plan_module_features
WHERE feature_key IN ('aprendizaje_recursos_free', 'mentorias_comprar');

COMMIT;
