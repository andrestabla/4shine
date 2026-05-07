-- Add 'privacy_policy' to the allowed integration_key values so the
-- privacy policy text can be stored and edited from the admin panel.
ALTER TABLE app_admin.integration_configs
DROP CONSTRAINT IF EXISTS integration_configs_integration_key_check;

ALTER TABLE app_admin.integration_configs
ADD CONSTRAINT integration_configs_integration_key_check
CHECK (integration_key = ANY (ARRAY[
  'google_meet',
  'google_calendar',
  'r2',
  'gemini',
  'google_sso',
  'openai',
  'youtube_data_api',
  'privacy_policy'
]));
