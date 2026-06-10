-- Jobs asíncronos para generación de reportes IA de descubrimiento.
-- Resuelve el problema de timeout cliente vs servidor: el frontend hacía POST
-- con 180s timeout, pero el bundle de 5 pilares podía tardar 200-300s (Vercel
-- max). El usuario veía error aunque el backend completaba.
--
-- Nuevo flujo:
-- 1. POST /analyze/batch crea un job (status=queued/running) y devuelve 202
--    con job_id inmediatamente, lanzando el procesamiento via waitUntil.
-- 2. Frontend hace polling GET /analyze/status?inviteToken=&accessCode=
--    cada 3s hasta status=completed/failed.
-- 3. Si un usuario vuelve y ya hay reports cacheados, POST detecta y devuelve
--    200 directo sin crear job nuevo.

CREATE TABLE IF NOT EXISTS app_assessment.discovery_ai_jobs (
    job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Una de estas dos debe estar set (invitation o session) para correlar.
    invitation_id uuid REFERENCES app_assessment.discovery_invitations(invitation_id) ON DELETE CASCADE,
    session_id uuid REFERENCES app_assessment.discovery_sessions(session_id) ON DELETE CASCADE,
    user_id uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    scope text NOT NULL CHECK (scope IN ('invitation','session','guest')),
    status text NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued','running','completed','failed','timeout'
    )),
    -- Input snapshot por si el job se reintenta tras un crash.
    input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Pilares generados (se van llenando conforme avanza).
    pillars_completed text[] NOT NULL DEFAULT '{}',
    pillars_failed text[] NOT NULL DEFAULT '{}',
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_ai_jobs_invitation
    ON app_assessment.discovery_ai_jobs(invitation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_ai_jobs_session
    ON app_assessment.discovery_ai_jobs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_ai_jobs_status
    ON app_assessment.discovery_ai_jobs(status, created_at DESC)
    WHERE status IN ('queued','running');

DROP TRIGGER IF EXISTS trg_discovery_ai_jobs_set_updated_at ON app_assessment.discovery_ai_jobs;
CREATE TRIGGER trg_discovery_ai_jobs_set_updated_at
BEFORE UPDATE ON app_assessment.discovery_ai_jobs
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();
