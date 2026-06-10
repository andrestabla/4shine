-- ============================================================
-- Plantillas por defecto para los eventos de pago de workshops:
--   - workshops.payment_confirmed
--   - workshops.payment_refunded
--
-- Se crean por cada organización existente. El admin puede editarlas
-- después desde /dashboard/administracion/notificaciones/plantillas.
--
-- Idempotente: usa WHERE NOT EXISTS para no duplicar si se re-aplica.
-- ============================================================

DO $$
DECLARE
  org           RECORD;
  tpl_paid      uuid;
  tpl_refunded  uuid;
BEGIN
  FOR org IN SELECT organization_id FROM app_core.organizations LOOP

    -- ── 1. Pago confirmado del workshop ───────────────────────────────────────
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
      'Pago de workshop confirmado',
      'Se envía al líder cuando el proveedor (Stripe/Wompi) confirma el pago de un workshop. Incluye estado de inscripción: registrado o lista de espera según cupo.',
      'workshops.payment_confirmed',
      'workshops',
      true, true,
      '¡Pago confirmado! Tu lugar en «{{titulo}}»',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Recibimos tu pago de <strong>{{monto}}</strong> para el workshop <strong>«{{titulo}}»</strong>. Estado de tu inscripción: <strong>{{estado_inscripcion}}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Fecha:</strong> {{fecha}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Hora:</strong> {{hora}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Método de pago:</strong> {{metodo_pago}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Código de reserva:</strong> {{codigo_reserva}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">Si quedaste en lista de espera, te notificaremos en cuanto un cupo se libere. Si quedaste inscrito, ya tienes tu lugar reservado.</p>
<p style="margin:0;"><a href="{{enlace_workshop}}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;">Ver workshop</a></p>',
      'Hola {{nombre}},

Recibimos tu pago de {{monto}} para el workshop «{{titulo}}». Estado de tu inscripción: {{estado_inscripcion}}.

Detalles:
- Fecha: {{fecha}}
- Hora: {{hora}}
- Método de pago: {{metodo_pago}}
- Código de reserva: {{codigo_reserva}}

Si quedaste en lista de espera, te notificaremos en cuanto un cupo se libere.

Ver workshop: {{enlace_workshop}}

— {{plataforma}}',
      '✓ Pago confirmado',
      '{{estado_inscripcion}} en «{{titulo}}». Reserva {{codigo_reserva}}.',
      'success',
      '{{enlace_workshop}}',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'workshops.payment_confirmed'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_paid;

    -- Asignamos la plantilla al event_config. Si ya existía un config
    -- con otra plantilla, NO la sobrescribimos (respeta override del admin).
    IF tpl_paid IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'workshops.payment_confirmed',
        'workshops',
        tpl_paid,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

    -- ── 2. Reembolso de workshop ──────────────────────────────────────────────
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
      'Reembolso de workshop procesado',
      'Se envía al líder cuando admin/gestor procesa el reembolso del pago de un workshop.',
      'workshops.payment_refunded',
      'workshops',
      true, true,
      'Reembolso procesado · {{titulo}}',
      '<p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hola <strong>{{nombre}}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">Procesamos el reembolso de <strong>{{monto}}</strong> por el workshop <strong>«{{titulo}}»</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Motivo:</strong> {{motivo_reembolso}}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Método de pago original:</strong> {{metodo_pago}}</p>
    <p style="margin:0;font-size:14px;color:#444;"><strong>Código de reserva:</strong> {{codigo_reserva}}</p>
  </td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">El reembolso aparecerá en tu medio de pago en los próximos 3-10 días hábiles, según el proveedor. Tu inscripción al workshop fue cancelada.</p>
<p style="margin:0;font-size:14px;color:#666;">Si tienes dudas, escríbenos respondiendo a este correo.</p>',
      'Hola {{nombre}},

Procesamos el reembolso de {{monto}} por el workshop «{{titulo}}».

Detalles:
- Motivo: {{motivo_reembolso}}
- Método de pago original: {{metodo_pago}}
- Código de reserva: {{codigo_reserva}}

El reembolso aparecerá en tu medio de pago en los próximos 3-10 días hábiles, según el proveedor. Tu inscripción al workshop fue cancelada.

Si tienes dudas, escríbenos respondiendo a este correo.

— {{plataforma}}',
      'Reembolso procesado',
      'Reembolsamos {{monto}} de «{{titulo}}». Motivo: {{motivo_reembolso}}.',
      'info',
      '',
      true, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM app_admin.notification_templates
      WHERE organization_id = org.organization_id
        AND event_key = 'workshops.payment_refunded'
        AND is_system = true
    )
    RETURNING template_id INTO tpl_refunded;

    IF tpl_refunded IS NOT NULL THEN
      INSERT INTO app_admin.notification_event_configs
        (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
      VALUES (
        org.organization_id,
        'workshops.payment_refunded',
        'workshops',
        tpl_refunded,
        true, true, true
      )
      ON CONFLICT (organization_id, event_key) DO NOTHING;
    END IF;

  END LOOP;
END;
$$;
