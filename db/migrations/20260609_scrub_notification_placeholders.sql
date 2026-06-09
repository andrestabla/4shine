-- Data cleanup: limpiar notificaciones históricas que quedaron con placeholders
-- {{var}} literales (debido a un bug en renderTemplate que dejaba la variable
-- sin resolver cuando el dispatcher no la pasaba). Idempotente: la condición
-- WHERE evita tocar filas ya limpias.
--
-- A partir de la corrección de renderTemplate (commit en este mismo deploy),
-- los placeholders no resueltos se eliminan en runtime; este script normaliza
-- el historial existente para que el centro de notificaciones no muestre
-- "{{lider_nombre}} agendó una sesión..." al usuario.

UPDATE app_core.notifications
SET
    title = regexp_replace(
        regexp_replace(title, '\{\{\w+\}\}', '', 'g'),
        '[ \t]{2,}', ' ', 'g'
    ),
    message = regexp_replace(
        regexp_replace(message, '\{\{\w+\}\}', '', 'g'),
        '[ \t]{2,}', ' ', 'g'
    )
WHERE title ~ '\{\{\w+\}\}' OR message ~ '\{\{\w+\}\}';

-- Limpieza adicional de puntuación huérfana ("  ," "( )") en mensajes
UPDATE app_core.notifications
SET
    title = btrim(regexp_replace(regexp_replace(title, '\s+([,.;:!?])', '\1', 'g'), '\(\s*\)', '', 'g')),
    message = btrim(regexp_replace(regexp_replace(message, '\s+([,.;:!?])', '\1', 'g'), '\(\s*\)', '', 'g'))
WHERE title ~ '\s[,.;:!?]' OR message ~ '\s[,.;:!?]' OR title ~ '\(\s*\)' OR message ~ '\(\s*\)';
