-- =========================================================
-- ADMINISTRATION CONFIGURATION MODULES
-- =========================================================

CREATE TABLE IF NOT EXISTS app_admin.branding_settings (
    branding_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
    platform_name text NOT NULL DEFAULT '4Shine Platform',
    primary_color text NOT NULL DEFAULT '#0f172a' CHECK (primary_color ~* '^#[0-9a-f]{6}$'),
    accent_color text NOT NULL DEFAULT '#f59e0b' CHECK (accent_color ~* '^#[0-9a-f]{6}$'),
    logo_url text,
    favicon_url text,
    loader_text text NOT NULL DEFAULT 'Cargando 4Shine...',
    typography text NOT NULL DEFAULT 'Instrument Sans',
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_branding_settings_updated_at
ON app_admin.branding_settings(updated_at DESC);

CREATE TABLE IF NOT EXISTS app_admin.integration_configs (
    integration_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
    integration_key text NOT NULL CHECK (integration_key IN (
        'google_meet',
        'google_calendar',
        'r2',
        'gemini',
        'google_sso',
        'openai'
    )),
    label text NOT NULL,
    provider text NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    secret_value text,
    wizard_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_configured_at timestamptz,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, integration_key)
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_org_enabled
ON app_admin.integration_configs(organization_id, enabled);

CREATE INDEX IF NOT EXISTS idx_integration_configs_updated_at
ON app_admin.integration_configs(updated_at DESC);

CREATE TABLE IF NOT EXISTS app_admin.outbound_email_configs (
    outbound_email_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT false,
    provider text NOT NULL DEFAULT 'smtp' CHECK (provider IN ('smtp', 'sendgrid', 'resend', 'ses')),
    from_name text NOT NULL DEFAULT '4Shine Platform',
    from_email text NOT NULL DEFAULT '',
    reply_to text NOT NULL DEFAULT '',
    smtp_host text NOT NULL DEFAULT '',
    smtp_port integer NOT NULL DEFAULT 587 CHECK (smtp_port BETWEEN 1 AND 65535),
    smtp_user text NOT NULL DEFAULT '',
    smtp_password text NOT NULL DEFAULT '',
    smtp_secure boolean NOT NULL DEFAULT false,
    api_key text NOT NULL DEFAULT '',
    ses_region text NOT NULL DEFAULT 'us-east-1',
    test_recipient text NOT NULL DEFAULT '',
    last_tested_at timestamptz,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_outbound_email_configs_updated_at
ON app_admin.outbound_email_configs(updated_at DESC);

DROP TRIGGER IF EXISTS trg_branding_settings_set_updated_at ON app_admin.branding_settings;
CREATE TRIGGER trg_branding_settings_set_updated_at
BEFORE UPDATE ON app_admin.branding_settings
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_integration_configs_set_updated_at ON app_admin.integration_configs;
CREATE TRIGGER trg_integration_configs_set_updated_at
BEFORE UPDATE ON app_admin.integration_configs
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_outbound_email_configs_set_updated_at ON app_admin.outbound_email_configs;
CREATE TRIGGER trg_outbound_email_configs_set_updated_at
BEFORE UPDATE ON app_admin.outbound_email_configs
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.branding_settings TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.integration_configs TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.outbound_email_configs TO app_runtime;

ALTER TABLE app_admin.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.outbound_email_configs ENABLE ROW LEVEL SECURITY;

ALTER TABLE app_admin.branding_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE app_admin.integration_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE app_admin.outbound_email_configs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS branding_settings_select_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_select_manage ON app_admin.branding_settings
FOR SELECT
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS branding_settings_insert_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_insert_manage ON app_admin.branding_settings
FOR INSERT
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS branding_settings_update_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_update_manage ON app_admin.branding_settings
FOR UPDATE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
)
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS branding_settings_delete_manage ON app_admin.branding_settings;
CREATE POLICY branding_settings_delete_manage ON app_admin.branding_settings
FOR DELETE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS integration_configs_select_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_select_manage ON app_admin.integration_configs
FOR SELECT
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS integration_configs_insert_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_insert_manage ON app_admin.integration_configs
FOR INSERT
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS integration_configs_update_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_update_manage ON app_admin.integration_configs
FOR UPDATE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
)
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS integration_configs_delete_manage ON app_admin.integration_configs;
CREATE POLICY integration_configs_delete_manage ON app_admin.integration_configs
FOR DELETE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS outbound_email_configs_select_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_select_manage ON app_admin.outbound_email_configs
FOR SELECT
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS outbound_email_configs_insert_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_insert_manage ON app_admin.outbound_email_configs
FOR INSERT
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS outbound_email_configs_update_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_update_manage ON app_admin.outbound_email_configs
FOR UPDATE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
)
WITH CHECK (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);

DROP POLICY IF EXISTS outbound_email_configs_delete_manage ON app_admin.outbound_email_configs;
CREATE POLICY outbound_email_configs_delete_manage ON app_admin.outbound_email_configs
FOR DELETE
USING (
    app_auth.has_permission('usuarios', 'manage')
    AND (
        app_auth.is_admin()
        OR organization_id = (
            SELECT u.organization_id
            FROM app_core.users u
            WHERE u.user_id = app_auth.current_user_id()
        )
    )
);
