BEGIN;

ALTER TABLE app_core.user_profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS job_role text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS years_experience integer;

ALTER TABLE app_core.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_job_role_check;
ALTER TABLE app_core.user_profiles
  ADD CONSTRAINT user_profiles_job_role_check
  CHECK (
    job_role IS NULL
    OR job_role IN (
      'Director/C-Level',
      'Gerente/Mando medio',
      'Coordinador',
      'Lider de proyecto con equipo a cargo',
      'Especialista sin personal a cargo'
    )
  );

ALTER TABLE app_core.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_years_experience_check;
ALTER TABLE app_core.user_profiles
  ADD CONSTRAINT user_profiles_years_experience_check
  CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 80));

INSERT INTO app_core.user_profiles (
  user_id,
  country,
  job_role,
  gender,
  years_experience
)
SELECT u.user_id
     , 'No definido'
     , 'Especialista sin personal a cargo'
     , 'Prefiero no decirlo'
     , 0
FROM app_core.users u
ON CONFLICT (user_id) DO NOTHING;

WITH latest_sessions AS (
  SELECT DISTINCT ON (ds.user_id)
    ds.user_id,
    NULLIF(BTRIM(ds.country), '') AS country,
    CASE
      WHEN ds.job_role IN (
        'Director/C-Level',
        'Gerente/Mando medio',
        'Coordinador',
        'Lider de proyecto con equipo a cargo',
        'Especialista sin personal a cargo'
      ) THEN ds.job_role
      WHEN ds.job_role = 'Gerente/Mand medio' THEN 'Gerente/Mando medio'
      WHEN ds.job_role = 'Individual contributor' THEN 'Especialista sin personal a cargo'
      ELSE NULL
    END AS job_role,
    CASE
      WHEN ds.years_experience BETWEEN 0 AND 80 THEN ds.years_experience
      ELSE NULL
    END AS years_experience
  FROM app_assessment.discovery_sessions ds
  WHERE ds.user_id IS NOT NULL
  ORDER BY ds.user_id, ds.updated_at DESC
)
UPDATE app_core.user_profiles up
SET
  country = COALESCE(latest_sessions.country, NULLIF(BTRIM(up.country), ''), 'No definido'),
  job_role = COALESCE(latest_sessions.job_role, up.job_role, 'Especialista sin personal a cargo'),
  gender = COALESCE(NULLIF(BTRIM(up.gender), ''), 'Prefiero no decirlo'),
  years_experience = COALESCE(latest_sessions.years_experience, up.years_experience, 0),
  updated_at = now()
FROM latest_sessions
WHERE up.user_id = latest_sessions.user_id
  AND (
    latest_sessions.country IS NOT NULL
    OR latest_sessions.job_role IS NOT NULL
    OR latest_sessions.years_experience IS NOT NULL
  );

COMMIT;
