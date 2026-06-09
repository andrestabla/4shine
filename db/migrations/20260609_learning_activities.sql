-- Sistema de actividades (quizzes) para contenidos de aprendizaje.
-- Cada content_item puede tener UNA actividad con N preguntas.
-- Los líderes hacen attempts y reciben grade automático para los tipos soportados.

-- 1. Actividad asociada al contenido
CREATE TABLE IF NOT EXISTS app_learning.content_activities (
    activity_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL UNIQUE REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    title text NOT NULL,
    instructions text,
    passing_score smallint NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    max_attempts smallint NOT NULL DEFAULT 0 CHECK (max_attempts >= 0), -- 0 = ilimitados
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Preguntas dentro de la actividad
CREATE TABLE IF NOT EXISTS app_learning.activity_questions (
    question_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id uuid NOT NULL REFERENCES app_learning.content_activities(activity_id) ON DELETE CASCADE,
    sort_order smallint NOT NULL DEFAULT 0,
    question_type text NOT NULL CHECK (question_type IN (
        'single_choice',
        'multiple_choice',
        'true_false',
        'fill_blank',
        'numeric',
        'ordering'
    )),
    prompt text NOT NULL,
    explanation text,
    points smallint NOT NULL DEFAULT 1 CHECK (points > 0),
    -- payload jsonb con la configuración específica del tipo:
    --   single/multiple_choice → { options: [{id, text, isCorrect}] }
    --   true_false             → { correctAnswer: boolean }
    --   fill_blank             → { acceptedAnswers: string[], caseInsensitive: boolean, accentInsensitive: boolean }
    --   numeric                → { correctValue: number, tolerance: number }
    --   ordering               → { items: [{id, text}], correctOrder: string[] }
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_questions_activity
    ON app_learning.activity_questions(activity_id, sort_order);

-- 3. Intentos del usuario
CREATE TABLE IF NOT EXISTS app_learning.activity_attempts (
    attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id uuid NOT NULL REFERENCES app_learning.content_activities(activity_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
    score_percent smallint, -- 0..100, NULL hasta que se submita
    points_earned smallint NOT NULL DEFAULT 0,
    points_possible smallint NOT NULL DEFAULT 0,
    passed boolean,
    started_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    UNIQUE (activity_id, user_id, started_at)
);

CREATE INDEX IF NOT EXISTS idx_activity_attempts_user
    ON app_learning.activity_attempts(user_id, activity_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity
    ON app_learning.activity_attempts(activity_id, submitted_at DESC NULLS LAST);

-- 4. Respuestas por pregunta dentro del intento
CREATE TABLE IF NOT EXISTS app_learning.question_responses (
    response_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES app_learning.activity_attempts(attempt_id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES app_learning.activity_questions(question_id) ON DELETE CASCADE,
    -- answer jsonb: forma depende del tipo, ej:
    --   single → { optionId: 'xxx' }
    --   multiple → { optionIds: ['a','b'] }
    --   true_false → { value: true }
    --   fill_blank → { text: 'respuesta del usuario' }
    --   numeric → { value: 42.5 }
    --   ordering → { order: ['c','a','b'] }
    answer jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_correct boolean,
    points_earned smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_responses_question
    ON app_learning.question_responses(question_id);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS trg_content_activities_set_updated_at ON app_learning.content_activities;
CREATE TRIGGER trg_content_activities_set_updated_at
BEFORE UPDATE ON app_learning.content_activities
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_activity_questions_set_updated_at ON app_learning.activity_questions;
CREATE TRIGGER trg_activity_questions_set_updated_at
BEFORE UPDATE ON app_learning.activity_questions
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();
