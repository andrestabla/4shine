BEGIN;

CREATE TABLE IF NOT EXISTS app_mentoring.program_mentorship_templates (
    template_code text PRIMARY KEY,
    sequence_no integer NOT NULL UNIQUE CHECK (sequence_no >= 1 AND sequence_no <= 50),
    title text NOT NULL,
    description text,
    phase_code text NOT NULL,
    workbook_code text,
    suggested_week integer NOT NULL CHECK (suggested_week >= 1 AND suggested_week <= 52),
    default_duration_minutes integer NOT NULL DEFAULT 60 CHECK (default_duration_minutes >= 15 AND default_duration_minutes <= 240),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_mentoring.user_program_mentorships (
    entitlement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    template_code text NOT NULL REFERENCES app_mentoring.program_mentorship_templates(template_code) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'scheduled', 'completed')),
    scheduled_session_id uuid REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_user_id, template_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_program_mentorships_session_unique
    ON app_mentoring.user_program_mentorships(scheduled_session_id)
    WHERE scheduled_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_program_mentorships_owner
    ON app_mentoring.user_program_mentorships(owner_user_id, status);

CREATE TABLE IF NOT EXISTS app_mentoring.mentor_offerings (
    offer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    offer_code text NOT NULL DEFAULT 'extra_1_1',
    title text NOT NULL,
    description text,
    session_type text NOT NULL CHECK (session_type IN ('individual', 'grupal')),
    duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 240),
    price_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
    currency_code text NOT NULL DEFAULT 'COP',
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (mentor_user_id, offer_code)
);

CREATE INDEX IF NOT EXISTS idx_mentor_offerings_active
    ON app_mentoring.mentor_offerings(mentor_user_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS app_mentoring.additional_mentorship_orders (
    order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE RESTRICT,
    offer_id uuid REFERENCES app_mentoring.mentor_offerings(offer_id) ON DELETE SET NULL,
    scheduled_session_id uuid UNIQUE REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE SET NULL,
    title text NOT NULL,
    topic text,
    notes text,
    scheduled_starts_at timestamptz,
    scheduled_ends_at timestamptz,
    status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'scheduled', 'completed', 'cancelled')),
    price_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
    currency_code text NOT NULL DEFAULT 'COP',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
        (scheduled_starts_at IS NULL AND scheduled_ends_at IS NULL)
        OR (scheduled_starts_at IS NOT NULL AND scheduled_ends_at IS NOT NULL AND scheduled_ends_at > scheduled_starts_at)
    )
);

CREATE INDEX IF NOT EXISTS idx_additional_orders_owner_status
    ON app_mentoring.additional_mentorship_orders(owner_user_id, status, created_at DESC);

ALTER TABLE app_mentoring.mentorship_sessions
    ADD COLUMN IF NOT EXISTS session_origin text;

UPDATE app_mentoring.mentorship_sessions
SET session_origin = COALESCE(session_origin, 'manual')
WHERE session_origin IS NULL;

ALTER TABLE app_mentoring.mentorship_sessions
    ALTER COLUMN session_origin SET DEFAULT 'manual';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'mentorship_sessions_session_origin_check'
          AND conrelid = 'app_mentoring.mentorship_sessions'::regclass
    ) THEN
        ALTER TABLE app_mentoring.mentorship_sessions
            ADD CONSTRAINT mentorship_sessions_session_origin_check
            CHECK (session_origin IN ('manual', 'program_included', 'additional_paid'));
    END IF;
END
$$;

ALTER TABLE app_mentoring.mentorship_sessions
    ALTER COLUMN session_origin SET NOT NULL;

DROP POLICY IF EXISTS mentorship_create_by_permission ON app_mentoring.mentorship_sessions;
CREATE POLICY mentorship_create_by_permission ON app_mentoring.mentorship_sessions
FOR INSERT
WITH CHECK (
    app_auth.has_permission('mentorias', 'create')
    AND created_by = app_auth.current_user_id()
    AND (
        app_auth.current_role() IN ('admin', 'gestor')
        OR mentor_user_id = app_auth.current_user_id()
        OR status = 'pending_approval'
        OR (
            app_auth.current_role() = 'lider'
            AND session_origin IN ('program_included', 'additional_paid')
        )
    )
);

ALTER TABLE app_mentoring.program_mentorship_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_mentoring.user_program_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_mentoring.mentor_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_mentoring.additional_mentorship_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS program_templates_read_policy ON app_mentoring.program_mentorship_templates;
CREATE POLICY program_templates_read_policy ON app_mentoring.program_mentorship_templates
FOR SELECT
USING (app_auth.has_permission('mentorias', 'view'));

DROP POLICY IF EXISTS user_program_mentorships_admin_gestor_all ON app_mentoring.user_program_mentorships;
CREATE POLICY user_program_mentorships_admin_gestor_all ON app_mentoring.user_program_mentorships
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS user_program_mentorships_owner_read ON app_mentoring.user_program_mentorships;
CREATE POLICY user_program_mentorships_owner_read ON app_mentoring.user_program_mentorships
FOR SELECT
USING (
    owner_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'lider'
    AND app_auth.has_permission('mentorias', 'view')
);

DROP POLICY IF EXISTS user_program_mentorships_owner_update ON app_mentoring.user_program_mentorships;
CREATE POLICY user_program_mentorships_owner_update ON app_mentoring.user_program_mentorships
FOR UPDATE
USING (
    owner_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'lider'
    AND app_auth.has_permission('mentorias', 'update')
)
WITH CHECK (
    owner_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'lider'
    AND app_auth.has_permission('mentorias', 'update')
);

DROP POLICY IF EXISTS mentor_offerings_read_policy ON app_mentoring.mentor_offerings;
CREATE POLICY mentor_offerings_read_policy ON app_mentoring.mentor_offerings
FOR SELECT
USING (app_auth.has_permission('mentorias', 'view'));

DROP POLICY IF EXISTS mentor_offerings_admin_gestor_all ON app_mentoring.mentor_offerings;
CREATE POLICY mentor_offerings_admin_gestor_all ON app_mentoring.mentor_offerings
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS mentor_offerings_owner_update ON app_mentoring.mentor_offerings;
CREATE POLICY mentor_offerings_owner_update ON app_mentoring.mentor_offerings
FOR UPDATE
USING (
    mentor_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'mentor'
    AND app_auth.has_permission('mentorias', 'update')
)
WITH CHECK (
    mentor_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'mentor'
    AND app_auth.has_permission('mentorias', 'update')
);

DROP POLICY IF EXISTS additional_orders_admin_gestor_all ON app_mentoring.additional_mentorship_orders;
CREATE POLICY additional_orders_admin_gestor_all ON app_mentoring.additional_mentorship_orders
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS additional_orders_owner_read ON app_mentoring.additional_mentorship_orders;
CREATE POLICY additional_orders_owner_read ON app_mentoring.additional_mentorship_orders
FOR SELECT
USING (
    app_auth.has_permission('mentorias', 'view')
    AND (
        owner_user_id = app_auth.current_user_id()
        OR mentor_user_id = app_auth.current_user_id()
    )
);

DROP POLICY IF EXISTS additional_orders_owner_insert ON app_mentoring.additional_mentorship_orders;
CREATE POLICY additional_orders_owner_insert ON app_mentoring.additional_mentorship_orders
FOR INSERT
WITH CHECK (
    owner_user_id = app_auth.current_user_id()
    AND app_auth.current_role() = 'lider'
    AND app_auth.has_permission('mentorias', 'create')
);

DROP POLICY IF EXISTS additional_orders_owner_update ON app_mentoring.additional_mentorship_orders;
CREATE POLICY additional_orders_owner_update ON app_mentoring.additional_mentorship_orders
FOR UPDATE
USING (
    app_auth.has_permission('mentorias', 'update')
    AND (
        owner_user_id = app_auth.current_user_id()
        OR mentor_user_id = app_auth.current_user_id()
    )
)
WITH CHECK (
    app_auth.has_permission('mentorias', 'update')
    AND (
        owner_user_id = app_auth.current_user_id()
        OR mentor_user_id = app_auth.current_user_id()
    )
);

DROP TRIGGER IF EXISTS trg_program_mentorship_templates_set_updated_at ON app_mentoring.program_mentorship_templates;
CREATE TRIGGER trg_program_mentorship_templates_set_updated_at
BEFORE UPDATE ON app_mentoring.program_mentorship_templates
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_program_mentorships_set_updated_at ON app_mentoring.user_program_mentorships;
CREATE TRIGGER trg_user_program_mentorships_set_updated_at
BEFORE UPDATE ON app_mentoring.user_program_mentorships
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_mentor_offerings_set_updated_at ON app_mentoring.mentor_offerings;
CREATE TRIGGER trg_mentor_offerings_set_updated_at
BEFORE UPDATE ON app_mentoring.mentor_offerings
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_additional_orders_set_updated_at ON app_mentoring.additional_mentorship_orders;
CREATE TRIGGER trg_additional_orders_set_updated_at
BEFORE UPDATE ON app_mentoring.additional_mentorship_orders
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

INSERT INTO app_mentoring.program_mentorship_templates (
    template_code,
    sequence_no,
    title,
    description,
    phase_code,
    workbook_code,
    suggested_week,
    default_duration_minutes
) VALUES
    ('m1', 1, 'Mentoría 01 · Creencias, identidad y pilares personales', 'Conversación para trabajar creencias fundacionales, identidad actual y pilares del liderazgo.', 'shine_within', 'wb1', 3, 60),
    ('m2', 2, 'Mentoría 02 · Gestión emocional y PDI estratégico', 'Espacio para revisar regulación emocional, foco y decisiones asociadas al PDI estratégico.', 'shine_within', 'wb2', 5, 60),
    ('m3', 3, 'Mentoría 03 · Propósito y valores no negociables', 'Sesión para aterrizar propósito ejecutivo y alinear decisiones con valores no negociables.', 'shine_within', 'wb3', 8, 60),
    ('m4', 4, 'Mentoría 04 · Narrativa profesional y Elevator Pitch', 'Mentoría de pulido narrativo para visibilidad, posicionamiento y pitch ejecutivo.', 'shine_out', 'wb4', 10, 60),
    ('m5', 5, 'Mentoría 05 · Comunicación ejecutiva estratégica', 'Sesión dedicada a comunicación ejecutiva, mensajes de influencia y conversaciones clave.', 'shine_out', 'wb5', 12, 60),
    ('m6', 6, 'Mentoría 06 · Lenguaje verbal y no verbal de impacto', 'Mentoría para fortalecer presencia, cuerpo, voz y credibilidad en contextos de alto impacto.', 'shine_out', 'wb6', 14, 60),
    ('m7', 7, 'Mentoría 07 · Mapeo del ecosistema estratégico', 'Espacio para leer el ecosistema relacional y activar decisiones más inteligentes de networking.', 'shine_up', 'wb7', 16, 60),
    ('m8', 8, 'Mentoría 08 · Pensamiento estratégico y toma de decisiones', 'Mentoría enfocada en criterio, priorización y decisiones estratégicas.', 'shine_up', 'wb8', 19, 60),
    ('m9', 9, 'Mentoría 09 · Latido de marca ejecutiva', 'Sesión para consolidar marca ejecutiva, visibilidad y coherencia de posicionamiento.', 'shine_beyond', 'wb9', 21, 60),
    ('m10', 10, 'Mentoría 10 · Visión estratégica personal', 'Conversación de cierre para proyectar visión, legado y próximos movimientos del liderazgo.', 'shine_beyond', 'wb10', 23, 60)
ON CONFLICT (template_code) DO UPDATE
SET
    sequence_no = EXCLUDED.sequence_no,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phase_code = EXCLUDED.phase_code,
    workbook_code = EXCLUDED.workbook_code,
    suggested_week = EXCLUDED.suggested_week,
    default_duration_minutes = EXCLUDED.default_duration_minutes,
    is_active = true,
    updated_at = now();

CREATE OR REPLACE FUNCTION app_mentoring.seed_program_mentorships_for_leader(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO app_mentoring.user_program_mentorships (owner_user_id, template_code)
    SELECT target_user_id, template_code
    FROM app_mentoring.program_mentorship_templates
    WHERE is_active = true
    ON CONFLICT (owner_user_id, template_code) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.seed_default_offerings_for_mentor(target_mentor_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO app_mentoring.mentor_offerings (
        mentor_user_id,
        offer_code,
        title,
        description,
        session_type,
        duration_minutes,
        price_amount,
        currency_code,
        sort_order
    )
    VALUES (
        target_mentor_user_id,
        'extra_1_1',
        'Sesión adicional 1:1',
        'Sesión adicional para profundizar retos puntuales del liderazgo y acelerar decisiones concretas.',
        'individual',
        60,
        0,
        'COP',
        1
    )
    ON CONFLICT (mentor_user_id, offer_code) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.handle_user_program_mentorship_seed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.primary_role = 'lider' THEN
        PERFORM app_mentoring.seed_program_mentorships_for_leader(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.handle_default_offering_seed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM app_mentoring.seed_default_offerings_for_mentor(NEW.mentor_user_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_program_mentorships_for_leader ON app_core.users;
CREATE TRIGGER trg_seed_program_mentorships_for_leader
AFTER INSERT ON app_core.users
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_program_mentorship_seed();

DROP TRIGGER IF EXISTS trg_seed_default_offerings_for_mentor ON app_mentoring.mentors;
CREATE TRIGGER trg_seed_default_offerings_for_mentor
AFTER INSERT ON app_mentoring.mentors
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_default_offering_seed();

INSERT INTO app_mentoring.user_program_mentorships (owner_user_id, template_code)
SELECT u.user_id, t.template_code
FROM app_core.users u
CROSS JOIN app_mentoring.program_mentorship_templates t
WHERE u.primary_role = 'lider'
  AND t.is_active = true
ON CONFLICT (owner_user_id, template_code) DO NOTHING;

INSERT INTO app_mentoring.mentor_offerings (
    mentor_user_id,
    offer_code,
    title,
    description,
    session_type,
    duration_minutes,
    price_amount,
    currency_code,
    sort_order
)
SELECT
    m.mentor_user_id,
    'extra_1_1',
    'Sesión adicional 1:1',
    'Sesión adicional para profundizar retos puntuales del liderazgo y acelerar decisiones concretas.',
    'individual',
    60,
    0,
    'COP',
    1
FROM app_mentoring.mentors m
ON CONFLICT (mentor_user_id, offer_code) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.program_mentorship_templates TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.user_program_mentorships TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.mentor_offerings TO app_runtime, app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_mentoring.additional_mentorship_orders TO app_runtime, app_admin;

GRANT SELECT ON app_mentoring.program_mentorship_templates TO app_gestor, app_mentor, app_lider;
GRANT SELECT, INSERT, UPDATE ON app_mentoring.user_program_mentorships TO app_gestor, app_lider;
GRANT SELECT, INSERT, UPDATE ON app_mentoring.mentor_offerings TO app_gestor, app_mentor, app_lider;
GRANT SELECT, INSERT, UPDATE ON app_mentoring.additional_mentorship_orders TO app_gestor, app_mentor, app_lider;

COMMIT;
