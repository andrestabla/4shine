-- =========================================================
-- DEFAULT ORGANIZATION FOR ORPHAN USERS
-- =========================================================

DO $$
DECLARE
  organization_total integer;
  default_organization_id uuid;
BEGIN
  SELECT COUNT(*)::int
  INTO organization_total
  FROM app_core.organizations;

  SELECT organization_id
  INTO default_organization_id
  FROM app_core.organizations
  ORDER BY created_at, organization_id
  LIMIT 1;

  -- Safe auto-backfill only in single-tenant setups.
  IF organization_total = 1 AND default_organization_id IS NOT NULL THEN
    UPDATE app_core.users
    SET
      organization_id = default_organization_id,
      updated_at = now()
    WHERE organization_id IS NULL;
  END IF;
END $$;
