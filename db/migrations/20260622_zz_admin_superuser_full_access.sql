-- Admin = superuser de la plataforma.
--
-- Esta migración garantiza que el rol 'admin' SIEMPRE tenga acceso total a
-- todos los módulos, sin depender de seeds futuros. Es una red de seguridad
-- triple capa:
--
--   Capa 1 (TS): src/server/auth/module-permissions.ts hace short-circuit
--                cuando current_role()='admin' y devuelve true sin tocar BD.
--
--   Capa 2 (SQL): app_auth.has_permission devuelve true incondicional cuando
--                 current_role()='admin'. Importante para RLS policies y
--                 cualquier consulta SQL que use la función directamente
--                 (sin pasar por el código TS).
--
--   Capa 3 (datos): reconciliar role_module_permissions para que admin
--                   tenga fila con TODO en true para CADA módulo existente.
--                   Útil si algún flujo lee la tabla cruda (ej. UI de
--                   gestión de permisos /dashboard/administracion/roles).
--
-- Idempotente. Reaplicarla no daña nada.

BEGIN;

-- ─── Capa 2 — has_permission: short-circuit para admin ──────────────────────

CREATE OR REPLACE FUNCTION app_auth.has_permission(p_module_code text, p_action text)
RETURNS boolean
LANGUAGE sql
VOLATILE
AS $$
    SELECT
        -- Admin tiene acceso total siempre. Esto blinda contra módulos
        -- nuevos cuyo seed no haya otorgado fila admin explícita.
        CASE
            WHEN app_auth.current_role() = 'admin' THEN true
            ELSE COALESCE(
                (
                    SELECT bool_or(
                        CASE lower(p_action)
                            WHEN 'view' THEN p.can_view
                            WHEN 'create' THEN p.can_create
                            WHEN 'update' THEN p.can_update
                            WHEN 'delete' THEN p.can_delete
                            WHEN 'approve' THEN p.can_approve
                            WHEN 'moderate' THEN p.can_moderate
                            WHEN 'manage' THEN p.can_manage
                            ELSE false
                        END
                    )
                    FROM app_auth.role_module_permissions p
                    WHERE p.role_code = app_auth.current_role()
                      AND p.module_code = p_module_code
                ),
                false
            )
        END;
$$;

COMMENT ON FUNCTION app_auth.has_permission(text, text) IS
'Verifica si el rol activo tiene permiso para una acción en un módulo. '
'Admin tiene acceso total incondicional (short-circuit). El resto consulta '
'role_module_permissions.';

-- Mantener VOLATILE (20260514_auth_functions_volatile.sql) para que la
-- planner no cachee el resultado entre invocaciones de la misma transacción.
ALTER FUNCTION app_auth.has_permission(text, text) VOLATILE;

-- ─── Capa 3 — Reconciliar filas admin para todos los módulos ────────────────
--
-- Por cada módulo presente en app_auth.modules, garantizamos que exista una
-- fila para 'admin' con TODAS las acciones en true. Si la fila ya existía
-- con cualquier valor parcial, la actualizamos a todo true.

INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete,
    can_approve, can_moderate, can_manage
)
SELECT
    'admin',
    m.module_code,
    true, true, true, true,
    true, true, true
FROM app_auth.modules m
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view     = true,
    can_create   = true,
    can_update   = true,
    can_delete   = true,
    can_approve  = true,
    can_moderate = true,
    can_manage   = true;

COMMIT;
