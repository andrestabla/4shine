-- ============================================================
-- Contenido: visibilidad en biblioteca + borrado lógico (papelera).
-- - show_in_library: si false, el contenido NO aparece en Aprendizaje
--   (Contenidos libres / Cursos), pero sigue publicado y disponible para
--   usarse dentro de un curso o abrirse por enlace directo.
-- - deleted_at: borrado lógico. Eliminar mueve a papelera; se puede restaurar
--   o eliminar definitivamente.
-- ============================================================
-- Idempotente.

ALTER TABLE app_learning.content_items
  ADD COLUMN IF NOT EXISTS show_in_library boolean NOT NULL DEFAULT true;

ALTER TABLE app_learning.content_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_content_items_deleted_at
  ON app_learning.content_items(deleted_at);
