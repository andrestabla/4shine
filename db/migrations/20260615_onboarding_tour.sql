-- ============================================================
-- Onboarding Tour: admin-managed guided tour with per-user
-- progress tracking and per-step / per-role funnel analytics.
-- ============================================================
-- Idempotente: se puede re-ejecutar sin efectos secundarios.

-- --------------------------------------------------------
-- Settings singleton (one row per organization).
-- Bumping current_version = "reiniciar tour para todos":
-- el progreso se llavea por (user_id, tour_version), así que
-- una versión nueva re-dispara el auto-start para todos.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.tour_settings (
  tour_settings_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  current_version   integer     NOT NULL DEFAULT 1,
  is_enabled        boolean     NOT NULL DEFAULT true,
  created_by        uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by        uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- --------------------------------------------------------
-- Steps (admin-config). step_key es la clave estable de
-- analítica: NO cambia al reordenar (eso solo toca sort_order).
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin.tour_steps (
  step_id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  step_key         text        NOT NULL CHECK (step_key ~ '^[a-z0-9_-]+$' AND char_length(step_key) BETWEEN 2 AND 80),
  anchor_key       text        NOT NULL,                      -- clave del catálogo estático (catalog.ts)
  title            text        NOT NULL DEFAULT '',
  body_html        text        NOT NULL DEFAULT '',           -- HTML de TipTap
  visible_roles    text[]      NOT NULL DEFAULT '{}',
  sort_order       integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  is_system        boolean     NOT NULL DEFAULT false,        -- seed: no se borra, solo se desactiva
  created_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, step_key),
  CHECK (visible_roles <@ ARRAY['lider','mentor','gestor','admin','invitado']::text[])
);

CREATE INDEX IF NOT EXISTS idx_tour_steps_org_order
  ON app_admin.tour_steps(organization_id, sort_order);

-- --------------------------------------------------------
-- Per-user progress (estado / punto de reanudación).
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_core.tour_progress (
  progress_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  tour_version     integer     NOT NULL,
  role_at_start    text        NOT NULL,
  total_steps      integer     NOT NULL DEFAULT 0,
  last_step_key    text,
  last_step_index  integer     NOT NULL DEFAULT 0,
  viewed_count     integer     NOT NULL DEFAULT 0,
  completion_pct   numeric(5,2) NOT NULL DEFAULT 0,
  status           text        NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress','completed','dismissed')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  dismissed_at     timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tour_version)
);

CREATE INDEX IF NOT EXISTS idx_tour_progress_user
  ON app_core.tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_progress_org_version_status
  ON app_core.tour_progress(organization_id, tour_version, status);

-- --------------------------------------------------------
-- Per-step view events (alimenta el embudo por paso + rol).
-- Tabla separada (no jsonb) para agregar con GROUP BY.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_core.tour_step_events (
  event_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  tour_version     integer     NOT NULL,
  role_at_event    text        NOT NULL,
  step_key         text        NOT NULL,
  step_index       integer     NOT NULL DEFAULT 0,
  viewed_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tour_version, step_key)
);

CREATE INDEX IF NOT EXISTS idx_tour_step_events_funnel
  ON app_core.tour_step_events(organization_id, tour_version, step_key, role_at_event);

-- --------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS trg_tour_settings_set_updated_at ON app_admin.tour_settings;
CREATE TRIGGER trg_tour_settings_set_updated_at
  BEFORE UPDATE ON app_admin.tour_settings
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_tour_steps_set_updated_at ON app_admin.tour_steps;
CREATE TRIGGER trg_tour_steps_set_updated_at
  BEFORE UPDATE ON app_admin.tour_steps
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_tour_progress_set_updated_at ON app_core.tour_progress;
CREATE TRIGGER trg_tour_progress_set_updated_at
  BEFORE UPDATE ON app_core.tour_progress
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
ALTER TABLE app_admin.tour_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.tour_steps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.tour_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.tour_step_events  ENABLE ROW LEVEL SECURITY;

-- Config: lectura para cualquier sesión autenticada (los pasos aplicables
-- se filtran en el servicio); escritura solo admin/gestor.
DROP POLICY IF EXISTS tour_settings_read ON app_admin.tour_settings;
CREATE POLICY tour_settings_read ON app_admin.tour_settings
  FOR SELECT USING (true);
DROP POLICY IF EXISTS tour_settings_write ON app_admin.tour_settings;
CREATE POLICY tour_settings_write ON app_admin.tour_settings
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS tour_steps_read ON app_admin.tour_steps;
CREATE POLICY tour_steps_read ON app_admin.tour_steps
  FOR SELECT USING (true);
DROP POLICY IF EXISTS tour_steps_write ON app_admin.tour_steps;
CREATE POLICY tour_steps_write ON app_admin.tour_steps
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

-- Progress / events: cada usuario gestiona lo suyo; admin/gestor leen todo
-- (analítica).
DROP POLICY IF EXISTS tour_progress_self ON app_core.tour_progress;
CREATE POLICY tour_progress_self ON app_core.tour_progress
  FOR ALL
  USING  (user_id = app_auth.current_user_id() OR app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS tour_step_events_self ON app_core.tour_step_events;
CREATE POLICY tour_step_events_self ON app_core.tour_step_events
  FOR ALL
  USING  (user_id = app_auth.current_user_id() OR app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (user_id = app_auth.current_user_id());

-- --------------------------------------------------------
-- Runtime grants
-- --------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.tour_settings   TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.tour_steps      TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_core.tour_progress    TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_core.tour_step_events TO app_runtime;

-- --------------------------------------------------------
-- Seed: settings singleton por organización
-- --------------------------------------------------------
INSERT INTO app_admin.tour_settings (organization_id)
SELECT organization_id FROM app_core.organizations
ON CONFLICT (organization_id) DO NOTHING;
