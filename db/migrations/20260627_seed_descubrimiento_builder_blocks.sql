-- Siembra la página "Descubrimiento" del Site Builder con la composición
-- completa de bloques (réplica del contenido codificado, ahora editable).
--
-- Seguro: solo actualiza páginas NO personalizadas (sections con <= 1 bloque).
-- NO activa use_builder: el sitio público sigue mostrando la versión codificada
-- hasta que el admin revise en el builder y active "Usar builder".

UPDATE app_admin.site_pages
SET sections = '[
  {
    "blockId": "desc-hero",
    "type": "hero",
    "isVisible": true,
    "props": {
      "layout": "left",
      "kicker": "Plataforma",
      "title": "Descubrimiento · Diagnóstico de liderazgo",
      "subtitle": "125 preguntas. 4 pilares. Análisis IA personalizado. Un informe ejecutivo que te muestra exactamente dónde estás hoy como líder.",
      "background": "dark",
      "height": "compact",
      "buttons": [
        { "label": "Activar diagnóstico · $50 USD", "href": "/acceso?plan=diagnostico", "variant": "solid", "color": "accent", "customColor": "#D4AF37", "shape": "brand", "size": "md" },
        { "label": "Ver metodología", "href": "/metodologia", "variant": "outline", "color": "white", "customColor": "#D4AF37", "shape": "brand", "size": "md" }
      ]
    }
  },
  {
    "blockId": "desc-stats",
    "type": "stats",
    "isVisible": true,
    "props": {
      "background": "darker",
      "items": [
        { "value": "125", "label": "Preguntas totales" },
        { "value": "4", "label": "Pilares evaluados" },
        { "value": "19", "label": "Escenarios SJT" },
        { "value": "35 min", "label": "Duración promedio" }
      ]
    }
  },
  {
    "blockId": "desc-objetivo",
    "type": "richText",
    "isVisible": true,
    "props": {
      "kicker": "Objetivo",
      "title": "Un mapa claro de dónde estás hoy.",
      "align": "left",
      "background": "light",
      "body": "Descubrimiento mide tu posicionamiento actual como líder en cuatro dimensiones complementarias. No es una evaluación de desempeño — es un diagnóstico de autoconocimiento ejecutivo que te da un punto de referencia sólido para orientar tu desarrollo con método.\n\nEl resultado identifica fortalezas consolidadas y las áreas con mayor potencial de impacto si las desarrollas intencionalmente."
    }
  },
  {
    "blockId": "desc-deliverables",
    "type": "features",
    "isVisible": true,
    "props": {
      "kicker": "",
      "title": "Lo que obtienes",
      "subtitle": "",
      "columns": "2",
      "align": "left",
      "iconStyle": "circle",
      "iconColor": "accent",
      "background": "surface",
      "items": [
        { "icon": "checkCircle", "title": "Índice global de liderazgo (0-100)", "description": "" },
        { "icon": "checkCircle", "title": "Score individual por cada uno de los 4 pilares", "description": "" },
        { "icon": "checkCircle", "title": "Ranking de las 16 competencias con gráfica visual", "description": "" },
        { "icon": "checkCircle", "title": "Análisis narrativo IA por pilar (5 lecturas)", "description": "" },
        { "icon": "checkCircle", "title": "Visión general integrada de tu perfil ejecutivo", "description": "" },
        { "icon": "checkCircle", "title": "Informe PDF descargable con lectura completa", "description": "" },
        { "icon": "checkCircle", "title": "Hoja de datos Excel para seguimiento en el tiempo", "description": "" }
      ]
    }
  },
  {
    "blockId": "desc-pillars",
    "type": "cards",
    "isVisible": true,
    "props": {
      "kicker": "Metodología 4Shine",
      "title": "Los 4 pilares del liderazgo.",
      "subtitle": "Cada pilar combina preguntas Likert con situaciones de juicio situacional (SJT) que revelan cómo actúas cuando hay presión, ambigüedad o decisiones difíciles.",
      "columns": "2",
      "style": "color",
      "cardShape": "rounded",
      "showNumbers": true,
      "background": "light",
      "items": [
        { "icon": "compass", "title": "Shine Within", "description": "El liderazgo que viene de adentro.", "detail": "Autoconocimiento, inteligencia emocional y gestión del estado interno.", "color": "#5b2d8a", "href": "" },
        { "icon": "message", "title": "Shine Out", "description": "La presencia que proyectas.", "detail": "Comunicación, influencia y construcción de relaciones.", "color": "#1e5fa0", "href": "" },
        { "icon": "trending", "title": "Shine Up", "description": "La visión que te orienta.", "detail": "Propósito, pensamiento estratégico y capacidad de decisión.", "color": "#7040b0", "href": "" },
        { "icon": "globe", "title": "Shine Beyond", "description": "El impacto que dejas.", "detail": "Desarrollo de equipos, cultura y trascendencia organizacional.", "color": "#a0306a", "href": "" }
      ]
    }
  },
  {
    "blockId": "desc-dual",
    "type": "cards",
    "isVisible": true,
    "props": {
      "kicker": "Metodología dual",
      "title": "Likert + SJT: más que lo que piensas, lo que haces.",
      "subtitle": "",
      "columns": "2",
      "style": "glass",
      "cardShape": "rounded",
      "showNumbers": false,
      "background": "dark",
      "items": [
        { "icon": "chart", "title": "Escala Likert · 107 ítems", "description": "Autopercepción cuantificable.", "detail": "Afirmaciones sobre comportamientos de liderazgo medidas en escala de frecuencia o acuerdo: una lectura numérica de cómo percibes tu propio desempeño.", "color": "#D4AF37", "href": "" },
        { "icon": "target", "title": "SJT · 19 situaciones", "description": "Criterio en condiciones reales.", "detail": "Escenarios con dilemas de liderazgo reales — ambigüedad, conflicto, presión. Tu elección de respuesta revela tu criterio aplicado, no solo tu intención.", "color": "#D4AF37", "href": "" }
      ]
    }
  },
  {
    "blockId": "desc-report",
    "type": "discoveryReport",
    "isVisible": true,
    "props": {
      "kicker": "Ejemplo del informe",
      "title": "Así luce tu resultado.",
      "subtitle": "Datos de ejemplo. Tu diagnóstico real generará scores propios con análisis IA personalizado.",
      "background": "light",
      "aiBadge": "Análisis IA · Shine Up",
      "aiLabel": "Ejemplo de lectura ejecutiva",
      "aiText": "Tu perfil muestra una orientación estratégica sólida — Shine Up es tu pilar más desarrollado, lo que indica claridad sobre hacia dónde vas y capacidad real para generar tracción en proyectos complejos. Esta fortaleza es un activo diferencial cuando necesitas articular visión o convencer stakeholders.\n\nShine Out es el área con mayor potencial de desarrollo: la brecha entre tu visión (Up, 81) y tu capacidad de comunicarla con impacto (Out, 58) es frecuente en líderes técnicos que han crecido por resultados más que por influencia directa. Desarrollar deliberadamente tu presencia ejecutiva y comunicación estratégica es la palanca de mayor retorno en esta etapa de tu carrera.",
      "disclaimer": "Este análisis es un ejemplo. El informe real se genera con IA a partir de tus respuestas específicas."
    }
  },
  {
    "blockId": "desc-features",
    "type": "cards",
    "isVisible": true,
    "props": {
      "kicker": "Características",
      "title": "Qué hace único a este diagnóstico.",
      "subtitle": "",
      "columns": "3",
      "style": "outline",
      "cardShape": "rounded",
      "showNumbers": true,
      "background": "surface",
      "items": [
        { "icon": "chart", "title": "Escala Likert", "description": "107 afirmaciones medidas en frecuencia o nivel de acuerdo para cuantificar autopercepción.", "detail": "", "color": "#1e5fa0", "href": "" },
        { "icon": "target", "title": "SJT · 19 situaciones", "description": "Escenarios de liderazgo bajo presión que revelan criterio aplicado, no solo intención.", "detail": "", "color": "#5b2d8a", "href": "" },
        { "icon": "brain", "title": "Análisis cualitativo IA", "description": "Cada pilar recibe una narrativa ejecutiva generada por IA con patrones, fortalezas y áreas de desarrollo.", "detail": "", "color": "#7040b0", "href": "" },
        { "icon": "lineChart", "title": "16 competencias medidas", "description": "Distribuidas en los 4 pilares. Cada una tiene score individual para un diagnóstico granular.", "detail": "", "color": "#0e7a5a", "href": "" },
        { "icon": "lock", "title": "Acceso permanente", "description": "Tu informe queda vinculado a tu cuenta. Puedes consultarlo en cualquier momento.", "detail": "", "color": "#a0306a", "href": "" },
        { "icon": "sparkles", "title": "Exportable", "description": "Descarga el informe en PDF y los datos de competencias en Excel para seguimiento futuro.", "detail": "", "color": "#a8420e", "href": "" }
      ]
    }
  },
  {
    "blockId": "desc-cta",
    "type": "cta",
    "isVisible": true,
    "props": {
      "layout": "center",
      "title": "Activa tu diagnóstico hoy.",
      "body": "Acceso inmediato. Tu informe queda vinculado a tu cuenta para consultarlo en cualquier momento. Una inversión puntual para entender exactamente dónde estás como líder.",
      "background": "darker",
      "buttons": [
        { "label": "Activar diagnóstico", "href": "/acceso?plan=diagnostico", "variant": "solid", "color": "accent", "customColor": "#D4AF37", "shape": "brand", "size": "md" },
        { "label": "Ver todos los planes", "href": "/planes-precios", "variant": "outline", "color": "white", "customColor": "#D4AF37", "shape": "brand", "size": "md" }
      ]
    }
  }
]'::jsonb,
    updated_at = now()
WHERE page_key = 'descubrimiento'
  AND COALESCE(jsonb_array_length(sections), 0) <= 1;
