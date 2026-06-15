-- ============================================================
-- Segmentación de popups por rol de usuario y plan de suscripción.
-- Arrays vacíos = sin filtro (aplica a todos).
-- ============================================================
-- Idempotente.

ALTER TABLE app_admin.popups
  ADD COLUMN IF NOT EXISTS target_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_plans uuid[] NOT NULL DEFAULT '{}';
