-- Add rich event fields to workshops table
ALTER TABLE app_networking.workshops
  ADD COLUMN IF NOT EXISTS location_name    text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_lat     numeric(9,6),
  ADD COLUMN IF NOT EXISTS location_lng     numeric(9,6),
  ADD COLUMN IF NOT EXISTS location_photos  text[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price            numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency         text          DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS max_attendees    int,
  ADD COLUMN IF NOT EXISTS agenda           jsonb         DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS speakers         jsonb         DEFAULT '[]';

-- Restrict workshop create/update to gestor/admin only
UPDATE app_auth.role_module_permissions
  SET can_create = false,
      can_update = false
  WHERE role_code IN ('lider', 'mentor')
    AND module_code = 'workshops';
