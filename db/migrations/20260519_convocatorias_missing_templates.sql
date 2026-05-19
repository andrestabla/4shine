-- Missing notification templates for Convocatorias events:
-- convocatorias.published, convocatorias.application_approved, convocatorias.application_rejected

DO $$
DECLARE
  org             RECORD;
  tpl_published   uuid;
  tpl_approved    uuid;
  tpl_rejected    uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── 1. Nueva convocatoria publicada (para usuarios interesados) ───────────
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
      'Nueva convocatoria disponible',
      'Se envía a usuarios interesados cuando se publica una nueva convocatoria.',
      'convocatorias.published',
      'convocatorias',
      true, true,
      'Nueva convocatoria disponible: {{titulo}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Hay una nueva oportunidad abierta para ti en {{plataforma}}:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;"><strong>Convocatoria:</strong> {{titulo}}</p>
    <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">{{descripcion}}</p>
  </td></tr>
</table>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">No dejes pasar esta oportunidad. Las postulaciones cierran pronto.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}" style="display:inline-block;background:#5b2d8a;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:100px;text-decoration:none;">Ver convocatoria y postularme &rarr;</a></p>',
      'Hola {{nombre}},

Hay una nueva convocatoria disponible en {{plataforma}}: {{titulo}}

{{descripcion}}

No dejes pasar esta oportunidad.

Ver convocatoria: {{enlace_plataforma}}

— {{plataforma}}',
      'Nueva convocatoria disponible',
      'Se abrió «{{titulo}}». ¡Revisa y postúlate!',
      'info',
      '{{enlace_plataforma}}',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_published;

    IF tpl_published IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.published', 'convocatorias', tpl_published, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

    -- ── 2. Postulación aprobada ───────────────────────────────────────────────
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
      'Postulación aprobada',
      'Se envía al postulante cuando su aplicación es aprobada.',
      'convocatorias.application_approved',
      'convocatorias',
      true, true,
      '¡Tu postulación a «{{titulo}}» fue aprobada!',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">¡Excelentes noticias! Tu postulación a la convocatoria <strong>«{{titulo}}»</strong> ha sido <strong style="color:#059669;">aprobada</strong>.</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">El equipo se comunicará contigo próximamente con los siguientes pasos. Puedes ver el estado de tu postulación en la plataforma.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}" style="display:inline-block;background:#5b2d8a;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:100px;text-decoration:none;">Ver convocatoria &rarr;</a></p>',
      'Hola {{nombre}},

¡Tu postulación a «{{titulo}}» fue aprobada!

El equipo se comunicará contigo próximamente con los siguientes pasos.

Ver convocatoria: {{enlace_plataforma}}

— {{plataforma}}',
      '¡Postulación aprobada!',
      'Tu postulación a «{{titulo}}» fue aprobada.',
      'success',
      '{{enlace_plataforma}}',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_approved;

    IF tpl_approved IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.application_approved', 'convocatorias', tpl_approved, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

    -- ── 3. Postulación no seleccionada ────────────────────────────────────────
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
      'Postulación no seleccionada',
      'Se envía al postulante cuando su aplicación no es seleccionada.',
      'convocatorias.application_rejected',
      'convocatorias',
      true, true,
      'Actualización sobre tu postulación a «{{titulo}}»',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Gracias por tu interés en la convocatoria <strong>«{{titulo}}»</strong>. Luego de revisar las aplicaciones, en esta ocasión tu postulación no fue seleccionada.</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">Te animamos a seguir participando en nuevas oportunidades en la plataforma.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}" style="display:inline-block;background:#5b2d8a;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:100px;text-decoration:none;">Ver convocatoria &rarr;</a></p>',
      'Hola {{nombre}},

Gracias por tu interés en «{{titulo}}». En esta ocasión tu postulación no fue seleccionada.

Te animamos a seguir participando en nuevas oportunidades.

Ver convocatoria: {{enlace_plataforma}}

— {{plataforma}}',
      'Postulación no seleccionada',
      'Tu postulación a «{{titulo}}» no fue seleccionada esta vez.',
      'warning',
      '{{enlace_plataforma}}',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_rejected;

    IF tpl_rejected IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.application_rejected', 'convocatorias', tpl_rejected, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

  END LOOP;
END;
$$;
