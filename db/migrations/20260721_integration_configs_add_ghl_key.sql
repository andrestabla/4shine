-- Habilita 'ghl' en la lista blanca de integration_configs.
-- Sin esto, guardar la integración de GoHighLevel falla con
-- "violates check constraint integration_configs_integration_key_check".
-- La lista debe mantenerse en paridad con INTEGRATION_CATALOG
-- (src/features/administracion/types.ts).

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
        'privacy_policy',
        'site_pages',
        'zoom',
        'stripe',
        'wompi',
        'ghl'
    ]));
