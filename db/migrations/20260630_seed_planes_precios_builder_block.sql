-- Siembra la página 'planes_precios' del Site Builder con el bloque dinámico
-- "pricingMatrix" (Planes y precios), para que sea editable desde el builder.
-- El bloque toma los planes/productos de Administración → Planes (catálogo).
--
-- Seguro/idempotente: solo actúa si la página aún está vacía (0 secciones), para
-- no pisar trabajo del admin. NO activa use_builder: el sitio público sigue
-- mostrando el mismo contenido hasta que el admin active "Usar builder".

UPDATE app_admin.site_pages
SET sections = '[
  {
    "blockId": "blk_pricingmx1",
    "type": "pricingMatrix",
    "isVisible": true,
    "props": {
      "buttons": [],
      "background": "dark",
      "backgroundCustom": "#0D1B2A",
      "backgroundOpacity": 100,
      "gradientFrom": "#0D1B2A",
      "gradientTo": "#D4AF37",
      "gradientAngle": 135,
      "backgroundImageUrl": "",
      "overlayColor": "#0D1B2A",
      "overlayOpacity": 70,
      "textColor": "auto",
      "textColorCustom": "#FFFFFF",
      "titleColor": "auto",
      "titleColorCustom": "#FFFFFF",
      "titleSize": "lg",
      "paddingY": "normal",
      "contentWidth": "full",
      "kicker": "",
      "title": "Planes y precios",
      "subtitle": "Elige el acceso que mejor se ajusta a tu momento. Todos los caminos llevan a un pago seguro o a un asesor."
    }
  }
]'::jsonb,
    updated_at = now()
WHERE page_key = 'planes_precios'
  AND jsonb_array_length(sections) = 0;
