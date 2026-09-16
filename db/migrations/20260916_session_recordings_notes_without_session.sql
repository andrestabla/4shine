-- Grabaciones 1:1 y notas de mentoría SIN sesión asociada.
--
-- Hasta ahora ambas colgaban obligatoriamente de una mentorship_session, así
-- que un líder sin mentorías agendadas no podía recibir ni grabaciones ni
-- notas en su 360. Ahora session_id es opcional y la fila lleva el líder al
-- que pertenece (leader_user_id). Regla: al menos uno de los dos existe.
--
-- Las filas existentes se completan con el mentee de su sesión, así todas
-- quedan con leader_user_id y las consultas pueden filtrar por él.

BEGIN;

-- Grabaciones 1:1 ------------------------------------------------------------
ALTER TABLE app_mentoring.session_recordings
    ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE app_mentoring.session_recordings
    ADD COLUMN IF NOT EXISTS leader_user_id uuid REFERENCES app_core.users(user_id) ON DELETE CASCADE;

UPDATE app_mentoring.session_recordings r
SET leader_user_id = (
    SELECT sp.user_id
    FROM app_mentoring.session_participants sp
    WHERE sp.session_id = r.session_id AND sp.participant_role = 'mentee'
    ORDER BY sp.joined_at
    LIMIT 1
)
WHERE r.leader_user_id IS NULL AND r.session_id IS NOT NULL;

ALTER TABLE app_mentoring.session_recordings
    DROP CONSTRAINT IF EXISTS session_recordings_owner_check;
ALTER TABLE app_mentoring.session_recordings
    ADD CONSTRAINT session_recordings_owner_check
    CHECK (session_id IS NOT NULL OR leader_user_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_session_recordings_leader
    ON app_mentoring.session_recordings(leader_user_id, recorded_at DESC);

-- Notas de mentoría ------------------------------------------------------------
ALTER TABLE app_mentoring.session_notes
    ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE app_mentoring.session_notes
    ADD COLUMN IF NOT EXISTS leader_user_id uuid REFERENCES app_core.users(user_id) ON DELETE CASCADE;

UPDATE app_mentoring.session_notes n
SET leader_user_id = (
    SELECT sp.user_id
    FROM app_mentoring.session_participants sp
    WHERE sp.session_id = n.session_id AND sp.participant_role = 'mentee'
    ORDER BY sp.joined_at
    LIMIT 1
)
WHERE n.leader_user_id IS NULL AND n.session_id IS NOT NULL;

ALTER TABLE app_mentoring.session_notes
    DROP CONSTRAINT IF EXISTS session_notes_owner_check;
ALTER TABLE app_mentoring.session_notes
    ADD CONSTRAINT session_notes_owner_check
    CHECK (session_id IS NOT NULL OR leader_user_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_session_notes_leader
    ON app_mentoring.session_notes(leader_user_id, note_date DESC);

COMMIT;
