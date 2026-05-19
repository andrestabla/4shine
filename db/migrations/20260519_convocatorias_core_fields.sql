-- Add core structured fields to convocatorias table
ALTER TABLE app_networking.convocatorias
  ADD COLUMN IF NOT EXISTS objetivo               text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo                  text NOT NULL DEFAULT 'otra'
    CHECK (tipo IN ('laboral', 'proyecto_social', 'proveedor', 'convenio', 'otra')),
  ADD COLUMN IF NOT EXISTS fecha_inicio          date,
  ADD COLUMN IF NOT EXISTS fecha_fin             date,
  ADD COLUMN IF NOT EXISTS requisitos            text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS enlaces_complementarios text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contacto_telefono     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contacto_email        text NOT NULL DEFAULT '';
