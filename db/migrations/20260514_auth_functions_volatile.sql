-- Auth helper functions read transaction-local GUCs (set via set_config with is_local=true).
-- Marking them STABLE allows the query planner to cache their results, which causes them to
-- be evaluated before transaction-local settings are visible when SET ROLE is in effect.
-- Changing to VOLATILE forces per-call evaluation, ensuring RLS policies see the correct values.
ALTER FUNCTION app_auth.current_role() VOLATILE;
ALTER FUNCTION app_auth.current_user_id() VOLATILE;
ALTER FUNCTION app_auth.has_permission(text, text) VOLATILE;
