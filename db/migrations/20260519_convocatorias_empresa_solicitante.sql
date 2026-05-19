-- Add empresa_solicitante field to convocatorias
ALTER TABLE app_networking.convocatorias
  ADD COLUMN IF NOT EXISTS empresa_solicitante TEXT NOT NULL DEFAULT '';
