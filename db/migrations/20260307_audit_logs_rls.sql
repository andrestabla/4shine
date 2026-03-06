-- =========================================================
-- AUDIT LOGS RLS HARDENING
-- =========================================================

ALTER TABLE app_admin.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select_manage_or_actor ON app_admin.audit_logs;
CREATE POLICY audit_logs_select_manage_or_actor ON app_admin.audit_logs
FOR SELECT
USING (
  app_auth.has_permission('usuarios', 'manage')
  OR actor_user_id = app_auth.current_user_id()
);

DROP POLICY IF EXISTS audit_logs_insert_system ON app_admin.audit_logs;
CREATE POLICY audit_logs_insert_system ON app_admin.audit_logs
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS audit_logs_update_manage ON app_admin.audit_logs;
CREATE POLICY audit_logs_update_manage ON app_admin.audit_logs
FOR UPDATE
USING (app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.has_permission('usuarios', 'manage'));

DROP POLICY IF EXISTS audit_logs_delete_manage ON app_admin.audit_logs;
CREATE POLICY audit_logs_delete_manage ON app_admin.audit_logs
FOR DELETE
USING (app_auth.has_permission('usuarios', 'manage'));
