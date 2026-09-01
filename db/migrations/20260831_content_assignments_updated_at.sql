-- `content_assignments` arrastra un trigger roto desde 20260609_assignments.sql:
-- ese archivo intentó crear una tabla homónima con otro diseño (que incluía
-- updated_at) pero, al usar CREATE TABLE IF NOT EXISTS, la tabla legacy quedó
-- intacta... y el trigger sí se instaló.
--
-- Resultado: trg_content_assignments_set_updated_at ejecuta set_updated_at()
-- BEFORE UPDATE sobre una tabla que NO tiene updated_at, así que cualquier
-- UPDATE de una asignación falla en tiempo de ejecución.
--
-- Se añade la columna en vez de borrar el trigger: la fecha de última
-- modificación es información útil para el seguimiento de la formación, y así
-- el trigger pasa a hacer exactamente lo que su nombre promete.

BEGIN;

ALTER TABLE app_learning.content_assignments
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Las filas existentes heredan su fecha de asignación, no la de esta migración.
UPDATE app_learning.content_assignments
SET updated_at = assigned_at
WHERE updated_at > assigned_at;

COMMIT;
