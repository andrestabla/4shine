-- ============================================================
-- Default notification templates for Convocatorias events
-- Creates 3 templates per organization and assigns them via
-- notification_event_configs.
-- ============================================================

DO $$
DECLARE
  org           RECORD;
  tpl_submitted uuid;
  tpl_received  uuid;
  tpl_applied   uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── 1. Solicitud enviada (confirmación al líder) ──────────────────────────
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
    ) VALUES (
      org.organization_id,
      'Solicitud de convocatoria enviada',
      'Confirmación al líder cuando envía una solicitud de publicación de convocatoria.',
      'convocatorias.request_submitted',
      'convocatorias',
      true, true,
      'Tu solicitud de convocatoria fue enviada',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Tu solicitud de publicación para la convocatoria <strong>«{{titulo}}»</strong> fue recibida exitosamente.</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">El equipo de gestión revisará tu solicitud y te notificará con la decisión. Puedes hacer seguimiento desde la plataforma en cualquier momento.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}/dashboard/convocatorias">Ver mis solicitudes</a></p>',
      'Hola {{nombre}},

Tu solicitud de publicación para la convocatoria «{{titulo}}» fue recibida exitosamente.

El equipo de gestión revisará tu solicitud y te notificará con la decisión pronto.

Ver la plataforma: {{enlace_plataforma}}/dashboard/convocatorias

— {{plataforma}}',
      'Solicitud enviada correctamente',
      'Tu solicitud para «{{titulo}}» fue recibida y está en revisión.',
      'success',
      '{{enlace_plataforma}}/dashboard/convocatorias',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_submitted;

    IF tpl_submitted IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.request_submitted', 'convocatorias', tpl_submitted, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

    -- ── 2. Nueva solicitud de convocatoria (para gestores y admin) ────────────
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
    ) VALUES (
      org.organization_id,
      'Nueva solicitud de convocatoria recibida',
      'Se envía a gestores y administradores cuando un líder solicita publicar una convocatoria.',
      'convocatorias.request_received',
      'convocatorias',
      true, true,
      'Nueva solicitud de convocatoria: {{titulo}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">El líder <strong>{{lider_nombre}}</strong> ha enviado una solicitud de publicación que requiere tu revisión.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;"><strong>Título:</strong> {{titulo}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Tipo:</strong> {{tipo_convocatoria}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Objetivo:</strong> {{objetivo}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Descripción:</strong> {{descripcion}}</p>
  </td></tr>
</table>
<p style="margin:0;"><a href="{{enlace_plataforma}}/dashboard/convocatorias">Revisar solicitud</a></p>',
      'Hola {{nombre}},

El líder {{lider_nombre}} ha enviado una solicitud de publicación que requiere tu revisión.

Título: {{titulo}}
Tipo: {{tipo_convocatoria}}
Objetivo: {{objetivo}}
Descripción: {{descripcion}}

Revisar solicitud: {{enlace_plataforma}}/dashboard/convocatorias

— {{plataforma}}',
      'Nueva solicitud de convocatoria',
      '{{lider_nombre}} solicita publicar «{{titulo}}». Revisa y aprueba.',
      'info',
      '{{enlace_plataforma}}/dashboard/convocatorias',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_received;

    IF tpl_received IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.request_received', 'convocatorias', tpl_received, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

    -- ── 3. Postulación recibida (confirmación al líder) ───────────────────────
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
    ) VALUES (
      org.organization_id,
      'Confirmación de postulación',
      'Confirmación al líder cuando aplica a una convocatoria.',
      'convocatorias.applied',
      'convocatorias',
      true, true,
      'Tu postulación a «{{titulo}}» fue registrada',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Tu postulación a la convocatoria <strong>«{{titulo}}»</strong> fue registrada exitosamente.</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">El equipo organizador revisará tu candidatura y se comunicará contigo con los próximos pasos. Puedes ver el estado de tu postulación en la plataforma en cualquier momento.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}/dashboard/convocatorias">Ver convocatoria</a></p>',
      'Hola {{nombre}},

Tu postulación a la convocatoria «{{titulo}}» fue registrada exitosamente.

El equipo organizador revisará tu candidatura y se comunicará contigo con los próximos pasos.

Ver convocatoria: {{enlace_plataforma}}/dashboard/convocatorias

— {{plataforma}}',
      '¡Postulación registrada!',
      'Tu postulación a «{{titulo}}» fue recibida con éxito.',
      'success',
      '{{enlace_plataforma}}/dashboard/convocatorias',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_applied;

    IF tpl_applied IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.applied', 'convocatorias', tpl_applied, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

  END LOOP;
END;
$$;
