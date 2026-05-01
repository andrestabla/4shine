-- Migration: Persist SCORM runtime state per user/course
-- Description: Stores cmi.* values (suspend_data, lesson_location, etc.) to resume SCORM sessions.

ALTER TABLE app_learning.content_progress
ADD COLUMN IF NOT EXISTS scorm_runtime_state jsonb NOT NULL DEFAULT '{}'::jsonb;
