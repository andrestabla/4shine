-- ============================================================
-- Sync app_auth.modules catalog with TypeScript MODULE_CODES
-- ============================================================
-- Inserta los módulos faltantes (notificaciones, planes) para
-- que aparezcan en la matriz de gestión de roles del admin.
-- Y agrega permisos por defecto sólo para admin (gestor: view).
-- ============================================================

BEGIN;

INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES
    ('notificaciones', 'Notificaciones', 'Plantillas de mensajes, eventos y disparadores.', true),
    ('planes', 'Planes y Precios', 'Catálogo de planes de suscripción y productos.', true)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    is_core = EXCLUDED.is_core;

-- Permisos por defecto:
--   admin: control total
--   gestor: view + update + manage
--   lider/mentor/invitado: sin permisos
INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete,
    can_approve, can_moderate, can_manage
)
SELECT r.role_code, m.module_code,
    r.role_code IN ('admin', 'gestor'),                  -- can_view
    r.role_code = 'admin',                                -- can_create
    r.role_code IN ('admin', 'gestor'),                  -- can_update
    r.role_code = 'admin',                                -- can_delete
    r.role_code = 'admin',                                -- can_approve
    r.role_code = 'admin',                                -- can_moderate
    r.role_code IN ('admin', 'gestor')                   -- can_manage
FROM app_auth.roles r
CROSS JOIN (VALUES ('notificaciones'), ('planes')) AS m(module_code)
ON CONFLICT (role_code, module_code) DO NOTHING;

COMMIT;
