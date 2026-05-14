-- Drop the constraint that required host_user_id OR external_expert_name to be set.
-- Group sessions are webinar-style (open to all subscribed leaders); the host can be
-- set later or omitted entirely.
ALTER TABLE app_mentoring.group_session_events
DROP CONSTRAINT IF EXISTS group_session_events_check;
