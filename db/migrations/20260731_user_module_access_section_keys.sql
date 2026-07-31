-- El acceso manual por usuario ahora también admite SECCIONES de módulo
-- (claves de feature del catálogo de planes), no solo módulos completos:
--   - mentorias_1on1        → Mentorías · 1:1 del programa
--   - mentorias_grupales    → Mentorías · Expertos en vivo
--   - aprendizaje_cursos    → Aprendizaje · Cursos
--   - aprendizaje_workbooks → Aprendizaje · Workbooks
--
-- Estas claves no existen en app_auth.modules, así que se retira el FK.
-- La validación de claves permitidas vive en el servicio
-- (setUserModuleAccess: módulos reales + lista blanca de secciones).

BEGIN;

ALTER TABLE app_auth.user_module_access
    DROP CONSTRAINT IF EXISTS user_module_access_module_code_fkey;

COMMENT ON COLUMN app_auth.user_module_access.module_code IS
'Módulo (app_auth.modules) o sección (feature key del catálogo de planes: mentorias_1on1, mentorias_grupales, aprendizaje_cursos, aprendizaje_workbooks).';

COMMIT;
