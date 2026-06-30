-- Arregla ERR_TOO_MANY_REDIRECTS en /advisors.
--
-- La página del builder (page_key='afiliados') quedó con el slug viejo 'advisers'
-- tras el rename Adviser→Advisor. Con use_builder=true, /advisors detectaba que
-- el slug ('advisers') ≠ 'advisors' y redirigía a /advisers, que a su vez
-- redirige a /advisors → bucle infinito.
--
-- Solución: el slug debe ser 'advisors' (la ruta actual), así /advisors renderiza
-- el builder sin redirigir y /advisers sigue siendo el redirect 308 de compat.

UPDATE app_admin.site_pages
SET slug = 'advisors', updated_at = now()
WHERE page_key = 'afiliados'
  AND slug = 'advisers'
  AND NOT EXISTS (
    SELECT 1 FROM app_admin.site_pages other
    WHERE other.slug = 'advisors' AND other.page_key <> 'afiliados'
  );
