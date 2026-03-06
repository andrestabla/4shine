-- =========================================================
-- USER AVATAR URL (R2 PROFILE PHOTO)
-- =========================================================

ALTER TABLE app_core.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

UPDATE app_core.users
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL
  AND btrim(avatar_url) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_avatar_url_len_chk'
      AND conrelid = 'app_core.users'::regclass
  ) THEN
    ALTER TABLE app_core.users
      ADD CONSTRAINT users_avatar_url_len_chk
      CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2000);
  END IF;
END $$;
