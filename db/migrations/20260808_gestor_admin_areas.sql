-- El gestor accede a cuatro áreas administrativas: Gestión de usuarios,
-- Mensajes y notificaciones, GoHighLevel y Asistente IA.
--
-- Hasta ahora TODO el panel de administración se protegía con una única llave,
-- `usuarios:manage`, que también abre branding, site, planes, integraciones,
-- módulos, pagos, políticas, tour y documentación. Dársela al gestor le habría
-- entregado la plataforma entera, así que se separan las llaves:
--
--   notificaciones : ya existía y el gestor ya la tenía; los servicios pasan a
--                    usarla en vez de usuarios:manage.
--   ghl            : módulo nuevo (webhooks de compra de GoHighLevel).
--   asistente_ia   : módulo nuevo (chatbot interno + asistente público).
--   usuarios       : el gestor ya tenía view/create/update; solo faltaba
--                    mostrarle la entrada en el menú.
--
-- Lo demás sigue reservado al administrador.

BEGIN;

INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES
    ('ghl', 'GoHighLevel', 'Webhooks de compra, alta automatica de usuarios y mapeo de productos.', false),
    ('asistente_ia', 'Asistente IA', 'Chatbot de soporte interno y asistente del sitio publico.', false)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description;

INSERT INTO app_auth.role_module_permissions (
    role_code, module_code,
    can_view, can_create, can_update, can_delete, can_approve, can_moderate, can_manage
)
VALUES
    ('admin',  'ghl',          true,  true,  true,  true,  false, false, true),
    ('gestor', 'ghl',          true,  true,  true,  true,  false, false, true),
    ('mentor', 'ghl',          false, false, false, false, false, false, false),
    ('lider',  'ghl',          false, false, false, false, false, false, false),
    ('invitado','ghl',         false, false, false, false, false, false, false),
    ('admin',  'asistente_ia', true,  true,  true,  true,  false, false, true),
    ('gestor', 'asistente_ia', true,  true,  true,  true,  false, false, true),
    ('mentor', 'asistente_ia', false, false, false, false, false, false, false),
    ('lider',  'asistente_ia', false, false, false, false, false, false, false),
    ('invitado','asistente_ia',false, false, false, false, false, false, false)
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_approve = EXCLUDED.can_approve,
    can_moderate = EXCLUDED.can_moderate,
    can_manage = EXCLUDED.can_manage;

-- El gestor administra plantillas y envíos: se completan create/delete sobre
-- notificaciones para que la matriz de roles refleje lo que realmente puede
-- hacer (los servicios exigen `manage`, que ya tenía).
UPDATE app_auth.role_module_permissions
SET can_create = true, can_delete = true
WHERE role_code = 'gestor' AND module_code = 'notificaciones';

COMMIT;
