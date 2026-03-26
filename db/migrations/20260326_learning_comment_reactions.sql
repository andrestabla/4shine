CREATE TABLE IF NOT EXISTS app_learning.content_comment_reactions (
    comment_id uuid NOT NULL REFERENCES app_learning.content_comments(comment_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('love', 'useful', 'insightful', 'celebrate')),
    reacted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_content_comment_reactions_comment_id
    ON app_learning.content_comment_reactions(comment_id);

CREATE INDEX IF NOT EXISTS idx_content_comment_reactions_user_id
    ON app_learning.content_comment_reactions(user_id);
