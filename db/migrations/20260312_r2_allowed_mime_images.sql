-- =========================================================
-- R2 MIME DEFAULTS FOR UI ASSETS (IMAGES + FILES)
-- =========================================================

UPDATE app_admin.integration_configs
SET wizard_data = jsonb_set(
  COALESCE(wizard_data, '{}'::jsonb),
  '{allowedMimeTypes}',
  to_jsonb(
    'image/png\nimage/jpeg\nimage/webp\nimage/gif\nimage/svg+xml\nimage/x-icon\napplication/pdf\nvideo/mp4\naudio/mpeg\napplication/zip'::text
  ),
  true
)
WHERE integration_key = 'r2'
  AND (
    wizard_data IS NULL
    OR NOT (wizard_data ? 'allowedMimeTypes')
    OR NULLIF(wizard_data->>'allowedMimeTypes', '') IS NULL
    OR wizard_data->>'allowedMimeTypes' = 'application/pdf\nvideo/mp4\napplication/zip'
  );
