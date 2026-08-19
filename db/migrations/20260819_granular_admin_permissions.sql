-- Permisos granulares para el panel de administración.
--
-- Hasta ahora, NUEVE áreas del panel se protegían con la misma llave que la
-- gestión de usuarios (`usuarios:manage`): branding, planes y precios,
-- integraciones, módulos, pagos, políticas, site, tour y documentación. Darle
-- "Administrar" sobre Gestión de Usuarios a un gestor —algo legítimo, para que
-- pueda eliminar cuentas o hacer operaciones masivas— le abría de golpe todo
-- el panel, incluidas las claves de las integraciones y los precios.
--
-- Esta migración separa las llaves: cada área es un módulo con su propia fila
-- en la matriz de permisos, así que se conceden una por una.
--
--   usuarios      : SOLO gestión de usuarios (cuentas, sesiones, auditoría,
--                   organizaciones, bajas). Deja de ser la llave maestra.
--   branding      : identidad visual.
--   planes        : planes, precios y catálogo de productos (el módulo ya
--                   existía en el catálogo pero nada lo usaba para proteger).
--   integraciones : conectores y sus secretos + correo saliente.
--   modulos       : encendido/apagado de módulos.
--   pagos         : transacciones y reembolsos de mentorías.
--   politicas     : texto de la política de privacidad.
--   site          : páginas públicas y su constructor.
--   tour          : recorrido guiado de onboarding.
--   documentacion : documentación técnica.
--
-- Se conceden todas al ADMIN y a nadie más: quien antes entraba por
-- `usuarios:manage` sin ser admin (un gestor con esa casilla marcada) deja de
-- entrar, que es justo lo que se reporta. Concederlas de nuevo es marcar la
-- casilla del módulo puntual en la matriz de roles.
--
-- Además se re-clavan las políticas RLS de cada área: antes exigían
-- `usuarios:manage` o directamente "el rol es admin o gestor", de modo que la
-- base de datos no distinguía a un gestor con permisos acotados. Ahora exigen
-- el permiso del área. Las lecturas públicas (planes visibles en el sitio,
-- branding del login, pasos del tour) se conservan intactas.
--
-- Idempotente.

BEGIN;

/* ── 1. Catálogo de módulos ──────────────────────────────────────────────── */

INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES
    ('branding',      'Branding y Marca',       'Identidad visual: colores, logo, loader, tipografía y favicon.', false),
    ('integraciones', 'Integraciones',          'Conectores y sus credenciales: Meet, Calendar, R2, OpenAI, SSO, Stripe, Wompi, GHL y correo saliente.', false),
    ('modulos',       'Módulos',                'Encender o apagar módulos y submódulos para toda la plataforma.', false),
    ('pagos',         'Pagos',                  'Transacciones de mentorías, intentos por proveedor y reembolsos.', false),
    ('politicas',     'Políticas',              'Texto de la política de privacidad que aceptan los usuarios.', false),
    ('site',          'Site',                   'Páginas públicas del sitio y su constructor por bloques.', false),
    ('tour',          'Tour de Onboarding',     'Recorrido guiado del primer ingreso: pasos por rol y analítica.', false),
    ('documentacion', 'Documentación Técnica',  'Documentación de arquitectura y de cada módulo del sistema.', false)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description;

/* ── 2. Matriz de roles ──────────────────────────────────────────────────── */

-- Admin: acceso completo a las áreas nuevas.
INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete, can_approve, can_moderate, can_manage
)
SELECT 'admin', m, true, true, true, true, true, true, true
FROM unnest(ARRAY[
    'branding','integraciones','modulos','pagos','politicas','site','tour','documentacion'
]) AS m
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = true, can_create = true, can_update = true, can_delete = true,
    can_approve = true, can_moderate = true, can_manage = true;

-- El resto de roles arranca sin acceso. Se concede módulo por módulo desde la
-- matriz de roles en Gestión de Usuarios.
INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete, can_approve, can_moderate, can_manage
)
SELECT r, m, false, false, false, false, false, false, false
FROM unnest(ARRAY['gestor','mentor','lider','invitado']) AS r
CROSS JOIN unnest(ARRAY[
    'branding','integraciones','modulos','pagos','politicas','site','tour','documentacion'
]) AS m
ON CONFLICT (role_code, module_code) DO NOTHING;

-- `planes` ya existía en el catálogo pero ningún control lo usaba: la página
-- de Planes y Precios se protegía con `usuarios:manage`. Al empezar a usarlo
-- de verdad, se alinea con el acceso que cada rol tenía HASTA HOY (solo el
-- admin), en vez de abrirle el área al gestor por una fila heredada.
UPDATE app_auth.role_module_permissions
SET can_view = true, can_create = true, can_update = true, can_delete = true,
    can_approve = true, can_moderate = true, can_manage = true
WHERE module_code = 'planes' AND role_code = 'admin';

UPDATE app_auth.role_module_permissions
SET can_view = false, can_create = false, can_update = false, can_delete = false,
    can_approve = false, can_moderate = false, can_manage = false
WHERE module_code = 'planes' AND role_code <> 'admin';

/* ── 3. RLS por área ─────────────────────────────────────────────────────── */

-- Branding: la lectura pública (login, sitio) no se toca.
DROP POLICY IF EXISTS branding_settings_insert_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_insert_manage ON app_admin.branding_settings
FOR INSERT TO PUBLIC
WITH CHECK (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS branding_settings_update_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_update_manage ON app_admin.branding_settings
FOR UPDATE TO PUBLIC
USING (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
)
WITH CHECK (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS branding_settings_delete_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_delete_manage ON app_admin.branding_settings
FOR DELETE TO PUBLIC
USING (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS branding_revisions_select_manage ON app_admin.branding_revisions;
CREATE POLICY branding_revisions_select_manage ON app_admin.branding_revisions
FOR SELECT TO PUBLIC
USING (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS branding_revisions_insert_manage ON app_admin.branding_revisions;
CREATE POLICY branding_revisions_insert_manage ON app_admin.branding_revisions
FOR INSERT TO PUBLIC
WITH CHECK (
    app_auth.has_permission('branding', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

-- Integraciones y correo saliente. Las políticas *_system_read (contexto de
-- sistema pre-login) y las *_runtime (openai/r2) se conservan tal cual: de
-- ellas dependen el login, el registro, el envío de correo y Zoom.
DROP POLICY IF EXISTS integration_configs_select_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_select_manage ON app_admin.integration_configs
FOR SELECT TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS integration_configs_insert_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_insert_manage ON app_admin.integration_configs
FOR INSERT TO PUBLIC
WITH CHECK (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS integration_configs_update_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_update_manage ON app_admin.integration_configs
FOR UPDATE TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
)
WITH CHECK (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS integration_configs_delete_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_delete_manage ON app_admin.integration_configs
FOR DELETE TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

-- La política de privacidad vive en esta misma tabla (integration_key =
-- 'privacy_policy'), pero es contenido editorial, no un secreto: quien
-- administra Políticas puede leer y escribir ESA fila y ninguna otra.
DROP POLICY IF EXISTS integration_configs_privacy_policy ON app_admin.integration_configs;
CREATE POLICY integration_configs_privacy_policy ON app_admin.integration_configs
FOR ALL TO PUBLIC
USING (integration_key = 'privacy_policy' AND app_auth.has_permission('politicas', 'manage'))
WITH CHECK (integration_key = 'privacy_policy' AND app_auth.has_permission('politicas', 'manage'));

-- Igual que la política de privacidad: el encendido de las páginas públicas se
-- guarda como integration_key = 'site_pages'. Es configuración del sitio, no
-- una credencial, así que la abre el permiso de Site sobre esa fila.
DROP POLICY IF EXISTS integration_configs_site_pages ON app_admin.integration_configs;
CREATE POLICY integration_configs_site_pages ON app_admin.integration_configs
FOR ALL TO PUBLIC
USING (integration_key = 'site_pages' AND app_auth.has_permission('site', 'manage'))
WITH CHECK (integration_key = 'site_pages' AND app_auth.has_permission('site', 'manage'));

DROP POLICY IF EXISTS outbound_email_configs_select_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_select_manage ON app_admin.outbound_email_configs
FOR SELECT TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS outbound_email_configs_insert_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_insert_manage ON app_admin.outbound_email_configs
FOR INSERT TO PUBLIC
WITH CHECK (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS outbound_email_configs_update_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_update_manage ON app_admin.outbound_email_configs
FOR UPDATE TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
)
WITH CHECK (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

DROP POLICY IF EXISTS outbound_email_configs_delete_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_delete_manage ON app_admin.outbound_email_configs
FOR DELETE TO PUBLIC
USING (
    app_auth.has_permission('integraciones', 'manage')
    AND (app_auth.is_admin() OR organization_id = (
        SELECT u.organization_id FROM app_core.users u WHERE u.user_id = app_auth.current_user_id()))
);

-- Encendido/apagado de módulos.
DROP POLICY IF EXISTS module_visibility_write ON app_admin.module_visibility;
CREATE POLICY module_visibility_write ON app_admin.module_visibility
FOR ALL TO PUBLIC
USING (app_auth.has_permission('modulos', 'manage'))
WITH CHECK (app_auth.has_permission('modulos', 'manage'));

-- GoHighLevel: ya existía el módulo `ghl`, pero la tabla seguía pidiendo
-- `usuarios:manage`.
DROP POLICY IF EXISTS ghl_webhook_events_manage ON app_billing.ghl_webhook_events;
CREATE POLICY ghl_webhook_events_manage ON app_billing.ghl_webhook_events
FOR ALL TO PUBLIC
USING (app_auth.has_permission('ghl', 'manage'))
WITH CHECK (app_auth.has_permission('ghl', 'manage'));

DROP POLICY IF EXISTS ghl_program_map_manage ON app_billing.ghl_program_map;
CREATE POLICY ghl_program_map_manage ON app_billing.ghl_program_map
FOR ALL TO PUBLIC
USING (app_auth.has_permission('ghl', 'manage'))
WITH CHECK (app_auth.has_permission('ghl', 'manage'));

-- Planes, precios y catálogo de productos: la escritura dependía del NOMBRE
-- del rol, así que cualquier gestor podía cambiar precios en base de datos.
DROP POLICY IF EXISTS subscription_plans_write ON app_billing.subscription_plans;
CREATE POLICY subscription_plans_write ON app_billing.subscription_plans
FOR ALL TO PUBLIC
USING (app_auth.has_permission('planes', 'manage'))
WITH CHECK (app_auth.has_permission('planes', 'manage'));

DROP POLICY IF EXISTS plan_features_write ON app_billing.plan_module_features;
CREATE POLICY plan_features_write ON app_billing.plan_module_features
FOR ALL TO PUBLIC
USING (app_auth.has_permission('planes', 'manage'))
WITH CHECK (app_auth.has_permission('planes', 'manage'));

DROP POLICY IF EXISTS product_catalog_write ON app_billing.product_catalog;
CREATE POLICY product_catalog_write ON app_billing.product_catalog
FOR ALL TO PUBLIC
USING (app_auth.has_permission('planes', 'manage'))
WITH CHECK (app_auth.has_permission('planes', 'manage'));

-- Tour de onboarding.
DROP POLICY IF EXISTS tour_settings_write ON app_admin.tour_settings;
CREATE POLICY tour_settings_write ON app_admin.tour_settings
FOR ALL TO PUBLIC
USING (app_auth.has_permission('tour', 'manage'))
WITH CHECK (app_auth.has_permission('tour', 'manage'));

DROP POLICY IF EXISTS tour_steps_write ON app_admin.tour_steps;
CREATE POLICY tour_steps_write ON app_admin.tour_steps
FOR ALL TO PUBLIC
USING (app_auth.has_permission('tour', 'manage'))
WITH CHECK (app_auth.has_permission('tour', 'manage'));

-- Sitio público: antes solo el rol admin literal; ahora el permiso del área,
-- que el admin tiene por defecto.
DROP POLICY IF EXISTS site_pages_admin_write ON app_admin.site_pages;
DROP POLICY IF EXISTS site_pages_write ON app_admin.site_pages;
CREATE POLICY site_pages_write ON app_admin.site_pages
FOR ALL TO PUBLIC
USING (app_auth.has_permission('site', 'manage'))
WITH CHECK (app_auth.has_permission('site', 'manage'));

-- Popups y banners: es el área de Mensajes y Notificaciones, que ya se protege
-- con `notificaciones:manage` en la aplicación.
DROP POLICY IF EXISTS popups_write ON app_admin.popups;
CREATE POLICY popups_write ON app_admin.popups
FOR ALL TO PUBLIC
USING (app_auth.has_permission('notificaciones', 'manage'))
WITH CHECK (app_auth.has_permission('notificaciones', 'manage'));

COMMIT;
