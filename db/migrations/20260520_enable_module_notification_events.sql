-- Enable in-app notification event configs for key mentoria, networking and
-- workshop events. Without an enabled notification_event_configs row,
-- dispatchNotification() is a no-op, so these events never reach the bell.
-- Email channel stays off here: those modules send their own transactional
-- emails; this config drives only the in-app notification.
INSERT INTO app_admin.notification_event_configs
  (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled)
SELECT
  t.organization_id,
  t.event_key,
  split_part(t.event_key, '.', 1),
  t.template_id,
  false,
  true,
  true
FROM app_admin.notification_templates t
WHERE t.event_key IN (
  'mentorias.session_scheduled_mentee',
  'mentorias.session_scheduled_mentor',
  'mentorias.session_cancelled_mentee',
  'networking.connection_request',
  'networking.connection_accepted',
  'workshops.registration_confirmed'
)
  AND t.channel_in_app = true
ON CONFLICT (organization_id, event_key) DO NOTHING;
