-- Add zoom_meeting_id to group_session_events so the platform can update
-- and delete Zoom meetings when sessions are modified or cancelled.
ALTER TABLE app_mentoring.group_session_events
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;
