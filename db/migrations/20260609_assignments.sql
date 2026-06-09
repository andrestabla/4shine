-- Sistema de TAREAS / ENTREGAS (assignment): el líder sube archivos o URL
-- y recibe revisión + calificación de admin/gestor/adviser.
-- Idempotente.

-- 1. Extender content_items.content_type para incluir 'assignment'
ALTER TABLE app_learning.content_items
    DROP CONSTRAINT IF EXISTS content_items_content_type_check;

ALTER TABLE app_learning.content_items
    ADD CONSTRAINT content_items_content_type_check
    CHECK (content_type IN (
        'video','pdf','scorm','article','podcast','html','ppt','activity','assignment'
    ));

-- 2. Tabla content_assignments (1 por content_id)
CREATE TABLE IF NOT EXISTS app_learning.content_assignments (
    assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL UNIQUE REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    title text NOT NULL,
    instructions text NOT NULL DEFAULT '',
    evaluation_criteria text NOT NULL DEFAULT '',
    max_score smallint NOT NULL DEFAULT 100 CHECK (max_score > 0 AND max_score <= 1000),
    passing_score smallint NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 1000),
    accept_files boolean NOT NULL DEFAULT true,
    accept_url boolean NOT NULL DEFAULT true,
    accept_text boolean NOT NULL DEFAULT true,
    max_files smallint NOT NULL DEFAULT 5 CHECK (max_files >= 0 AND max_files <= 20),
    allow_multiple_submissions boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla assignment_submissions (entregas del líder)
CREATE TABLE IF NOT EXISTS app_learning.assignment_submissions (
    submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES app_learning.content_assignments(assignment_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft','submitted','graded','rejected','revision_requested'
    )),
    submission_text text,
    submission_url text,
    -- [{ url, name, size }]
    submission_files jsonb NOT NULL DEFAULT '[]'::jsonb,
    score smallint,
    passed boolean,
    grader_feedback text,
    graded_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    graded_at timestamptz,
    submitted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user
    ON app_learning.assignment_submissions(user_id, assignment_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
    ON app_learning.assignment_submissions(assignment_id, status, submitted_at DESC);

-- Touch updated_at trigger
DROP TRIGGER IF EXISTS trg_content_assignments_set_updated_at ON app_learning.content_assignments;
CREATE TRIGGER trg_content_assignments_set_updated_at
BEFORE UPDATE ON app_learning.content_assignments
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_assignment_submissions_set_updated_at ON app_learning.assignment_submissions;
CREATE TRIGGER trg_assignment_submissions_set_updated_at
BEFORE UPDATE ON app_learning.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();
