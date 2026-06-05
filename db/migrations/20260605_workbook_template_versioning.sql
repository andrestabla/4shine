-- =========================================================
-- WORKBOOK TEMPLATE EDITOR + VERSIONING
-- =========================================================
-- Admin/gestor pueden editar la plantilla base de cada workbook
-- (carátula, secciones, preguntas) y publicar versiones. Cada
-- nueva instancia de user_workbooks toma snapshot de la versión
-- vigente; las instancias preexistentes mantienen su snapshot
-- (NULL = se renderiza con el config TypeScript empaquetado).

BEGIN;

-- 1) Campos en workbook_templates: carátula, draft pendiente, versión actual
ALTER TABLE app_learning.workbook_templates
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS draft_content jsonb,
  ADD COLUMN IF NOT EXISTS draft_cover_image_url text,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS draft_updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_version_no integer NOT NULL DEFAULT 0;

-- 2) Tabla de versiones publicadas
CREATE TABLE IF NOT EXISTS app_learning.workbook_template_versions (
  version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES app_learning.workbook_templates(template_id) ON DELETE CASCADE,
  version_no integer NOT NULL CHECK (version_no >= 1),
  cover_image_url text,
  content jsonb NOT NULL,
  published_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (template_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_workbook_template_versions_template
  ON app_learning.workbook_template_versions(template_id, version_no DESC);

-- 3) Snapshot en user_workbooks: cada instancia guarda la versión + contenido
ALTER TABLE app_learning.user_workbooks
  ADD COLUMN IF NOT EXISTS template_version_no integer,
  ADD COLUMN IF NOT EXISTS content_snapshot jsonb;

CREATE INDEX IF NOT EXISTS idx_user_workbooks_template_version
  ON app_learning.user_workbooks(template_id, template_version_no);

-- 4) RLS / GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.workbook_template_versions TO app_runtime;
ALTER TABLE app_learning.workbook_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_learning.workbook_template_versions FORCE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado con permiso aprendizaje:view puede
-- consultar versiones (el runtime las usa para renderizar el WB del líder
-- aunque éste no sea admin/gestor).
DROP POLICY IF EXISTS workbook_template_versions_select_runtime ON app_learning.workbook_template_versions;
CREATE POLICY workbook_template_versions_select_runtime ON app_learning.workbook_template_versions
FOR SELECT
USING (
  app_auth.current_user_id() IS NOT NULL
  AND app_auth.has_permission('aprendizaje', 'view')
);

-- Insert/update/delete: sólo admin o gestor. Adviser/líder no editan.
DROP POLICY IF EXISTS workbook_template_versions_insert_manage ON app_learning.workbook_template_versions;
CREATE POLICY workbook_template_versions_insert_manage ON app_learning.workbook_template_versions
FOR INSERT
WITH CHECK (
  app_auth.is_admin()
  OR EXISTS (
    SELECT 1 FROM app_core.users u
    WHERE u.user_id = app_auth.current_user_id()
      AND u.primary_role = 'gestor'
  )
);

DROP POLICY IF EXISTS workbook_template_versions_delete_manage ON app_learning.workbook_template_versions;
CREATE POLICY workbook_template_versions_delete_manage ON app_learning.workbook_template_versions
FOR DELETE
USING (
  app_auth.is_admin()
);

COMMENT ON TABLE app_learning.workbook_template_versions
  IS 'Historial de versiones publicadas de cada plantilla de workbook. Cada user_workbooks creado tras la publicación apunta a una de estas versiones via template_version_no + content_snapshot.';
COMMENT ON COLUMN app_learning.workbook_templates.draft_content
  IS 'Borrador en progreso del admin/gestor antes de publicar. Sólo visible en el editor; no afecta a los workbooks de los líderes hasta publicar.';
COMMENT ON COLUMN app_learning.user_workbooks.content_snapshot
  IS 'Snapshot inmutable del contenido del workbook al momento de su creación. Si es NULL, el runtime cae al config TypeScript empaquetado (legacy).';

COMMIT;
