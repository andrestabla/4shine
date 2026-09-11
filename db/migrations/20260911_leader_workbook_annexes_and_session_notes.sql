-- Dos anexos a la gestión 360 del líder:
--
-- 1. Documentos anexos (PDF) a cada workbook de un líder. Los carga advisor,
--    gestor o admin; el líder los ve desde Aprendizaje junto a su workbook.
--
-- 2. Notas de mentoría: sobre una sesión 1:1 o grupal del líder, con fecha y
--    un comentario escrito y/o un documento (.pdf o .docx). Al menos uno de
--    los dos debe existir (CHECK). Las escribe advisor, gestor o admin.

BEGIN;

CREATE TABLE IF NOT EXISTS app_learning.workbook_annexes (
    annex_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workbook_id uuid NOT NULL REFERENCES app_learning.user_workbooks(workbook_id) ON DELETE CASCADE,
    title text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL DEFAULT 0 CHECK (file_size >= 0),
    content_type text NOT NULL DEFAULT 'application/pdf',
    created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workbook_annexes_workbook
    ON app_learning.workbook_annexes(workbook_id, created_at DESC);

CREATE TRIGGER trg_workbook_annexes_set_updated_at
    BEFORE UPDATE ON app_learning.workbook_annexes
    FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

CREATE TABLE IF NOT EXISTS app_mentoring.session_notes (
    note_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    note_date date NOT NULL DEFAULT CURRENT_DATE,
    comment text,
    document_url text,
    document_name text,
    document_size bigint NOT NULL DEFAULT 0 CHECK (document_size >= 0),
    document_content_type text,
    created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_notes_comment_or_document_check
        CHECK (NULLIF(btrim(comment), '') IS NOT NULL OR NULLIF(btrim(document_url), '') IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_session_notes_session
    ON app_mentoring.session_notes(session_id, note_date DESC);

CREATE TRIGGER trg_session_notes_set_updated_at
    BEFORE UPDATE ON app_mentoring.session_notes
    FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMIT;
