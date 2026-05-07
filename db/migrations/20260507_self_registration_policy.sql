-- Allow INSERT on app_core.users and app_core.user_profiles during self-registration.
-- The register API sets app.allow_self_register = '1' (transaction-local) before calling
-- the insert. The value is never persisted beyond the transaction.

DROP POLICY IF EXISTS users_self_register ON app_core.users;
CREATE POLICY users_self_register ON app_core.users
FOR INSERT
WITH CHECK (
    current_setting('app.allow_self_register', true) = '1'
);

DROP POLICY IF EXISTS profiles_self_register ON app_core.user_profiles;
CREATE POLICY profiles_self_register ON app_core.user_profiles
FOR INSERT
WITH CHECK (
    current_setting('app.allow_self_register', true) = '1'
);
