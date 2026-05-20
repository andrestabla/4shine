-- Add a dedicated banner/cover image to workshops
ALTER TABLE app_networking.workshops
  ADD COLUMN IF NOT EXISTS banner_url text;
