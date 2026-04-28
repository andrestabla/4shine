BEGIN;

CREATE TABLE IF NOT EXISTS app_learning.certificate_templates (
    template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_number integer NOT NULL UNIQUE CHECK (template_number BETWEEN 1 AND 3),
    name text NOT NULL,
    headline_text text NOT NULL DEFAULT 'Este certificado acredita que',
    body_text text NOT NULL DEFAULT 'ha completado satisfactoriamente',
    organization_name text NOT NULL DEFAULT '4Shine Academy',
    signatory_name text NOT NULL DEFAULT '',
    signatory_title text NOT NULL DEFAULT '',
    logo_url text,
    signature_url text,
    footer_text text NOT NULL DEFAULT 'Certificado emitido digitalmente por 4Shine.',
    accent_color text NOT NULL DEFAULT '#5f3471',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_learning.content_items
    ADD COLUMN IF NOT EXISTS certificate_template_id uuid
        REFERENCES app_learning.certificate_templates(template_id)
        ON DELETE SET NULL;

INSERT INTO app_learning.certificate_templates (
    template_number, name, headline_text, body_text,
    organization_name, signatory_name, signatory_title,
    footer_text, accent_color
)
VALUES
    (
        1,
        'Plantilla Ejecutiva',
        'Este certificado acredita que',
        'ha completado satisfactoriamente el curso',
        '4Shine Academy',
        '',
        'Directora 4Shine',
        'Certificado emitido digitalmente por 4Shine Academy.',
        '#5f3471'
    ),
    (
        2,
        'Plantilla Premium',
        'Con orgullo se certifica que',
        'ha finalizado con éxito el programa',
        '4Shine',
        '',
        'Directora 4Shine',
        'Este certificado valida el desarrollo de liderazgo con el programa 4Shine.',
        '#3b2a70'
    ),
    (
        3,
        'Plantilla Estándar',
        'Se certifica que',
        'completó el curso',
        '4Shine',
        '',
        'Equipo 4Shine',
        'Aprendizaje verificado por la plataforma 4Shine.',
        '#1a3a5c'
    )
ON CONFLICT (template_number) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_content_items_certificate_template
    ON app_learning.content_items(certificate_template_id)
    WHERE certificate_template_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_certificate_templates_set_updated_at ON app_learning.certificate_templates;
CREATE TRIGGER trg_certificate_templates_set_updated_at
BEFORE UPDATE ON app_learning.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON app_learning.certificate_templates TO app_admin;
GRANT SELECT, INSERT, UPDATE ON app_learning.certificate_templates TO app_gestor;
GRANT SELECT ON app_learning.certificate_templates TO app_runtime;
GRANT SELECT ON app_learning.certificate_templates TO app_mentor;
GRANT SELECT ON app_learning.certificate_templates TO app_lider;

COMMIT;
