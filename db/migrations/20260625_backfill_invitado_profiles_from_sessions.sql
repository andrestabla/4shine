-- ============================================================
-- Backfill: perfiles de usuarios invitados desde sus discovery_sessions.
--
-- Contexto: los datos demográficos que un invitado diligencia antes del
-- diagnóstico (país, cargo, género, años de experiencia, nombre) se
-- guardaban solo en app_assessment.discovery_sessions — el perfil real
-- (app_core.user_profiles) quedaba con los placeholders del provisioning
-- ("No definido", cargo default, 0 años). El fix de código sincroniza en
-- adelante; esta migración repara a los invitados ya existentes.
--
-- Política: para usuarios con primary_role='invitado', el dato de la
-- sesión (si es no-vacío) SOBREESCRIBE el del perfil — el perfil solo
-- contiene placeholders de provisioning, nunca datos curados. Los roles
-- no-invitado NO se tocan.
--
-- Idempotente: re-ejecutarla produce el mismo resultado.
-- ============================================================

BEGIN;

-- 1) Demografía: user_profiles <- discovery_sessions (solo invitados,
--    solo campos con dato real en la sesión).
UPDATE app_core.user_profiles up
SET
  country = CASE
    WHEN NULLIF(BTRIM(ds.country), '') IS NOT NULL THEN ds.country
    ELSE up.country
  END,
  job_role = CASE
    WHEN NULLIF(BTRIM(ds.job_role), '') IS NOT NULL THEN ds.job_role
    ELSE up.job_role
  END,
  gender = CASE
    WHEN NULLIF(BTRIM(ds.gender), '') IS NOT NULL THEN ds.gender
    ELSE up.gender
  END,
  years_experience = COALESCE(ds.years_experience, up.years_experience),
  updated_at = now()
FROM app_assessment.discovery_sessions ds
JOIN app_core.users u ON u.user_id = ds.user_id
WHERE up.user_id = ds.user_id
  AND u.primary_role = 'invitado'
  AND (
    NULLIF(BTRIM(ds.country), '') IS NOT NULL
    OR NULLIF(BTRIM(ds.job_role), '') IS NOT NULL
    OR NULLIF(BTRIM(ds.gender), '') IS NOT NULL
    OR ds.years_experience IS NOT NULL
  );

-- 2) Nombre: users <- discovery_sessions cuando la sesión tiene nombre y
--    apellido reales (el invitado los escribió en el paso de perfil).
UPDATE app_core.users u
SET
  first_name = ds.first_name,
  last_name = ds.last_name,
  display_name = BTRIM(ds.first_name || ' ' || ds.last_name),
  avatar_initial = UPPER(LEFT(BTRIM(ds.first_name || ' ' || ds.last_name), 1)),
  updated_at = now()
FROM app_assessment.discovery_sessions ds
WHERE ds.user_id = u.user_id
  AND u.primary_role = 'invitado'
  AND NULLIF(BTRIM(ds.first_name), '') IS NOT NULL
  AND NULLIF(BTRIM(ds.last_name), '') IS NOT NULL;

COMMIT;
