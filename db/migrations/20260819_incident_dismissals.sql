-- Cierre de casos del panel "Casos por solucionar".
--
-- Las incidencias no se guardan: se detectan en cada carga con consultas sobre
-- datos reales. Lo único que hace falta persistir es la DECISIÓN humana sobre
-- cada caso, para que un caso ya resuelto o descartado no vuelva a aparecer.
--
-- Se guarda por `incident_id` (la clave estable que arma cada detector, p. ej.
-- 'duplicado:<a>:<b>' o 'plan-vencido:<user>'), junto con un snapshot del
-- título: así la lista de casos cerrados se puede mostrar aunque el detector
-- ya no genere ese caso.
--
--   resolution = 'resuelto'   → se hizo el cambio que lo resolvía.
--   resolution = 'descartado' → no era un caso real (falso positivo).
--
-- Reabrir un caso es borrar su fila.
--
-- Idempotente.

BEGIN;

CREATE TABLE IF NOT EXISTS app_admin.incident_dismissals (
    incident_id   text        PRIMARY KEY,
    incident_type text        NOT NULL,
    title         text        NOT NULL,
    resolution    text        NOT NULL CHECK (resolution IN ('resuelto', 'descartado')),
    note          text,
    user_ids      uuid[]      NOT NULL DEFAULT '{}',
    closed_by     uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
    closed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_dismissals_closed_at
    ON app_admin.incident_dismissals (closed_at DESC);

COMMENT ON TABLE app_admin.incident_dismissals IS
    'Casos del centro de incidencias cerrados por un gestor o admin. Su presencia oculta el caso del panel; borrar la fila lo reabre.';
COMMENT ON COLUMN app_admin.incident_dismissals.incident_id IS
    'Clave estable del detector (src/features/incidencias/service.ts).';
COMMENT ON COLUMN app_admin.incident_dismissals.user_ids IS
    'Personas involucradas al momento del cierre, para filtrar la lista dentro de la ficha de un líder.';

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.incident_dismissals TO app_runtime, app_admin;

ALTER TABLE app_admin.incident_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin.incident_dismissals FORCE  ROW LEVEL SECURITY;

-- Quien puede ver el panel puede cerrar y reabrir casos: es la misma llave que
-- exige el servicio de incidencias (usuarios:view) y la acción es reversible.
DROP POLICY IF EXISTS incident_dismissals_all ON app_admin.incident_dismissals;
CREATE POLICY incident_dismissals_all ON app_admin.incident_dismissals
FOR ALL
TO PUBLIC
USING (app_auth.has_permission('usuarios', 'view'))
WITH CHECK (app_auth.has_permission('usuarios', 'view'));

COMMIT;
