-- Ledger de migraciones aplicadas. Hasta ahora las migraciones se aplicaban a
-- mano SIN registro, así que no había forma de saber cuáles corrieron en prod
-- (se detectaba drift por existencia de objetos — ver scripts/db-apply-migration.mjs
-- --status). Esta tabla lo cierra: el runner registra cada migración aplicada y
-- salta las ya registradas.
--
-- Vive en app_admin como metadato operativo. No lleva RLS: solo la escribe el
-- rol de despliegue (el mismo que corre las migraciones); no la toca el runtime.
--
-- Idempotente.

CREATE SCHEMA IF NOT EXISTS app_admin;

CREATE TABLE IF NOT EXISTS app_admin.schema_migrations (
    filename      text PRIMARY KEY,
    checksum      text NOT NULL,               -- sha256 del contenido del .sql al aplicarse
    applied_at    timestamptz NOT NULL DEFAULT now(),
    applied_by    text NOT NULL DEFAULT current_user,
    execution_ms  integer
);

COMMENT ON TABLE app_admin.schema_migrations IS
    'Ledger de migraciones SQL aplicadas. Lo mantiene scripts/db-apply-migration.mjs.';
