-- ============================================================
-- En el módulo Aprendizaje, las pestañas "Contenidos libres" y "Cursos"
-- ahora pueden separarse independientemente del content_type.
--
-- - "Contenidos libres" muestra todos los items con library_location =
--   'contenidos_libres' (incluye recursos individuales y cursos que el
--   admin decidió ubicar ahí).
-- - "Cursos" muestra solo cursos (content_type = 'scorm') con
--   library_location = 'cursos'.
--
-- Backfill: los cursos existentes (scorm) quedan en 'cursos' por
-- compatibilidad con la vista anterior; todo lo demás en
-- 'contenidos_libres'.
-- ============================================================

ALTER TABLE app_learning.content_items
  ADD COLUMN IF NOT EXISTS library_location text NOT NULL DEFAULT 'contenidos_libres';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'content_items_library_location_chk'
      AND conrelid = 'app_learning.content_items'::regclass
  ) THEN
    ALTER TABLE app_learning.content_items
      ADD CONSTRAINT content_items_library_location_chk
      CHECK (library_location IN ('contenidos_libres', 'cursos'));
  END IF;
END;
$$;

UPDATE app_learning.content_items
SET library_location = 'cursos'
WHERE content_type = 'scorm'
  AND library_location <> 'cursos';

CREATE INDEX IF NOT EXISTS idx_content_items_library_location
  ON app_learning.content_items(library_location);
