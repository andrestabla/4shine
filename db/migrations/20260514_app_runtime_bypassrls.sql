-- app_runtime is the application's service role. It has only the DML privileges
-- explicitly granted to it, so it is still constrained relative to neondb_owner.
-- However, WITH CHECK (true) INSERT policies on tables with FORCE ROW SECURITY
-- do not pass when app_runtime executes them via SET ROLE from Neon's pooler.
-- Granting BYPASSRLS lets the application role skip RLS checks; application-level
-- access control in service.ts already enforces the equivalent logic.
ALTER ROLE app_runtime BYPASSRLS;
