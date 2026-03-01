BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app_auth;
CREATE SCHEMA IF NOT EXISTS app_core;
CREATE SCHEMA IF NOT EXISTS app_assessment;
CREATE SCHEMA IF NOT EXISTS app_learning;
CREATE SCHEMA IF NOT EXISTS app_mentoring;
CREATE SCHEMA IF NOT EXISTS app_networking;
CREATE SCHEMA IF NOT EXISTS app_admin;

-- =========================================================
-- CORE ENTITIES
-- =========================================================

CREATE TABLE IF NOT EXISTS app_core.organizations (
    organization_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    industry text,
    country_code char(2),
    city text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.users (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    display_name text NOT NULL,
    avatar_initial char(1),
    timezone text NOT NULL DEFAULT 'America/Bogota',
    primary_role text NOT NULL CHECK (primary_role IN ('lider', 'mentor', 'gestor', 'admin')),
    is_active boolean NOT NULL DEFAULT true,
    organization_id uuid REFERENCES app_core.organizations(organization_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_primary_role ON app_core.users(primary_role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON app_core.users(organization_id);

CREATE TABLE IF NOT EXISTS app_core.user_profiles (
    user_id uuid PRIMARY KEY REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    profession text,
    industry text,
    plan_type text CHECK (plan_type IN ('standard', 'premium', 'vip', 'empresa_elite')),
    seniority_level text CHECK (seniority_level IN ('senior', 'c_level', 'director', 'manager', 'vp')),
    bio text,
    location text,
    linkedin_url text,
    twitter_url text,
    website_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.interests (
    interest_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.user_interests (
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    interest_id uuid NOT NULL REFERENCES app_core.interests(interest_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS app_core.user_projects (
    project_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    project_role text,
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON app_core.user_projects(user_id);

CREATE TABLE IF NOT EXISTS app_core.cohorts (
    cohort_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_code text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'archived')),
    starts_at date,
    ends_at date,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS app_core.cohort_memberships (
    cohort_id uuid NOT NULL REFERENCES app_core.cohorts(cohort_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    role_code text NOT NULL CHECK (role_code IN ('lider', 'mentor', 'gestor', 'admin')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    left_at timestamptz,
    PRIMARY KEY (cohort_id, user_id),
    CHECK (left_at IS NULL OR left_at >= joined_at)
);

CREATE INDEX IF NOT EXISTS idx_cohort_memberships_user_id ON app_core.cohort_memberships(user_id);

CREATE TABLE IF NOT EXISTS app_core.challenges (
    challenge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    challenge_type text NOT NULL CHECK (challenge_type IN ('strategic', 'social', 'personal')),
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.user_challenges (
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES app_core.challenges(challenge_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    due_at date,
    completed_at timestamptz,
    PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON app_core.user_challenges(status);

CREATE TABLE IF NOT EXISTS app_core.trajectory_events (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    cohort_id uuid REFERENCES app_core.cohorts(cohort_id) ON DELETE SET NULL,
    title text NOT NULL,
    event_type text NOT NULL CHECK (event_type IN ('test', 'mentoria', 'milestone', 'challenge')),
    status text NOT NULL CHECK (status IN ('completed', 'current', 'locked', 'cancelled')),
    planned_at timestamptz,
    completed_at timestamptz,
    source_module text,
    source_ref_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trajectory_events_user_id ON app_core.trajectory_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_events_status ON app_core.trajectory_events(status);

CREATE TABLE IF NOT EXISTS app_core.notifications (
    notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    notification_type text NOT NULL CHECK (notification_type IN ('message', 'alert', 'success', 'info')),
    title text NOT NULL,
    message text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON app_core.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_core.quotes (
    quote_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_text text NOT NULL,
    author_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.news_updates (
    news_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text NOT NULL,
    summary text NOT NULL,
    content text,
    image_token text,
    likes_count integer NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    published_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_news_updates_published_at ON app_core.news_updates(published_at DESC);

-- =========================================================
-- AUTH / RBAC
-- =========================================================

CREATE TABLE IF NOT EXISTS app_auth.roles (
    role_code text PRIMARY KEY CHECK (role_code IN ('lider', 'mentor', 'gestor', 'admin')),
    role_name text NOT NULL UNIQUE,
    description text NOT NULL
);

INSERT INTO app_auth.roles (role_code, role_name, description)
VALUES
    ('lider', 'Lider', 'Usuario participante del programa de liderazgo.'),
    ('mentor', 'Mentor', 'Usuario que guía y acompaña a lideres.'),
    ('gestor', 'Gestor', 'Usuario que gestiona operacion, contenidos y mentorias.'),
    ('admin', 'Administrador', 'Usuario con control total de la plataforma.')
ON CONFLICT (role_code) DO UPDATE
SET role_name = EXCLUDED.role_name,
    description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS app_auth.user_roles (
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    role_code text NOT NULL REFERENCES app_auth.roles(role_code) ON DELETE CASCADE,
    is_default boolean NOT NULL DEFAULT false,
    assigned_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_default
    ON app_auth.user_roles(user_id)
    WHERE is_default;

CREATE TABLE IF NOT EXISTS app_auth.user_credentials (
    user_id uuid PRIMARY KEY REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    failed_attempts smallint NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until timestamptz,
    password_updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_auth.refresh_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    refresh_token_hash text NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id ON app_auth.refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires_at ON app_auth.refresh_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_active ON app_auth.refresh_sessions(user_id, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS app_auth.modules (
    module_code text PRIMARY KEY,
    module_name text NOT NULL,
    description text NOT NULL,
    is_core boolean NOT NULL DEFAULT false
);

INSERT INTO app_auth.modules (module_code, module_name, description, is_core)
VALUES
    ('dashboard', 'Dashboard', 'Panel principal por rol.', true),
    ('trayectoria', 'Trayectoria', 'Seguimiento de progreso y hitos de liderazgo.', true),
    ('aprendizaje', 'Aprendizaje', 'Cursos y contenido de aprendizaje.', true),
    ('metodologia', 'Metodologia', 'Recursos metodologicos del programa.', false),
    ('mentorias', 'Mentorias', 'Gestion de sesiones de mentoria.', true),
    ('networking', 'Networking', 'Conexiones profesionales y comunidad.', false),
    ('convocatorias', 'Convocatorias', 'Ofertas y convocatorias laborales.', false),
    ('mensajes', 'Mensajes', 'Chat y mensajeria entre usuarios.', true),
    ('workshops', 'Workshops', 'Talleres y eventos colaborativos.', false),
    ('perfil', 'Perfil', 'Perfil profesional del usuario.', true),
    ('lideres', 'Lideres', 'Gestion de lideres para mentores/gestores.', false),
    ('formacion_mentores', 'Formacion Mentores', 'Ruta de capacitacion para mentores.', false),
    ('gestion_formacion_mentores', 'Gestion Formacion Mentores', 'Asignacion y seguimiento de formacion de mentores.', false),
    ('usuarios', 'Gestion Usuarios', 'Administracion global de usuarios.', true),
    ('contenido', 'Gestion Contenido', 'Administracion global de contenidos.', true),
    ('analitica', 'Analitica', 'Analitica y reportes globales.', true)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    description = EXCLUDED.description,
    is_core = EXCLUDED.is_core;

CREATE TABLE IF NOT EXISTS app_auth.role_module_permissions (
    role_code text NOT NULL REFERENCES app_auth.roles(role_code) ON DELETE CASCADE,
    module_code text NOT NULL REFERENCES app_auth.modules(module_code) ON DELETE CASCADE,
    can_view boolean NOT NULL DEFAULT false,
    can_create boolean NOT NULL DEFAULT false,
    can_update boolean NOT NULL DEFAULT false,
    can_delete boolean NOT NULL DEFAULT false,
    can_approve boolean NOT NULL DEFAULT false,
    can_moderate boolean NOT NULL DEFAULT false,
    can_manage boolean NOT NULL DEFAULT false,
    PRIMARY KEY (role_code, module_code)
);

INSERT INTO app_auth.role_module_permissions (
    role_code,
    module_code,
    can_view,
    can_create,
    can_update,
    can_delete,
    can_approve,
    can_moderate,
    can_manage
)
VALUES
    -- LIDER
    ('lider', 'dashboard', true, false, false, false, false, false, false),
    ('lider', 'trayectoria', true, false, true, false, false, false, false),
    ('lider', 'aprendizaje', true, false, true, false, false, false, false),
    ('lider', 'metodologia', false, false, false, false, false, false, false),
    ('lider', 'mentorias', true, true, true, false, false, false, false),
    ('lider', 'networking', true, true, true, false, false, false, false),
    ('lider', 'convocatorias', true, true, true, false, false, false, false),
    ('lider', 'mensajes', true, true, true, true, false, false, false),
    ('lider', 'workshops', true, true, true, false, false, false, false),
    ('lider', 'perfil', true, false, true, false, false, false, false),
    ('lider', 'lideres', false, false, false, false, false, false, false),
    ('lider', 'formacion_mentores', false, false, false, false, false, false, false),
    ('lider', 'gestion_formacion_mentores', false, false, false, false, false, false, false),
    ('lider', 'usuarios', false, false, false, false, false, false, false),
    ('lider', 'contenido', false, false, false, false, false, false, false),
    ('lider', 'analitica', false, false, false, false, false, false, false),

    -- MENTOR
    ('mentor', 'dashboard', true, false, false, false, false, false, false),
    ('mentor', 'trayectoria', true, false, true, false, false, false, false),
    ('mentor', 'aprendizaje', true, true, true, false, false, false, false),
    ('mentor', 'metodologia', true, false, false, false, false, false, false),
    ('mentor', 'mentorias', true, true, true, false, false, false, false),
    ('mentor', 'networking', true, true, true, false, false, false, false),
    ('mentor', 'convocatorias', true, false, false, false, false, false, false),
    ('mentor', 'mensajes', true, true, true, true, false, false, false),
    ('mentor', 'workshops', true, true, true, false, false, false, false),
    ('mentor', 'perfil', true, false, true, false, false, false, false),
    ('mentor', 'lideres', true, false, true, false, false, false, false),
    ('mentor', 'formacion_mentores', true, true, true, false, false, false, false),
    ('mentor', 'gestion_formacion_mentores', false, false, false, false, false, false, false),
    ('mentor', 'usuarios', false, false, false, false, false, false, false),
    ('mentor', 'contenido', false, false, false, false, false, false, false),
    ('mentor', 'analitica', false, false, false, false, false, false, false),

    -- GESTOR
    ('gestor', 'dashboard', true, false, false, false, false, false, false),
    ('gestor', 'trayectoria', true, false, true, false, false, false, true),
    ('gestor', 'aprendizaje', true, true, true, true, true, false, true),
    ('gestor', 'metodologia', true, true, true, true, true, false, true),
    ('gestor', 'mentorias', true, true, true, true, true, false, true),
    ('gestor', 'networking', true, true, true, true, false, true, true),
    ('gestor', 'convocatorias', true, true, true, true, true, false, true),
    ('gestor', 'mensajes', true, true, true, true, false, true, false),
    ('gestor', 'workshops', true, true, true, true, true, true, true),
    ('gestor', 'perfil', true, false, true, false, false, false, false),
    ('gestor', 'lideres', true, true, true, true, false, false, true),
    ('gestor', 'formacion_mentores', true, true, true, true, false, false, true),
    ('gestor', 'gestion_formacion_mentores', true, true, true, true, true, false, true),
    ('gestor', 'usuarios', false, false, false, false, false, false, false),
    ('gestor', 'contenido', true, true, true, true, true, false, true),
    ('gestor', 'analitica', true, false, false, false, false, false, true),

    -- ADMIN
    ('admin', 'dashboard', true, true, true, true, true, true, true),
    ('admin', 'trayectoria', true, true, true, true, true, true, true),
    ('admin', 'aprendizaje', true, true, true, true, true, true, true),
    ('admin', 'metodologia', true, true, true, true, true, true, true),
    ('admin', 'mentorias', true, true, true, true, true, true, true),
    ('admin', 'networking', true, true, true, true, true, true, true),
    ('admin', 'convocatorias', true, true, true, true, true, true, true),
    ('admin', 'mensajes', true, true, true, true, true, true, true),
    ('admin', 'workshops', true, true, true, true, true, true, true),
    ('admin', 'perfil', true, true, true, true, true, true, true),
    ('admin', 'lideres', true, true, true, true, true, true, true),
    ('admin', 'formacion_mentores', true, true, true, true, true, true, true),
    ('admin', 'gestion_formacion_mentores', true, true, true, true, true, true, true),
    ('admin', 'usuarios', true, true, true, true, true, true, true),
    ('admin', 'contenido', true, true, true, true, true, true, true),
    ('admin', 'analitica', true, true, true, true, true, true, true)
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_approve = EXCLUDED.can_approve,
    can_moderate = EXCLUDED.can_moderate,
    can_manage = EXCLUDED.can_manage;

CREATE OR REPLACE FUNCTION app_auth.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_auth.current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app_auth.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT app_auth.current_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION app_auth.has_permission(p_module_code text, p_action text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        bool_or(
            CASE lower(p_action)
                WHEN 'view' THEN p.can_view
                WHEN 'create' THEN p.can_create
                WHEN 'update' THEN p.can_update
                WHEN 'delete' THEN p.can_delete
                WHEN 'approve' THEN p.can_approve
                WHEN 'moderate' THEN p.can_moderate
                WHEN 'manage' THEN p.can_manage
                ELSE false
            END
        ),
        false
    )
    FROM app_auth.role_module_permissions p
    WHERE p.role_code = app_auth.current_role()
      AND p.module_code = p_module_code;
$$;

CREATE OR REPLACE VIEW app_auth.v_role_permission_matrix AS
SELECT
    p.role_code,
    p.module_code,
    m.module_name,
    p.can_view,
    p.can_create,
    p.can_update,
    p.can_delete,
    p.can_approve,
    p.can_moderate,
    p.can_manage
FROM app_auth.role_module_permissions p
JOIN app_auth.modules m ON m.module_code = p.module_code;

-- =========================================================
-- ASSESSMENT MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_assessment.pillars (
    pillar_code text PRIMARY KEY CHECK (pillar_code IN ('shine_within', 'shine_out', 'shine_up', 'shine_beyond')),
    display_name text NOT NULL UNIQUE,
    sequence_no smallint NOT NULL UNIQUE CHECK (sequence_no > 0)
);

INSERT INTO app_assessment.pillars (pillar_code, display_name, sequence_no)
VALUES
    ('shine_within', 'Shine Within', 1),
    ('shine_out', 'Shine Out', 2),
    ('shine_up', 'Shine Up', 3),
    ('shine_beyond', 'Shine Beyond', 4)
ON CONFLICT (pillar_code) DO UPDATE
SET display_name = EXCLUDED.display_name,
    sequence_no = EXCLUDED.sequence_no;

CREATE TABLE IF NOT EXISTS app_assessment.tests (
    test_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code text NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    pillar_code text REFERENCES app_assessment.pillars(pillar_code) ON DELETE SET NULL,
    sequence_no smallint CHECK (sequence_no > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_assessment.test_attempts (
    attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES app_assessment.tests(test_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    overall_score numeric(5,2) CHECK (overall_score >= 0 AND overall_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON app_assessment.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON app_assessment.test_attempts(test_id);

CREATE TABLE IF NOT EXISTS app_assessment.test_attempt_scores (
    attempt_id uuid NOT NULL REFERENCES app_assessment.test_attempts(attempt_id) ON DELETE CASCADE,
    pillar_code text NOT NULL REFERENCES app_assessment.pillars(pillar_code) ON DELETE RESTRICT,
    score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    PRIMARY KEY (attempt_id, pillar_code)
);

-- =========================================================
-- LEARNING / CONTENT MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_learning.content_items (
    content_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scope text NOT NULL CHECK (scope IN ('aprendizaje', 'metodologia', 'formacion_mentores', 'formacion_lideres')),
    title text NOT NULL,
    description text,
    content_type text NOT NULL CHECK (content_type IN ('video', 'pdf', 'scorm', 'article', 'podcast', 'html', 'ppt')),
    category text NOT NULL,
    duration_minutes integer CHECK (duration_minutes > 0),
    duration_label text,
    url text,
    thumbnail_url text,
    author_user_id uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    author_name text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'rejected')),
    is_recommended boolean NOT NULL DEFAULT false,
    created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    approved_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    approved_at timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_scope ON app_learning.content_items(scope);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON app_learning.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_category ON app_learning.content_items(category);

CREATE TABLE IF NOT EXISTS app_learning.tags (
    tag_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS app_learning.content_tags (
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES app_learning.tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE IF NOT EXISTS app_learning.content_reviews (
    review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    reviewer_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_changes')),
    notes text,
    reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_reviews_content_id ON app_learning.content_reviews(content_id);

CREATE TABLE IF NOT EXISTS app_learning.content_comments (
    comment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    author_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    parent_comment_id uuid REFERENCES app_learning.content_comments(comment_id) ON DELETE CASCADE,
    comment_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON app_learning.content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_author_id ON app_learning.content_comments(author_user_id);

CREATE TABLE IF NOT EXISTS app_learning.content_likes (
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    liked_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (content_id, user_id)
);

CREATE TABLE IF NOT EXISTS app_learning.content_progress (
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    seen boolean NOT NULL DEFAULT false,
    started_at timestamptz,
    completed_at timestamptz,
    last_viewed_at timestamptz,
    PRIMARY KEY (content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_progress_user_id ON app_learning.content_progress(user_id);

CREATE TABLE IF NOT EXISTS app_learning.content_assignments (
    assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES app_learning.content_items(content_id) ON DELETE CASCADE,
    assignee_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    last_accessed_at timestamptz,
    completed_at timestamptz,
    UNIQUE (content_id, assignee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_assignments_assignee ON app_learning.content_assignments(assignee_user_id);

-- =========================================================
-- MENTORING MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_mentoring.mentors (
    mentor_user_id uuid PRIMARY KEY REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    specialty text,
    rating_avg numeric(3,2) CHECK (rating_avg >= 0 AND rating_avg <= 5),
    rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_mentoring.mentor_specialties (
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    pillar_code text NOT NULL REFERENCES app_assessment.pillars(pillar_code) ON DELETE RESTRICT,
    PRIMARY KEY (mentor_user_id, pillar_code)
);

CREATE TABLE IF NOT EXISTS app_mentoring.mentor_availability (
    availability_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    is_booked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at),
    UNIQUE (mentor_user_id, starts_at, ends_at)
);

CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor_starts ON app_mentoring.mentor_availability(mentor_user_id, starts_at);

CREATE TABLE IF NOT EXISTS app_mentoring.mentor_assignments (
    assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    mentee_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    notes text,
    UNIQUE (mentor_user_id, mentee_user_id, status),
    CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

CREATE INDEX IF NOT EXISTS idx_mentor_assignments_mentee_user_id ON app_mentoring.mentor_assignments(mentee_user_id);

CREATE TABLE IF NOT EXISTS app_mentoring.mentorship_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid REFERENCES app_mentoring.mentor_assignments(assignment_id) ON DELETE SET NULL,
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE RESTRICT,
    title text NOT NULL,
    description text,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    session_type text NOT NULL CHECK (session_type IN ('individual', 'grupal')),
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending_rating', 'pending_approval', 'no_show')),
    meeting_url text,
    created_by uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE RESTRICT,
    approved_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    approved_at timestamptz,
    cancellation_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor_start ON app_mentoring.mentorship_sessions(mentor_user_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_status ON app_mentoring.mentorship_sessions(status);

CREATE TABLE IF NOT EXISTS app_mentoring.session_participants (
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    participant_role text NOT NULL CHECK (participant_role IN ('mentor', 'mentee', 'guest')),
    attended boolean,
    joined_at timestamptz,
    left_at timestamptz,
    PRIMARY KEY (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON app_mentoring.session_participants(user_id);

CREATE TABLE IF NOT EXISTS app_mentoring.session_feedback (
    feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    rater_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    ratee_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    rating numeric(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, rater_user_id, ratee_user_id)
);

CREATE TABLE IF NOT EXISTS app_mentoring.session_private_notes (
    note_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES app_mentoring.mentorship_sessions(session_id) ON DELETE CASCADE,
    mentor_user_id uuid NOT NULL REFERENCES app_mentoring.mentors(mentor_user_id) ON DELETE CASCADE,
    note_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, mentor_user_id)
);

-- =========================================================
-- NETWORKING / COMMUNITY MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_networking.connections (
    connection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    addressee_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'blocked', 'rejected')),
    requested_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    CHECK (requester_user_id <> addressee_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_connections_pair
    ON app_networking.connections (
        LEAST(requester_user_id, addressee_user_id),
        GREATEST(requester_user_id, addressee_user_id)
    );

CREATE INDEX IF NOT EXISTS idx_connections_requester ON app_networking.connections(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON app_networking.connections(addressee_user_id);

CREATE TABLE IF NOT EXISTS app_networking.interest_groups (
    group_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    category text,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_networking.group_memberships (
    group_id uuid NOT NULL REFERENCES app_networking.interest_groups(group_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    membership_role text NOT NULL DEFAULT 'member' CHECK (membership_role IN ('owner', 'moderator', 'member')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON app_networking.group_memberships(user_id);

CREATE TABLE IF NOT EXISTS app_networking.job_posts (
    job_post_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    company_name text NOT NULL,
    organization_id uuid REFERENCES app_core.organizations(organization_id) ON DELETE SET NULL,
    location text,
    work_mode text CHECK (work_mode IN ('presencial', 'hibrido', 'remoto', 'voluntariado')),
    description text NOT NULL,
    posted_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    posted_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    CHECK (expires_at IS NULL OR expires_at > posted_at)
);

CREATE INDEX IF NOT EXISTS idx_job_posts_posted_at ON app_networking.job_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_active ON app_networking.job_posts(is_active);

CREATE TABLE IF NOT EXISTS app_networking.job_tags (
    tag_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS app_networking.job_post_tags (
    job_post_id uuid NOT NULL REFERENCES app_networking.job_posts(job_post_id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES app_networking.job_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (job_post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS app_networking.job_applications (
    application_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id uuid NOT NULL REFERENCES app_networking.job_posts(job_post_id) ON DELETE CASCADE,
    applicant_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    cover_letter text,
    status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn')),
    applied_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (job_post_id, applicant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON app_networking.job_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON app_networking.job_applications(status);

CREATE TABLE IF NOT EXISTS app_networking.chat_threads (
    thread_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type text NOT NULL CHECK (thread_type IN ('direct', 'group')),
    title text,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_networking.thread_participants (
    thread_id uuid NOT NULL REFERENCES app_networking.chat_threads(thread_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    last_read_at timestamptz,
    PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_participants_user_id ON app_networking.thread_participants(user_id);

CREATE TABLE IF NOT EXISTS app_networking.messages (
    message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES app_networking.chat_threads(thread_id) ON DELETE CASCADE,
    sender_user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    message_text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    edited_at timestamptz,
    deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON app_networking.messages(thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app_networking.workshops (
    workshop_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    workshop_type text NOT NULL CHECK (workshop_type IN ('relacionamiento', 'formacion', 'innovacion', 'wellbeing', 'otro')),
    status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    facilitator_user_id uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    facilitator_name text,
    meeting_url text,
    created_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_workshops_starts_at ON app_networking.workshops(starts_at);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON app_networking.workshops(status);

CREATE TABLE IF NOT EXISTS app_networking.workshop_attendees (
    workshop_id uuid NOT NULL REFERENCES app_networking.workshops(workshop_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    attendance_status text NOT NULL DEFAULT 'registered' CHECK (attendance_status IN ('invited', 'registered', 'attended', 'no_show', 'cancelled')),
    registered_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (workshop_id, user_id)
);

-- =========================================================
-- AUDIT / ADMIN MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS app_admin.audit_logs (
    audit_id bigserial PRIMARY KEY,
    actor_user_id uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    action text NOT NULL,
    module_code text REFERENCES app_auth.modules(module_code) ON DELETE SET NULL,
    entity_table text NOT NULL,
    entity_id uuid,
    change_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON app_admin.audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON app_admin.audit_logs(actor_user_id);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION app_core.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_set_updated_at ON app_core.organizations;
CREATE TRIGGER trg_organizations_set_updated_at
BEFORE UPDATE ON app_core.organizations
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON app_core.users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON app_core.users
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_set_updated_at ON app_core.user_profiles;
CREATE TRIGGER trg_user_profiles_set_updated_at
BEFORE UPDATE ON app_core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_projects_set_updated_at ON app_core.user_projects;
CREATE TRIGGER trg_user_projects_set_updated_at
BEFORE UPDATE ON app_core.user_projects
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_cohorts_set_updated_at ON app_core.cohorts;
CREATE TRIGGER trg_cohorts_set_updated_at
BEFORE UPDATE ON app_core.cohorts
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_challenges_set_updated_at ON app_core.challenges;
CREATE TRIGGER trg_challenges_set_updated_at
BEFORE UPDATE ON app_core.challenges
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_tests_set_updated_at ON app_assessment.tests;
CREATE TRIGGER trg_tests_set_updated_at
BEFORE UPDATE ON app_assessment.tests
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_credentials_set_updated_at ON app_auth.user_credentials;
CREATE TRIGGER trg_user_credentials_set_updated_at
BEFORE UPDATE ON app_auth.user_credentials
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_content_items_set_updated_at ON app_learning.content_items;
CREATE TRIGGER trg_content_items_set_updated_at
BEFORE UPDATE ON app_learning.content_items
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_content_comments_set_updated_at ON app_learning.content_comments;
CREATE TRIGGER trg_content_comments_set_updated_at
BEFORE UPDATE ON app_learning.content_comments
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_mentors_set_updated_at ON app_mentoring.mentors;
CREATE TRIGGER trg_mentors_set_updated_at
BEFORE UPDATE ON app_mentoring.mentors
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_mentorship_sessions_set_updated_at ON app_mentoring.mentorship_sessions;
CREATE TRIGGER trg_mentorship_sessions_set_updated_at
BEFORE UPDATE ON app_mentoring.mentorship_sessions
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_session_private_notes_set_updated_at ON app_mentoring.session_private_notes;
CREATE TRIGGER trg_session_private_notes_set_updated_at
BEFORE UPDATE ON app_mentoring.session_private_notes
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_interest_groups_set_updated_at ON app_networking.interest_groups;
CREATE TRIGGER trg_interest_groups_set_updated_at
BEFORE UPDATE ON app_networking.interest_groups
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_job_applications_set_updated_at ON app_networking.job_applications;
CREATE TRIGGER trg_job_applications_set_updated_at
BEFORE UPDATE ON app_networking.job_applications
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

DROP TRIGGER IF EXISTS trg_workshops_set_updated_at ON app_networking.workshops;
CREATE TRIGGER trg_workshops_set_updated_at
BEFORE UPDATE ON app_networking.workshops
FOR EACH ROW
EXECUTE FUNCTION app_core.set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY POLICIES (KEY TABLES)
-- =========================================================

ALTER TABLE app_core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_learning.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_mentoring.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_networking.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_networking.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_core.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_admin_all ON app_core.users;
CREATE POLICY users_admin_all ON app_core.users
FOR ALL
USING (app_auth.is_admin())
WITH CHECK (app_auth.is_admin());

DROP POLICY IF EXISTS users_self_read ON app_core.users;
CREATE POLICY users_self_read ON app_core.users
FOR SELECT
USING (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS users_role_based_read ON app_core.users;
CREATE POLICY users_role_based_read ON app_core.users
FOR SELECT
USING (
    app_auth.current_role() IN ('admin', 'gestor')
    OR app_auth.has_permission('usuarios', 'view')
    OR app_auth.has_permission('lideres', 'view')
    OR app_auth.has_permission('networking', 'view')
    OR app_auth.has_permission('mensajes', 'view')
);

DROP POLICY IF EXISTS users_self_update ON app_core.users;
CREATE POLICY users_self_update ON app_core.users
FOR UPDATE
USING (user_id = app_auth.current_user_id())
WITH CHECK (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS profiles_admin_all ON app_core.user_profiles;
CREATE POLICY profiles_admin_all ON app_core.user_profiles
FOR ALL
USING (app_auth.is_admin())
WITH CHECK (app_auth.is_admin());

DROP POLICY IF EXISTS profiles_self_all ON app_core.user_profiles;
CREATE POLICY profiles_self_all ON app_core.user_profiles
FOR ALL
USING (user_id = app_auth.current_user_id())
WITH CHECK (user_id = app_auth.current_user_id());

DROP POLICY IF EXISTS profiles_role_based_read ON app_core.user_profiles;
CREATE POLICY profiles_role_based_read ON app_core.user_profiles
FOR SELECT
USING (
    app_auth.current_role() IN ('admin', 'gestor')
    OR app_auth.has_permission('usuarios', 'view')
    OR app_auth.has_permission('lideres', 'view')
    OR app_auth.has_permission('networking', 'view')
    OR app_auth.has_permission('mensajes', 'view')
);

DROP POLICY IF EXISTS content_admin_gestor_all ON app_learning.content_items;
CREATE POLICY content_admin_gestor_all ON app_learning.content_items
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS content_published_read ON app_learning.content_items;
CREATE POLICY content_published_read ON app_learning.content_items
FOR SELECT
USING (
    status = 'published'
    AND (
        app_auth.has_permission('aprendizaje', 'view')
        OR app_auth.has_permission('metodologia', 'view')
        OR app_auth.has_permission('formacion_mentores', 'view')
    )
);

DROP POLICY IF EXISTS content_creator_manage ON app_learning.content_items;
DROP POLICY IF EXISTS content_creator_read ON app_learning.content_items;
DROP POLICY IF EXISTS content_creator_insert ON app_learning.content_items;
DROP POLICY IF EXISTS content_creator_update ON app_learning.content_items;
DROP POLICY IF EXISTS content_creator_delete ON app_learning.content_items;

CREATE POLICY content_creator_read ON app_learning.content_items
FOR SELECT
USING (created_by = app_auth.current_user_id());

CREATE POLICY content_creator_insert ON app_learning.content_items
FOR INSERT
WITH CHECK (
    created_by = app_auth.current_user_id()
    AND (
        (scope = 'aprendizaje' AND app_auth.has_permission('aprendizaje', 'create'))
        OR (scope = 'metodologia' AND app_auth.has_permission('metodologia', 'create'))
        OR (scope = 'formacion_mentores' AND app_auth.has_permission('formacion_mentores', 'create'))
        OR (scope = 'formacion_lideres' AND app_auth.has_permission('contenido', 'create'))
    )
);

CREATE POLICY content_creator_update ON app_learning.content_items
FOR UPDATE
USING (created_by = app_auth.current_user_id())
WITH CHECK (
    created_by = app_auth.current_user_id()
    AND (
        (scope = 'aprendizaje' AND app_auth.has_permission('aprendizaje', 'update'))
        OR (scope = 'metodologia' AND app_auth.has_permission('metodologia', 'update'))
        OR (scope = 'formacion_mentores' AND app_auth.has_permission('formacion_mentores', 'update'))
        OR (scope = 'formacion_lideres' AND app_auth.has_permission('contenido', 'update'))
    )
);

CREATE POLICY content_creator_delete ON app_learning.content_items
FOR DELETE
USING (
    created_by = app_auth.current_user_id()
    AND (
        (scope = 'aprendizaje' AND app_auth.has_permission('aprendizaje', 'delete'))
        OR (scope = 'metodologia' AND app_auth.has_permission('metodologia', 'delete'))
        OR (scope = 'formacion_mentores' AND app_auth.has_permission('formacion_mentores', 'delete'))
        OR (scope = 'formacion_lideres' AND app_auth.has_permission('contenido', 'delete'))
    )
);

DROP POLICY IF EXISTS mentorship_admin_gestor_all ON app_mentoring.mentorship_sessions;
CREATE POLICY mentorship_admin_gestor_all ON app_mentoring.mentorship_sessions
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS mentorship_participants_read ON app_mentoring.mentorship_sessions;
CREATE POLICY mentorship_participants_read ON app_mentoring.mentorship_sessions
FOR SELECT
USING (
    app_auth.has_permission('mentorias', 'view')
    AND (
        mentor_user_id = app_auth.current_user_id()
    OR EXISTS (
        SELECT 1
        FROM app_mentoring.session_participants sp
        WHERE sp.session_id = mentorship_sessions.session_id
          AND sp.user_id = app_auth.current_user_id()
    )
    )
);

DROP POLICY IF EXISTS mentorship_mentor_update ON app_mentoring.mentorship_sessions;
CREATE POLICY mentorship_mentor_update ON app_mentoring.mentorship_sessions
FOR UPDATE
USING (
    mentor_user_id = app_auth.current_user_id()
    AND app_auth.has_permission('mentorias', 'update')
)
WITH CHECK (
    mentor_user_id = app_auth.current_user_id()
    AND app_auth.has_permission('mentorias', 'update')
);

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
    )
);

DROP POLICY IF EXISTS chat_thread_admin_gestor_all ON app_networking.chat_threads;
CREATE POLICY chat_thread_admin_gestor_all ON app_networking.chat_threads
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS chat_thread_participant_read ON app_networking.chat_threads;
CREATE POLICY chat_thread_participant_read ON app_networking.chat_threads
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM app_networking.thread_participants tp
        WHERE tp.thread_id = chat_threads.thread_id
          AND tp.user_id = app_auth.current_user_id()
    )
);

DROP POLICY IF EXISTS chat_thread_create ON app_networking.chat_threads;
CREATE POLICY chat_thread_create ON app_networking.chat_threads
FOR INSERT
WITH CHECK (app_auth.has_permission('mensajes', 'create'));

DROP POLICY IF EXISTS messages_participant_read ON app_networking.messages;
CREATE POLICY messages_participant_read ON app_networking.messages
FOR SELECT
USING (
    app_auth.has_permission('mensajes', 'view')
    AND EXISTS (
        SELECT 1
        FROM app_networking.thread_participants tp
        WHERE tp.thread_id = messages.thread_id
          AND tp.user_id = app_auth.current_user_id()
    )
);

DROP POLICY IF EXISTS messages_admin_gestor_all ON app_networking.messages;
CREATE POLICY messages_admin_gestor_all ON app_networking.messages
FOR ALL
USING (app_auth.current_role() IN ('admin', 'gestor'))
WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

DROP POLICY IF EXISTS messages_participant_create ON app_networking.messages;
CREATE POLICY messages_participant_create ON app_networking.messages
FOR INSERT
WITH CHECK (
    sender_user_id = app_auth.current_user_id()
    AND EXISTS (
        SELECT 1
        FROM app_networking.thread_participants tp
        WHERE tp.thread_id = messages.thread_id
          AND tp.user_id = app_auth.current_user_id()
    )
    AND app_auth.has_permission('mensajes', 'create')
);

DROP POLICY IF EXISTS notifications_admin_all ON app_core.notifications;
CREATE POLICY notifications_admin_all ON app_core.notifications
FOR ALL
USING (app_auth.is_admin())
WITH CHECK (app_auth.is_admin());

DROP POLICY IF EXISTS notifications_owner_access ON app_core.notifications;
CREATE POLICY notifications_owner_access ON app_core.notifications
FOR ALL
USING (user_id = app_auth.current_user_id())
WITH CHECK (user_id = app_auth.current_user_id());

-- =========================================================
-- DATABASE ROLES + GRANTS (OPTIONAL APP RUNTIME ROLES)
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_lider') THEN
        CREATE ROLE app_lider NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_mentor') THEN
        CREATE ROLE app_mentor NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_gestor') THEN
        CREATE ROLE app_gestor NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
        CREATE ROLE app_admin NOLOGIN;
    END IF;
END
$$;

REVOKE ALL ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin FROM PUBLIC;

GRANT USAGE ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking, app_admin TO app_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_admin TO app_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_auth, app_core TO app_admin;

GRANT USAGE ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_gestor;
GRANT SELECT ON ALL TABLES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_gestor;
GRANT INSERT, UPDATE, DELETE ON
    app_learning.content_items,
    app_learning.content_tags,
    app_learning.content_reviews,
    app_learning.content_comments,
    app_learning.content_likes,
    app_learning.content_assignments,
    app_mentoring.mentorship_sessions,
    app_mentoring.session_participants,
    app_mentoring.session_feedback,
    app_mentoring.session_private_notes,
    app_networking.connections,
    app_networking.interest_groups,
    app_networking.group_memberships,
    app_networking.job_posts,
    app_networking.job_post_tags,
    app_networking.job_applications,
    app_networking.chat_threads,
    app_networking.thread_participants,
    app_networking.messages,
    app_networking.workshops,
    app_networking.workshop_attendees,
    app_core.trajectory_events,
    app_core.notifications
TO app_gestor;
GRANT EXECUTE ON FUNCTION app_auth.has_permission(text, text) TO app_gestor;

GRANT USAGE ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_mentor;
GRANT SELECT ON ALL TABLES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_mentor;
GRANT INSERT, UPDATE ON
    app_core.user_profiles,
    app_learning.content_comments,
    app_learning.content_likes,
    app_learning.content_progress,
    app_learning.content_assignments,
    app_mentoring.mentorship_sessions,
    app_mentoring.session_participants,
    app_mentoring.session_feedback,
    app_mentoring.session_private_notes,
    app_networking.connections,
    app_networking.chat_threads,
    app_networking.thread_participants,
    app_networking.messages,
    app_networking.workshop_attendees,
    app_networking.group_memberships,
    app_core.notifications
TO app_mentor;
GRANT EXECUTE ON FUNCTION app_auth.has_permission(text, text) TO app_mentor;

GRANT USAGE ON SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_lider;
GRANT SELECT ON ALL TABLES IN SCHEMA app_auth, app_core, app_assessment, app_learning, app_mentoring, app_networking TO app_lider;
GRANT INSERT, UPDATE ON
    app_core.user_profiles,
    app_learning.content_comments,
    app_learning.content_likes,
    app_learning.content_progress,
    app_mentoring.session_feedback,
    app_networking.connections,
    app_networking.job_applications,
    app_networking.chat_threads,
    app_networking.thread_participants,
    app_networking.messages,
    app_networking.workshop_attendees,
    app_networking.group_memberships,
    app_core.notifications
TO app_lider;
GRANT EXECUTE ON FUNCTION app_auth.has_permission(text, text) TO app_lider;

COMMIT;
