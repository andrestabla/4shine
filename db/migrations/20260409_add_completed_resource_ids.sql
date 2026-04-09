-- Migration: Add completed_resource_ids to content_progress
-- Description: Allows dynamic progress calculation based on individual resource completion.

ALTER TABLE app_learning.content_progress 
ADD COLUMN IF NOT EXISTS completed_resource_ids jsonb DEFAULT '[]'::jsonb;

-- Initialize existing records where progress_percent was 100 as having completed ALL currently available items is hard, 
-- but we can at least ensure the column exists for future updates.
-- For new users, it will start as [].
