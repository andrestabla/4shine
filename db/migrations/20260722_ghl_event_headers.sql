-- Encabezados recibidos en cada webhook de GHL, para poder diagnosticar sin
-- adivinar. El caso que lo motivó: un evento fallaba por "firma inválida" y no
-- había forma de saber desde el panel si el encabezado no llegaba o si llegaba
-- con un valor equivocado — dos problemas con arreglos distintos.
--
-- Los valores sensibles (x-4shine-token, x-4shine-signature, authorization,
-- cookie) se redactan ANTES de guardarse: aquí solo queda constancia de que
-- llegaron y de su longitud, nunca su contenido.
ALTER TABLE app_billing.ghl_webhook_events
    ADD COLUMN IF NOT EXISTS headers jsonb;

COMMENT ON COLUMN app_billing.ghl_webhook_events.headers IS
    'Encabezados de la petición, con los valores sensibles ya redactados en la aplicación.';
