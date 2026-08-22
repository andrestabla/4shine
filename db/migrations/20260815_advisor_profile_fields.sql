-- Datos de Advisor: categoría, precio de sesión y link de pago.
--
-- El resto de la ficha (título, perfil, áreas de experticia, ubicación, años de
-- experiencia y redes) ya vivía en app_core.user_profiles y app_mentoring.
-- mentor_topics; aquí solo se agrega lo que faltaba.
--
-- Los tres campos nuevos son COMERCIALES: el advisor los ve pero no los edita,
-- solo gestor y admin (la regla se aplica en el servicio).

BEGIN;

CREATE TABLE IF NOT EXISTS app_admin.advisor_categories (
    category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Una etiqueta no se repite (sin importar mayúsculas ni espacios sobrantes).
CREATE UNIQUE INDEX IF NOT EXISTS idx_advisor_categories_label
    ON app_admin.advisor_categories (lower(btrim(label)));

INSERT INTO app_admin.advisor_categories (label, sort_order)
VALUES ('Advisor senior', 1), ('Advisor c-level', 2)
ON CONFLICT DO NOTHING;

ALTER TABLE app_core.user_profiles
    ADD COLUMN IF NOT EXISTS advisor_category text,
    ADD COLUMN IF NOT EXISTS session_price_amount numeric(12,2),
    ADD COLUMN IF NOT EXISTS session_price_currency text,
    ADD COLUMN IF NOT EXISTS payment_link_url text;

ALTER TABLE app_core.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_session_price_check;
ALTER TABLE app_core.user_profiles
    ADD CONSTRAINT user_profiles_session_price_check
    CHECK (session_price_amount IS NULL OR session_price_amount >= 0);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.advisor_categories TO app_runtime, app_admin;

COMMENT ON COLUMN app_core.user_profiles.advisor_category IS
'Categoría comercial del advisor (etiqueta de app_admin.advisor_categories). Solo la cambian gestor y admin.';
COMMENT ON COLUMN app_core.user_profiles.session_price_amount IS
'Precio de la sesión de trabajo del advisor. Solo lo cambian gestor y admin.';
COMMENT ON COLUMN app_core.user_profiles.payment_link_url IS
'Link de pago del advisor. Solo lo cambian gestor y admin.';

COMMIT;
