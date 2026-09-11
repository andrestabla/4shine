-- Estado editorial de las grabaciones de Expertos en vivo.
--
--   published ("Publicada")  → visible para líderes y advisors.
--   draft     ("Borrador")   → solo la ven admin y gestor mientras se completa.
--   hidden    ("No mostrar") → retirada de la vista de líderes sin borrarla.
--
-- Las filas existentes se interpretan como 'published', que es como se
-- comportaban hasta ahora. La directiva de los 90 días (una grabación deja de
-- mostrarse a líderes pasados 90 días desde su fecha) se aplica en la consulta
-- con la hora del sistema, no requiere columna.

BEGIN;

ALTER TABLE app_mentoring.group_session_recordings
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

ALTER TABLE app_mentoring.group_session_recordings
    DROP CONSTRAINT IF EXISTS group_session_recordings_status_check;

ALTER TABLE app_mentoring.group_session_recordings
    ADD CONSTRAINT group_session_recordings_status_check CHECK (status IN ('published', 'draft', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_group_session_recordings_status_recorded
    ON app_mentoring.group_session_recordings(status, recorded_at DESC);

COMMIT;
