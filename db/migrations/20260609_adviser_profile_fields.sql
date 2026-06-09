-- Adviser (mentor) profile fields: experiencia, precio sesión, temas (asociados a pilares 4shine)
-- Idempotent migration.

-- 1. Extra columns on the mentor record itself
ALTER TABLE app_mentoring.mentors
    ADD COLUMN IF NOT EXISTS experiencia text,
    ADD COLUMN IF NOT EXISTS precio_sesion integer,
    ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'COP';

-- Enforce price range only when set (180.000 - 500.000 COP)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'mentors_precio_sesion_range_chk'
          AND conrelid = 'app_mentoring.mentors'::regclass
    ) THEN
        ALTER TABLE app_mentoring.mentors
            ADD CONSTRAINT mentors_precio_sesion_range_chk
            CHECK (precio_sesion IS NULL OR (precio_sesion >= 180000 AND precio_sesion <= 500000));
    END IF;
END$$;

-- 2. Adviser topics (one row per topic, associated to a 4shine pillar)
CREATE TABLE IF NOT EXISTS app_mentoring.mentor_topics (
    topic_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    topic_label text NOT NULL,
    pillar_code text NOT NULL REFERENCES app_assessment.pillars(pillar_code) ON DELETE RESTRICT,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (length(btrim(topic_label)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_mentor_topics_mentor
    ON app_mentoring.mentor_topics(mentor_user_id, sort_order);

-- Touch updated_at trigger
DROP TRIGGER IF EXISTS trg_mentor_topics_set_updated_at ON app_mentoring.mentor_topics;
CREATE TRIGGER trg_mentor_topics_set_updated_at
BEFORE UPDATE ON app_mentoring.mentor_topics
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();
