INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES
    ('descubrimiento', 'Descubrimiento', 'Diagnóstico 4Shine para lectura ejecutiva de liderazgo.', true)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    is_core = EXCLUDED.is_core;

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
VALUES
    ('lider', 'descubrimiento', true, true, true, false, false, false, false),
    ('mentor', 'descubrimiento', true, true, true, false, false, false, false),
    ('gestor', 'descubrimiento', true, true, true, false, false, false, false),
    ('admin', 'descubrimiento', true, true, true, true, true, true, true)
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_approve = EXCLUDED.can_approve,
    can_moderate = EXCLUDED.can_moderate,
    can_manage = EXCLUDED.can_manage;

INSERT INTO app_assessment.tests (
    test_code,
    title,
    description,
    pillar_code,
    sequence_no,
    is_active
)
VALUES (
    'diagnostico_4shine',
    'Diagnóstico 4Shine',
    'Diagnóstico integral de liderazgo basado en los cuatro pilares 4Shine.',
    NULL,
    1,
    true
)
ON CONFLICT (test_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    pillar_code = EXCLUDED.pillar_code,
    sequence_no = EXCLUDED.sequence_no,
    is_active = EXCLUDED.is_active,
    updated_at = now();

CREATE TABLE IF NOT EXISTS app_assessment.discovery_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL UNIQUE REFERENCES app_assessment.test_attempts(attempt_id) ON DELETE CASCADE,
    user_id uuid NOT NULL UNIQUE REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    name_snapshot text NOT NULL,
    role_snapshot text NOT NULL DEFAULT 'Director/C-Level',
    status text NOT NULL DEFAULT 'intro' CHECK (status IN ('intro', 'instructions', 'quiz', 'results')),
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    current_idx integer NOT NULL DEFAULT 0 CHECK (current_idx >= 0),
    completion_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    public_id text UNIQUE,
    shared_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user_id
    ON app_assessment.discovery_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_discovery_sessions_public_id
    ON app_assessment.discovery_sessions(public_id)
    WHERE public_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_discovery_sessions_set_updated_at ON app_assessment.discovery_sessions;
CREATE TRIGGER trg_discovery_sessions_set_updated_at
BEFORE UPDATE ON app_assessment.discovery_sessions
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

WITH discovery_test AS (
    SELECT test_id
    FROM app_assessment.tests
    WHERE test_code = 'diagnostico_4shine'
    LIMIT 1
),
created_attempts AS (
    INSERT INTO app_assessment.test_attempts (
        test_id,
        user_id,
        status,
        started_at
    )
    SELECT
        discovery_test.test_id,
        u.user_id,
        'in_progress',
        now()
    FROM discovery_test
    JOIN app_core.users u ON u.is_active = true
    LEFT JOIN app_assessment.discovery_sessions ds
        ON ds.user_id = u.user_id
    WHERE ds.user_id IS NULL
    RETURNING attempt_id, user_id
)
INSERT INTO app_assessment.discovery_sessions (
    attempt_id,
    user_id,
    name_snapshot
)
SELECT
    created_attempts.attempt_id,
    created_attempts.user_id,
    COALESCE(NULLIF(u.display_name, ''), split_part(u.email, '@', 1), 'Usuario 4Shine')
FROM created_attempts
JOIN app_core.users u ON u.user_id = created_attempts.user_id
ON CONFLICT (user_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_sessions TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_sessions TO app_admin;
GRANT SELECT, INSERT, UPDATE ON app_assessment.discovery_sessions TO app_gestor;
GRANT SELECT, INSERT, UPDATE ON app_assessment.discovery_sessions TO app_mentor;
GRANT SELECT, INSERT, UPDATE ON app_assessment.discovery_sessions TO app_lider;

