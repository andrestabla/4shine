-- Add review fields to convocatoria_applications
ALTER TABLE app_networking.convocatoria_applications
  ADD COLUMN IF NOT EXISTS application_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (application_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES app_core.users(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conv_applications_status
  ON app_networking.convocatoria_applications(convocatoria_id, application_status);
