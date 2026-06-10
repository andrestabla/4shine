-- Corrige recursos de cursos cuyo contentType era 'link' aunque su
-- linkedContentId apunta a una actividad o tarea (bug del normalizer en
-- src/features/content/service.ts que omitía 'activity' y 'assignment' en
-- la whitelist). El bug ya está fix en código, esta migración trae los datos
-- existentes al estado consistente.
--
-- Idempotente: si vuelve a correr no hace nada porque ya están correctos.
-- Usa un DO block + LOOP porque jsonb_set sobre la misma fila no compone en
-- un UPDATE multi-row (postgres solo aplica una vez por target row).

DO $$
DECLARE
  rec RECORD;
  rows_fixed int := 0;
  courses_touched int := 0;
  last_course uuid := NULL;
BEGIN
  FOR rec IN
    SELECT
      ci.content_id AS course_id,
      (mod_idx::int - 1) AS mod_idx,
      (res_idx::int - 1) AS res_idx,
      linked.content_type::text AS correct_type,
      res ->> 'contentType' AS current_type
    FROM app_learning.content_items ci,
         LATERAL jsonb_array_elements(ci.structure_payload->'modules')
           WITH ORDINALITY AS modules(mod, mod_idx),
         LATERAL jsonb_array_elements(modules.mod->'resources')
           WITH ORDINALITY AS resources(res, res_idx)
    JOIN app_learning.content_items linked
      ON linked.content_id::text = (res ->> 'linkedContentId')
    WHERE ci.content_type = 'scorm'
      AND (res ->> 'linkedContentId') IS NOT NULL
      AND linked.content_type IN ('activity', 'assignment')
      AND (res ->> 'contentType') IS DISTINCT FROM linked.content_type::text
    -- Orden estable: aplicamos los cambios desde el último índice hacia atrás
    -- para que los path siempre sigan apuntando al mismo resource (irrelevante
    -- en este caso porque solo cambiamos contentType, no reordenamos, pero
    -- es buena costumbre).
    ORDER BY ci.content_id, mod_idx, res_idx
  LOOP
    UPDATE app_learning.content_items
    SET structure_payload = jsonb_set(
      structure_payload,
      ARRAY['modules', rec.mod_idx::text, 'resources', rec.res_idx::text, 'contentType'],
      to_jsonb(rec.correct_type),
      true
    ),
    updated_at = now()
    WHERE content_id = rec.course_id;

    rows_fixed := rows_fixed + 1;
    IF rec.course_id IS DISTINCT FROM last_course THEN
      courses_touched := courses_touched + 1;
      last_course := rec.course_id;
    END IF;

    RAISE NOTICE 'fixed course=% mod=% res=% % -> %',
      rec.course_id, rec.mod_idx, rec.res_idx, rec.current_type, rec.correct_type;
  END LOOP;

  RAISE NOTICE 'Total: % resources fixed across % courses', rows_fixed, courses_touched;
END $$;
