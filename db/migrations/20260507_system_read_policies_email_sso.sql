-- Allow server-side system code to read outbound email and integration configs
-- without a full user session context.
--
-- Both tables previously only allowed reads from authenticated users who had
-- 'usuarios manage' permission AND whose organization matched the row's
-- organization_id. Server-side flows (sendVerificationEmail, sso-config endpoint)
-- run with app.current_role='gestor' but no app.current_user_id, so the
-- organization subquery returned NULL and the RLS check failed silently.
--
-- These permissive policies run alongside the existing ones. Either policy can
-- grant SELECT access (PostgreSQL ORs permissive policies).

DROP POLICY IF EXISTS outbound_email_configs_system_read ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_system_read ON app_admin.outbound_email_configs
FOR SELECT
USING (
    current_setting('app.current_role', true) IN ('gestor', 'admin')
);

DROP POLICY IF EXISTS integration_configs_system_read ON app_admin.integration_configs;
CREATE POLICY integration_configs_system_read ON app_admin.integration_configs
FOR SELECT
USING (
    current_setting('app.current_role', true) IN ('gestor', 'admin')
);
