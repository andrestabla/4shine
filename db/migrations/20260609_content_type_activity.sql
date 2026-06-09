-- Agrega 'activity' como nuevo content_type permitido. Permite crear
-- contenidos cuyo cuerpo primario es una actividad/quiz (sin video/PDF).
-- Idempotente.

ALTER TABLE app_learning.content_items
    DROP CONSTRAINT IF EXISTS content_items_content_type_check;

ALTER TABLE app_learning.content_items
    ADD CONSTRAINT content_items_content_type_check
    CHECK (content_type IN (
        'video',
        'pdf',
        'scorm',
        'article',
        'podcast',
        'html',
        'ppt',
        'activity'
    ));
