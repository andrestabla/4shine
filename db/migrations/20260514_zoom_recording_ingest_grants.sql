-- Allow server-side webhook code (runs without role context, as pool owner)
-- to read group_session_events and insert group_session_recordings.
-- The Zoom recording.completed webhook uses withClient without withRoleContext.
GRANT SELECT ON app_mentoring.group_session_events TO app_runtime;
GRANT SELECT, INSERT ON app_mentoring.group_session_recordings TO app_runtime;
