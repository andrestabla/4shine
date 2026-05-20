-- Dedicated column for the Zoom cloud recording URL of an individual mentorship,
-- so the recording is kept separate from the live meeting (join) URL.
ALTER TABLE app_mentoring.mentorship_sessions
  ADD COLUMN IF NOT EXISTS zoom_recording_url text;
