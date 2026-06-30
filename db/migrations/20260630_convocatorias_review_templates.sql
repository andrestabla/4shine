-- ============================================================
-- Plantillas de notificación para el resultado de la revisión de
-- solicitudes de convocatoria: aprobada (publicada) / rechazada.
-- Crea una plantilla por evento y por organización y la asigna vía
-- notification_event_configs. Idempotente.
-- ============================================================

DO $$
DECLARE
  org          RECORD;
  tpl_approved uuid;
  tpl_rejected uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── Solicitud aprobada y publicada (para el líder) ────────────────────────
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
      'Convocatoria aprobada y publicada',
      'Se envía al líder cuando su solicitud es aprobada y la convocatoria queda publicada.',
      'convocatorias.request_approved',
      'convocatorias',
      true, true,
      'Tu convocatoria «{{titulo}}» fue publicada',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">¡Buenas noticias! Tu solicitud para la convocatoria <strong>«{{titulo}}»</strong> fue aprobada y ya está <strong>publicada</strong> en el ecosistema.</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">Ya puede recibir postulaciones. Puedes verla y gestionarla desde la plataforma.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}/dashboard/convocatorias">Ver la convocatoria</a></p>',
      'Hola {{nombre}},

¡Buenas noticias! Tu solicitud para la convocatoria «{{titulo}}» fue aprobada y ya está publicada en el ecosistema. Ya puede recibir postulaciones.

Ver la plataforma: {{enlace_plataforma}}/dashboard/convocatorias

— {{plataforma}}',
      'Convocatoria publicada',
      'Tu convocatoria «{{titulo}}» fue aprobada y ya está publicada.',
      'success',
      '{{enlace_plataforma}}/dashboard/convocatorias',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_approved;

    IF tpl_approved IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.request_approved', 'convocatorias', tpl_approved, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

    -- ── Solicitud rechazada (para el líder) ───────────────────────────────────
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
      'Solicitud de convocatoria rechazada',
      'Se envía al líder cuando su solicitud de publicación es rechazada. Incluye el motivo si el gestor lo escribió.',
      'convocatorias.request_rejected',
      'convocatorias',
      true, true,
      'Sobre tu solicitud de convocatoria «{{titulo}}»',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Revisamos tu solicitud para la convocatoria <strong>«{{titulo}}»</strong> y por ahora no fue aprobada para publicación.</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;"><strong>Motivo / comentarios:</strong> {{motivo}}</p>
<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">Puedes ajustar los detalles y volver a enviarla. Estamos para ayudarte a que quede lista.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}/dashboard/convocatorias">Ir a Convocatorias</a></p>',
      'Hola {{nombre}},

Revisamos tu solicitud para la convocatoria «{{titulo}}» y por ahora no fue aprobada para publicación.

Motivo / comentarios: {{motivo}}

Puedes ajustar los detalles y volver a enviarla.

Ir a la plataforma: {{enlace_plataforma}}/dashboard/convocatorias

— {{plataforma}}',
      'Solicitud no aprobada',
      'Tu solicitud para «{{titulo}}» no fue aprobada. Revisa los comentarios y vuelve a enviarla.',
      'alert',
      '{{enlace_plataforma}}/dashboard/convocatorias',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl_rejected;

    IF tpl_rejected IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (org.organization_id, 'convocatorias.request_rejected', 'convocatorias', tpl_rejected, true, true, true)
      ON CONFLICT (organization_id, event_key) DO UPDATE SET template_id = EXCLUDED.template_id;
    END IF;

  END LOOP;
END $$;
