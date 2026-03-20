BEGIN;

COMMENT ON TABLE app_assessment.discovery_sessions IS 'Diagnóstico único por usuario para el módulo Descubrimiento.';
COMMENT ON COLUMN app_assessment.discovery_sessions.session_id IS 'ID único del diagnóstico asociado al usuario.';
COMMENT ON COLUMN app_assessment.discovery_sessions.user_id IS 'Usuario propietario del diagnóstico.';
COMMENT ON COLUMN app_assessment.discovery_sessions.answers IS 'Respuestas persistidas del diagnóstico vinculadas al usuario.';
COMMENT ON COLUMN app_assessment.discovery_sessions.completion_percent IS 'Progreso real del diagnóstico del usuario.';

ALTER TABLE app_learning.user_workbooks
    ADD COLUMN IF NOT EXISTS state_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE app_learning.user_workbooks
SET state_payload = '{}'::jsonb
WHERE state_payload IS NULL;

COMMENT ON COLUMN app_learning.user_workbooks.workbook_id IS 'ID único del workbook asociado a un usuario y plantilla.';
COMMENT ON COLUMN app_learning.user_workbooks.owner_user_id IS 'Usuario propietario de la instancia única del workbook.';
COMMENT ON COLUMN app_learning.user_workbooks.state_payload IS 'Estado persistido del workbook digital, ligado al workbook_id único del usuario.';

COMMIT;
