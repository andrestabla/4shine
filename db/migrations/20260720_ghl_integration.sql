-- ============================================================================
-- Integración GoHighLevel (GHL) → 4Shine
-- 1) Bitácora de webhooks recibidos (idempotencia + reporte para el admin)
-- 2) Mapeo program_id (GHL) → plan de suscripción 4Shine (editable sin deploy)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS app_billing;

-- ─── 1. Eventos de webhook ──────────────────────────────────────────────────
-- Registra TODO evento recibido, se procese o no. La unicidad
-- (transaction_id, event_type) es la garantía de idempotencia: si GHL reintenta,
-- el INSERT choca y el endpoint responde duplicate_ignored sin volver a
-- provisionar.
CREATE TABLE IF NOT EXISTS app_billing.ghl_webhook_events (
    event_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  text        NOT NULL,
    event_type      text        NOT NULL,
    program_id      text,
    product_name    text,
    email           citext,
    first_name      text,
    last_name       text,
    mode            text,                      -- live | test
    signature_ok    boolean     NOT NULL DEFAULT false,
    status          text        NOT NULL,      -- created | updated | renewed | access_revoked
                                               -- suspended | cancel_scheduled | duplicate_ignored
                                               -- unknown_program | invalid_signature | invalid_payload | error
    result_message  text,
    user_id         uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    plan_id         uuid,
    expires_at      timestamptz,
    payload         jsonb       NOT NULL,
    received_at     timestamptz NOT NULL DEFAULT now(),
    processed_at    timestamptz,
    CONSTRAINT ghl_webhook_events_unique_event UNIQUE (transaction_id, event_type)
);

CREATE INDEX IF NOT EXISTS ghl_webhook_events_received_idx
    ON app_billing.ghl_webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS ghl_webhook_events_status_idx
    ON app_billing.ghl_webhook_events (status);
CREATE INDEX IF NOT EXISTS ghl_webhook_events_email_idx
    ON app_billing.ghl_webhook_events (email);

-- ─── 2. Mapeo de productos ──────────────────────────────────────────────────
-- La vigencia REAL sale de aquí (o del plan), nunca de enrolment_months del
-- payload: ese campo es manipulable desde fuera.
CREATE TABLE IF NOT EXISTS app_billing.ghl_program_map (
    program_id      text        PRIMARY KEY,
    label           text        NOT NULL,
    kind            text        NOT NULL DEFAULT 'plan',   -- plan | diagnostico
    plan_id         uuid,                                   -- FK lógica a app_billing.subscription_plans
    duration_days   integer,                                -- NULL = usa duration_days del plan
    role_override   text,                                   -- p.ej. 'invitado' para el diagnóstico
    plan_type       text,                                   -- standard | premium | vip | empresa_elite
    price_usd       numeric(10,2),
    is_active       boolean     NOT NULL DEFAULT true,
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Catálogo inicial (plan_id queda NULL: se asigna desde Administración → GHL)
INSERT INTO app_billing.ghl_program_map
    (program_id, label, kind, duration_days, role_override, plan_type, price_usd)
VALUES
    ('discovery_4shine',       'Diagnóstico 4Shine',               'diagnostico', 365,  'invitado', NULL,      15),
    ('circulo_vip_semestral',  'Círculo Líderes VIP · Semestral',  'plan',        180,  NULL,       'vip',     197),
    ('circulo_vip_trimestral', 'Círculo Líderes VIP · Trimestral', 'plan',        90,   NULL,       'vip',     119),
    ('circulo_vip_mensual',    'Círculo Líderes VIP · Mensual',    'plan',        30,   NULL,       'vip',     49),
    ('marca_ejecutiva',        'Marca Ejecutiva',                  'plan',        180,  NULL,       'premium', 3000),
    ('ceo_signature',          'CEO Signature',                    'plan',        180,  NULL,       'premium', 4000),
    ('reinventate_pro',        'Reinvéntate PRO',                  'plan',        90,   NULL,       'premium', 2500),
    ('executive_edge',         'Executive Edge',                   'plan',        90,   NULL,       'premium', 990)
ON CONFLICT (program_id) DO NOTHING;

-- ─── 3. Permisos y RLS ──────────────────────────────────────────────────────
-- Ambas tablas son de uso exclusivo del administrador (permiso usuarios:manage);
-- el webhook accede bajo contexto de rol admin, igual que los crons.
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.ghl_webhook_events TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.ghl_program_map   TO app_runtime;

ALTER TABLE app_billing.ghl_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_billing.ghl_webhook_events FORCE  ROW LEVEL SECURITY;
ALTER TABLE app_billing.ghl_program_map    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_billing.ghl_program_map    FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ghl_webhook_events_manage ON app_billing.ghl_webhook_events;
CREATE POLICY ghl_webhook_events_manage ON app_billing.ghl_webhook_events
FOR ALL
USING (app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.has_permission('usuarios', 'manage'));

DROP POLICY IF EXISTS ghl_program_map_manage ON app_billing.ghl_program_map;
CREATE POLICY ghl_program_map_manage ON app_billing.ghl_program_map
FOR ALL
USING (app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.has_permission('usuarios', 'manage'));
