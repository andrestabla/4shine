BEGIN;

ALTER TABLE app_core.users
  DROP CONSTRAINT IF EXISTS users_primary_role_check;
ALTER TABLE app_core.users
  ADD CONSTRAINT users_primary_role_check
  CHECK (primary_role IN ('lider', 'mentor', 'gestor', 'admin', 'invitado'));

ALTER TABLE app_core.cohort_memberships
  DROP CONSTRAINT IF EXISTS cohort_memberships_role_code_check;
ALTER TABLE app_core.cohort_memberships
  ADD CONSTRAINT cohort_memberships_role_code_check
  CHECK (role_code IN ('lider', 'mentor', 'gestor', 'admin', 'invitado'));

ALTER TABLE app_auth.roles
  DROP CONSTRAINT IF EXISTS roles_role_code_check;
ALTER TABLE app_auth.roles
  ADD CONSTRAINT roles_role_code_check
  CHECK (role_code IN ('lider', 'mentor', 'gestor', 'admin', 'invitado'));

INSERT INTO app_auth.roles (role_code, role_name, description)
VALUES (
  'invitado',
  'Invitado',
  'Usuario temporal creado desde invitación a Descubrimiento con acceso exclusivo a ese módulo.'
)
ON CONFLICT (role_code) DO UPDATE
SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description;

INSERT INTO app_auth.role_module_permissions (
  role_code,
  module_code,
  can_view,
  can_create,
  can_update,
  can_delete,
  can_approve,
  can_moderate,
  can_manage
)
SELECT
  'invitado',
  m.module_code,
  (m.module_code = 'descubrimiento')::boolean,
  (m.module_code = 'descubrimiento')::boolean,
  (m.module_code = 'descubrimiento')::boolean,
  false,
  false,
  false,
  false
FROM app_auth.modules m
ON CONFLICT (role_code, module_code) DO UPDATE
SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  can_moderate = EXCLUDED.can_moderate,
  can_manage = EXCLUDED.can_manage;

COMMIT;
