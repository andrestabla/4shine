-- Módulo de Cohortes.
--
-- Las tablas app_core.cohorts y app_core.cohort_memberships existen desde el
-- esquema inicial pero nunca se usaron (0 filas) y no tenían ni organización,
-- ni permisos, ni capa de accesos. Esta migración las pone en servicio.
--
-- Decisión de alcance: por ahora TODAS las cohortes pertenecen a la misma
-- organización (Algoritmo T's). Se modela igual con organization_id explícito
-- —con esa organización como valor por defecto— para no tener que rehacer el
-- modelo el día que exista una segunda.

BEGIN;

-- ── 1. La cohorte vive dentro de una organización ───────────────────────────
ALTER TABLE app_core.cohorts
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES app_core.organizations(organization_id) ON DELETE RESTRICT;

UPDATE app_core.cohorts
SET organization_id = (SELECT organization_id FROM app_core.organizations WHERE name = 'Algoritmo T''s')
WHERE organization_id IS NULL;

-- Postgres no admite subconsultas en DEFAULT, así que el valor se fija con
-- SQL dinámico a partir del nombre de la organización.
DO $$
DECLARE
    org uuid;
BEGIN
    SELECT organization_id INTO org FROM app_core.organizations WHERE name = 'Algoritmo T''s';
    IF org IS NULL THEN
        RAISE EXCEPTION 'No existe la organización Algoritmo T''''s';
    END IF;
    EXECUTE format('ALTER TABLE app_core.cohorts ALTER COLUMN organization_id SET DEFAULT %L', org);
END $$;

ALTER TABLE app_core.cohorts
    ALTER COLUMN organization_id SET NOT NULL;

-- Descripción libre: para qué es la cohorte, a quién agrupa.
ALTER TABLE app_core.cohorts
    ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_cohorts_organization_id ON app_core.cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON app_core.cohorts(status);

-- ── 2. Accesos por cohorte ──────────────────────────────────────────────────
-- Mismo diseño que app_auth.user_module_access: sin fila = manda el plan;
-- false = apagado aunque el plan lo incluya; true = encendido aunque no.
-- module_code admite también claves de sección (mentorias_1on1, etc.), por eso
-- no lleva llave foránea contra app_auth.modules.
CREATE TABLE IF NOT EXISTS app_auth.cohort_module_access (
    cohort_id uuid NOT NULL REFERENCES app_core.cohorts(cohort_id) ON DELETE CASCADE,
    module_code text NOT NULL,
    is_enabled boolean NOT NULL,
    updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (cohort_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_cohort_module_access_cohort ON app_auth.cohort_module_access(cohort_id);

-- ── 3. Módulo y permisos ────────────────────────────────────────────────────
INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES ('cohortes', 'Cohortes', 'Agrupamiento de lideres para personalizar accesos y generar informes.', false)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description;

INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete, can_approve, can_moderate, can_manage
)
VALUES
    ('admin',   'cohortes', true,  true,  true,  true,  false, false, true),
    ('gestor',  'cohortes', true,  true,  true,  true,  false, false, true),
    ('mentor',  'cohortes', false, false, false, false, false, false, false),
    ('lider',   'cohortes', false, false, false, false, false, false, false),
    ('invitado','cohortes', false, false, false, false, false, false, false)
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_manage = EXCLUDED.can_manage;

COMMIT;
