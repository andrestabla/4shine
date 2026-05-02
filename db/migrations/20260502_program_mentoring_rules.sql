BEGIN;

ALTER TABLE app_mentoring.program_mentorship_templates
  ADD COLUMN IF NOT EXISTS topic_code text;

ALTER TABLE app_mentoring.mentors
  ADD COLUMN IF NOT EXISTS office_hours_join_url text;

CREATE TABLE IF NOT EXISTS app_mentoring.mentorship_session_change_logs (
  change_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('cancelled', 'rescheduled')),
  reason text NOT NULL,
  previous_starts_at timestamptz,
  previous_ends_at timestamptz,
  proposed_starts_at timestamptz,
  proposed_ends_at timestamptz,
  changed_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_change_logs_session
  ON app_mentoring.mentorship_session_change_logs(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_mentoring.program_session_reminders (
  reminder_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  reminder_window text NOT NULL CHECK (reminder_window IN ('1h')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id, reminder_window)
);

UPDATE app_mentoring.program_mentorship_templates
SET
  sequence_no = x.sequence_no,
  title = x.title,
  description = x.description,
  suggested_week = x.suggested_week,
  default_duration_minutes = 90,
  topic_code = x.topic_code,
  is_active = true,
  updated_at = now()
FROM (
  VALUES
    ('m1', 1, 'Mentoría 01 · Creencias, identidad y pilares personales', 'Espacio para trabajar creencias fundacionales, identidad y pilares personales.', 3, 'creencias_identidad_pilares'),
    ('m2', 2, 'Mentoría 02 · Gestión emocional', 'Sesión para fortalecer regulación emocional y foco de liderazgo.', 6, 'gestion_emocional'),
    ('m3', 3, 'Mentoría 03 · Propósito y valores no negociables', 'Conversación para alinear decisiones con propósito y valores no negociables.', 8, 'proposito_valores'),
    ('m4', 4, 'Mentoría 04 · Narrativa profesional y Elevator Pitch', 'Mentoría para consolidar narrativa profesional y elevator pitch.', 10, 'narrativa_elevator_pitch'),
    ('m5', 5, 'Mentoría 05 · Comunicación ejecutiva estratégica', 'Trabajo de mensajes clave e influencia en contextos ejecutivos.', 12, 'comunicacion_ejecutiva'),
    ('m6', 6, 'Mentoría 06 · Lenguaje verbal y no verbal', 'Sesión de presencia ejecutiva, lenguaje verbal y no verbal.', 14, 'lenguaje_verbal_no_verbal'),
    ('m7', 7, 'Mentoría 07 · Mapeo del ecosistema estratégico', 'Mapeo de actores y decisiones para activar el ecosistema estratégico.', 16, 'mapeo_ecosistema'),
    ('m8', 8, 'Mentoría 08 · Pensamiento estratégico y toma de decisiones', 'Entrenamiento en criterio, priorización y toma de decisiones.', 19, 'pensamiento_estrategico'),
    ('m9', 9, 'Mentoría 09 · Latido de marca ejecutiva', 'Sesión para consolidar narrativa y latido de marca ejecutiva.', 21, 'latido_marca'),
    ('m10', 10, 'Mentoría 10 · Visión Estratégica Personal', 'Cierre de visión estratégica personal y próximos pasos.', 23, 'vision_estrategica')
) AS x(template_code, sequence_no, title, description, suggested_week, topic_code)
WHERE app_mentoring.program_mentorship_templates.template_code = x.template_code;

COMMENT ON COLUMN app_mentoring.program_mentorship_templates.topic_code IS 'Código temático de la mentoría del programa para filtros y matching de Adviser.';
COMMENT ON COLUMN app_mentoring.mentors.office_hours_join_url IS 'Enlace fijo de sala/oficina virtual del Adviser para reservas predecibles.';

GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.mentorship_session_change_logs TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.program_session_reminders TO app_runtime, app_admin;
GRANT SELECT, INSERT ON app_mentoring.mentorship_session_change_logs TO app_gestor, app_mentor, app_lider;
GRANT SELECT, INSERT ON app_mentoring.program_session_reminders TO app_gestor, app_mentor, app_lider;

COMMIT;
