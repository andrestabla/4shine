-- Self-service password reset.
-- Stores a hashed token + expiry on the credentials row, reusing the same
-- pattern as email verification (one token at a time per user).

ALTER TABLE app_auth.user_credentials
  ADD COLUMN IF NOT EXISTS password_reset_token        TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ DEFAULT NULL;

-- Allow the runtime role to write reset columns from public endpoints.
GRANT UPDATE (password_reset_token, password_reset_expires_at, password_reset_requested_at)
  ON app_auth.user_credentials TO app_runtime;
