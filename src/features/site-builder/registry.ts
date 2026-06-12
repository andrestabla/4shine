import type { SiteBlock, SiteBlockProps, SiteBlockType } from './types';

export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'color'
  | 'select'
  | 'toggle'
  | 'number'
  | 'list';

export interface BlockFieldOption {
  value: string;
  label: string;
}

export interface BlockField {
  key: string;
  label: string;
  type: BlockFieldType;
  placeholder?: string;
  help?: string;
  options?: BlockFieldOption[];
  /** Solo para type: 'list' — campos de cada elemento */
  itemFields?: BlockField[];
  /** Solo para type: 'list' — etiqueta de cada elemento ("Tarjeta", "Testimonio"...) */
  itemLabel?: string;
}

export interface BlockDefinition {
  type: SiteBlockType;
  label: string;
  description: string;
  fields: BlockField[];
  defaults: SiteBlockProps;
}

const BACKGROUND_OPTIONS: BlockFieldOption[] = [
  { value: 'dark', label: 'Oscuro (marca)' },
  { value: 'darker', label: 'Oscuro profundo' },
  { value: 'light', label: 'Blanco' },
  { value: 'surface', label: 'Superficie clara' },
];

const backgroundField: BlockField = {
  key: 'background',
  label: 'Fondo',
  type: 'select',
  options: BACKGROUND_OPTIONS,
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Encabezado principal con título, subtítulo y botones.',
    fields: [
      { key: 'kicker', label: 'Kicker (texto superior)', type: 'text', placeholder: 'PLATAFORMA DE LIDERAZGO' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      {
        key: 'align',
        label: 'Alineación',
        type: 'select',
        options: [
          { value: 'left', label: 'Izquierda' },
          { value: 'center', label: 'Centrado' },
        ],
      },
      backgroundField,
      { key: 'backgroundImageUrl', label: 'Imagen de fondo (opcional)', type: 'image' },
      {
        key: 'backgroundVideoUrl',
        label: 'Video de fondo MP4 (opcional)',
        type: 'text',
        help: 'URL directa a un archivo .mp4. Tiene prioridad sobre la imagen.',
      },
      { key: 'primaryLabel', label: 'Botón principal — texto', type: 'text' },
      { key: 'primaryHref', label: 'Botón principal — enlace', type: 'text', placeholder: '/planes-precios' },
      { key: 'secondaryLabel', label: 'Botón secundario — texto', type: 'text' },
      { key: 'secondaryHref', label: 'Botón secundario — enlace', type: 'text' },
      { key: 'compact', label: 'Versión compacta', type: 'toggle' },
    ],
    defaults: {
      kicker: 'Plataforma de liderazgo',
      title: 'Un título potente para tu página.',
      subtitle: 'Describe en una o dos frases el valor de esta sección.',
      align: 'left',
      background: 'dark',
      backgroundImageUrl: '',
      backgroundVideoUrl: '',
      primaryLabel: 'Conocer más',
      primaryHref: '/metodologia',
      secondaryLabel: '',
      secondaryHref: '',
      compact: false,
    },
  },
  {
    type: 'stats',
    label: 'Métricas',
    description: 'Fila de cifras destacadas (ej. +1.000 líderes).',
    fields: [
      backgroundField,
      {
        key: 'items',
        label: 'Métricas',
        type: 'list',
        itemLabel: 'Métrica',
        itemFields: [
          { key: 'value', label: 'Valor', type: 'text', placeholder: '+1.000' },
          { key: 'label', label: 'Etiqueta', type: 'text', placeholder: 'Líderes activos' },
        ],
      },
    ],
    defaults: {
      background: 'darker',
      items: [
        { value: '+1.000', label: 'Líderes activos' },
        { value: '6', label: 'Meses de programa' },
        { value: '4', label: 'Pilares de liderazgo' },
        { value: '+25', label: 'Advisers certificados' },
      ],
    },
  },
  {
    type: 'richText',
    label: 'Texto',
    description: 'Bloque de texto con título. Soporta Markdown.',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'body', label: 'Contenido (Markdown)', type: 'textarea' },
      {
        key: 'align',
        label: 'Alineación',
        type: 'select',
        options: [
          { value: 'left', label: 'Izquierda' },
          { value: 'center', label: 'Centrado' },
        ],
      },
      backgroundField,
    ],
    defaults: {
      kicker: '',
      title: 'Un título de sección.',
      body: 'Escribe aquí el contenido. Puedes usar **negritas**, listas y enlaces.',
      align: 'left',
      background: 'light',
    },
  },
  {
    type: 'imageText',
    label: 'Imagen + texto',
    description: 'Texto a un lado e imagen al otro, con botón opcional.',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'body', label: 'Contenido (Markdown)', type: 'textarea' },
      { key: 'imageUrl', label: 'Imagen', type: 'image' },
      {
        key: 'imageSide',
        label: 'Posición de la imagen',
        type: 'select',
        options: [
          { value: 'right', label: 'Derecha' },
          { value: 'left', label: 'Izquierda' },
        ],
      },
      { key: 'buttonLabel', label: 'Botón — texto', type: 'text' },
      { key: 'buttonHref', label: 'Botón — enlace', type: 'text' },
      backgroundField,
    ],
    defaults: {
      title: 'Para líderes que saben que hay más en ellos.',
      body: 'Describe el valor de tu propuesta con un par de párrafos claros.',
      imageUrl: '',
      imageSide: 'right',
      buttonLabel: '',
      buttonHref: '',
      background: 'light',
    },
  },
  {
    type: 'cards',
    label: 'Tarjetas',
    description: 'Grilla de tarjetas con color, título y descripción (ej. pilares).',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      {
        key: 'columns',
        label: 'Columnas',
        type: 'select',
        options: [
          { value: '2', label: '2 columnas' },
          { value: '3', label: '3 columnas' },
          { value: '4', label: '4 columnas' },
        ],
      },
      {
        key: 'style',
        label: 'Estilo de tarjeta',
        type: 'select',
        options: [
          { value: 'color', label: 'Con color de fondo' },
          { value: 'outline', label: 'Borde sutil' },
        ],
      },
      backgroundField,
      {
        key: 'items',
        label: 'Tarjetas',
        type: 'list',
        itemLabel: 'Tarjeta',
        itemFields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'textarea' },
          { key: 'detail', label: 'Detalle (opcional)', type: 'textarea' },
          { key: 'color', label: 'Color', type: 'color' },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: 'Cuatro dimensiones. Una transformación completa.',
      subtitle: '',
      columns: '4',
      style: 'color',
      background: 'light',
      items: [
        { title: 'Shine Within', description: 'Autoliderazgo, identidad y claridad personal.', detail: '', color: '#5b2d8a' },
        { title: 'Shine Out', description: 'Comunicación estratégica y presencia ejecutiva.', detail: '', color: '#1e5fa8' },
        { title: 'Shine Up', description: 'Pensamiento estratégico e influencia.', detail: '', color: '#0e7a5a' },
        { title: 'Shine Beyond', description: 'Legado y liderazgo que transforma ecosistemas.', detail: '', color: '#a8420e' },
      ],
    },
  },
  {
    type: 'testimonials',
    label: 'Testimonios',
    description: 'Citas de clientes o participantes con nombre y cargo.',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
      backgroundField,
      {
        key: 'items',
        label: 'Testimonios',
        type: 'list',
        itemLabel: 'Testimonio',
        itemFields: [
          { key: 'text', label: 'Cita', type: 'textarea' },
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'role', label: 'Cargo / contexto', type: 'text' },
          { key: 'color', label: 'Color', type: 'color' },
        ],
      },
    ],
    defaults: {
      title: 'Resultados reales en líderes reales.',
      background: 'dark',
      items: [
        {
          text: '"En 12 semanas convertí mi visión en una ruta concreta."',
          name: 'Pablo R.',
          role: 'Director de Tecnología',
          color: '#5b2d8a',
        },
      ],
    },
  },
  {
    type: 'pricing',
    label: 'Planes y precios',
    description: 'Tarjetas de precios con lista de características.',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      backgroundField,
      {
        key: 'items',
        label: 'Planes',
        type: 'list',
        itemLabel: 'Plan',
        itemFields: [
          { key: 'label', label: 'Etiqueta', type: 'text', placeholder: 'Recomendado' },
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'price', label: 'Precio', type: 'text', placeholder: '50' },
          { key: 'currency', label: 'Moneda / periodo', type: 'text', placeholder: 'USD / mes' },
          { key: 'description', label: 'Descripción', type: 'textarea' },
          { key: 'features', label: 'Características (una por línea)', type: 'textarea' },
          { key: 'ctaLabel', label: 'Botón — texto', type: 'text' },
          { key: 'ctaHref', label: 'Botón — enlace', type: 'text' },
          { key: 'highlighted', label: 'Destacado', type: 'toggle' },
        ],
      },
    ],
    defaults: {
      kicker: 'Inversión',
      title: 'Elige tu punto de entrada.',
      subtitle: '',
      background: 'surface',
      items: [
        {
          label: 'Primer paso',
          name: 'Diagnóstico Ejecutivo',
          price: '50',
          currency: 'USD',
          description: 'Evalúa tu nivel en los 4 pilares.',
          features: 'Evaluación de los 4 pilares\nInforme ejecutivo personalizado',
          ctaLabel: 'Comprar diagnóstico',
          ctaHref: '/acceso',
          highlighted: false,
        },
      ],
    },
  },
  {
    type: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Lista de preguntas expandibles.',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
      backgroundField,
      {
        key: 'items',
        label: 'Preguntas',
        type: 'list',
        itemLabel: 'Pregunta',
        itemFields: [
          { key: 'question', label: 'Pregunta', type: 'text' },
          { key: 'answer', label: 'Respuesta', type: 'textarea' },
        ],
      },
    ],
    defaults: {
      title: 'Preguntas frecuentes',
      background: 'light',
      items: [{ question: '¿Cómo funciona el programa?', answer: 'Es una ruta estructurada de 24 semanas.' }],
    },
  },
  {
    type: 'cta',
    label: 'Llamado a la acción',
    description: 'Sección de cierre con título y botones.',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'body', label: 'Texto', type: 'textarea' },
      { key: 'primaryLabel', label: 'Botón principal — texto', type: 'text' },
      { key: 'primaryHref', label: 'Botón principal — enlace', type: 'text' },
      { key: 'secondaryLabel', label: 'Botón secundario — texto', type: 'text' },
      { key: 'secondaryHref', label: 'Botón secundario — enlace', type: 'text' },
      backgroundField,
    ],
    defaults: {
      title: '¿Listo para transformar tu liderazgo?',
      body: 'Empieza hoy con un diagnóstico o únete al programa completo.',
      primaryLabel: 'Comenzar ahora',
      primaryHref: '/acceso',
      secondaryLabel: '',
      secondaryHref: '',
      background: 'dark',
    },
  },
  {
    type: 'video',
    label: 'Video',
    description: 'Video destacado (YouTube, Vimeo o MP4).',
    fields: [
      { key: 'title', label: 'Título (opcional)', type: 'textarea' },
      {
        key: 'videoUrl',
        label: 'URL del video',
        type: 'text',
        help: 'Acepta enlaces de YouTube, Vimeo o archivos .mp4.',
      },
      { key: 'caption', label: 'Pie de video', type: 'text' },
      backgroundField,
    ],
    defaults: { title: '', videoUrl: '', caption: '', background: 'surface' },
  },
  {
    type: 'image',
    label: 'Imagen',
    description: 'Imagen destacada con pie opcional.',
    fields: [
      { key: 'imageUrl', label: 'Imagen', type: 'image' },
      { key: 'caption', label: 'Pie de imagen', type: 'text' },
      { key: 'fullWidth', label: 'Ancho completo', type: 'toggle' },
      backgroundField,
    ],
    defaults: { imageUrl: '', caption: '', fullWidth: false, background: 'light' },
  },
  {
    type: 'html',
    label: 'HTML personalizado',
    description: 'Inserta HTML libre (avanzado).',
    fields: [
      { key: 'html', label: 'HTML', type: 'textarea' },
      backgroundField,
    ],
    defaults: { html: '<div style="padding:40px;text-align:center;">Contenido personalizado</div>', background: 'light' },
  },
  {
    type: 'spacer',
    label: 'Espaciador',
    description: 'Espacio vertical entre secciones.',
    fields: [
      { key: 'height', label: 'Altura (px)', type: 'number' },
      backgroundField,
    ],
    defaults: { height: 64, background: 'light' },
  },
];

export const BLOCK_DEFINITION_MAP: Record<string, BlockDefinition> = Object.fromEntries(
  BLOCK_DEFINITIONS.map((def) => [def.type, def]),
);

export function isKnownBlockType(value: unknown): value is SiteBlockType {
  return typeof value === 'string' && value in BLOCK_DEFINITION_MAP;
}

export function createBlock(type: SiteBlockType): SiteBlock {
  const def = BLOCK_DEFINITION_MAP[type];
  return {
    blockId: `blk_${Math.random().toString(36).slice(2, 10)}`,
    type,
    isVisible: true,
    props: JSON.parse(JSON.stringify(def?.defaults ?? {})) as SiteBlockProps,
  };
}
