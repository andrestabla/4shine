-- Renombra las tablas del feature "Tarea o entrega" para evitar conflicto
-- con la tabla legacy app_learning.content_assignments (asignación de
-- contenido a usuario — schema distinto y ya en uso).
--
-- Nombre nuevo:
--   content_tasks       (antes pensado content_assignments)
--   task_submissions    (antes assignment_submissions)
--
-- Idempotente. Si las tablas viejas (mías) no existen, crea las nuevas
-- directamente. Si existen, las renombra preservando datos.

BEGIN;

-- 1. Drop tabla mía vieja assignment_submissions si está vacía (FK incorrecto
--    contra la content_assignments legacy).
DO $$
DECLARE
  has_data boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='app_learning' AND table_name='assignment_submissions'
  ) THEN
    -- Verificar la PK de la tabla actual para detectar si es la mía.
    -- La mía tiene submission_id como PK; la legacy (si existiera con ese
    -- nombre) tendría algo distinto.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='app_learning' AND table_name='assignment_submissions'
        AND column_name='submission_id'
    ) THEN
      EXECUTE 'SELECT EXISTS(SELECT 1 FROM app_learning.assignment_submissions LIMIT 1)' INTO has_data;
      IF has_data THEN
        RAISE NOTICE 'assignment_submissions tiene datos. Renombrando a task_submissions.';
        EXECUTE 'ALTER TABLE app_learning.assignment_submissions RENAME TO task_submissions';
      ELSE
        RAISE NOTICE 'assignment_submissions sin datos. Drop y recreate.';
        EXECUTE 'DROP TABLE app_learning.assignment_submissions CASCADE';
      END IF;
    END IF;
  END IF;
END $$;

-- 2. Crear content_tasks (nombre nuevo) si no existe.
CREATE TABLE IF NOT EXISTS app_learning.content_tasks (
    task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL UNIQUE REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    title text NOT NULL,
    instructions text NOT NULL DEFAULT '',
    evaluation_criteria text NOT NULL DEFAULT '',
    max_score smallint NOT NULL DEFAULT 100 CHECK (max_score > 0 AND max_score <= 1000),
    passing_score smallint NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 1000),
    accept_files boolean NOT NULL DEFAULT true,
    accept_url boolean NOT NULL DEFAULT true,
    accept_text boolean NOT NULL DEFAULT true,
    max_files smallint NOT NULL DEFAULT 5 CHECK (max_files >= 0 AND max_files <= 20),
    allow_multiple_submissions boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Recrear task_submissions con FK correcto a content_tasks.
CREATE TABLE IF NOT EXISTS app_learning.task_submissions (
    submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES app_learning.content_tasks(task_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft','submitted','graded','rejected','revision_requested'
    )),
    submission_text text,
    submission_url text,
    submission_files jsonb NOT NULL DEFAULT '[]'::jsonb,
    score smallint,
    passed boolean,
    grader_feedback text,
    graded_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    graded_at timestamptz,
    submitted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Si la tabla task_submissions venía renombrada de assignment_submissions,
-- la columna FK seguirá siendo assignment_id. La renombramos.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='app_learning' AND table_name='task_submissions'
      AND column_name='assignment_id'
  ) THEN
    RAISE NOTICE 'Renombrando columna assignment_id -> task_id en task_submissions';
    ALTER TABLE app_learning.task_submissions RENAME COLUMN assignment_id TO task_id;
    -- El FK constraint quedará apuntando a la tabla equivocada; lo
    -- removemos y recreamos. Buscar el nombre del constraint.
  END IF;
END $$;

-- Asegurar FK correcto contra content_tasks (no contra content_assignments).
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'app_learning.task_submissions'::regclass
    AND contype = 'f'
    AND conname LIKE '%task_id%' OR conname LIKE '%assignment_id%'
  LIMIT 1;

  -- Drop el FK actual si apunta a content_assignments (legacy).
  FOR con_name IN
    SELECT conname FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.confrelid
    WHERE c.conrelid = 'app_learning.task_submissions'::regclass
      AND c.contype = 'f'
      AND t.relname IN ('content_assignments')
  LOOP
    EXECUTE format('ALTER TABLE app_learning.task_submissions DROP CONSTRAINT %I', con_name);
    RAISE NOTICE 'Dropped legacy FK %', con_name;
  END LOOP;

  -- Agregar FK correcto si no existe.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.confrelid
    WHERE c.conrelid = 'app_learning.task_submissions'::regclass
      AND c.contype = 'f'
      AND t.relname = 'content_tasks'
  ) THEN
    ALTER TABLE app_learning.task_submissions
      ADD CONSTRAINT task_submissions_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES app_learning.content_tasks(task_id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK task_submissions -> content_tasks';
  END IF;
END $$;

-- 4. Índices y triggers.
CREATE INDEX IF NOT EXISTS idx_task_submissions_user
    ON app_learning.task_submissions(user_id, task_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task
    ON app_learning.task_submissions(task_id, status, submitted_at DESC);

DROP TRIGGER IF EXISTS trg_content_tasks_set_updated_at ON app_learning.content_tasks;
CREATE TRIGGER trg_content_tasks_set_updated_at
BEFORE UPDATE ON app_learning.content_tasks
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_task_submissions_set_updated_at ON app_learning.task_submissions;
CREATE TRIGGER trg_task_submissions_set_updated_at
BEFORE UPDATE ON app_learning.task_submissions
FOR EACH ROW EXECUTE FUNCTION app_core.set_updated_at();

COMMIT;
