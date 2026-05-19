-- Workshop FAQs (managed by gestor/admin)
CREATE TABLE IF NOT EXISTS app_networking.workshop_faqs (
  faq_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid        NOT NULL REFERENCES app_networking.workshops(workshop_id) ON DELETE CASCADE,
  question    text        NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
  answer      text        NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 2000),
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_faqs_wid
  ON app_networking.workshop_faqs(workshop_id, sort_order);

-- Workshop forum posts
CREATE TABLE IF NOT EXISTS app_networking.workshop_forum_posts (
  post_id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id    uuid        NOT NULL REFERENCES app_networking.workshops(workshop_id) ON DELETE CASCADE,
  author_user_id uuid        NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  body           text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_forum_posts_wid
  ON app_networking.workshop_forum_posts(workshop_id, created_at);

CREATE OR REPLACE TRIGGER trg_workshop_forum_posts_set_updated_at
  BEFORE UPDATE ON app_networking.workshop_forum_posts
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.workshop_faqs         TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.workshop_forum_posts  TO app_runtime;
