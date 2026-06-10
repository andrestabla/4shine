-- Workshops de pago: tabla de órdenes + historial de intentos de pago.
--
-- Replica el mismo modelo que ya existe para
-- `app_mentoring.additional_mentorship_orders` y
-- `app_mentoring.payment_attempts`, pero para el dominio de workshops.
--
-- Decisiones de diseño confirmadas con el usuario:
--   1. Precio se "snapshotea" al momento de comprar: si admin sube el
--      precio del workshop después, los compradores anteriores quedan
--      con el precio que pagaron (price_amount/currency en la orden).
--   2. Si el workshop está lleno (max_attendees alcanzado) la compra NO
--      se bloquea: se vende con waitlist. Por eso añadimos el status
--      'waitlist' a workshop_attendees.
--   3. Reembolsos solo los pueden ejecutar admin o gestor (gate vía
--      módulo `workshops.approve` / RLS). No se modela aquí.
--   4. Workshops gratis (price = 0 o NULL) NO pasan por este sistema:
--      siguen usando workshop_attendees directamente con applyToWorkshop.
--
-- Idempotente.

BEGIN;

-- 1) Permitir status 'waitlist' en workshop_attendees.
--    Cuando max_attendees está lleno y un usuario compra, su attendance
--    queda en 'waitlist'; admin/gestor decide si lo asciende a 'registered'.
ALTER TABLE app_networking.workshop_attendees
    DROP CONSTRAINT IF EXISTS workshop_attendees_attendance_status_check;

ALTER TABLE app_networking.workshop_attendees
    ADD CONSTRAINT workshop_attendees_attendance_status_check
    CHECK (attendance_status IN (
        'invited',
        'registered',
        'waitlist',
        'attended',
        'no_show',
        'cancelled'
    ));

-- 2) Tabla principal de órdenes de workshop. Vive en su propio espacio,
--    no abusa de workshop_attendees (que es para "presencia/registro").
CREATE TABLE IF NOT EXISTS app_networking.workshop_orders (
    order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id uuid NOT NULL
        REFERENCES app_networking.workshops(workshop_id) ON DELETE CASCADE,
    owner_user_id uuid NOT NULL
        REFERENCES app_core.users(user_id) ON DELETE CASCADE,

    -- Snapshot de precio: lo que el usuario realmente pagó.
    price_amount numeric(10,2) NOT NULL,
    currency_code text NOT NULL DEFAULT 'USD',

    -- Estado funcional de la orden (independiente del status de pago).
    status text NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'refunded')),

    -- Estado del pago en sí (paralelo a additional_mentorship_orders).
    payment_provider text
        CHECK (payment_provider IS NULL OR payment_provider IN ('stripe', 'wompi', 'manual')),
    payment_reference text,
    payment_status text NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'awaiting_payment', 'paid', 'failed', 'refunded', 'cancelled')),
    payment_redirect_url text,
    paid_at timestamptz,

    refunded_at timestamptz,
    refund_reference text,
    refund_reason text,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Un usuario solo puede tener una orden "viva" por workshop. Si el
    -- pago falla y se queda en 'cancelled'/'refunded', dejarías una fila
    -- bloqueando el UNIQUE; por eso el unique es parcial: aplica solo a
    -- órdenes en pending_payment o paid (las "activas").
    CONSTRAINT workshop_orders_price_nonneg CHECK (price_amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_orders_active_owner
    ON app_networking.workshop_orders(workshop_id, owner_user_id)
    WHERE status IN ('pending_payment', 'paid');

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_orders_provider_reference
    ON app_networking.workshop_orders(payment_provider, payment_reference)
    WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workshop_orders_owner
    ON app_networking.workshop_orders(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_workshop_orders_workshop
    ON app_networking.workshop_orders(workshop_id);

CREATE INDEX IF NOT EXISTS idx_workshop_orders_status
    ON app_networking.workshop_orders(status);

-- Trigger de updated_at usando la función estándar del schema.
DROP TRIGGER IF EXISTS trg_workshop_orders_updated_at
    ON app_networking.workshop_orders;

CREATE TRIGGER trg_workshop_orders_updated_at
    BEFORE UPDATE ON app_networking.workshop_orders
    FOR EACH ROW
    EXECUTE FUNCTION app_core.set_updated_at();

-- 3) Historial de intentos de pago (paralelo a app_mentoring.payment_attempts).
CREATE TABLE IF NOT EXISTS app_networking.workshop_payment_attempts (
    attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL
        REFERENCES app_networking.workshop_orders(order_id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_workshop_payment_attempts_order
    ON app_networking.workshop_payment_attempts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workshop_payment_attempts_provider_ref
    ON app_networking.workshop_payment_attempts(provider, reference)
    WHERE reference IS NOT NULL;

-- 4) Grants para que app_runtime pueda leer/escribir.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON app_networking.workshop_orders TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON app_networking.workshop_payment_attempts TO app_runtime;

-- 5) RLS. La policy es laxa porque la autorización real ocurre en el
--    service layer (requireModulePermission('workshops', ...)). Pero
--    activamos RLS para que solo el runtime con role context pueda leer.
ALTER TABLE app_networking.workshop_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_networking.workshop_payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workshop_orders_read  ON app_networking.workshop_orders;
CREATE POLICY workshop_orders_read ON app_networking.workshop_orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS workshop_orders_write ON app_networking.workshop_orders;
CREATE POLICY workshop_orders_write ON app_networking.workshop_orders
    FOR ALL
    USING  (app_auth.current_role() IN ('lider', 'mentor', 'admin', 'gestor'))
    WITH CHECK (app_auth.current_role() IN ('lider', 'mentor', 'admin', 'gestor'));

DROP POLICY IF EXISTS workshop_payment_attempts_read  ON app_networking.workshop_payment_attempts;
CREATE POLICY workshop_payment_attempts_read ON app_networking.workshop_payment_attempts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS workshop_payment_attempts_write ON app_networking.workshop_payment_attempts;
CREATE POLICY workshop_payment_attempts_write ON app_networking.workshop_payment_attempts
    FOR ALL
    USING  (app_auth.current_role() IN ('lider', 'mentor', 'admin', 'gestor'))
    WITH CHECK (app_auth.current_role() IN ('lider', 'mentor', 'admin', 'gestor'));

COMMIT;
