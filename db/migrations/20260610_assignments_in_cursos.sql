-- Política: las tareas (content_type='assignment') solo se publican dentro
-- del contexto de un curso. Forzamos library_location='cursos' para todas.
-- El código (resolveLibraryLocation) ahora aplica esta regla automáticamente
-- en creación/edición; esta migración trae los datos existentes al estado
-- consistente.

UPDATE app_learning.content_items
SET library_location = 'cursos',
    updated_at = now()
WHERE content_type = 'assignment'
  AND library_location IS DISTINCT FROM 'cursos';
