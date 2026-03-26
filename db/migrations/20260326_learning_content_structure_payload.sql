ALTER TABLE app_learning.content_items
  ADD COLUMN IF NOT EXISTS structure_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE app_learning.content_items
SET structure_payload = jsonb_build_object(
  'kind',
  CASE
    WHEN content_type = 'scorm' THEN 'course'
    ELSE 'resource'
  END,
  'modules',
  COALESCE(structure_payload->'modules', '[]'::jsonb)
)
WHERE structure_payload = '{}'::jsonb
   OR structure_payload IS NULL;
