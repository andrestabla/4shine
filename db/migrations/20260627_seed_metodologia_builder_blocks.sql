-- Siembra la página "Metodología" del Site Builder con la composición completa
-- de bloques (réplica del contenido codificado, ahora editable).
--
-- Seguro: solo actualiza páginas NO personalizadas (sections con <= 1 bloque,
-- es decir, el hero de marcador original). NO activa use_builder: el sitio
-- público sigue mostrando la versión codificada hasta que el admin revise en el
-- builder y active "Usar builder" en los ajustes de la página.

UPDATE app_admin.site_pages
SET sections = '[
  {
    "blockId": "met-hero",
    "type": "hero",
    "isVisible": true,
    "props": {
      "layout": "left",
      "kicker": "Plataforma",
      "title": "La metodología 4Shine Platform",
      "subtitle": "Un programa de 24 semanas que integra diagnóstico, formación aplicada, mentoría experta y comunidad ejecutiva para generar resultados sostenibles.",
      "background": "dark",
      "height": "compact",
      "buttons": [
        { "label": "Ver planes y precios", "href": "/planes-precios", "variant": "solid", "color": "accent", "customColor": "#D4AF37", "shape": "brand", "size": "md" }
      ]
    }
  },
  {
    "blockId": "met-intro",
    "type": "cards",
    "isVisible": true,
    "props": {
      "kicker": "",
      "title": "Más que una plataforma. Un sistema de transformación.",
      "subtitle": "",
      "columns": "3",
      "style": "outline",
      "cardShape": "rounded",
      "showNumbers": true,
      "background": "light",
      "items": [
        { "icon": "chart", "title": "Diagnóstico", "description": "125 preguntas que miden tu nivel en los 4 pilares de liderazgo y definen tu punto de partida.", "detail": "", "color": "#5b2d8a", "href": "" },
        { "icon": "map", "title": "Ruta guiada", "description": "24 semanas con workbooks prácticos, contenido exclusivo y hitos claros por fase.", "detail": "", "color": "#1e5fa8", "href": "" },
        { "icon": "users", "title": "Acompañamiento", "description": "Advisors certificados que aceleran decisiones y consolidan hábitos reales.", "detail": "", "color": "#0e7a5a", "href": "" }
      ]
    }
  },
  {
    "blockId": "met-stats",
    "type": "stats",
    "isVisible": true,
    "props": {
      "background": "darker",
      "items": [
        { "value": "+1.000", "label": "Líderes activos" },
        { "value": "24", "label": "Semanas de programa" },
        { "value": "10", "label": "Workbooks exclusivos" },
        { "value": "+25", "label": "Advisors certificados" }
      ]
    }
  },
  {
    "blockId": "met-pillars",
    "type": "cards",
    "isVisible": true,
    "props": {
      "kicker": "",
      "title": "Cuatro dimensiones. Una transformación completa.",
      "subtitle": "Cada fase construye sobre la anterior. De adentro hacia afuera, de la identidad al impacto colectivo.",
      "columns": "4",
      "style": "color",
      "cardShape": "rounded",
      "showNumbers": true,
      "background": "surface",
      "items": [
        { "icon": "compass", "title": "Shine Within", "description": "Autoliderazgo, identidad y claridad personal para decidir con conciencia.", "detail": "Descubres quién eres como líder, qué valores te mueven y cómo decidir alineado con tu propósito.", "color": "#5b2d8a", "href": "" },
        { "icon": "message", "title": "Shine Out", "description": "Comunicación estratégica, presencia ejecutiva y narrativa de impacto.", "detail": "Articulas ideas con poder, influyes con autenticidad y proyectas una presencia ejecutiva real.", "color": "#1e5fa8", "href": "" },
        { "icon": "trending", "title": "Shine Up", "description": "Pensamiento estratégico, influencia y decisiones en contextos complejos.", "detail": "Elevas tu pensamiento, navegas la ambigüedad y ejerces influencia sin necesitar autoridad directa.", "color": "#0e7a5a", "href": "" },
        { "icon": "globe", "title": "Shine Beyond", "description": "Legado, expansión y liderazgo que transforma equipos y ecosistemas.", "detail": "Construyes equipos de alto desempeño, articulas un legado de impacto y multiplicas tu transformación.", "color": "#a8420e", "href": "" }
      ]
    }
  },
  {
    "blockId": "met-workbooks",
    "type": "phasedList",
    "isVisible": true,
    "props": {
      "kicker": "",
      "title": "10 guías de trabajo práctico, una por fase y momento.",
      "subtitle": "",
      "columns": "2",
      "background": "light",
      "items": [
        { "title": "Propósito y Visión", "meta": "Sem. 1-2", "tag": "Shine Within", "color": "#7c3aad" },
        { "title": "Mapa de Valores", "meta": "Sem. 3-4", "tag": "Shine Within", "color": "#7c3aad" },
        { "title": "Autoliderazgo Consciente", "meta": "Sem. 5-6", "tag": "Shine Within", "color": "#7c3aad" },
        { "title": "Comunicación Auténtica", "meta": "Sem. 7-8", "tag": "Shine Out", "color": "#2d7dd2" },
        { "title": "Presencia Ejecutiva", "meta": "Sem. 9-10", "tag": "Shine Out", "color": "#2d7dd2" },
        { "title": "Narrativa de Impacto", "meta": "Sem. 11-12", "tag": "Shine Out", "color": "#2d7dd2" },
        { "title": "Pensamiento Estratégico", "meta": "Sem. 13-15", "tag": "Shine Up", "color": "#15a37a" },
        { "title": "Influencia sin Autoridad", "meta": "Sem. 16-18", "tag": "Shine Up", "color": "#15a37a" },
        { "title": "Equipos de Alto Desempeño", "meta": "Sem. 19-21", "tag": "Shine Beyond", "color": "#d45a0f" },
        { "title": "Legado y Expansión", "meta": "Sem. 22-24", "tag": "Shine Beyond", "color": "#d45a0f" }
      ]
    }
  },
  {
    "blockId": "met-platform",
    "type": "featureGroups",
    "isVisible": true,
    "props": {
      "kicker": "",
      "title": "Todo lo que necesitas para crecer, en un solo lugar.",
      "subtitle": "Diagnóstico, ruta, contenido, mentoría y comunidad. Sin dispersión.",
      "background": "surface",
      "items": [
        {
          "title": "Contenido exclusivo",
          "summary": "Clases, masterclasses y material de apoyo diseñados para aplicar en tu realidad profesional inmediata.",
          "subItems": [
            { "title": "Video-clases por fase", "text": "Lecciones cortas y accionables alineadas a cada workbook." },
            { "title": "Masterclasses de Advisors", "text": "Sesiones de expertos sobre temas de liderazgo de alto impacto." },
            { "title": "Biblioteca de recursos", "text": "Lecturas, frameworks y herramientas curadas por especialistas." }
          ]
        },
        {
          "title": "Sesiones de mentoría con expertos",
          "summary": "Acompañamiento 1:1 y grupal con Advisors especializados que te ayudan a decidir con mayor claridad y velocidad.",
          "subItems": [
            { "title": "Advisor Guía", "text": "Acompañamiento continuo a lo largo de tu ruta: seguimiento semanal, retroalimentación y accountability." },
            { "title": "Advisor Experto", "text": "Sesiones focalizadas con especialistas según la fase que estés transitando en el programa." },
            { "title": "Estructura probada", "text": "Cada sesión tiene un marco de preparación, conversación y compromisos que aceleran el avance real." }
          ]
        },
        {
          "title": "Comunidad y Networking",
          "summary": "Una red de líderes con el mismo nivel de ambición y compromiso. Colaboración real, no solo contactos.",
          "subItems": [
            { "title": "Sesiones grupales en vivo", "text": "Encuentros semanales con el grupo del programa para compartir avances y desafíos reales." },
            { "title": "Workshops y convocatorias", "text": "Eventos de profundización, talleres temáticos y encuentros presenciales o virtuales." },
            { "title": "Red de líderes 4Shine", "text": "Acceso permanente a la comunidad: más de 1.000 líderes activos en distintas industrias." }
          ]
        }
      ]
    }
  },
  {
    "blockId": "met-testimonials",
    "type": "testimonials",
    "isVisible": true,
    "props": {
      "title": "Experiencias reales de transformación.",
      "columns": "3",
      "style": "border",
      "background": "dark",
      "items": [
        { "text": "En 12 semanas convertí mi visión en una ruta concreta. Mi equipo mejoró el foco y la coordinación de una manera que no creí posible.", "name": "Pablo R.", "role": "Director de Tecnología - LATAM", "avatarUrl": "", "color": "#5b2d8a" },
        { "text": "4Shine me enseñó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con claridad en alta incertidumbre.", "name": "Carolina M.", "role": "Directora Académica", "avatarUrl": "", "color": "#1e5fa8" },
        { "text": "Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna sin perder mi autenticidad.", "name": "Andrés V.", "role": "Gerente Comercial", "avatarUrl": "", "color": "#0e7a5a" }
      ]
    }
  },
  {
    "blockId": "met-cta",
    "type": "cta",
    "isVisible": true,
    "props": {
      "layout": "center",
      "title": "Empieza tu transformación hoy.",
      "body": "Comienza con el Diagnóstico Ejecutivo o únete a un programa completo.",
      "background": "darker",
      "buttons": [
        { "label": "Empezar con el Diagnóstico - $50 USD", "href": "/acceso?plan=diagnostico", "variant": "solid", "color": "accent", "customColor": "#D4AF37", "shape": "brand", "size": "md" },
        { "label": "Ver todos los programas", "href": "/planes-precios", "variant": "outline", "color": "white", "customColor": "#D4AF37", "shape": "brand", "size": "md" }
      ]
    }
  }
]'::jsonb,
    updated_at = now()
WHERE page_key = 'metodologia'
  AND COALESCE(jsonb_array_length(sections), 0) <= 1;
