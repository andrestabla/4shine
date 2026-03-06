-- =========================================================
-- R2 UPLOAD RUNTIME ACCESS POLICY
-- =========================================================

DROP POLICY IF EXISTS integration_configs_select_r2_runtime ON app_admin.integration_configs;
CREATE POLICY integration_configs_select_r2_runtime ON app_admin.integration_configs
FOR SELECT
USING (
  integration_key = 'r2'
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
