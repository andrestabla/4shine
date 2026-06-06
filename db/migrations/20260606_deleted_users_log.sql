-- Snapshot histórico de cuentas eliminadas para el reporte de bajas en
-- /dashboard/usuarios. Antes de borrar a un usuario, snapshotamos su
-- identidad y motivo en esta tabla; sobrevive al CASCADE del DELETE
-- sobre app_core.users.

BEGIN;

CREATE TABLE IF NOT EXISTS app_admin.deleted_users_log (
    log_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL,
    email             text NOT NULL,
    display_name      text NOT NULL,
    primary_role      text NOT NULL,
    organization_id   uuid,
    organization_name text,
    deleted_at        timestamptz NOT NULL DEFAULT now(),
    deleted_source    text NOT NULL CHECK (deleted_source IN ('self', 'admin')),
    deleted_by_id     uuid,
    deleted_by_email  text,
    deleted_by_name   text,
    reason            text,
    metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_log_deleted_at
    ON app_admin.deleted_users_log (deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deleted_users_log_email
    ON app_admin.deleted_users_log (lower(email));

COMMENT ON TABLE app_admin.deleted_users_log IS
    'Historial de bajas de cuentas. Independiente de app_core.users (la fila se inserta antes del DELETE para sobrevivir al CASCADE).';
COMMENT ON COLUMN app_admin.deleted_users_log.deleted_source IS
    'self = el propio usuario se dio de baja desde /perfil. admin = un admin/gestor lo eliminó.';

-- RLS
ALTER TABLE app_admin.deleted_users_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deleted_users_log_admin_all ON app_admin.deleted_users_log;
CREATE POLICY deleted_users_log_admin_all
ON app_admin.deleted_users_log
FOR ALL
TO PUBLIC
USING (app_auth.is_admin() OR app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.is_admin() OR app_auth.has_permission('usuarios', 'manage'));

DROP POLICY IF EXISTS deleted_users_log_insert_system ON app_admin.deleted_users_log;
CREATE POLICY deleted_users_log_insert_system
ON app_admin.deleted_users_log
FOR INSERT
TO PUBLIC
WITH CHECK (true);

COMMIT;
