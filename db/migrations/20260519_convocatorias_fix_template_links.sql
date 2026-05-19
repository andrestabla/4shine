-- Fix notification template links so they point to the specific convocatoria
-- The {{enlace_plataforma}} variable now receives the full convocatoria URL,
-- so the button href should be just {{enlace_plataforma}} (no appended path).

UPDATE app_admin.notification_templates
SET
  body_html_template = replace(
    body_html_template,
    'href="{{enlace_plataforma}}/dashboard/convocatorias"',
    'href="{{enlace_plataforma}}"'
  ),
  body_text_template = replace(
    body_text_template,
    '{{enlace_plataforma}}/dashboard/convocatorias',
    '{{enlace_plataforma}}'
  ),
  in_app_action_url_template = '{{enlace_plataforma}}'
WHERE event_key = 'convocatorias.applied';
