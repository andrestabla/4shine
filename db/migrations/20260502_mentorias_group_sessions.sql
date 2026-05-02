BEGIN;

CREATE TABLE IF NOT EXISTS app_mentoring.group_session_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
  host_user_id uuid REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE SET NULL,
  external_expert_name text,
  external_expert_bio text,
  zoom_join_url text,
  zoom_host_url text,
  zoom_meeting_id text,
  invitation_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (host_user_id IS NOT NULL OR external_expert_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_group_session_events_host_user_id
  ON app_mentoring.group_session_events(host_user_id);

CREATE TABLE IF NOT EXISTS app_mentoring.group_session_participation (
  event_id uuid NOT NULL REFERENCES app_mentoring.group_session_events(event_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  participation_status text NOT NULL CHECK (participation_status IN ('interested', 'joined', 'declined')),
  last_confirmation_sent_at timestamptz,
  reminder_14h_sent_at timestamptz,
  reminder_30m_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_session_participation_user_id
  ON app_mentoring.group_session_participation(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_mentoring.group_session_recordings (
  recording_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES app_mentoring.group_session_events(event_id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('zoom', 'manual')),
  title text NOT NULL,
  description text,
  recording_url text NOT NULL,
  thumbnail_url text,
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  recorded_at timestamptz,
  published_at timestamptz,
  created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_session_recordings_event_id
  ON app_mentoring.group_session_recordings(event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_mentoring.group_session_recording_reactions (
  recording_id uuid NOT NULL REFERENCES app_mentoring.group_session_recordings(recording_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like', 'celebrate', 'insightful', 'love')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (recording_id, user_id)
);

CREATE TABLE IF NOT EXISTS app_mentoring.group_session_recording_comments (
  comment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES app_mentoring.group_session_recordings(recording_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_session_recording_comments_recording_id
  ON app_mentoring.group_session_recording_comments(recording_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_group_session_events_set_updated_at ON app_mentoring.group_session_events;
CREATE TRIGGER trg_group_session_events_set_updated_at
BEFORE UPDATE ON app_mentoring.group_session_events
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_session_participation_set_updated_at ON app_mentoring.group_session_participation;
CREATE TRIGGER trg_group_session_participation_set_updated_at
BEFORE UPDATE ON app_mentoring.group_session_participation
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_session_recordings_set_updated_at ON app_mentoring.group_session_recordings;
CREATE TRIGGER trg_group_session_recordings_set_updated_at
BEFORE UPDATE ON app_mentoring.group_session_recordings
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_session_recording_comments_set_updated_at ON app_mentoring.group_session_recording_comments;
CREATE TRIGGER trg_group_session_recording_comments_set_updated_at
BEFORE UPDATE ON app_mentoring.group_session_recording_comments
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_events TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_participation TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_recordings TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_recording_reactions TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_recording_comments TO app_runtime, app_admin;

GRANT SELECT, INSERT, UPDATE ON app_mentoring.group_session_events TO app_gestor, app_mentor;
GRANT SELECT ON app_mentoring.group_session_events TO app_lider;
GRANT SELECT, INSERT, UPDATE ON app_mentoring.group_session_participation TO app_gestor, app_mentor, app_lider;
GRANT SELECT ON app_mentoring.group_session_recordings TO app_lider, app_mentor, app_gestor;
GRANT SELECT, INSERT, UPDATE ON app_mentoring.group_session_recordings TO app_gestor, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_recording_reactions TO app_lider, app_mentor, app_gestor;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.group_session_recording_comments TO app_lider, app_mentor, app_gestor;

COMMIT;
