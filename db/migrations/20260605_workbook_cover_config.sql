-- =========================================================
-- WORKBOOK COVER CONFIG (overlay + texts)
-- =========================================================
-- Admin/gestor pueden personalizar la carátula de cada workbook:
-- imagen (ya existente), color del overlay, opacidad del overlay,
-- y los textos visibles (kicker, título, resumen). El cover_config
-- vive como jsonb en workbook_templates y se snapshotea en cada
-- version publicada para mantener la semántica "solo los nuevos".

BEGIN;

ALTER TABLE app_learning.workbook_templates
  ADD COLUMN IF NOT EXISTS cover_config jsonb,
  ADD COLUMN IF NOT EXISTS draft_cover_config jsonb;

ALTER TABLE app_learning.workbook_template_versions
  ADD COLUMN IF NOT EXISTS cover_config jsonb;

ALTER TABLE app_learning.user_workbooks
  ADD COLUMN IF NOT EXISTS cover_config_snapshot jsonb;

COMMENT ON COLUMN app_learning.workbook_templates.cover_config
  IS 'Configuración de la carátula (publicada): { overlayHex, overlayOpacity, kicker, title, summary }. cover_image_url permanece en su propia columna para backward-compat.';
COMMENT ON COLUMN app_learning.workbook_templates.draft_cover_config
  IS 'Borrador de cover_config aún no publicado.';
COMMENT ON COLUMN app_learning.workbook_template_versions.cover_config
  IS 'Snapshot del cover_config al momento de publicar la versión.';
COMMENT ON COLUMN app_learning.user_workbooks.cover_config_snapshot
  IS 'Snapshot del cover_config en el momento que se creó la instancia del workbook del líder.';

COMMIT;
