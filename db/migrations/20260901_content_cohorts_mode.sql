-- Dos formas de usar la cohorte sobre un curso:
--
--   allow ("Solo esta cohorte")  → únicamente sus miembros lo ven.
--   deny  ("Ocultar a esta cohorte") → sus miembros NO lo ven; el resto sí.
--
-- Las filas que existían se interpretan como 'allow', que es como se creó la
-- restricción originalmente.

BEGIN;

ALTER TABLE app_learning.content_cohorts
    ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'allow';

ALTER TABLE app_learning.content_cohorts
    DROP CONSTRAINT IF EXISTS content_cohorts_mode_check;

ALTER TABLE app_learning.content_cohorts
    ADD CONSTRAINT content_cohorts_mode_check CHECK (mode IN ('allow', 'deny'));

CREATE INDEX IF NOT EXISTS idx_content_cohorts_mode ON app_learning.content_cohorts(content_id, mode);

COMMIT;
