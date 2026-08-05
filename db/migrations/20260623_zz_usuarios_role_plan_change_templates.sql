-- ============================================================
-- Plantillas por defecto para los eventos:
--   - usuarios.role_changed  (cambio de rol)
--   - usuarios.plan_changed  (asignación / cambio de plan)
--
-- Ambos eventos se disparan automáticamente desde updateUser y
-- bulkAssignPlan cada vez que admin/gestor cambia el rol o el plan
-- de un usuario. El correo incluye:
--   - Rol / plan nuevo
--   - Rol / plan anterior (para contexto)
--   - Fecha de vencimiento (solo en plan)
--   - Correo de login del usuario (para "recordarle sus credenciales")
--   - Link a la plataforma
--
-- SEGURIDAD: la contraseña NUNCA se incluye. Si el usuario la olvidó,
-- puede usar el link "restablecer contraseña" desde el login.
--
-- Idempotente: WHERE NOT EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  org       RECORD;
  tpl_role  uuid;
  tpl_plan  uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── 1. Cambio de rol ──────────────────────────────────────────────────────
    INSERT INTO app_admin.notification_templates (
      organization_id, name, description,
      event_key, module_code,
      channel_email, channel_in_app,
      subject_template,
      body_html_template,
      body_text_template,
      in_app_title_template, in_app_body_template,
      in_app_type, in_app_action_url_template,
      is_active, is_system
    )
    SELECT
      org.organization_id,
      'Cambio de rol en la plataforma',
      'Notificación automática al usuario cuando admin/gestor cambia su rol. Recuerda su correo de acceso y le da un link a la plataforma para que ingrese con sus credenciales existentes.',
      'usuarios.role_changed',
      'usuarios',
      true, true,
      'Tu rol en {{plataforma}} cambió a {{rol_nuevo}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Queremos avisarte que tu rol en <strong>{{plataforma}}</strong> ha sido actualizado. Ahora tienes un nuevo nivel de acceso y responsabilidades en la plataforma.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Rol anterior:</strong> {{rol_anterior}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Rol nuevo:</strong> {{rol_nuevo}}</p>
  </td></tr>
</table>
<p style="margin:0 0 12px;font-size:14px;color:#444;"><strong>Recordatorio de tus credenciales de acceso:</strong></p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:16px 24px;">
    <p style="margin:0;font-size:14px;color:#444;"><strong>Correo:</strong> {{correo}}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Si olvidaste tu contraseña, usa la opción <em>&ldquo;Olvidé mi contraseña&rdquo;</em> desde el login para restablecerla.</p>
  </td></tr>
</table>
<p style="margin:0;"><a href="{{enlace_plataforma}}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ir a {{plataforma}}</a></p>',
      'Hola {{nombre}},

Tu rol en {{plataforma}} ha sido actualizado:

- Rol anterior: {{rol_anterior}}
- Rol nuevo: {{rol_nuevo}}

Recordatorio de tus credenciales de acceso:
- Correo: {{correo}}
- Si olvidaste tu contraseña, usa la opción "Olvidé mi contraseña" desde el login para restablecerla.

Ingresa a la plataforma: {{enlace_plataforma}}

— {{plataforma}}',
      'Tu rol cambió a {{rol_nuevo}}',
      'De {{rol_anterior}} a {{rol_nuevo}} en {{plataforma}}.',
      'info',
      '{{enlace_plataforma}}',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'usuarios.role_changed'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_role;

    IF tpl_role IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'usuarios.role_changed',
        'usuarios',
        tpl_role,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

    -- ── 2. Cambio de plan ─────────────────────────────────────────────────────
    INSERT INTO app_admin.notification_templates (
      organization_id, name, description,
      event_key, module_code,
      channel_email, channel_in_app,
      subject_template,
      body_html_template,
      body_text_template,
      in_app_title_template, in_app_body_template,
      in_app_type, in_app_action_url_template,
      is_active, is_system
    )
    SELECT
      org.organization_id,
      'Cambio de plan de suscripción',
      'Notificación automática al usuario cuando admin/gestor asigna, cambia o retira su plan. Incluye vigencia, correo de acceso y URL a la plataforma.',
      'usuarios.plan_changed',
      'usuarios',
      true, true,
      'Tu plan en {{plataforma}}: {{plan_nuevo}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Queremos avisarte que tu plan de suscripción en <strong>{{plataforma}}</strong> ha sido actualizado.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Plan anterior:</strong> {{plan_anterior}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Plan nuevo:</strong> {{plan_nuevo}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Vigencia:</strong> {{fecha_vencimiento}}</p>
  </td></tr>
</table>
<p style="margin:0 0 12px;font-size:14px;color:#444;"><strong>Recordatorio de tus credenciales de acceso:</strong></p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:16px 24px;">
    <p style="margin:0;font-size:14px;color:#444;"><strong>Correo:</strong> {{correo}}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Si olvidaste tu contraseña, usa la opción <em>&ldquo;Olvidé mi contraseña&rdquo;</em> desde el login para restablecerla.</p>
  </td></tr>
</table>
<p style="margin:0;"><a href="{{enlace_plataforma}}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ir a {{plataforma}}</a></p>',
      'Hola {{nombre}},

Tu plan de suscripción en {{plataforma}} ha sido actualizado:

- Plan anterior: {{plan_anterior}}
- Plan nuevo: {{plan_nuevo}}
- Vigencia: {{fecha_vencimiento}}

Recordatorio de tus credenciales de acceso:
- Correo: {{correo}}
- Si olvidaste tu contraseña, usa la opción "Olvidé mi contraseña" desde el login para restablecerla.

Ingresa a la plataforma: {{enlace_plataforma}}

— {{plataforma}}',
      'Tu plan cambió a {{plan_nuevo}}',
      'Vigencia: {{fecha_vencimiento}}.',
      'success',
      '{{enlace_plataforma}}',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'usuarios.plan_changed'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_plan;

    IF tpl_plan IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'usuarios.plan_changed',
        'usuarios',
        tpl_plan,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

  END LOOP;
END;
$$;
