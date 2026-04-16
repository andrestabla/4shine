ALTER TABLE app_assessment.discovery_sessions
  ADD COLUMN IF NOT EXISTS ai_reports jsonb;

COMMENT ON COLUMN app_assessment.discovery_sessions.ai_reports IS
  'Analisis persistidos por IA para all, within, out, up y beyond.';
