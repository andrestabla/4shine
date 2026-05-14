-- Backfill: create mentor rows for any user with role='mentor' who lacks one
INSERT INTO app_mentoring.mentors (mentor_user_id)
SELECT u.user_id
FROM app_core.users u
WHERE u.primary_role = 'mentor'
  AND NOT EXISTS (
    SELECT 1 FROM app_mentoring.mentors m WHERE m.mentor_user_id = u.user_id
  );

-- Trigger: auto-create a mentors row whenever a user's role is set to 'mentor'
CREATE OR REPLACE FUNCTION app_core.ensure_mentor_row()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.primary_role = 'mentor' THEN
    INSERT INTO app_mentoring.mentors (mentor_user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (mentor_user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_mentor_row ON app_core.users;
CREATE TRIGGER trg_ensure_mentor_row
AFTER INSERT OR UPDATE OF primary_role ON app_core.users
FOR EACH ROW EXECUTE FUNCTION app_core.ensure_mentor_row();
