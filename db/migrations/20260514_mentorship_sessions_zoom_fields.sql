ALTER TABLE app_mentoring.mentorship_sessions
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_host_url TEXT;
