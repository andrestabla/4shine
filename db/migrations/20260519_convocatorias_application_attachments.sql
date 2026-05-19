-- Application attachment requirements on the convocatoria itself
ALTER TABLE app_networking.convocatorias
  ADD COLUMN IF NOT EXISTS solicitud_archivo_label     TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solicitud_archivo_requerido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS solicitud_url_label         TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solicitud_url_requerido     BOOLEAN NOT NULL DEFAULT false;

-- Submitted attachment data on each application
ALTER TABLE app_networking.convocatoria_applications
  ADD COLUMN IF NOT EXISTS attachment_file_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url      TEXT;
