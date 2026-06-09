-- Payment columns on additional_mentorship_orders + new integration keys (wompi, stripe).
-- Idempotent migration.

-- 1. Payment columns
ALTER TABLE app_mentoring.additional_mentorship_orders
    ADD COLUMN IF NOT EXISTS payment_provider text,
    ADD COLUMN IF NOT EXISTS payment_reference text,
    ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_redirect_url text,
    ADD COLUMN IF NOT EXISTS paid_at timestamptz;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'additional_orders_payment_provider_chk'
          AND conrelid = 'app_mentoring.additional_mentorship_orders'::regclass
    ) THEN
        ALTER TABLE app_mentoring.additional_mentorship_orders
            ADD CONSTRAINT additional_orders_payment_provider_chk
            CHECK (payment_provider IS NULL OR payment_provider IN ('stripe', 'wompi', 'manual'));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'additional_orders_payment_status_chk'
          AND conrelid = 'app_mentoring.additional_mentorship_orders'::regclass
    ) THEN
        ALTER TABLE app_mentoring.additional_mentorship_orders
            ADD CONSTRAINT additional_orders_payment_status_chk
            CHECK (payment_status IN ('pending', 'awaiting_payment', 'paid', 'failed', 'refunded', 'cancelled'));
    END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_orders_provider_reference
    ON app_mentoring.additional_mentorship_orders(payment_provider, payment_reference)
    WHERE payment_reference IS NOT NULL;

-- 2. Add 'stripe' and 'wompi' to the integration_configs whitelist.
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
        'wompi'
    ]));
