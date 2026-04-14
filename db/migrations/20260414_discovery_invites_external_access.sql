ALTER TABLE app_assessment.discovery_invitations
  ALTER COLUMN session_id DROP NOT NULL;

DROP INDEX IF EXISTS idx_discovery_invitations_session;
CREATE INDEX IF NOT EXISTS idx_discovery_invitations_session
  ON app_assessment.discovery_invitations(session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN app_assessment.discovery_invitations.session_id IS 'Sesion asociada opcional. NULL para invitaciones externas solo con acceso al modulo.';
