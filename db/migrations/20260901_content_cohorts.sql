-- Cursos restringidos a cohortes.
--
-- Regla: un contenido SIN cohortes asignadas se comporta como hasta ahora (lo
-- rigen el plan y los permisos). Con una o más cohortes asignadas, solo lo ven
-- quienes pertenezcan a alguna de ellas.
--
-- La pertenencia basta: no se exige que la cohorte siga activa. Si un programa
-- termina, sus miembros conservan el material que trabajaron —el mismo criterio
-- de derechos adquiridos que ya rige para el avance de los líderes—. Quien sale
-- de la cohorte (left_at) sí deja de verlo.

BEGIN;

CREATE TABLE IF NOT EXISTS app_learning.content_cohorts (
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    cohort_id uuid NOT NULL REFERENCES app_core.cohorts(cohort_id) ON DELETE CASCADE,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (content_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_content_cohorts_cohort ON app_learning.content_cohorts(cohort_id);

COMMIT;
