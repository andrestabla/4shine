ALTER TABLE app_assessment.discovery_sessions
  ADD COLUMN IF NOT EXISTS diagnostic_identifier text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS job_role text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS years_experience numeric(4,1);

ALTER TABLE app_assessment.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_age_check;

ALTER TABLE app_assessment.discovery_sessions
  ADD CONSTRAINT discovery_sessions_age_check
  CHECK (age IS NULL OR (age >= 16 AND age <= 100));

ALTER TABLE app_assessment.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_years_experience_check;

ALTER TABLE app_assessment.discovery_sessions
  ADD CONSTRAINT discovery_sessions_years_experience_check
  CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 80));

ALTER TABLE app_assessment.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_job_role_check;

ALTER TABLE app_assessment.discovery_sessions
  ADD CONSTRAINT discovery_sessions_job_role_check
  CHECK (
    job_role IS NULL
    OR job_role IN (
      'Director/C-Level',
      'Gerente/Mand medio',
      'Coordinador',
      'Lider de proyecto con equipo a cargo',
      'Individual contributor'
    )
  );

UPDATE app_assessment.discovery_sessions ds
SET
  first_name = COALESCE(NULLIF(ds.first_name, ''), split_part(ds.name_snapshot, ' ', 1)),
  last_name = COALESCE(
    NULLIF(ds.last_name, ''),
    NULLIF(trim(regexp_replace(ds.name_snapshot, '^\S+\s*', '')), ''),
    split_part(ds.name_snapshot, ' ', 1)
  ),
  diagnostic_identifier = COALESCE(
    NULLIF(ds.diagnostic_identifier, ''),
    'DX-' || upper(substr(replace(ds.session_id::text, '-', ''), 1, 12))
  )
WHERE
  ds.first_name IS NULL
  OR ds.last_name IS NULL
  OR ds.diagnostic_identifier IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_discovery_sessions_diagnostic_identifier
  ON app_assessment.discovery_sessions(diagnostic_identifier)
  WHERE diagnostic_identifier IS NOT NULL;

CREATE TABLE IF NOT EXISTS app_assessment.discovery_feedback_settings (
  settings_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
  ai_feedback_instructions text NOT NULL DEFAULT 'Genera feedback ejecutivo accionable, con tono claro, respetuoso y orientado a priorizar el siguiente paso de desarrollo en liderazgo.',
  context_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  invite_email_subject text NOT NULL DEFAULT 'Diagnostico 4Shine: acceso personalizado',
  invite_email_html text NOT NULL DEFAULT '',
  invite_email_text text NOT NULL DEFAULT '',
  created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

DROP TRIGGER IF EXISTS trg_discovery_feedback_settings_set_updated_at ON app_assessment.discovery_feedback_settings;
CREATE TRIGGER trg_discovery_feedback_settings_set_updated_at
BEFORE UPDATE ON app_assessment.discovery_feedback_settings
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

CREATE TABLE IF NOT EXISTS app_assessment.discovery_invitations (
  invitation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES app_assessment.discovery_sessions(session_id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invite_token text NOT NULL,
  access_code_hash text NOT NULL,
  access_code_last4 text NOT NULL,
  access_code_sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz,
  invited_by_user_id uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, invited_email),
  UNIQUE (invite_token)
);

CREATE INDEX IF NOT EXISTS idx_discovery_invitations_session
  ON app_assessment.discovery_invitations(session_id);

CREATE INDEX IF NOT EXISTS idx_discovery_invitations_email
  ON app_assessment.discovery_invitations(lower(invited_email));

DROP TRIGGER IF EXISTS trg_discovery_invitations_set_updated_at ON app_assessment.discovery_invitations;
CREATE TRIGGER trg_discovery_invitations_set_updated_at
BEFORE UPDATE ON app_assessment.discovery_invitations
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_feedback_settings TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_feedback_settings TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_feedback_settings TO app_gestor;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_invitations TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_invitations TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_assessment.discovery_invitations TO app_gestor;

COMMENT ON COLUMN app_assessment.discovery_sessions.diagnostic_identifier IS 'Identificador unico legible por diagnostico.';
COMMENT ON COLUMN app_assessment.discovery_sessions.job_role IS 'Cargo reportado antes de iniciar el diagnostico.';
COMMENT ON TABLE app_assessment.discovery_invitations IS 'Invitaciones por correo con codigo unico de acceso al diagnostico.';
COMMENT ON TABLE app_assessment.discovery_feedback_settings IS 'Configuracion editable de prompts de feedback IA y plantillas de invitacion.';
