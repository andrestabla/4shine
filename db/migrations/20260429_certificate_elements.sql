-- Certificate builder: store freely-positioned element layouts per template.
-- elements is a jsonb array of CertificateElement objects (see src/lib/certificate-elements.ts).
-- When null the legacy preset rendering is used; when set the builder layout takes over.

ALTER TABLE app_learning.certificate_templates
  ADD COLUMN IF NOT EXISTS elements jsonb DEFAULT NULL;
