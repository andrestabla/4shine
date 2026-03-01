-- =========================================================
-- 4Shine RLS runtime hardening
-- Date: 2026-03-02
-- Purpose:
--   1) run app queries with non-owner runtime role (app_runtime)
--   2) force RLS on critical tables to avoid owner bypass
-- =========================================================

DO $$
DECLARE
    runtime_role text := 'app_runtime';
    owner_role text := current_user;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = runtime_role) THEN
        EXECUTE format('CREATE ROLE %I NOLOGIN', runtime_role);
    END IF;

    -- Allow the connection user to SET ROLE app_runtime in application sessions.
    EXECUTE format('GRANT %I TO %I', runtime_role, owner_role);
END
$$;

GRANT USAGE ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_runtime;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_runtime;

DO $$
DECLARE
    owner_role text := current_user;
BEGIN
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime',
        owner_role
    );

    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin GRANT USAGE, SELECT ON SEQUENCES TO app_runtime',
        owner_role
    );

    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin GRANT EXECUTE ON FUNCTIONS TO app_runtime',
        owner_role
    );
END
$$;

ALTER TABLE app_core.users FORCE ROW LEVEL SECURITY;
ALTER TABLE app_core.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE app_learning.content_items FORCE ROW LEVEL SECURITY;
ALTER TABLE app_mentoring.mentorship_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE app_networking.chat_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE app_networking.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE app_core.notifications FORCE ROW LEVEL SECURITY;
