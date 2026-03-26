ALTER TABLE app_admin.integration_configs
DROP CONSTRAINT IF EXISTS integration_configs_integration_key_check;

ALTER TABLE app_admin.integration_configs
ADD CONSTRAINT integration_configs_integration_key_check
CHECK (
  integration_key IN (
    'google_meet',
    'google_calendar',
    'r2',
    'gemini',
    'google_sso',
    'openai',
    'youtube_data_api'
  )
);
