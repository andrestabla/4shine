-- Provisiona el informe público (public_id + shared_at) para los diagnósticos
-- de Descubrimiento YA PRESENTADOS (status = 'results') que aún no lo tienen.
--
-- Motivo: en la vista 360 del líder, la sección "Resultados diagnóstico" muestra
-- "Ver informe del líder" solo cuando la sesión tiene public_id (deepLink al
-- informe compartido). Ese public_id solo se generaba cuando el líder pulsaba
-- compartir/descargar, así que líderes que completaron el diagnóstico pero nunca
-- lo compartieron (p. ej. Daniel Artico) no mostraban el botón. Ahora el informe
-- se provisiona al completar; este backfill cubre los que ya estaban completos.
--
-- Idempotente: COALESCE respeta los valores existentes.

BEGIN;

UPDATE app_assessment.discovery_sessions
SET public_id = COALESCE(
      public_id,
      lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
    ),
    shared_at = COALESCE(shared_at, now()),
    updated_at = now()
WHERE status = 'results'
  AND public_id IS NULL;

COMMIT;
