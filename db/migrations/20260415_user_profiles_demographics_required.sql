BEGIN;

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

  IF NEW.age IS NULL THEN
    RAISE EXCEPTION 'age is required in app_core.user_profiles';
  END IF;

  IF NEW.years_experience IS NULL THEN
    RAISE EXCEPTION 'years_experience is required in app_core.user_profiles';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_require_demographics ON app_core.user_profiles;
CREATE TRIGGER trg_user_profiles_require_demographics
BEFORE INSERT OR UPDATE ON app_core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION app_core.enforce_user_profile_demographics_required();

COMMIT;
