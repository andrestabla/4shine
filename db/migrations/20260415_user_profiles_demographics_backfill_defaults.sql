BEGIN;

INSERT INTO app_core.user_profiles (
  user_id,
  country,
  job_role,
  age,
  years_experience
)
SELECT u.user_id
     , 'No definido'
     , 'Individual contributor'
     , 30
     , 0
FROM app_core.users u
ON CONFLICT (user_id) DO NOTHING;

UPDATE app_core.user_profiles up
SET
  country = COALESCE(NULLIF(BTRIM(up.country), ''), 'No definido'),
  job_role = CASE
    WHEN up.job_role = 'Gerente/Mand medio' THEN 'Gerente/Mando medio'
    WHEN up.job_role IN (
      'Director/C-Level',
      'Gerente/Mando medio',
      'Coordinador',
      'Lider de proyecto con equipo a cargo',
      'Individual contributor'
    ) THEN up.job_role
    ELSE 'Individual contributor'
  END,
  age = CASE
    WHEN up.age BETWEEN 16 AND 100 THEN up.age
    ELSE 30
  END,
  years_experience = CASE
    WHEN up.years_experience BETWEEN 0 AND 80 THEN up.years_experience
    ELSE 0
  END,
  updated_at = now()
WHERE
  up.country IS NULL
  OR BTRIM(up.country) = ''
  OR up.job_role IS NULL
  OR up.job_role = 'Gerente/Mand medio'
  OR up.job_role NOT IN (
    'Director/C-Level',
    'Gerente/Mando medio',
    'Coordinador',
    'Lider de proyecto con equipo a cargo',
    'Individual contributor'
  )
  OR up.age IS NULL
  OR up.age < 16
  OR up.age > 100
  OR up.years_experience IS NULL
  OR up.years_experience < 0
  OR up.years_experience > 80;

UPDATE app_assessment.discovery_sessions ds
SET
  job_role = CASE
    WHEN ds.job_role = 'Gerente/Mand medio' THEN 'Gerente/Mando medio'
    ELSE ds.job_role
  END,
  country = COALESCE(NULLIF(BTRIM(ds.country), ''), 'No definido'),
  age = CASE
    WHEN ds.age BETWEEN 16 AND 100 THEN ds.age
    ELSE 30
  END,
  years_experience = CASE
    WHEN ds.years_experience BETWEEN 0 AND 80 THEN ds.years_experience
    ELSE 0
  END,
  updated_at = now()
WHERE
  ds.job_role = 'Gerente/Mand medio'
  OR ds.country IS NULL
  OR BTRIM(ds.country) = ''
  OR ds.age IS NULL
  OR ds.age < 16
  OR ds.age > 100
  OR ds.years_experience IS NULL
  OR ds.years_experience < 0
  OR ds.years_experience > 80;

COMMIT;
