BEGIN;

-- ── 1. Main convocatorias table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatorias (
  convocatoria_id uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  description     text        NOT NULL DEFAULT '',
  cover_image_url text,
  external_url    text,
  location        text,
  status          text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'suspended')),
  created_by      uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convocatorias_status
  ON app_networking.convocatorias(status);
CREATE INDEX IF NOT EXISTS idx_convocatorias_created_at
  ON app_networking.convocatorias(created_at DESC);

DROP TRIGGER IF EXISTS trg_convocatorias_set_updated_at ON app_networking.convocatorias;
CREATE TRIGGER trg_convocatorias_set_updated_at
  BEFORE UPDATE ON app_networking.convocatorias
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMENT ON TABLE app_networking.convocatorias
  IS 'Convocatorias del ecosistema 4Shine — proyectos, programas y oportunidades.';

-- ── 2. Gallery images ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_images (
  image_id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid        NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  url             text        NOT NULL,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_images_cid
  ON app_networking.convocatoria_images(convocatoria_id, sort_order);

-- ── 3. File attachments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_attachments (
  attachment_id   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid        NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  file_url        text        NOT NULL,
  file_name       text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_attachments_cid
  ON app_networking.convocatoria_attachments(convocatoria_id);

-- ── 4. Key dates ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_dates (
  date_id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid  NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  label           text  NOT NULL,
  date_value      date  NOT NULL,
  sort_order      int   NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_dates_cid
  ON app_networking.convocatoria_dates(convocatoria_id, sort_order);

-- ── 5. FAQ items ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_faqs (
  faq_id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid  NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  question        text  NOT NULL,
  answer          text  NOT NULL,
  sort_order      int   NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_faqs_cid
  ON app_networking.convocatoria_faqs(convocatoria_id, sort_order);

-- ── 6. Applications ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_applications (
  application_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id   uuid        NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  applicant_user_id uuid        NOT NULL
    REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  applied_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (convocatoria_id, applicant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_applications_applicant
  ON app_networking.convocatoria_applications(applicant_user_id);

-- ── 7. Forum posts ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.convocatoria_forum_posts (
  post_id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid        NOT NULL
    REFERENCES app_networking.convocatorias(convocatoria_id) ON DELETE CASCADE,
  author_user_id  uuid        NOT NULL
    REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  body            text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
  is_pinned       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convocatoria_forum_posts_cid
  ON app_networking.convocatoria_forum_posts(convocatoria_id, is_pinned DESC, created_at DESC);

DROP TRIGGER IF EXISTS trg_convocatoria_forum_posts_updated_at ON app_networking.convocatoria_forum_posts;
CREATE TRIGGER trg_convocatoria_forum_posts_updated_at
  BEFORE UPDATE ON app_networking.convocatoria_forum_posts
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMENT ON TABLE app_networking.convocatoria_forum_posts
  IS 'Foro exclusivo por convocatoria — visible solo para líderes con suscripción.';

-- ── 8. Grants ────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatorias               TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_images         TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_attachments    TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_dates          TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_faqs           TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_applications   TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.convocatoria_forum_posts    TO app_runtime;

COMMIT;
