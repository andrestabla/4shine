-- ============================================================
-- Site Builder: gestión de páginas públicas por bloques
-- ============================================================

CREATE TABLE IF NOT EXISTS app_admin.site_pages (
  page_id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES app_core.organizations(organization_id) ON DELETE CASCADE,

  -- Identidad
  page_key         text        NOT NULL CHECK (page_key ~ '^[a-z0-9_-]{1,64}$'),
  title            text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  slug             text        NOT NULL CHECK (slug = '' OR slug ~ '^[a-z0-9-]{1,80}$'),

  -- Navegación
  nav_label        text        NOT NULL DEFAULT '',
  show_in_nav      boolean     NOT NULL DEFAULT true,
  nav_order        integer     NOT NULL DEFAULT 100,

  -- Estado
  is_visible       boolean     NOT NULL DEFAULT true,
  is_system        boolean     NOT NULL DEFAULT false,  -- páginas base de la plataforma, no se pueden eliminar
  use_builder      boolean     NOT NULL DEFAULT true,   -- en páginas de sistema: false = render con la versión codificada

  -- Contenido por bloques
  sections         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  seo              jsonb       NOT NULL DEFAULT '{}'::jsonb,

  created_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  updated_by       uuid        REFERENCES app_core.users(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE(organization_id, page_key),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_site_pages_org ON app_admin.site_pages(organization_id, nav_order);
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON app_admin.site_pages(organization_id, slug);

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
ALTER TABLE app_admin.site_pages ENABLE ROW LEVEL SECURITY;

-- El contenido es público: cualquiera puede leer (el sitio se renderiza sin sesión)
DROP POLICY IF EXISTS site_pages_public_read ON app_admin.site_pages;
CREATE POLICY site_pages_public_read ON app_admin.site_pages
  FOR SELECT
  USING (true);

-- Solo admin gestiona
DROP POLICY IF EXISTS site_pages_admin_write ON app_admin.site_pages;
CREATE POLICY site_pages_admin_write ON app_admin.site_pages
  FOR ALL
  USING  (app_auth.current_role() = 'admin')
  WITH CHECK (app_auth.current_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON app_admin.site_pages TO app_runtime;

-- --------------------------------------------------------
-- Seed: páginas de sistema (visibilidad heredada del toggle previo
-- guardado en integration_configs / site_pages)
-- --------------------------------------------------------
INSERT INTO app_admin.site_pages
  (organization_id, page_key, title, slug, nav_label, show_in_nav, nav_order, is_visible, is_system, use_builder, sections)
SELECT
  o.organization_id,
  p.page_key,
  p.title,
  p.slug,
  p.nav_label,
  p.show_in_nav,
  p.nav_order,
  COALESCE((ic.wizard_data->'pages'->>p.page_key)::boolean, true),
  true,
  false,
  p.sections::jsonb
FROM app_core.organizations o
CROSS JOIN (
  VALUES
    ('home', 'Home', '', 'Home', false, 0, $home$
      [
        {
          "blockId": "seed-home-hero",
          "type": "hero",
          "isVisible": true,
          "props": {
            "kicker": "Plataforma de liderazgo",
            "title": "Transforma tu liderazgo con método, mentoría y resultados medibles.",
            "subtitle": "4Shine Platform existe para acelerar el desarrollo de líderes que necesitan elevar su impacto personal, profesional y estratégico con una ruta estructurada de 6 meses.",
            "align": "left",
            "background": "dark",
            "backgroundImageUrl": "",
            "backgroundVideoUrl": "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/4shine/International_Team_1920x1080.mp4",
            "primaryLabel": "Conocer metodología",
            "primaryHref": "/metodologia",
            "secondaryLabel": "Ver planes",
            "secondaryHref": "/planes-precios",
            "compact": false
          }
        },
        {
          "blockId": "seed-home-stats",
          "type": "stats",
          "isVisible": true,
          "props": {
            "background": "darker",
            "items": [
              { "value": "+1.000", "label": "Líderes activos" },
              { "value": "6", "label": "Meses de programa" },
              { "value": "4", "label": "Pilares de liderazgo" },
              { "value": "+25", "label": "Advisers certificados" }
            ]
          }
        },
        {
          "blockId": "seed-home-proposito",
          "type": "imageText",
          "isVisible": true,
          "props": {
            "title": "Para líderes que saben que hay más en ellos.",
            "body": "4Shine nació porque el liderazgo real no se improvisa ni se aprende en un curso de 8 horas. Nació para quienes están dispuestos a trabajar con método, recibir acompañamiento de alto nivel y medir su transformación con honestidad.\n\nNo somos una plataforma de contenido. Somos una experiencia de desarrollo que combina herramientas, comunidad, diagnóstico y mentores especializados en un solo programa estructurado.",
            "imageUrl": "https://liderazgoestrategico.s3.us-east-1.amazonaws.com/recursos/IMG_4119.JPG",
            "imageSide": "right",
            "buttonLabel": "Ver metodología completa",
            "buttonHref": "/metodologia",
            "background": "light"
          }
        },
        {
          "blockId": "seed-home-pilares",
          "type": "cards",
          "isVisible": true,
          "props": {
            "kicker": "",
            "title": "Cuatro dimensiones. Una transformación completa.",
            "subtitle": "",
            "columns": "4",
            "style": "color",
            "background": "light",
            "items": [
              { "title": "Shine Within", "description": "Autoliderazgo, identidad y claridad personal para decidir con conciencia.", "detail": "Descubres quién eres como líder, qué valores te mueven y cómo tomar decisiones profundamente alineadas con tu propósito.", "color": "#5b2d8a" },
              { "title": "Shine Out", "description": "Comunicación estratégica, presencia ejecutiva y narrativa de impacto.", "detail": "Desarrollas la capacidad de articular ideas con poder, influir con autenticidad y proyectar una presencia ejecutiva real.", "color": "#1e5fa8" },
              { "title": "Shine Up", "description": "Pensamiento estratégico, influencia y toma de decisiones en contextos complejos.", "detail": "Elevas tu pensamiento, navegas la ambigüedad y ejerces influencia sin necesitar autoridad directa.", "color": "#0e7a5a" },
              { "title": "Shine Beyond", "description": "Legado, expansión y liderazgo que transforma equipos y ecosistemas.", "detail": "Construyes equipos de alto desempeño, articulas un legado de impacto y multiplicas tu capacidad de transformación.", "color": "#a8420e" }
            ]
          }
        },
        {
          "blockId": "seed-home-testimonios",
          "type": "testimonials",
          "isVisible": true,
          "props": {
            "title": "Resultados reales en líderes reales.",
            "background": "dark",
            "items": [
              { "text": "\"En 12 semanas convertí mi visión en una ruta concreta. Mi equipo mejoró el foco y la coordinación de una manera que no creí posible antes del programa.\"", "name": "Pablo R.", "role": "Director de Tecnología · LATAM", "color": "#5b2d8a" },
              { "text": "\"4Shine me enseñó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con claridad en contextos de alta incertidumbre.\"", "name": "Carolina M.", "role": "Directora Académica", "color": "#1e5fa8" },
              { "text": "\"Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna sin perder mi autenticidad como líder.\"", "name": "Andrés V.", "role": "Gerente Comercial", "color": "#0e7a5a" }
            ]
          }
        },
        {
          "blockId": "seed-home-planes",
          "type": "pricing",
          "isVisible": true,
          "props": {
            "kicker": "Inversión",
            "title": "Elige tu punto de entrada.",
            "subtitle": "Diagnóstico individual, programa completo o comunidad semanal. Cada opción lleva al mismo destino: un liderazgo más claro, más potente.",
            "background": "surface",
            "items": [
              { "label": "Primer paso", "name": "Diagnóstico Ejecutivo", "price": "50", "currency": "USD", "description": "Evalúa tu nivel en los 4 pilares y obtén un informe ejecutivo personalizado con tus fortalezas, brechas y próximos pasos.", "features": "Evaluación de los 4 pilares de liderazgo\nInforme ejecutivo personalizado\nIdentificación de brechas críticas\nAcceso permanente a tus resultados", "ctaLabel": "Comprar diagnóstico", "ctaHref": "/acceso?plan=diagnostico", "highlighted": false },
              { "label": "Recomendado", "name": "Programas de liderazgo", "price": "desde 1.000", "currency": "USD", "description": "Trayectoria de 24 semanas con Adviser asignado, workbooks exclusivos, diagnóstico, comunidad y certificación. 4 niveles disponibles.", "features": "Junior · Reinvéntate · Marca Ejecutiva · Executive\nDe 5 a 10 sesiones individuales con Adviser\nWorkbooks de metodología 4Shine\nNetworking, workshops y convocatorias\nCertificación 4Shine Leadership", "ctaLabel": "Ver todos los programas", "ctaHref": "/planes-precios", "highlighted": true },
              { "label": "Comunidad", "name": "Círculo de líderes", "price": "57", "currency": "USD / mes", "description": "Sesiones en vivo grupales semanales, cursos exclusivos, comunidad de práctica continua, convocatorias y workshops.", "features": "1 sesión en vivo grupal por semana\nTodos los cursos y material exclusivo\nComunidad y networking\nConvocatorias y workshops", "ctaLabel": "Unirme al Círculo", "ctaHref": "/planes-precios", "highlighted": false }
            ]
          }
        },
        {
          "blockId": "seed-home-cta",
          "type": "cta",
          "isVisible": true,
          "props": {
            "title": "¿Eres experto? Multiplica tu impacto como Adviser.",
            "body": "Si tienes experiencia probada en liderazgo, desarrollo organizacional o comunicación ejecutiva, puedes prestar tus servicios en modalidad de afiliado dentro de la plataforma.",
            "primaryLabel": "Postularme como Adviser",
            "primaryHref": "/afiliados",
            "secondaryLabel": "Conocer el programa primero",
            "secondaryHref": "/metodologia",
            "background": "dark"
          }
        }
      ]
    $home$),
    ('descubrimiento', 'Diagnóstico de Equipo', 'descubrimiento', 'Descubrimiento', true, 2, $desc$
      [
        {
          "blockId": "seed-desc-hero",
          "type": "hero",
          "isVisible": true,
          "props": {
            "kicker": "Plataforma",
            "title": "Descubrimiento · Diagnóstico de liderazgo",
            "subtitle": "Evalúa tu liderazgo en 4 dimensiones con metodología validada. Obtén un informe ejecutivo con análisis cualitativo generado por IA.",
            "align": "left",
            "background": "dark",
            "backgroundImageUrl": "",
            "backgroundVideoUrl": "",
            "primaryLabel": "Activar diagnóstico",
            "primaryHref": "/acceso?plan=diagnostico",
            "secondaryLabel": "Ver metodología",
            "secondaryHref": "/metodologia",
            "compact": true
          }
        }
      ]
    $desc$),
    ('metodologia', 'Metodología', 'metodologia', 'Metodología', true, 1, $met$
      [
        {
          "blockId": "seed-met-hero",
          "type": "hero",
          "isVisible": true,
          "props": {
            "kicker": "Plataforma",
            "title": "La metodología 4Shine Platform",
            "subtitle": "Un programa de 24 semanas que integra diagnóstico, formación aplicada, mentoría experta y comunidad ejecutiva para generar resultados sostenibles.",
            "align": "left",
            "background": "dark",
            "backgroundImageUrl": "",
            "backgroundVideoUrl": "",
            "primaryLabel": "Ver planes y precios",
            "primaryHref": "/planes-precios",
            "secondaryLabel": "",
            "secondaryHref": "",
            "compact": true
          }
        }
      ]
    $met$),
    ('planes_precios', 'Planes y Precios', 'planes-precios', 'Planes y precios', true, 3, '[]'),
    ('afiliados', 'Afiliados', 'afiliados', 'Afiliados', true, 4, $afi$
      [
        {
          "blockId": "seed-afi-hero",
          "type": "hero",
          "isVisible": true,
          "props": {
            "kicker": "Plataforma",
            "title": "Programa de afiliados y Advisers",
            "subtitle": "Conectamos tu experiencia con líderes que están listos para crecer. Tú pones el expertise; nosotros la comunidad, la plataforma y el programa.",
            "align": "left",
            "background": "dark",
            "backgroundImageUrl": "",
            "backgroundVideoUrl": "",
            "primaryLabel": "Postularme como Adviser",
            "primaryHref": "/acceso",
            "secondaryLabel": "",
            "secondaryHref": "",
            "compact": true
          }
        }
      ]
    $afi$)
) AS p(page_key, title, slug, nav_label, show_in_nav, nav_order, sections)
LEFT JOIN app_admin.integration_configs ic
  ON ic.organization_id = o.organization_id AND ic.integration_key = 'site_pages'
ON CONFLICT (organization_id, page_key) DO NOTHING;
