-- Email verification for self-registered users.
-- Stores a hashed token and expiry on the credentials row.
-- Existing users (created by admins or via Google) are pre-verified.

ALTER TABLE app_auth.user_credentials
  ADD COLUMN IF NOT EXISTS email_verified_at       TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Pre-verify all existing accounts (admin-created or Google) so current
-- users are not locked out.
UPDATE app_auth.user_credentials
SET email_verified_at = now()
WHERE email_verified_at IS NULL;

-- Allow the runtime role to write verification columns.
GRANT UPDATE (email_verified_at, email_verification_token, email_verification_expires_at)
  ON app_auth.user_credentials TO app_runtime;
