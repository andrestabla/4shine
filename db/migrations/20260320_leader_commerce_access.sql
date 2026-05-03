BEGIN;

CREATE SCHEMA IF NOT EXISTS app_billing;

CREATE TABLE IF NOT EXISTS app_billing.product_catalog (
    product_code text PRIMARY KEY CHECK (
        product_code IN (
            'program_4shine',
            'discovery_4shine',
            'mentoring_pack_1',
            'mentoring_pack_3',
            'mentoring_pack_5'
        )
    ),
    product_group text NOT NULL CHECK (product_group IN ('program', 'discovery', 'mentoring_pack')),
    name text NOT NULL,
    headline text NOT NULL,
    description text NOT NULL,
    price_amount numeric(10,2) NOT NULL CHECK (price_amount >= 0),
    currency_code text NOT NULL DEFAULT 'USD',
    sessions_included integer NOT NULL DEFAULT 0 CHECK (sessions_included >= 0),
    highlight_label text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 100,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_billing.user_purchases (
    purchase_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    product_code text NOT NULL REFERENCES app_billing.product_catalog(product_code) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'consumed')),
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price_amount numeric(10,2) NOT NULL CHECK (unit_price_amount >= 0),
    currency_code text NOT NULL DEFAULT 'USD',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    purchased_at timestamptz NOT NULL DEFAULT now(),
    activated_at timestamptz,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_products_group
    ON app_billing.product_catalog(product_group, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_user_purchases_owner
    ON app_billing.user_purchases(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_purchases_product
    ON app_billing.user_purchases(product_code, status);

INSERT INTO app_billing.product_catalog (
    product_code,
    product_group,
    name,
    headline,
    description,
    price_amount,
    currency_code,
    sessions_included,
    highlight_label,
    is_active,
    sort_order
)
VALUES
    (
        'program_4shine',
        'program',
        '4Shine programa',
        'Ruta completa con suscripción',
        'Desbloquea Trayectoria, Descubrimiento, Aprendizaje completo, comunidad y mentorías incluidas del programa.',
        2000,
        'USD',
        10,
        'Programa principal',
        true,
        10
    ),
    (
        'discovery_4shine',
        'discovery',
        'Descubrimiento',
        'Diagnóstico individual',
        'Compra puntual para realizar la prueba diagnóstica 4Shine y acceder a su lectura ejecutiva.',
        50,
        'USD',
        0,
        'Acceso puntual',
        true,
        20
    ),
    (
        'mentoring_pack_1',
        'mentoring_pack',
        'Mentoría 1 sesión',
        'Pack individual',
        'Compra 1 sesión adicional de mentoría con Adviser disponible.',
        50,
        'USD',
        1,
        NULL,
        true,
        30
    ),
    (
        'mentoring_pack_3',
        'mentoring_pack',
        'Mentoría 3 sesiones',
        'Pack intensivo',
        'Compra 3 sesiones adicionales de mentoría con tarifa preferencial.',
        140,
        'USD',
        3,
        'Más elegido',
        true,
        40
    ),
    (
        'mentoring_pack_5',
        'mentoring_pack',
        'Mentoría 5 sesiones',
        'Pack expansión',
        'Compra 5 sesiones adicionales de mentoría para acompañamiento sostenido.',
        200,
        'USD',
        5,
        'Mejor valor',
        true,
        50
    )
ON CONFLICT (product_code) DO UPDATE
SET
    product_group = EXCLUDED.product_group,
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    price_amount = EXCLUDED.price_amount,
    currency_code = EXCLUDED.currency_code,
    sessions_included = EXCLUDED.sessions_included,
    highlight_label = EXCLUDED.highlight_label,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO app_core.user_profiles (
    user_id,
    plan_type,
    country,
    job_role,
    years_experience,
    gender
)
SELECT
    u.user_id,
    'premium',
    'No definido',
    'Especialista sin personal a cargo',
    0,
    'Prefiero no decirlo'
FROM app_core.users u
WHERE u.email = 'andresrico50@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET
    plan_type = 'premium',
    country = COALESCE(NULLIF(BTRIM(app_core.user_profiles.country), ''), 'No definido'),
    job_role = COALESCE(NULLIF(BTRIM(app_core.user_profiles.job_role), ''), 'Especialista sin personal a cargo'),
    years_experience = COALESCE(app_core.user_profiles.years_experience, 0),
    gender = COALESCE(NULLIF(BTRIM(app_core.user_profiles.gender), ''), 'Prefiero no decirlo'),
    updated_at = now();

INSERT INTO app_billing.user_purchases (
    user_id,
    product_code,
    status,
    quantity,
    unit_price_amount,
    currency_code,
    metadata,
    purchased_at,
    activated_at
)
SELECT
    u.user_id,
    'program_4shine',
    'active',
    1,
    2000,
    'USD',
    jsonb_build_object('seeded_by', '20260320_leader_commerce_access'),
    now(),
    now()
FROM app_core.users u
WHERE u.email = 'andresrico50@gmail.com'
  AND NOT EXISTS (
      SELECT 1
      FROM app_billing.user_purchases up
      WHERE up.user_id = u.user_id
        AND up.product_code = 'program_4shine'
        AND up.status = 'active'
  );

DROP TRIGGER IF EXISTS trg_billing_product_catalog_set_updated_at ON app_billing.product_catalog;
CREATE TRIGGER trg_billing_product_catalog_set_updated_at
BEFORE UPDATE ON app_billing.product_catalog
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_billing_user_purchases_set_updated_at ON app_billing.user_purchases;
CREATE TRIGGER trg_billing_user_purchases_set_updated_at
BEFORE UPDATE ON app_billing.user_purchases
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT USAGE ON SCHEMA app_billing TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.product_catalog TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.user_purchases TO app_runtime, app_admin;

COMMENT ON TABLE app_billing.product_catalog IS 'Catálogo comercial visible para planes, diagnóstico y packs de mentoría.';
COMMENT ON TABLE app_billing.user_purchases IS 'Compras y activaciones de productos por usuario.';
COMMENT ON COLUMN app_billing.user_purchases.user_id IS 'Usuario comprador o titular del acceso.';
COMMENT ON COLUMN app_billing.user_purchases.product_code IS 'Producto comercial adquirido.';
COMMENT ON COLUMN app_billing.user_purchases.status IS 'Estado del acceso comercial o compra.';

COMMIT;
