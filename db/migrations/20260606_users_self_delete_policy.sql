-- Permite al usuario eliminar su propia fila en app_core.users.
--
-- Hasta ahora la única policy DELETE era users_admin_all (requiere
-- app_auth.is_admin()). Por eso el flujo de auto-baja desde
-- /dashboard/perfil silenciosamente fallaba con "User not found": la
-- RLS filtraba la fila y RETURNING quedaba vacío.
--
-- Esta policy autoriza la operación SÓLO sobre la fila del propio
-- usuario; un líder no puede borrar a otros. Mantiene la admin policy
-- intacta (un admin sigue pudiendo borrar a cualquier usuario).

BEGIN;

DROP POLICY IF EXISTS users_self_delete ON app_core.users;

CREATE POLICY users_self_delete
ON app_core.users
FOR DELETE
TO PUBLIC
USING (user_id = app_auth.current_user_id());

COMMENT ON POLICY users_self_delete ON app_core.users IS
  'Permite al usuario autenticado eliminar exclusivamente su propia fila (flujo Eliminar mi cuenta en /perfil).';

COMMIT;
