-- ============================================================
-- Product Catalog admin management
-- ============================================================
-- Libera el CHECK del product_code para permitir packs/productos
-- nuevos administrables por admin/gestor desde el panel admin.
-- Aplica RLS escritura admin/gestor sobre app_billing.product_catalog.
-- ============================================================

BEGIN;

-- Drop the rigid CHECK constraint on product_code so admin/gestor
-- pueden crear nuevos productos sin tocar el schema.
ALTER TABLE app_billing.product_catalog
  DROP CONSTRAINT IF EXISTS product_catalog_product_code_check;

-- Reemplazar por validación de formato suave: snake_case 2-60 chars
ALTER TABLE app_billing.product_catalog
  ADD CONSTRAINT product_catalog_product_code_format
  CHECK (product_code ~ '^[a-z0-9_]+$'
         AND char_length(product_code) BETWEEN 2 AND 60);

-- Asegura presencia de is_system para proteger productos críticos
ALTER TABLE app_billing.product_catalog
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Marcar los productos sembrados originalmente como del sistema
UPDATE app_billing.product_catalog
  SET is_system = true
  WHERE product_code IN (
    'program_4shine',
    'discovery_4shine',
    'mentoring_pack_1',
    'mentoring_pack_3',
    'mentoring_pack_5'
  );

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
ALTER TABLE app_billing.product_catalog ENABLE ROW LEVEL SECURITY;

-- Lectura abierta (catálogo público de productos)
DROP POLICY IF EXISTS product_catalog_read  ON app_billing.product_catalog;
CREATE POLICY product_catalog_read ON app_billing.product_catalog
  FOR SELECT USING (true);

-- Escritura sólo admin/gestor
DROP POLICY IF EXISTS product_catalog_write ON app_billing.product_catalog;
CREATE POLICY product_catalog_write ON app_billing.product_catalog
  FOR ALL
  USING  (app_auth.current_role() IN ('admin', 'gestor'))
  WITH CHECK (app_auth.current_role() IN ('admin', 'gestor'));

GRANT SELECT, INSERT, UPDATE, DELETE ON app_billing.product_catalog TO app_runtime, app_admin;

COMMENT ON COLUMN app_billing.product_catalog.is_system IS
  'Indica si el producto es del catálogo base (no se puede eliminar; sí editar precio/descr).';

COMMIT;
