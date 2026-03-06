-- =========================================================
-- BRANDING REVISION HISTORY + REVERT SUPPORT
-- =========================================================

CREATE TABLE IF NOT EXISTS app_admin.branding_revisions (
    revision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,
    branding_id uuid REFERENCES app_admin.branding_settings(branding_id) ON DELETE SET NULL,
    reason text NOT NULL DEFAULT 'manual_update' CHECK (reason IN ('manual_update', 'revert')),
    source_revision_id uuid REFERENCES app_admin.branding_revisions(revision_id) ON DELETE SET NULL,
    changed_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
    snapshot jsonb NOT NULL,
    change_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branding_revisions_org_created_at
ON app_admin.branding_revisions(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_revisions_source
ON app_admin.branding_revisions(source_revision_id)
WHERE source_revision_id IS NOT NULL;

GRANT SELECT, INSERT ON app_admin.branding_revisions TO app_runtime;

ALTER TABLE app_admin.branding_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.branding_revisions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS branding_revisions_select_manage ON app_admin.branding_revisions;
CREATE POLICY branding_revisions_select_manage ON app_admin.branding_revisions
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

DROP POLICY IF EXISTS branding_revisions_insert_manage ON app_admin.branding_revisions;
CREATE POLICY branding_revisions_insert_manage ON app_admin.branding_revisions
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

INSERT INTO app_admin.branding_revisions (
  organization_id,
  branding_id,
  reason,
  changed_fields,
  snapshot,
  change_summary,
  created_by,
  created_at
)
SELECT
  bs.organization_id,
  bs.branding_id,
  'manual_update',
  ARRAY['bootstrap']::text[],
  jsonb_build_object(
    'platformName', bs.platform_name,
    'institutionTimezone', bs.institution_timezone,
    'primaryColor', bs.primary_color,
    'secondaryColor', bs.secondary_color,
    'accentColor', bs.accent_color,
    'logoUrl', COALESCE(bs.logo_url, ''),
    'faviconUrl', COALESCE(bs.favicon_url, ''),
    'loaderText', bs.loader_text,
    'loaderAssetUrl', COALESCE(bs.loader_asset_url, ''),
    'typography', bs.typography,
    'borderRadiusRem', bs.border_radius_rem,
    'pageMaxWidth', bs.page_max_width,
    'loginLayout', bs.login_layout,
    'welcomeMessage', bs.login_welcome_message,
    'customCss', COALESCE(bs.custom_css, ''),
    'presetCode', bs.preset_code
  ),
  jsonb_build_object(
    'backfilled', true,
    'source', '20260309_branding_revision_history'
  ),
  COALESCE(bs.updated_by, bs.created_by),
  COALESCE(bs.updated_at, bs.created_at, now())
FROM app_admin.branding_settings bs
WHERE NOT EXISTS (
  SELECT 1
  FROM app_admin.branding_revisions br
  WHERE br.organization_id = bs.organization_id
);
