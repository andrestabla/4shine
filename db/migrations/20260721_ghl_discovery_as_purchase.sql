-- El Diagnóstico 4Shine no es un plan: el comprador es un LÍDER sin suscripción
-- cuyo acceso a Descubrimiento viene de una compra puntual registrada en
-- app_billing.user_purchases (product_group='discovery').
--
-- Ese grant es "sticky": readAccessStateForActor lo respeta incluso después de
-- asignarle un plan, así que el diagnóstico no se pierde si luego compra un
-- programa. El rol 'invitado' que traía el seed inicial habría funcionado por
-- otra vía (el guard solo bloquea a 'lider'), pero obligaría a migrar el rol el
-- día que ese contacto compre el Círculo VIP.

ALTER TABLE app_billing.ghl_program_map
    ADD COLUMN IF NOT EXISTS product_code text;

COMMENT ON COLUMN app_billing.ghl_program_map.product_code IS
    'Solo para kind=''diagnostico'': producto de app_billing.product_catalog que se registra como compra puntual en lugar de asignar un plan.';

UPDATE app_billing.ghl_program_map
   SET role_override = 'lider',
       product_code  = 'discovery_4shine',
       duration_days = NULL,
       updated_at    = now()
 WHERE program_id = 'discovery_4shine';
