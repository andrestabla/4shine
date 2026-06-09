-- Fase 2 de actividades: 3 nuevos tipos de pregunta (drag/drop equivalent
-- con interacción click-to-select).
--   - matching      : emparejar columnas
--   - classification: arrastrar items a categorías
--   - hotspot       : click en zona de imagen
-- Idempotente.

ALTER TABLE app_learning.activity_questions
    DROP CONSTRAINT IF EXISTS activity_questions_question_type_check;

ALTER TABLE app_learning.activity_questions
    ADD CONSTRAINT activity_questions_question_type_check
    CHECK (question_type IN (
        'single_choice',
        'multiple_choice',
        'true_false',
        'fill_blank',
        'numeric',
        'ordering',
        'matching',
        'classification',
        'hotspot'
    ));
