BEGIN;

UPDATE app_billing.product_catalog
SET
    description = replace(replace(description, 'ishineres', 'Advisers'), 'ishiner', 'Adviser'),
    updated_at = now()
WHERE description ILIKE '%ishiner%';

UPDATE app_learning.workbook_templates
SET
    default_fields = (default_fields - 'ishinerNotes')
        || jsonb_build_object('AdviserNotes', COALESCE(default_fields -> 'ishinerNotes', '""'::jsonb)),
    updated_at = now()
WHERE default_fields ? 'ishinerNotes';

UPDATE app_learning.user_workbooks
SET
    editable_fields = CASE
        WHEN editable_fields ? 'ishinerNotes'
            THEN (editable_fields - 'ishinerNotes')
                || jsonb_build_object('AdviserNotes', COALESCE(editable_fields -> 'ishinerNotes', '""'::jsonb))
        ELSE editable_fields
    END,
    state_payload = CASE
        WHEN state_payload ? 'ishinerNotes'
            THEN (state_payload - 'ishinerNotes')
                || jsonb_build_object('AdviserNotes', COALESCE(state_payload -> 'ishinerNotes', '""'::jsonb))
        ELSE state_payload
    END,
    updated_at = now()
WHERE editable_fields ? 'ishinerNotes'
   OR state_payload ? 'ishinerNotes';

COMMIT;
