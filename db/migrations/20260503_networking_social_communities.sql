BEGIN;

ALTER TABLE app_networking.interest_groups
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'open'
  CHECK (visibility IN ('open', 'closed'));

CREATE TABLE IF NOT EXISTS app_networking.user_follows (
  follower_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  followed_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  followed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, followed_user_id),
  CHECK (follower_user_id <> followed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON app_networking.user_follows(followed_user_id);

CREATE TABLE IF NOT EXISTS app_networking.community_posts (
  post_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES app_networking.interest_groups(group_id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  resource_url text,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_group_created
  ON app_networking.community_posts(group_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_community_posts_set_updated_at ON app_networking.community_posts;
CREATE TRIGGER trg_community_posts_set_updated_at
BEFORE UPDATE ON app_networking.community_posts
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

COMMENT ON TABLE app_networking.user_follows IS 'Seguimiento de perfiles públicos entre usuarios de networking.';
COMMENT ON TABLE app_networking.community_posts IS 'Publicaciones y recursos compartidos dentro de comunidades de networking.';

COMMIT;
