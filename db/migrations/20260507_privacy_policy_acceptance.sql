ALTER TABLE app_auth.user_credentials
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamptz;
