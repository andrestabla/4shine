-- Grabaciones de mentorías 1:1, cargadas manualmente por gestor o admin.
--
-- Las sesiones grupales ya tenían su tabla (group_session_recordings), colgada
-- del evento. Las 1:1 no tienen evento: cuelgan directamente de la sesión, y
-- son privadas de esa relación líder–advisor, así que no llevan reacciones ni
-- comentarios públicos como las grupales.

BEGIN;

CREATE TABLE IF NOT EXISTS app_mentoring.session_recordings (
    recording_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    recording_url text NOT NULL,
    thumbnail_url text,
    duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    recorded_at timestamptz,
    published_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON app_mentoring.session_recordings(session_id);

CREATE TRIGGER trg_session_recordings_set_updated_at
    BEFORE UPDATE ON app_mentoring.session_recordings
    FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMIT;
