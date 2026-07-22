-- Encendido/apagado de módulos y submódulos del dashboard.
-- Afecta la visibilidad para todos los usuarios; el admin los sigue viendo
-- marcados como apagados para poder reactivarlos.
--
-- Solo se guardan las EXCEPCIONES: lo que no tiene fila está encendido. Así,
-- agregar un módulo nuevo al catálogo (src/features/modulos/catalog.ts) no
-- requiere migración ni queda invisible por omisión.

CREATE TABLE IF NOT EXISTS app_admin.module_visibility (
    organization_id uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
    -- Clave del catálogo: 'mentorias' o 'mentorias.grupales'.
    module_key      text        NOT NULL,
    is_enabled      boolean     NOT NULL DEFAULT true,
    updated_by      uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, module_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.module_visibility TO app_runtime;

ALTER TABLE app_admin.module_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.module_visibility FORCE  ROW LEVEL SECURITY;

-- Lectura para cualquier sesión autenticada: el menú de todo usuario necesita
-- saber qué está apagado. No hay nada sensible en estas filas.
DROP POLICY IF EXISTS module_visibility_select ON app_admin.module_visibility;
CREATE POLICY module_visibility_select ON app_admin.module_visibility
FOR SELECT
USING (app_auth.current_user_id() IS NOT NULL);

-- Escritura solo con permiso de administración.
DROP POLICY IF EXISTS module_visibility_write ON app_admin.module_visibility;
CREATE POLICY module_visibility_write ON app_admin.module_visibility
FOR ALL
USING (app_auth.has_permission('usuarios', 'manage'))
WITH CHECK (app_auth.has_permission('usuarios', 'manage'));
