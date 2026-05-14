-- Allow any user with mentorias→view to read the underlying mentorship_session
-- of a group session event. The existing mentorship_participants_read policy
-- only covers individual sessions (where the user is a participant or host),
-- so líderes could not see group sessions at all via the JOIN in listGroupSessionEvents.

DROP POLICY IF EXISTS mentorship_group_session_read ON app_mentoring.mentorship_sessions;
CREATE POLICY mentorship_group_session_read ON app_mentoring.mentorship_sessions
FOR SELECT
USING (
  app_auth.has_permission('mentorias', 'view')
  AND EXISTS (
    SELECT 1
    FROM app_mentoring.group_session_events gse
    WHERE gse.session_id = mentorship_sessions.session_id
  )
);
