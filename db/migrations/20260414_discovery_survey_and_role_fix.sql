ALTER TABLE app_assessment.discovery_sessions
  ADD COLUMN IF NOT EXISTS feedback_survey jsonb;

ALTER TABLE app_assessment.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_job_role_check;

ALTER TABLE app_assessment.discovery_sessions
  ADD CONSTRAINT discovery_sessions_job_role_check
  CHECK (
    job_role IS NULL
    OR job_role IN (
      'Director/C-Level',
      'Gerente/Mando medio',
      'Coordinador',
      'Lider de proyecto con equipo a cargo',
      'Individual contributor'
    )
  );

UPDATE app_assessment.discovery_sessions
SET job_role = 'Gerente/Mando medio'
WHERE job_role = 'Gerente/Mand medio';

COMMENT ON COLUMN app_assessment.discovery_sessions.feedback_survey IS 'Encuesta de satisfaccion del proceso de diagnostico.';
