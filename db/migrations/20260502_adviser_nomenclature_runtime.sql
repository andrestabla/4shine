BEGIN;

-- Update product copy in catalog descriptions.
UPDATE app_billing.product_catalog
SET
  description = replace(
    replace(
      replace(
        replace(description, 'iShiners', 'Advisers'),
        'iShiner',
        'Adviser'
      ),
      'iShine',
      'Adviser'
    ),
    'Ishine',
    'Adviser'
  ),
  updated_at = now()
WHERE description ILIKE '%ishine%'
   OR description ILIKE '%ishiner%';

-- Normalize workbook template key name.
UPDATE app_learning.workbook_templates
SET
  default_fields = CASE
    WHEN default_fields ? 'AdviserNotes' THEN default_fields
    WHEN default_fields ? 'iShineNotes' THEN (default_fields - 'iShineNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(default_fields -> 'iShineNotes', '""'::jsonb))
    WHEN default_fields ? 'ishinerNotes' THEN (default_fields - 'ishinerNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(default_fields -> 'ishinerNotes', '""'::jsonb))
    ELSE default_fields
  END,
  updated_at = now()
WHERE default_fields ? 'iShineNotes'
   OR default_fields ? 'ishinerNotes';

-- Normalize workbook user payload key names.
UPDATE app_learning.user_workbooks
SET
  editable_fields = CASE
    WHEN editable_fields ? 'AdviserNotes' THEN editable_fields
    WHEN editable_fields ? 'iShineNotes' THEN (editable_fields - 'iShineNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(editable_fields -> 'iShineNotes', '""'::jsonb))
    WHEN editable_fields ? 'ishinerNotes' THEN (editable_fields - 'ishinerNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(editable_fields -> 'ishinerNotes', '""'::jsonb))
    ELSE editable_fields
  END,
  state_payload = CASE
    WHEN state_payload ? 'AdviserNotes' THEN state_payload
    WHEN state_payload ? 'iShineNotes' THEN (state_payload - 'iShineNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(state_payload -> 'iShineNotes', '""'::jsonb))
    WHEN state_payload ? 'ishinerNotes' THEN (state_payload - 'ishinerNotes')
      || jsonb_build_object('AdviserNotes', COALESCE(state_payload -> 'ishinerNotes', '""'::jsonb))
    ELSE state_payload
  END,
  updated_at = now()
WHERE editable_fields ? 'iShineNotes'
   OR editable_fields ? 'ishinerNotes'
   OR state_payload ? 'iShineNotes'
   OR state_payload ? 'ishinerNotes';

COMMIT;
