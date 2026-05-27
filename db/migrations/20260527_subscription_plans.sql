-- ============================================================
-- Subscription Plans & Pricing Management
-- ============================================================
-- Permite al admin/gestor administrar dinámicamente los planes
-- y precios de la plataforma. Cada plan tiene metadatos
-- comerciales y un set granular de permisos por módulo/feature.
-- ============================================================

BEGIN;

-- --------------------------------------------------------
-- Subscription plans (catálogo dinámico de planes)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_billing.subscription_plans (
  plan_id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code        text        NOT NULL UNIQUE
                                 CHECK (plan_code ~ '^[a-z0-9_]+$'
                                        AND char_length(plan_code) BETWEEN 2 AND 60),
  plan_group       text        NOT NULL DEFAULT 'program'
                                 CHECK (plan_group IN ('program', 'circulo', 'custom')),
  name             text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description      text        NOT NULL DEFAULT '',
  highlight_label  text,
  price_amount     numeric(10,2) NOT NULL CHECK (price_amount >= 0),
  currency_code    text        NOT NULL DEFAULT 'USD',
  duration_days    int         NOT NULL CHECK (duration_days > 0),
  is_active        boolean     NOT NULL DEFAULT true,
  is_system        boolean     NOT NULL DEFAULT false,
  sort_order       int         NOT NULL DEFAULT 100,
  created_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active
  ON app_billing.subscription_plans(is_active, sort_order);

DROP TRIGGER IF EXISTS trg_subscription_plans_set_updated_at
  ON app_billing.subscription_plans;
CREATE TRIGGER trg_subscription_plans_set_updated_at
BEFORE UPDATE ON app_billing.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

-- --------------------------------------------------------
-- Plan module features (permisos granulares por feature)
-- --------------------------------------------------------
-- feature_key sigue la convención `<modulo>` o `<modulo>_<sub>`
-- y se enumera en src/features/planes/features-catalog.ts
CREATE TABLE IF NOT EXISTS app_billing.plan_module_features (
  plan_id           uuid        NOT NULL
                                  REFERENCES app_billing.subscription_plans(plan_id)
                                  ON DELETE CASCADE,
  feature_key       text        NOT NULL,
  is_enabled        boolean     NOT NULL DEFAULT false,
  quota             int,
  metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan
  ON app_billing.plan_module_features(plan_id);

-- --------------------------------------------------------
-- Vincular usuario a plan dinámico
-- --------------------------------------------------------
ALTER TABLE app_core.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid
    REFERENCES app_billing.subscription_plans(plan_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan
  ON app_core.user_profiles(subscription_plan_id);

-- --------------------------------------------------------
-- Vincular compras al plan elegido
-- --------------------------------------------------------
ALTER TABLE app_billing.user_purchases
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid
    REFERENCES app_billing.subscription_plans(plan_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_purchases_subscription_plan
  ON app_billing.user_purchases(subscription_plan_id);

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
ALTER TABLE app_billing.subscription_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_billing.plan_module_features   ENABLE ROW LEVEL SECURITY;

-- Lectura abierta para todos los roles autenticados; escritura admin/gestor
DROP POLICY IF EXISTS subscription_plans_read   ON app_billing.subscription_plans;
CREATE POLICY subscription_plans_read ON app_billing.subscription_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS subscription_plans_write  ON app_billing.subscription_plans;
CREATE POLICY subscription_plans_write ON app_billing.subscription_plans
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS plan_features_read   ON app_billing.plan_module_features;
CREATE POLICY plan_features_read ON app_billing.plan_module_features
  FOR SELECT USING (true);

DROP POLICY IF EXISTS plan_features_write  ON app_billing.plan_module_features;
CREATE POLICY plan_features_write ON app_billing.plan_module_features
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

-- --------------------------------------------------------
-- Runtime grants
-- --------------------------------------------------------
GRANT USAGE ON SCHEMA app_billing TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.subscription_plans   TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.plan_module_features TO app_runtime;

-- --------------------------------------------------------
-- Seed planes iniciales (basado en spec comercial)
-- --------------------------------------------------------
INSERT INTO app_billing.subscription_plans
  (plan_code, plan_group, name, description, highlight_label,
   price_amount, currency_code, duration_days, is_active, is_system, sort_order)
VALUES
  ('marca_ejecutiva', 'program', 'Programa Marca Ejecutiva',
    'Programa de transformación del líder que busca profundizar en su autoconocimiento, fortalecer su presencia ejecutiva y convertir su liderazgo en una práctica más consciente, estratégica y coherente. A través de un recorrido estructurado de diagnóstico, workbooks, mentoría y evaluación, el líder identifica sus fortalezas, reconoce sus brechas, trabaja sus patrones internos, mejora su comunicación, amplía su capacidad de influencia y proyecta una visión de futuro alineada con su propósito y su legado.',
    'Más elegido', 3000, 'USD', 180, true, true, 10),
  ('ceo_signature', 'program', 'Programa CEO Signature',
    'El programa CEO Signature le permite al líder escalar su impacto, fortalecer su presencia ejecutiva y consolidar una firma de liderazgo estratégica, auténtica y orientada al legado. A través de un acompañamiento personalizado, el líder trabaja sus desafíos reales de alta dirección: toma de decisiones bajo presión, claridad estratégica, gestión emocional, escalamiento empresarial, influencia, networking de alto nivel y construcción de marca ejecutiva.',
    'Premium', 4000, 'USD', 180, true, true, 20),
  ('reinventate_pro', 'program', 'Programa Reinvéntate PRO',
    'El programa Reinvéntate PRO le permite al líder transitar un cambio profesional con claridad, estrategia y confianza, integrando reinvención personal, posicionamiento en el mercado y marca ejecutiva. A través de un acompañamiento personalizado, el líder trabaja su propósito, fortalece su narrativa profesional, optimiza su CV y LinkedIn, entrena entrevistas de alto nivel, activa su red de contactos y construye un plan de acción concreto para avanzar en su transición laboral.',
    NULL, 2500, 'USD', 90, true, true, 30),
  ('executive_edge', 'program', 'Programa Executive Edge',
    'El programa Executive Edge le permite al líder desarrollar desde etapas tempranas una estructura de autoconocimiento, comunicación, criterio relacional y proyección profesional. A través de un proceso formativo práctico y acompañado, el líder emergente identifica sus fortalezas, reconoce oportunidades de mejora, fortalece su seguridad personal, aprende a comunicarse con mayor claridad y comienza a construir una presencia profesional coherente con su potencial.',
    NULL, 990, 'USD', 90, true, true, 40),
  ('circulo_vip_semestral', 'circulo', 'Círculo Líderes VIP semestral',
    'Acceso semestral al Círculo de Líderes VIP. Sesiones grupales, cursos y comunidad activa.',
    NULL, 197, 'USD', 180, true, true, 110),
  ('circulo_vip_trimestral', 'circulo', 'Círculo Líderes VIP trimestral',
    'Acceso trimestral al Círculo de Líderes VIP. Sesiones grupales, cursos y comunidad activa.',
    NULL, 119, 'USD', 90, true, true, 120),
  ('circulo_vip_mensual', 'circulo', 'Círculo Líderes VIP mensual',
    'Acceso mensual al Círculo de Líderes VIP. Sesiones grupales, cursos y comunidad activa.',
    NULL, 49, 'USD', 30, true, true, 130)
ON CONFLICT (plan_code) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  highlight_label  = EXCLUDED.highlight_label,
  price_amount     = EXCLUDED.price_amount,
  currency_code    = EXCLUDED.currency_code,
  duration_days    = EXCLUDED.duration_days,
  sort_order       = EXCLUDED.sort_order,
  updated_at       = now();

-- --------------------------------------------------------
-- Seed permisos por feature
-- --------------------------------------------------------
-- Programa 4Shine (Marca, CEO, Reinvéntate, Executive Edge):
-- Acceso completo a todos los módulos. Executive Edge sólo tiene 4 mentorías 1:1.
WITH base_features AS (
  SELECT * FROM (VALUES
    ('trayectoria',                true,  NULL::int),
    ('descubrimiento',              true,  NULL),
    ('aprendizaje_recursos_free',   true,  NULL),
    ('aprendizaje_cursos',          true,  NULL),
    ('aprendizaje_workbooks',       true,  NULL),
    ('mentorias_grupales',          true,  10),
    ('mentorias_1on1',              true,  10),
    ('mentorias_comprar',           true,  NULL),
    ('networking',                  true,  NULL),
    ('mensajes',                    true,  NULL),
    ('convocatorias',               true,  NULL),
    ('workshops',                   true,  NULL)
  ) AS f(feature_key, is_enabled, quota)
)
INSERT INTO app_billing.plan_module_features (plan_id, feature_key, is_enabled, quota)
SELECT p.plan_id, f.feature_key, f.is_enabled,
       CASE
         WHEN p.plan_code = 'executive_edge' AND f.feature_key = 'mentorias_1on1' THEN 4
         ELSE f.quota
       END
FROM app_billing.subscription_plans p
CROSS JOIN base_features f
WHERE p.plan_code IN ('marca_ejecutiva', 'ceo_signature', 'reinventate_pro', 'executive_edge')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Círculo VIP (mensual / trimestral / semestral):
-- Acceso a aprendizaje (free + cursos), mentorías grupales, comunidad, mensajes, convocatorias, workshops.
-- NO incluye trayectoria, descubrimiento, workbooks ni mentorías 1:1.
WITH circulo_features AS (
  SELECT * FROM (VALUES
    ('trayectoria',                false, NULL::int),
    ('descubrimiento',              false, NULL),
    ('aprendizaje_recursos_free',   true,  NULL),
    ('aprendizaje_cursos',          true,  NULL),
    ('aprendizaje_workbooks',       false, NULL),
    ('mentorias_grupales',          true,  NULL),
    ('mentorias_1on1',              false, NULL),
    ('mentorias_comprar',           true,  NULL),
    ('networking',                  true,  NULL),
    ('mensajes',                    true,  NULL),
    ('convocatorias',               true,  NULL),
    ('workshops',                   true,  NULL)
  ) AS f(feature_key, is_enabled, quota)
)
INSERT INTO app_billing.plan_module_features (plan_id, feature_key, is_enabled, quota)
SELECT p.plan_id, f.feature_key, f.is_enabled, f.quota
FROM app_billing.subscription_plans p
CROSS JOIN circulo_features f
WHERE p.plan_group = 'circulo'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

COMMENT ON TABLE app_billing.subscription_plans IS
  'Catálogo dinámico de planes y precios administrable desde el panel admin (admin/gestor).';
COMMENT ON TABLE app_billing.plan_module_features IS
  'Permisos granulares por módulo/feature para cada plan dinámico.';
COMMENT ON COLUMN app_core.user_profiles.subscription_plan_id IS
  'Plan dinámico activo del usuario (FK a app_billing.subscription_plans).';

COMMIT;
