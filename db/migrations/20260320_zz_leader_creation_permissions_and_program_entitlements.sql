BEGIN;

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
VALUES (
    'gestor',
    'usuarios',
    true,
    true,
    true,
    false,
    false,
    false,
    false
)
ON CONFLICT (role_code, module_code) DO UPDATE
SET can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete,
    can_approve = EXCLUDED.can_approve,
    can_moderate = EXCLUDED.can_moderate,
    can_manage = EXCLUDED.can_manage;

CREATE OR REPLACE FUNCTION app_mentoring.user_has_program_access(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM app_core.users u
        LEFT JOIN app_core.user_profiles up
          ON up.user_id = u.user_id
        WHERE u.user_id = target_user_id
          AND u.primary_role = 'lider'
          AND u.is_active = true
          AND (
            up.plan_type IN ('premium', 'vip', 'empresa_elite')
            OR EXISTS (
                SELECT 1
                FROM app_billing.user_purchases purchase
                JOIN app_billing.product_catalog catalog
                  ON catalog.product_code = purchase.product_code
                WHERE purchase.user_id = u.user_id
                  AND purchase.status = 'active'
                  AND catalog.product_group = 'program'
            )
          )
    );
$$;

CREATE OR REPLACE FUNCTION app_mentoring.sync_program_mentorships_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF app_mentoring.user_has_program_access(target_user_id) THEN
        INSERT INTO app_mentoring.user_program_mentorships (owner_user_id, template_code)
        SELECT target_user_id, template_code
        FROM app_mentoring.program_mentorship_templates
        WHERE is_active = true
        ON CONFLICT (owner_user_id, template_code) DO NOTHING;
        RETURN;
    END IF;

    DELETE FROM app_mentoring.user_program_mentorships
    WHERE owner_user_id = target_user_id
      AND status = 'available'
      AND scheduled_session_id IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.seed_program_mentorships_for_leader(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM app_mentoring.sync_program_mentorships_for_user(target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.handle_user_program_mentorship_seed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM app_mentoring.sync_program_mentorships_for_user(NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.handle_user_profile_program_access_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM app_mentoring.sync_program_mentorships_for_user(NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app_mentoring.handle_user_purchase_program_access_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.product_code = 'program_4shine' THEN
        PERFORM app_mentoring.sync_program_mentorships_for_user(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_program_mentorships_for_leader ON app_core.users;
DROP TRIGGER IF EXISTS trg_sync_program_mentorships_on_user ON app_core.users;
CREATE TRIGGER trg_sync_program_mentorships_on_user
AFTER INSERT OR UPDATE OF primary_role, is_active ON app_core.users
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_program_mentorship_seed();

DROP TRIGGER IF EXISTS trg_sync_program_mentorships_on_profile ON app_core.user_profiles;
CREATE TRIGGER trg_sync_program_mentorships_on_profile
AFTER INSERT OR UPDATE OF plan_type ON app_core.user_profiles
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_profile_program_access_sync();

DROP TRIGGER IF EXISTS trg_sync_program_mentorships_on_purchase ON app_billing.user_purchases;
CREATE TRIGGER trg_sync_program_mentorships_on_purchase
AFTER INSERT OR UPDATE OF product_code, status ON app_billing.user_purchases
FOR EACH ROW
EXECUTE FUNCTION app_mentoring.handle_user_purchase_program_access_sync();

SELECT app_mentoring.sync_program_mentorships_for_user(u.user_id)
FROM app_core.users u
WHERE u.primary_role = 'lider';

COMMENT ON FUNCTION app_mentoring.user_has_program_access(uuid) IS 'Determina si un líder tiene acceso activo al programa por plan o compra comercial.';
COMMENT ON FUNCTION app_mentoring.sync_program_mentorships_for_user(uuid) IS 'Sincroniza las mentorías incluidas del programa según el acceso comercial real del usuario.';

COMMIT;
