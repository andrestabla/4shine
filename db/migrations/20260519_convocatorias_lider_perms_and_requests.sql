BEGIN;

-- ── 1. Corregir permisos de lider en convocatorias ───────────────────────────
-- Liders solo pueden ver. Crear / editar / eliminar es exclusivo de gestor y admin.

UPDATE app_auth.role_module_permissions
SET
  can_create   = false,
  can_update   = false,
  can_delete   = false,
  can_approve  = false,
  can_moderate = false,
  can_manage   = false
WHERE role_code = 'lider'
  AND module_code = 'convocatorias';

-- Mentor también queda solo con can_view (ya debería estarlo, por seguridad lo forzamos)
UPDATE app_auth.role_module_permissions
SET
  can_create   = false,
  can_update   = false,
  can_delete   = false,
  can_approve  = false,
  can_moderate = false,
  can_manage   = false
WHERE role_code = 'mentor'
  AND module_code = 'convocatorias';

-- ── 2. Tabla de solicitudes de publicación ───────────────────────────────────
-- Los líderes pueden solicitar que se publique una convocatoria.
-- Gestores / admins la revisan y aprueban o rechazan.

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_requests (
  request_id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  description       text        NOT NULL DEFAULT '',
  requester_user_id uuid        NOT NULL
    REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_user_id  uuid
    REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  reviewer_notes    text,
  convocatoria_id   uuid
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_requests_status
  ON app_networking.convocatoria_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_convocatoria_requests_requester
  ON app_networking.convocatoria_requests(requester_user_id);

DROP TRIGGER IF EXISTS trg_convocatoria_requests_updated_at ON app_networking.convocatoria_requests;
CREATE TRIGGER trg_convocatoria_requests_updated_at
  BEFORE UPDATE ON app_networking.convocatoria_requests
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_requests TO app_runtime;

COMMIT;
