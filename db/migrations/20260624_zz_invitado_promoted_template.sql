-- ============================================================
-- Plantilla por defecto para el evento:
--   - usuarios.invitado_promoted
--
-- Se dispara cuando un usuario con rol Invitado (que solo entraba a
-- Descubrimiento con un código único) es promovido a otro rol o recibe
-- un plan. Como nunca tuvo contraseña propia, el sistema le genera una
-- temporal (must_change_password=true) y este correo se la entrega junto
-- con las instrucciones de ingreso. Es el ÚNICO evento post-creación que
-- legítimamente incluye {{contrasena}} — la contraseña se acaba de
-- generar y viaja a la misma bandeja que ya demostró controlar al usar
-- su código de invitación.
--
-- Idempotente: WHERE NOT EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  org      RECORD;
  tpl_prom uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

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
      'Cuenta activada (invitado promovido)',
      'Se envía al promover un Invitado a otro rol o al asignarle un plan. Incluye su contraseña temporal (deberá cambiarla en el primer ingreso) e instrucciones de acceso.',
      'usuarios.invitado_promoted',
      'usuarios',
      true, true,
      '¡Tu cuenta en {{plataforma}} fue activada! Aquí están tus credenciales',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">¡Buenas noticias! Tu cuenta en <strong>{{plataforma}}</strong> fue activada con el rol <strong>{{rol_nuevo}}</strong>. Hasta ahora ingresabas con tu código único de invitación; a partir de hoy tienes acceso completo a la plataforma con correo y contraseña.</p>
<p style="margin:0 0 12px;font-size:14px;color:#444;"><strong>Tus credenciales de acceso:</strong></p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Correo:</strong> {{correo}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Contraseña temporal:</strong> <code style="background:#dcfce7;padding:2px 8px;border-radius:6px;font-size:14px;">{{contrasena}}</code></p>
  </td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:14px 20px;">
    <p style="margin:0;font-size:13px;color:#713f12;">🔐 Por seguridad, la plataforma te pedirá <strong>cambiar esta contraseña</strong> en tu primer ingreso.</p>
  </td></tr>
</table>
<p style="margin:0 0 12px;font-size:14px;color:#444;"><strong>Cómo ingresar:</strong></p>
<ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#444;line-height:1.8;">
  <li>Entra a <a href="{{enlace_plataforma}}/acceso" style="color:#16a34a;">{{enlace_plataforma}}/acceso</a></li>
  <li>Escribe tu correo y la contraseña temporal de arriba</li>
  <li>Define tu nueva contraseña personal cuando la plataforma te lo pida</li>
</ol>
<p style="margin:0;"><a href="{{enlace_plataforma}}/acceso" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Ingresar a {{plataforma}}</a></p>',
      'Hola {{nombre}},

¡Tu cuenta en {{plataforma}} fue activada con el rol {{rol_nuevo}}!

Hasta ahora ingresabas con tu código único de invitación; a partir de hoy tienes acceso completo con correo y contraseña.

Tus credenciales de acceso:
- Correo: {{correo}}
- Contraseña temporal: {{contrasena}}

Por seguridad, la plataforma te pedirá cambiar esta contraseña en tu primer ingreso.

Cómo ingresar:
1. Entra a {{enlace_plataforma}}/acceso
2. Escribe tu correo y la contraseña temporal
3. Define tu nueva contraseña personal cuando la plataforma te lo pida

— {{plataforma}}',
      '¡Tu cuenta fue activada!',
      'Ahora eres {{rol_nuevo}} en {{plataforma}}. Revisa tu correo para tus credenciales.',
      'success',
      '{{enlace_plataforma}}/acceso',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'usuarios.invitado_promoted'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_prom;

    IF tpl_prom IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'usuarios.invitado_promoted',
        'usuarios',
        tpl_prom,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

  END LOOP;
END;
$$;
