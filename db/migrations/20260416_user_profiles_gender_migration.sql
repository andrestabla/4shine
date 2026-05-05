-- Migration: Clean up gender and job role data and update triggers
-- Created: 2026-04-16

-- 1. Update the trigger function to use gender instead of age
CREATE OR REPLACE FUNCTION app_core.enforce_user_profile_demographics_required()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.country IS NULL OR btrim(NEW.country) = '' THEN
    RAISE EXCEPTION 'country is required in app_core.user_profiles';
  END IF;

  IF NEW.job_role IS NULL THEN
    RAISE EXCEPTION 'job_role is required in app_core.user_profiles';
  END IF;

  IF NEW.gender IS NULL THEN
    RAISE EXCEPTION 'gender is required in app_core.user_profiles';
  END IF;

  IF NEW.years_experience IS NULL THEN
    RAISE EXCEPTION 'years_experience is required in app_core.user_profiles';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Reset numeric ages in gender column to a default text value
UPDATE app_assessment.discovery_sessions SET gender = 'Prefiero no decirlo' WHERE gender ~ '^[0-9]+$';
UPDATE app_core.user_profiles SET gender = 'Prefiero no decirlo' WHERE gender ~ '^[0-9]+$';

-- 2.1 Ensure discovery job role constraint accepts both legacy and normalized labels
ALTER TABLE app_assessment.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_job_role_check;

ALTER TABLE app_assessment.discovery_sessions
  ADD CONSTRAINT discovery_sessions_job_role_check
  CHECK (
    job_role IS NULL
    OR job_role IN (
      'Director/C-Level',
      'Gerente/Mand medio',
      'Gerente/Mando medio',
      'Coordinador',
      'Lider de proyecto con equipo a cargo',
      'Individual contributor',
      'Especialista sin personal a cargo'
    )
  );

-- 3. Normalize NULL or empty values
UPDATE app_assessment.discovery_sessions SET gender = 'Prefiero no decirlo' WHERE gender IS NULL OR gender = '';
UPDATE app_core.user_profiles SET gender = 'Prefiero no decirlo' WHERE gender IS NULL OR gender = '';

-- 4. Update Job Role nomenclature in existing data
UPDATE app_assessment.discovery_sessions SET job_role = 'Especialista sin personal a cargo' WHERE job_role = 'Individual contributor';
UPDATE app_core.user_profiles SET job_role = 'Especialista sin personal a cargo' WHERE job_role = 'Individual contributor';

