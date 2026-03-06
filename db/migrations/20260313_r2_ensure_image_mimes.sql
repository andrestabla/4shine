-- =========================================================
-- ENSURE R2 ALLOWED MIME TYPES INCLUDE UI IMAGES
-- =========================================================

WITH base AS (
  SELECT
    integration_id,
    COALESCE(wizard_data, '{}'::jsonb) AS wizard_data,
    COALESCE(NULLIF(wizard_data->>'allowedMimeTypes', ''), '') AS allowed
  FROM app_admin.integration_configs
  WHERE integration_key = 'r2'
), patched AS (
  SELECT
    integration_id,
    trim(both E'\n' FROM (
      'image/png\nimage/jpeg\nimage/webp\nimage/gif\nimage/svg+xml\nimage/x-icon' ||
      CASE WHEN allowed = '' THEN '' ELSE E'\n' || allowed END
    )) AS merged_allowed,
    wizard_data
  FROM base
  WHERE allowed NOT ILIKE '%image/%'
)
UPDATE app_admin.integration_configs ic
SET wizard_data = jsonb_set(
  patched.wizard_data,
  '{allowedMimeTypes}',
  to_jsonb(patched.merged_allowed),
  true
)
FROM patched
WHERE ic.integration_id = patched.integration_id;
