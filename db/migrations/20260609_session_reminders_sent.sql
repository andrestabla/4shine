-- Idempotencia para el cron job de recordatorios de sesión.
-- (session_id, window_key) garantiza que cada ventana (24h, 1h, etc.) se
-- envíe a lo sumo una vez por sesión. Idempotente.

CREATE TABLE IF NOT EXISTS app_mentoring.session_reminders_sent (
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    window_key text NOT NULL CHECK (window_key IN ('24h', '1h')),
    sent_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (session_id, window_key)
);

CREATE INDEX IF NOT EXISTS idx_session_reminders_sent_at
    ON app_mentoring.session_reminders_sent(sent_at DESC);
