-- Enlace de pago / asesor por plan y por producto puntual.
-- Se usa como destino del botón "Comenzar" / "Comprar" en /planes-precios.
-- Opcional: si está vacío, el botón usa el flujo por defecto (/acceso?plan=...).

ALTER TABLE app_billing.subscription_plans
  ADD COLUMN IF NOT EXISTS checkout_url text;

ALTER TABLE app_billing.product_catalog
  ADD COLUMN IF NOT EXISTS checkout_url text;
