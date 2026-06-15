-- ============================================================
-- Popup Builder: popups configurables que se muestran a los
-- visitantes en el sitio público y/o el dashboard.
-- ============================================================
-- Idempotente.

CREATE TABLE IF NOT EXISTS app_admin.popups (
  popup_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  name             text        NOT NULL DEFAULT '',
  is_active        boolean     NOT NULL DEFAULT false,
  trigger_type     text        NOT NULL DEFAULT 'time'
                     CHECK (trigger_type IN ('time', 'scroll', 'exit_intent', 'immediate')),
  delay_seconds    int         NOT NULL DEFAULT 5  CHECK (delay_seconds >= 0 AND delay_seconds <= 600),
  scroll_percent   int         NOT NULL DEFAULT 40 CHECK (scroll_percent >= 0 AND scroll_percent <= 100),
  target_mode      text        NOT NULL DEFAULT 'all' CHECK (target_mode IN ('all', 'include')),
  target_paths     text[]      NOT NULL DEFAULT '{}',
  frequency        text        NOT NULL DEFAULT 'session'
                     CHECK (frequency IN ('session', 'daily', 'once', 'always')),
  title            text        NOT NULL DEFAULT '',
  message          text        NOT NULL DEFAULT '',
  cta_label        text        NOT NULL DEFAULT '',
  cta_url          text        NOT NULL DEFAULT '',
  dismiss_label    text        NOT NULL DEFAULT 'No, gracias',
  sort_order       int         NOT NULL DEFAULT 0,
  created_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popups_org_order
  ON app_admin.popups(organization_id, sort_order);

DROP TRIGGER IF EXISTS trg_popups_set_updated_at ON app_admin.popups;
CREATE TRIGGER trg_popups_set_updated_at
  BEFORE UPDATE ON app_admin.popups
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

ALTER TABLE app_admin.popups ENABLE ROW LEVEL SECURITY;

-- Lectura abierta (el endpoint público sirve los popups activos a los
-- visitantes); escritura solo admin/gestor.
DROP POLICY IF EXISTS popups_read ON app_admin.popups;
CREATE POLICY popups_read ON app_admin.popups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS popups_write ON app_admin.popups;
CREATE POLICY popups_write ON app_admin.popups
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.popups TO app_runtime;
