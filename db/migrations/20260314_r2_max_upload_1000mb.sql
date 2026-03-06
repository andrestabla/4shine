-- Establece tamaño máximo por archivo en R2 a 1000 MB para todas las organizaciones.
UPDATE app_admin.integration_configs
SET wizard_data = jsonb_set(
      COALESCE(wizard_data, '{}'::jsonb),
      '{maxFileSizeMb}',
      to_jsonb('1000'::text),
      true
    )
WHERE integration_key = 'r2'
  AND COALESCE(wizard_data->>'maxFileSizeMb', '') <> '1000';
