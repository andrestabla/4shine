-- =========================================================
-- OPENAI RUNTIME ACCESS POLICY FOR DISCOVERY ANALYSIS
-- =========================================================

DROP POLICY IF EXISTS integration_configs_select_openai_runtime ON app_admin.integration_configs;
CREATE POLICY integration_configs_select_openai_runtime ON app_admin.integration_configs
FOR SELECT
USING (
  integration_key = 'openai'
  AND app_auth.current_user_id() IS NOT NULL
  AND (
    app_auth.is_admin()
    OR organization_id = (
      SELECT u.organization_id
      FROM app_core.users u
      WHERE u.user_id = app_auth.current_user_id()
    )
  )
);
