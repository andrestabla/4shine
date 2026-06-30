-- Tipo de destino del botón de cada plan/producto + texto de botón customizable.
--   checkout_type: 'payment' (centro de pagos, usa checkout_url tal cual)
--                  'whatsapp' (asesor; checkout_url guarda el número y el front
--                   arma el enlace wa.me con un mensaje predefinido).
--   cta_label: texto del botón en /planes-precios (si está vacío, usa el default).

ALTER TABLE app_billing.subscription_plans
  ADD COLUMN IF NOT EXISTS checkout_type text NOT NULL DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS cta_label text;

ALTER TABLE app_billing.product_catalog
  ADD COLUMN IF NOT EXISTS checkout_type text NOT NULL DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS cta_label text;
