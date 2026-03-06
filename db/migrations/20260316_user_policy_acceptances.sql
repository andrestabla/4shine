-- =========================================================
-- USER POLICY ACCEPTANCES
-- =========================================================

CREATE TABLE IF NOT EXISTS app_auth.user_policy_acceptances (
    acceptance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    policy_code text NOT NULL,
    policy_version text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT now(),
    acceptance_source text NOT NULL DEFAULT 'platform',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (char_length(trim(policy_code)) > 0),
    CHECK (char_length(trim(policy_version)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_policy_acceptances_unique
ON app_auth.user_policy_acceptances(user_id, policy_code, policy_version);

CREATE INDEX IF NOT EXISTS idx_user_policy_acceptances_user
ON app_auth.user_policy_acceptances(user_id, accepted_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_auth.user_policy_acceptances TO app_runtime;

ALTER TABLE app_auth.user_policy_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_auth.user_policy_acceptances FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_policy_acceptances_manage_all ON app_auth.user_policy_acceptances;
CREATE POLICY user_policy_acceptances_manage_all ON app_auth.user_policy_acceptances
FOR ALL
USING (app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.has_permission('usuarios', 'manage'));

DROP POLICY IF EXISTS user_policy_acceptances_self_read ON app_auth.user_policy_acceptances;
CREATE POLICY user_policy_acceptances_self_read ON app_auth.user_policy_acceptances
FOR SELECT
USING (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS user_policy_acceptances_self_insert ON app_auth.user_policy_acceptances;
CREATE POLICY user_policy_acceptances_self_insert ON app_auth.user_policy_acceptances
FOR INSERT
WITH CHECK (user_id = app_auth.current_user_id());
