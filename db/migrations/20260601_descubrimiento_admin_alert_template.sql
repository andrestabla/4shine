-- ============================================================
-- Default notification template for `descubrimiento.started_admin_alert`.
-- Se envía a admins/gestores cada vez que un líder o invitado
-- inicia un diagnóstico DX por primera vez.
-- ============================================================

DO $$
DECLARE
  org   RECORD;
  tpl   uuid;
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
    ) VALUES (
      org.organization_id,
      'Diagnóstico iniciado · alerta a administradores',
      'Notifica a administradores y gestores cada vez que un líder o invitado inicia un diagnóstico DX.',
      'descubrimiento.started_admin_alert',
      'descubrimiento',
      true, true,
      'Nuevo diagnóstico iniciado: {{lider_nombre}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;"><strong>{{lider_nombre}}</strong> acaba de iniciar un nuevo diagnóstico DX en la plataforma.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;border:1px solid #e1e5eb;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;"><strong>Participante:</strong> {{lider_nombre}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Identificador del diagnóstico:</strong> {{titulo}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">Recibirás una segunda alerta cuando complete el diagnóstico y sus resultados estén listos para revisión.</p>
<p style="margin:0;"><a href="{{enlace_plataforma}}">Ver resultados generales</a></p>',
      'Hola {{nombre}},

{{lider_nombre}} acaba de iniciar un nuevo diagnóstico DX en la plataforma.

Participante: {{lider_nombre}}
Identificador del diagnóstico: {{titulo}}

Recibirás una segunda alerta cuando complete el diagnóstico y sus resultados estén listos para revisión.

Ver resultados generales: {{enlace_plataforma}}

— {{plataforma}}',
      'Nuevo diagnóstico iniciado',
      '{{lider_nombre}} comenzó el diagnóstico DX ({{titulo}}).',
      'info',
      '{{enlace_plataforma}}',
      true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING template_id INTO tpl;

    IF tpl IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'descubrimiento.started_admin_alert',
        'descubrimiento',
        tpl,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO UPDATE SET
        template_id    = EXCLUDED.template_id,
        channel_email  = true,
        channel_in_app = true,
        is_enabled     = true;
    END IF;

  END LOOP;
END;
$$;
