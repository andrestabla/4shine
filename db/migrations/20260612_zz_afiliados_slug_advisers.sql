-- ============================================================
-- La página de afiliados pasa a vivir en /advisers.
-- Solo actualiza filas que aún conserven el slug original, para
-- respetar cambios posteriores hechos por el admin en el builder.
-- ============================================================

UPDATE app_admin.site_pages
SET slug = 'advisers', updated_at = now()
WHERE page_key = 'afiliados' AND slug = 'afiliados';
