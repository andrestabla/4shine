-- Acceso a módulos por usuario + cupo manual de mentorías 1:1.
--
-- 1) app_auth.user_module_access: override por usuario y módulo.
--    - Fila con is_enabled=false → el módulo queda APAGADO para ese usuario
--      aunque su rol o plan lo permitan (se cierra API, menú y muro).
--    - Fila con is_enabled=true → el módulo queda ENCENDIDO para un líder
--      aunque su plan no lo incluya (no eleva permisos de rol: solo levanta
--      el gating por plan; el rol debe poder ver el módulo).
--    - Sin fila → comportamiento por defecto (rol + plan).
--
-- 2) user_profiles.mentorship_sessions_limit: cupo manual de sesiones 1:1
--    del programa. NULL = sin límite manual (todas las plantillas activas).
--    N = el usuario tiene acceso a las mentorías m1..mN. Si N > 0 y el líder
--    no tiene acceso por plan, el cupo actúa como concesión manual.
--
-- 3) sync_program_mentorships_for_user pasa a respetar ese cupo, de modo que
--    los triggers existentes (cambios de plan/perfil) no lo deshagan.

BEGIN;

CREATE TABLE IF NOT EXISTS app_auth.user_module_access (
    user_id uuid NOT NULL REFERENCES app_core.users(user_id) ON DELETE CASCADE,
    module_code text NOT NULL REFERENCES app_auth.modules(module_code) ON DELETE CASCADE,
    is_enabled boolean NOT NULL,
    updated_by uuid REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, module_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON app_auth.user_module_access TO app_runtime, app_admin;

ALTER TABLE app_core.user_profiles
    ADD COLUMN IF NOT EXISTS mentorship_sessions_limit integer;

ALTER TABLE app_core.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_mentorship_sessions_limit_check;

ALTER TABLE app_core.user_profiles
    ADD CONSTRAINT user_profiles_mentorship_sessions_limit_check
    CHECK (
        mentorship_sessions_limit IS NULL
        OR (mentorship_sessions_limit >= 0 AND mentorship_sessions_limit <= 50)
    );

CREATE OR REPLACE FUNCTION app_mentoring.sync_program_mentorships_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_limit integer;
BEGIN
    SELECT up.mentorship_sessions_limit
      INTO v_limit
      FROM app_core.user_profiles up
     WHERE up.user_id = target_user_id;

    IF app_mentoring.user_has_program_access(target_user_id) THEN
        INSERT INTO app_mentoring.user_program_mentorships (owner_user_id, template_code)
        SELECT target_user_id, t.template_code
        FROM app_mentoring.program_mentorship_templates t
        WHERE t.is_active = true
          AND (v_limit IS NULL OR t.sequence_no <= v_limit)
        ON CONFLICT (owner_user_id, template_code) DO NOTHING;

        IF v_limit IS NOT NULL THEN
            DELETE FROM app_mentoring.user_program_mentorships upm
            USING app_mentoring.program_mentorship_templates t
            WHERE upm.owner_user_id = target_user_id
              AND t.template_code = upm.template_code
              AND t.sequence_no > v_limit
              AND upm.status = 'available'
              AND upm.scheduled_session_id IS NULL;
        END IF;

        RETURN;
    END IF;

    -- Sin acceso por plan: si un admin/gestor fijó un cupo manual > 0, ese
    -- cupo es una concesión manual y manda.
    IF v_limit IS NOT NULL AND v_limit > 0 THEN
        INSERT INTO app_mentoring.user_program_mentorships (owner_user_id, template_code)
        SELECT target_user_id, t.template_code
        FROM app_mentoring.program_mentorship_templates t
        WHERE t.is_active = true
          AND t.sequence_no <= v_limit
        ON CONFLICT (owner_user_id, template_code) DO NOTHING;

        DELETE FROM app_mentoring.user_program_mentorships upm
        USING app_mentoring.program_mentorship_templates t
        WHERE upm.owner_user_id = target_user_id
          AND t.template_code = upm.template_code
          AND t.sequence_no > v_limit
          AND upm.status = 'available'
          AND upm.scheduled_session_id IS NULL;

        RETURN;
    END IF;

    -- Comportamiento histórico: sin acceso y sin cupo manual, se limpian las
    -- disponibles no agendadas.
    DELETE FROM app_mentoring.user_program_mentorships
    WHERE owner_user_id = target_user_id
      AND status = 'available'
      AND scheduled_session_id IS NULL;
END;
$$;

COMMENT ON TABLE app_auth.user_module_access IS
'Override por usuario del acceso a módulos: false = apagado manual (gana sobre rol/plan), true = encendido manual (levanta el gating por plan para líderes), sin fila = por defecto.';

COMMENT ON COLUMN app_core.user_profiles.mentorship_sessions_limit IS
'Cupo manual de mentorías 1:1 del programa (m1..mN). NULL = sin límite manual.';

COMMIT;
