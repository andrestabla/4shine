BEGIN;

ALTER TABLE app_learning.content_items
  ADD COLUMN IF NOT EXISTS competency_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS app_learning.workbook_templates (
    template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workbook_code text NOT NULL UNIQUE,
    sequence_no integer NOT NULL UNIQUE CHECK (sequence_no >= 1 AND sequence_no <= 10),
    title text NOT NULL,
    description text,
    pillar_code text REFERENCES app_assessment.pillars(pillar_code) ON DELETE SET NULL,
    unlock_offset_days integer NOT NULL DEFAULT 0 CHECK (unlock_offset_days >= 0),
    default_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_learning.user_workbooks (
    workbook_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES app_learning.workbook_templates(template_id) ON DELETE RESTRICT,
    owner_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    available_from timestamptz,
    is_enabled boolean NOT NULL DEFAULT true,
    is_hidden boolean NOT NULL DEFAULT false,
    editable_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
    completion_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    last_downloaded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_workbook_templates_pillar_code ON app_learning.workbook_templates(pillar_code);
CREATE INDEX IF NOT EXISTS idx_user_workbooks_owner ON app_learning.user_workbooks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_user_workbooks_available_from ON app_learning.user_workbooks(available_from);
CREATE INDEX IF NOT EXISTS idx_user_workbooks_visibility ON app_learning.user_workbooks(is_hidden, is_enabled);

INSERT INTO app_learning.workbook_templates (
    workbook_code,
    sequence_no,
    title,
    description,
    pillar_code,
    unlock_offset_days,
    default_fields
)
VALUES
    (
        'wb1',
        1,
        'WB1 · Creencias, identidad y pilares personales',
        'Versión digital interactiva completa con navegación editorial, guardado por instrumento y exportación integral.',
        'shine_within',
        0,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb2',
        2,
        'WB2 · Gestión emocional y PDI estratégico',
        'Versión digital interactiva completa con estructura por páginas, experiencia guiada y exportación profesional.',
        'shine_within',
        7,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb3',
        3,
        'WB3 · Propósito y valores no negociables',
        'Versión digital interactiva completa con diseño editorial estandarizado, flujo claro y cierre de evaluación.',
        'shine_within',
        14,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb4',
        4,
        'WB4 · Narrativa profesional y Elevator Pitch',
        'Portada y presentación informativa activas en formato digital premium, con flujo guiado para primer ingreso y continuidad automática.',
        'shine_out',
        21,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb5',
        5,
        'WB5 · Comunicación ejecutiva y estratégica',
        'Estructura digital en desarrollo con portada, presentación y bloques operativos iniciales para comunicación, influencia y conversaciones estratégicas.',
        'shine_out',
        28,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb6',
        6,
        'WB6 · Lenguaje verbal y no verbal de impacto',
        'Edición premium con bloques avanzados de lenguaje corporal, voz, presión, objeciones, coherencia y evaluación.',
        'shine_out',
        35,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb7',
        7,
        'WB7 · Mapeo del ecosistema estratégico',
        'Nueva versión digital con portada e identificación, presentación informativa completa y continuidad automática por sesión.',
        'shine_up',
        42,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb8',
        8,
        'WB8 · Pensamiento estratégico y toma de decisiones',
        'Portada, presentación y sección Escalera de valor con pasos, ejemplos, validaciones suaves y esquema visual interactivo.',
        'shine_up',
        49,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb9',
        9,
        'WB9 · Latido de marca',
        'Versión digital estructurada para propósito, posicionamiento, reputación y legado ejecutivo.',
        'shine_beyond',
        56,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    ),
    (
        'wb10',
        10,
        'WB10 · Visión estratégica personal',
        'Versión digital estructurada para visión a 3 años, prioridades estratégicas, compromisos e indicadores de avance.',
        'shine_beyond',
        63,
        '{"currentFocus":"","leadershipReflection":"","actionPlan":"","successMetrics":"","AdviserNotes":""}'::jsonb
    )
ON CONFLICT (workbook_code) DO UPDATE
SET
    sequence_no = EXCLUDED.sequence_no,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    pillar_code = EXCLUDED.pillar_code,
    unlock_offset_days = EXCLUDED.unlock_offset_days,
    default_fields = EXCLUDED.default_fields,
    is_active = true,
    updated_at = now();

INSERT INTO app_learning.user_workbooks (
    template_id,
    owner_user_id,
    assigned_by,
    title,
    description,
    available_from,
    editable_fields,
    completion_percent
)
SELECT
    wt.template_id,
    u.user_id,
    NULL,
    wt.title,
    wt.description,
    u.created_at + make_interval(days => wt.unlock_offset_days),
    wt.default_fields,
    0
FROM app_core.users u
CROSS JOIN app_learning.workbook_templates wt
LEFT JOIN app_learning.user_workbooks uw
    ON uw.owner_user_id = u.user_id
   AND uw.template_id = wt.template_id
WHERE u.primary_role = 'lider'
  AND u.is_active = true
  AND wt.is_active = true
  AND uw.workbook_id IS NULL;

DROP TRIGGER IF EXISTS trg_workbook_templates_set_updated_at ON app_learning.workbook_templates;
CREATE TRIGGER trg_workbook_templates_set_updated_at
BEFORE UPDATE ON app_learning.workbook_templates
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_workbooks_set_updated_at ON app_learning.user_workbooks;
CREATE TRIGGER trg_user_workbooks_set_updated_at
BEFORE UPDATE ON app_learning.user_workbooks
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.workbook_templates TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.user_workbooks TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.workbook_templates TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.user_workbooks TO app_admin;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.workbook_templates TO app_gestor;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_learning.user_workbooks TO app_gestor;

GRANT SELECT ON app_learning.workbook_templates TO app_mentor;
GRANT SELECT, UPDATE ON app_learning.user_workbooks TO app_mentor;

GRANT SELECT ON app_learning.workbook_templates TO app_lider;
GRANT SELECT, UPDATE ON app_learning.user_workbooks TO app_lider;

COMMIT;
