-- Eventos personalizados: repetición periódica y filtro de plan activo.
--
--  - repeat_interval_hours: 0 = una sola vez por ancla (comportamiento actual).
--    N > 0 = mientras la condición del ancla siga vigente, se reenvía cada N horas.
--    El fire_key pasa a ser "<ancla>#<periodo>" para mantener la idempotencia.
--  - require_active_plan: solo dispara para usuarios con plan de suscripción
--    activo (subscription_plan_id → plan activo y no vencido).
--  - Nueva ancla 'never_logged_in': cuenta desde u.created_at y solo mientras
--    el usuario no tenga ninguna app_auth.refresh_sessions (jamás ingresó).

ALTER TABLE app_admin.notification_events
  ADD COLUMN IF NOT EXISTS repeat_interval_hours integer NOT NULL DEFAULT 0
    CHECK (repeat_interval_hours >= 0),
  ADD COLUMN IF NOT EXISTS require_active_plan boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN app_admin.notification_events.trigger_anchor IS
  'date_anchor: registration | program_start | subscription_expiry | last_login | never_logged_in';
COMMENT ON COLUMN app_admin.notification_events.repeat_interval_hours IS
  '0 = una vez por ancla; N > 0 = reenvío cada N horas mientras la condición siga vigente';
COMMENT ON COLUMN app_admin.notification_events.require_active_plan IS
  'Solo dispara para usuarios con plan de suscripción activo y vigente';
