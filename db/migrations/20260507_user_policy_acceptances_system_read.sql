-- Allow server-side auth flows (login, verify-email, google, me) to read
-- user_policy_acceptances without a full user session context.
-- These flows set app.current_role='gestor' but no app.current_user_id,
-- so neither the manage_all nor the self_read policies fire.

DROP POLICY IF EXISTS user_policy_acceptances_system_read ON app_auth.user_policy_acceptances;
CREATE POLICY user_policy_acceptances_system_read ON app_auth.user_policy_acceptances
FOR SELECT
USING (
    current_setting('app.current_role', true) IN ('gestor', 'admin')
);
