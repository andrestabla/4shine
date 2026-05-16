BEGIN;

-- ── 1. Enrich interest_groups ────────────────────────────────────────────────

ALTER TABLE app_networking.interest_groups
  ADD COLUMN IF NOT EXISTS is_general      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS links           jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- Only one general community allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_interest_groups_one_general
  ON app_networking.interest_groups(is_general)
  WHERE is_general = true;

-- ── 2. Post reactions (likes / Recomendar) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.post_reactions (
  post_id    uuid NOT NULL REFERENCES app_networking.community_posts(post_id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES app_core.users(user_id)                ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id
  ON app_networking.post_reactions(post_id);

COMMENT ON TABLE app_networking.post_reactions
  IS 'Recomendaciones (likes) de usuarios sobre publicaciones de comunidades.';

-- ── 3. Post comments (Comentar) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_networking.post_comments (
  comment_id     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        uuid        NOT NULL REFERENCES app_networking.community_posts(post_id) ON DELETE CASCADE,
  author_user_id uuid        NOT NULL REFERENCES app_core.users(user_id)                ON DELETE CASCADE,
  body           text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
  ON app_networking.post_comments(post_id);

DROP TRIGGER IF EXISTS trg_post_comments_set_updated_at ON app_networking.post_comments;
CREATE TRIGGER trg_post_comments_set_updated_at
  BEFORE UPDATE ON app_networking.post_comments
  FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMENT ON TABLE app_networking.post_comments
  IS 'Comentarios de usuarios sobre publicaciones de comunidades.';

-- ── 4. Seed the General community (idempotent) ───────────────────────────────

INSERT INTO app_networking.interest_groups
  (name, description, category, visibility, is_general, is_active, created_by)
SELECT
  'General',
  'Canal de comunicación abierto para toda la comunidad 4Shine.',
  'General',
  'open',
  true,
  true,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM app_networking.interest_groups WHERE is_general = true
);

-- ── 5. Grants for app_runtime on new tables ──────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.post_reactions TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_networking.post_comments  TO app_runtime;

COMMIT;
