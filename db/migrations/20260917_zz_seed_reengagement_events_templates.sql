-- ============================================================
-- Eventos personalizados + plantillas de reenganche:
--
--   1) custom.sin_acceso_a_la_plataforma
--      Usuarios con cuenta y plan activo que JAMÁS han ingresado.
--      Se envía 72 h después de crear la cuenta y se repite cada 72 h
--      hasta que el usuario inicie sesión por primera vez. Solo correo.
--
--   2) custom.inactividad_de_7_dias
--      Usuarios con plan activo que llevan más de 7 días sin ingresar.
--      Se envía una vez por periodo de inactividad (se vuelve a evaluar
--      tras cada nuevo acceso). Correo + notificación in-app.
--
-- Requiere: 20260917_custom_events_repeat_and_plan_filter.sql
-- Idempotente: WHERE NOT EXISTS + ON CONFLICT DO NOTHING.
-- ============================================================

DO $$
DECLARE
  org          RECORD;
  tpl_acceso   uuid;
  tpl_inactivo uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── 1. Evento: sin acceso a la plataforma ────────────────────────────────
    INSERT INTO app_admin.notification_events (
      organization_id, event_key, module_code, label, description, variables,
      trigger_type, trigger_anchor, trigger_parent_event,
      offset_value, offset_unit, offset_direction,
      repeat_interval_hours, require_active_plan, is_active
    )
    VALUES (
      org.organization_id,
      'custom.sin_acceso_a_la_plataforma',
      'usuarios',
      'Sin acceso a la plataforma',
      'Recordatorio para usuarios con cuenta y plan activo que nunca han iniciado sesión. Se envía a las 72 h de crear la cuenta y se repite cada 72 h hasta que ingresen.',
      '["nombre","nombre_completo","correo","plataforma","enlace_plataforma","fecha"]'::jsonb,
      'date_anchor', 'never_logged_in', NULL,
      72, 'hours', 'after',
      72, true, true
    )
    ON CONFLICT (organization_id, event_key) DO NOTHING;

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
      'Recordatorio: aún no has ingresado a la plataforma',
      'Se envía cada 72 h a usuarios con cuenta y plan activo que nunca han iniciado sesión, hasta que ingresen. Recuerda su correo de acceso e incluye el botón de ingreso.',
      'custom.sin_acceso_a_la_plataforma',
      'usuarios',
      true, false,
      '{{nombre}}, tu acceso a {{plataforma}} te está esperando',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Notamos que todavía no has ingresado a <strong>{{plataforma}}</strong>. Tu cuenta ya está creada y tu <strong>plan está activo</strong>, así que puedes empezar hoy mismo tu proceso de desarrollo.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:16px 24px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Tu correo de acceso</p>
    <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;word-break:break-all;">{{correo}}</p>
    <p style="margin:10px 0 0;font-size:13px;color:#64748b;">Si no recuerdas tu contraseña, usa la opción <em>&ldquo;Olvidé mi contraseña&rdquo;</em> en la pantalla de acceso y la restableces en un minuto.</p>
  </td></tr>
</table>
<p style="margin:0 0 24px;text-align:center;"><a href="{{enlace_plataforma}}">Ingresar a {{plataforma}}</a></p>
<p style="margin:0 0 8px;font-size:14px;color:#444;line-height:1.6;">Al ingresar podrás:</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#444;line-height:1.7;">
  <li>Completar tu diagnóstico y conocer tu punto de partida.</li>
  <li>Avanzar en tu ruta de aprendizaje y tus workbooks.</li>
  <li>Agendar tus sesiones de mentoría y conectar con la comunidad.</li>
</ul>
<p style="margin:0;font-size:13px;color:#94a3b8;">Te seguiremos recordando cada pocos días hasta que ingreses por primera vez. Si necesitas ayuda, responde a este correo.</p>',
      'Hola {{nombre}},

Notamos que todavía no has ingresado a {{plataforma}}. Tu cuenta ya está creada y tu plan está activo, así que puedes empezar hoy mismo.

Tu correo de acceso: {{correo}}
Si no recuerdas tu contraseña, usa "Olvidé mi contraseña" en la pantalla de acceso.

Ingresa aquí: {{enlace_plataforma}}

Al ingresar podrás completar tu diagnóstico, avanzar en tu ruta de aprendizaje y agendar tus sesiones de mentoría.

Te seguiremos recordando cada pocos días hasta que ingreses por primera vez.

— {{plataforma}}',
      'Tu acceso a {{plataforma}} te está esperando',
      'Tu cuenta y tu plan están activos. Ingresa y comienza tu proceso.',
      'info',
      '{{enlace_plataforma}}',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'custom.sin_acceso_a_la_plataforma'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_acceso;

    IF tpl_acceso IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'custom.sin_acceso_a_la_plataforma',
        'usuarios',
        tpl_acceso,
        true, false, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

    -- ── 2. Evento: inactividad de 7 días ─────────────────────────────────────
    INSERT INTO app_admin.notification_events (
      organization_id, event_key, module_code, label, description, variables,
      trigger_type, trigger_anchor, trigger_parent_event,
      offset_value, offset_unit, offset_direction,
      repeat_interval_hours, require_active_plan, is_active
    )
    VALUES (
      org.organization_id,
      'custom.inactividad_de_7_dias',
      'usuarios',
      'Inactividad de 7 días',
      'Recordatorio para usuarios con plan activo que llevan más de 7 días sin ingresar. Se envía una vez por periodo de inactividad y se vuelve a evaluar tras cada nuevo acceso.',
      '["nombre","nombre_completo","correo","plataforma","enlace_plataforma","fecha"]'::jsonb,
      'date_anchor', 'last_login', NULL,
      7, 'days', 'after',
      0, true, true
    )
    ON CONFLICT (organization_id, event_key) DO NOTHING;

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
      'Te extrañamos: más de 7 días sin ingresar',
      'Se envía a usuarios con plan activo que llevan más de 7 días sin ingresar, para recordarles todo lo que su plan les ofrece. Incluye botón de ingreso.',
      'custom.inactividad_de_7_dias',
      'usuarios',
      true, true,
      '{{nombre}}, tu plan en {{plataforma}} sigue activo y te está esperando',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Llevas más de <strong>7 días sin ingresar</strong> a <strong>{{plataforma}}</strong> (tu último acceso fue el {{fecha}}). Tu plan sigue activo y cada día que pasa es una oportunidad de avance que se queda sin usar.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">Todo esto te está esperando:</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;color:#444;line-height:1.7;">
      <li>Tu ruta de aprendizaje y los workbooks de cada pilar.</li>
      <li>Sesiones de mentoría con tu adviser.</li>
      <li>Convocatorias y sesiones grupales.</li>
      <li>La comunidad de networking para conectar con otros líderes.</li>
    </ul>
  </td></tr>
</table>
<p style="margin:0 0 24px;text-align:center;"><a href="{{enlace_plataforma}}">Retomar mi proceso</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.6;">Con solo unos minutos a la semana puedes mantener el ritmo. Elige una actividad pequeña hoy y continúa desde donde lo dejaste.</p>
<p style="margin:0;font-size:13px;color:#94a3b8;">Tu correo de acceso es {{correo}}. Si olvidaste tu contraseña, usa la opción &ldquo;Olvidé mi contraseña&rdquo; en la pantalla de acceso.</p>',
      'Hola {{nombre}},

Llevas más de 7 días sin ingresar a {{plataforma}} (tu último acceso fue el {{fecha}}). Tu plan sigue activo y te está esperando.

Todo esto tienes disponible:
- Tu ruta de aprendizaje y los workbooks de cada pilar.
- Sesiones de mentoría con tu adviser.
- Convocatorias y sesiones grupales.
- La comunidad de networking.

Retoma tu proceso aquí: {{enlace_plataforma}}

Tu correo de acceso es {{correo}}. Si olvidaste tu contraseña, usa "Olvidé mi contraseña" en la pantalla de acceso.

— {{plataforma}}',
      'Te extrañamos en {{plataforma}}',
      'Llevas más de 7 días sin ingresar. Tu plan sigue activo: retoma tu proceso hoy.',
      'info',
      '{{enlace_plataforma}}',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'custom.inactividad_de_7_dias'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_inactivo;

    IF tpl_inactivo IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'custom.inactividad_de_7_dias',
        'usuarios',
        tpl_inactivo,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

  END LOOP;
END;
$$;
