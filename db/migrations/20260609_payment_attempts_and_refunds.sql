-- Tracking de intentos de pago (historial separado) + columnas de reembolso.
-- Idempotente.

CREATE TABLE IF NOT EXISTS app_mentoring.payment_attempts (
    attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES app_mentoring.additional_mentorship_orders(order_id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('stripe', 'wompi', 'manual')),
    status text NOT NULL CHECK (status IN (
        'initiated',
        'awaiting_payment',
        'succeeded',
        'failed',
        'refunded',
        'refund_failed'
    )),
    reference text,
    error_code text,
    error_message text,
    raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order
    ON app_mentoring.payment_attempts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider_ref
    ON app_mentoring.payment_attempts(provider, reference)
    WHERE reference IS NOT NULL;

-- Columnas de reembolso sobre la orden
ALTER TABLE app_mentoring.additional_mentorship_orders
    ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
    ADD COLUMN IF NOT EXISTS refund_reference text,
    ADD COLUMN IF NOT EXISTS refund_reason text;
