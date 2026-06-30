import type { SiteBlock, SiteBlockProps, SiteBlockType } from './types';
import { SITE_ICON_NAMES } from './icons';

export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'image'
  | 'color'
  | 'select'
  | 'toggle'
  | 'number'
  | 'range'
  | 'icon'
  | 'advisors'
  | 'list';

export type BlockFieldGroup = 'content' | 'style';

export interface BlockFieldOption {
  value: string;
  label: string;
}

export interface BlockField {
  key: string;
  label: string;
  type: BlockFieldType;
  /** Pestaña del editor donde aparece. Por defecto 'content'. */
  group?: BlockFieldGroup;
  placeholder?: string;
  help?: string;
  options?: BlockFieldOption[];
  /** Solo para type: 'range' */
  min?: number;
  max?: number;
  step?: number;
  /** Solo para type: 'list' — campos de cada elemento */
  itemFields?: BlockField[];
  /** Solo para type: 'list' — etiqueta de cada elemento ("Tarjeta", "Testimonio"...) */
  itemLabel?: string;
  /** Mostrar el campo solo cuando se cumple la condición sobre los props (o el item, en itemFields). */
  showIf?: (props: SiteBlockProps) => boolean;
}

export interface BlockDefinition {
  type: SiteBlockType;
  label: string;
  description: string;
  category: 'Estructura' | 'Contenido' | 'Social' | 'Conversión' | 'Media' | 'Avanzado';
  fields: BlockField[];
  defaults: SiteBlockProps;
}

/* ─────────────────────── Sistema de estilo compartido ───────────────────────
 * Todos los bloques de sección comparten estos controles, alineados con los
 * tokens del módulo de branding (--brand-primary/secondary/accent, radio,
 * tipografía). "Personalizado" permite salirse de la paleta cuando se necesite.
 */

export const BACKGROUND_OPTIONS: BlockFieldOption[] = [
  { value: 'inherit', label: 'Transparente / heredar' },
  { value: 'light', label: 'Blanco' },
  { value: 'surface', label: 'Superficie clara (marca)' },
  { value: 'dark', label: 'Oscuro (marca)' },
  { value: 'darker', label: 'Oscuro profundo (marca)' },
  { value: 'primary', label: 'Color primario (marca)' },
  { value: 'secondary', label: 'Color secundario (marca)' },
  { value: 'accent', label: 'Color acento (marca)' },
  { value: 'custom', label: 'Color personalizado' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'image', label: 'Imagen de fondo' },
];

const isBg = (...values: string[]) => (props: SiteBlockProps) =>
  values.includes(typeof props.background === 'string' ? props.background : '');

export const STYLE_DEFAULTS: SiteBlockProps = {
  background: 'light',
  backgroundCustom: '#0D1B2A',
  backgroundOpacity: 100,
  gradientFrom: '#0D1B2A',
  gradientTo: '#D4AF37',
  gradientAngle: 135,
  backgroundImageUrl: '',
  overlayColor: '#0D1B2A',
  overlayOpacity: 70,
  textColor: 'auto',
  textColorCustom: '#FFFFFF',
  titleColor: 'auto',
  titleColorCustom: '#FFFFFF',
  titleSize: 'md',
  paddingY: 'normal',
  contentWidth: 'normal',
};

function styleFields(): BlockField[] {
  return [
    { key: 'background', label: 'Fondo', type: 'select', group: 'style', options: BACKGROUND_OPTIONS },
    { key: 'backgroundCustom', label: 'Color de fondo', type: 'color', group: 'style', showIf: isBg('custom') },
    {
      key: 'backgroundOpacity',
      label: 'Opacidad del fondo (%)',
      type: 'range',
      group: 'style',
      min: 0,
      max: 100,
      step: 5,
      showIf: isBg('custom'),
    },
    { key: 'gradientFrom', label: 'Degradado — inicio', type: 'color', group: 'style', showIf: isBg('gradient') },
    { key: 'gradientTo', label: 'Degradado — fin', type: 'color', group: 'style', showIf: isBg('gradient') },
    {
      key: 'gradientAngle',
      label: 'Degradado — ángulo (°)',
      type: 'range',
      group: 'style',
      min: 0,
      max: 360,
      step: 15,
      showIf: isBg('gradient'),
    },
    { key: 'backgroundImageUrl', label: 'Imagen de fondo', type: 'image', group: 'style', showIf: isBg('image') },
    { key: 'overlayColor', label: 'Capa de color sobre la imagen', type: 'color', group: 'style', showIf: isBg('image') },
    {
      key: 'overlayOpacity',
      label: 'Opacidad de la capa (%)',
      type: 'range',
      group: 'style',
      min: 0,
      max: 100,
      step: 5,
      showIf: isBg('image'),
    },
    {
      key: 'titleSize',
      label: 'Tamaño del título',
      type: 'select',
      group: 'style',
      options: [
        { value: 'sm', label: 'Pequeño' },
        { value: 'md', label: 'Mediano' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Extra grande' },
      ],
    },
    {
      key: 'titleColor',
      label: 'Color del título',
      type: 'select',
      group: 'style',
      options: [
        { value: 'auto', label: 'Automático (según fondo)' },
        { value: 'accent', label: 'Acento (marca)' },
        { value: 'primary', label: 'Primario (marca)' },
        { value: 'custom', label: 'Personalizado' },
      ],
    },
    {
      key: 'titleColorCustom',
      label: 'Color del título — personalizado',
      type: 'color',
      group: 'style',
      showIf: (props) => props.titleColor === 'custom',
    },
    {
      key: 'textColor',
      label: 'Color del texto',
      type: 'select',
      group: 'style',
      options: [
        { value: 'auto', label: 'Automático (según fondo)' },
        { value: 'custom', label: 'Personalizado' },
      ],
    },
    {
      key: 'textColorCustom',
      label: 'Color del texto — personalizado',
      type: 'color',
      group: 'style',
      showIf: (props) => props.textColor === 'custom',
    },
    {
      key: 'paddingY',
      label: 'Espaciado vertical',
      type: 'select',
      group: 'style',
      options: [
        { value: 'none', label: 'Sin espaciado' },
        { value: 'compact', label: 'Compacto' },
        { value: 'normal', label: 'Normal' },
        { value: 'spacious', label: 'Amplio' },
      ],
    },
    {
      key: 'contentWidth',
      label: 'Ancho del contenido',
      type: 'select',
      group: 'style',
      options: [
        { value: 'normal', label: 'Normal (1240px)' },
        { value: 'narrow', label: 'Angosto (900px)' },
        { value: 'full', label: 'Ancho completo' },
      ],
    },
  ];
}

/* ─────────────────────── Botones configurables ─────────────────────── */

export const BUTTON_ITEM_FIELDS: BlockField[] = [
  { key: 'label', label: 'Texto', type: 'text' },
  { key: 'href', label: 'Enlace', type: 'text', placeholder: '/planes-precios' },
  {
    key: 'variant',
    label: 'Estilo',
    type: 'select',
    options: [
      { value: 'solid', label: 'Relleno' },
      { value: 'outline', label: 'Borde' },
      { value: 'ghost', label: 'Fantasma (sin borde)' },
      { value: 'link', label: 'Enlace con flecha' },
    ],
  },
  {
    key: 'color',
    label: 'Color',
    type: 'select',
    options: [
      { value: 'accent', label: 'Acento (marca)' },
      { value: 'primary', label: 'Primario (marca)' },
      { value: 'secondary', label: 'Secundario (marca)' },
      { value: 'white', label: 'Blanco' },
      { value: 'custom', label: 'Personalizado' },
    ],
  },
  {
    key: 'customColor',
    label: 'Color personalizado',
    type: 'color',
    showIf: (item) => item.color === 'custom',
  },
  {
    key: 'shape',
    label: 'Forma',
    type: 'select',
    options: [
      { value: 'brand', label: 'Según branding (radio de marca)' },
      { value: 'pill', label: 'Píldora' },
      { value: 'rounded', label: 'Redondeado' },
      { value: 'square', label: 'Recto' },
    ],
  },
  {
    key: 'size',
    label: 'Tamaño',
    type: 'select',
    options: [
      { value: 'sm', label: 'Pequeño' },
      { value: 'md', label: 'Mediano' },
      { value: 'lg', label: 'Grande' },
    ],
  },
];

function buttonsField(label = 'Botones'): BlockField {
  return { key: 'buttons', label, type: 'list', itemLabel: 'Botón', itemFields: BUTTON_ITEM_FIELDS };
}

export function defaultButton(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    label: 'Conocer más',
    href: '/metodologia',
    variant: 'solid',
    color: 'accent',
    customColor: '#D4AF37',
    shape: 'brand',
    size: 'md',
    ...overrides,
  };
}

/* ─────────────────────── Campos repetidos ─────────────────────── */

const iconField: BlockField = {
  key: 'icon',
  label: 'Ícono',
  type: 'icon',
  help: `Catálogo de ${SITE_ICON_NAMES.length} íconos.`,
};

const alignField: BlockField = {
  key: 'align',
  label: 'Alineación',
  type: 'select',
  options: [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centrado' },
  ],
};

const columnsField = (max: 2 | 3 | 4 | 5 = 4): BlockField => ({
  key: 'columns',
  label: 'Columnas',
  type: 'select',
  options: Array.from({ length: max - 1 }, (_, i) => ({
    value: String(i + 2),
    label: `${i + 2} columnas`,
  })),
});

/** hideStyleFields: controles de estilo compartidos que el bloque no renderiza (p. ej. título en Métricas). */
function def(definition: BlockDefinition & { hideStyleFields?: string[] }): BlockDefinition {
  const { hideStyleFields, ...rest } = definition;
  // Todos los bloques aceptan botones; los que no definen su propio campo lo reciben aquí.
  const hasButtonsField = rest.fields.some((field) => field.key === 'buttons');
  return {
    ...rest,
    fields: [
      ...rest.fields,
      ...(hasButtonsField ? [] : [buttonsField('Botones (opcional)')]),
      ...styleFields().filter((field) => !hideStyleFields || !hideStyleFields.includes(field.key)),
    ],
    defaults: { buttons: [], ...STYLE_DEFAULTS, ...rest.defaults },
  };
}

const TITLE_STYLE_FIELDS = ['titleSize', 'titleColor', 'titleColorCustom'];
const TEXT_STYLE_FIELDS = ['textColor', 'textColorCustom'];

/* ─────────────────────── Definiciones de bloques ─────────────────────── */

/** Layouts de columnas disponibles para el bloque 'section' (valores en fracciones fr). */
export const SECTION_LAYOUTS: Record<string, number[]> = {
  '1': [1],
  '1-1': [1, 1],
  '1-1-1': [1, 1, 1],
  '1-1-1-1': [1, 1, 1, 1],
  '1-2': [1, 2],
  '2-1': [2, 1],
  '1-3': [1, 3],
  '3-1': [3, 1],
  '1-1-2': [1, 1, 2],
  '2-1-1': [2, 1, 1],
};

export function makeColumn(): { columnId: string; blocks: never[] } {
  return { columnId: `col_${Math.random().toString(36).slice(2, 10)}`, blocks: [] };
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  def({
    type: 'section',
    label: 'Sección (columnas)',
    description: 'Contenedor con columnas; en cada columna apilas uno o más componentes.',
    category: 'Estructura',
    fields: [
      {
        key: 'layout',
        label: 'Distribución de columnas',
        type: 'select',
        options: [
          { value: '1', label: '1 columna' },
          { value: '1-1', label: '2 columnas (50/50)' },
          { value: '1-2', label: '2 columnas (33/66)' },
          { value: '2-1', label: '2 columnas (66/33)' },
          { value: '1-3', label: '2 columnas (25/75)' },
          { value: '3-1', label: '2 columnas (75/25)' },
          { value: '1-1-1', label: '3 columnas iguales' },
          { value: '1-1-2', label: '3 columnas (25/25/50)' },
          { value: '2-1-1', label: '3 columnas (50/25/25)' },
          { value: '1-1-1-1', label: '4 columnas iguales' },
        ],
      },
      {
        key: 'gap',
        label: 'Separación entre columnas',
        type: 'select',
        group: 'style',
        options: [
          { value: 'sm', label: 'Pequeña' },
          { value: 'md', label: 'Mediana' },
          { value: 'lg', label: 'Grande' },
        ],
      },
      {
        key: 'verticalAlign',
        label: 'Alineación vertical',
        type: 'select',
        group: 'style',
        options: [
          { value: 'top', label: 'Arriba' },
          { value: 'center', label: 'Centrada' },
          { value: 'stretch', label: 'Estirada' },
        ],
      },
    ],
    defaults: {
      layout: '1-1',
      gap: 'md',
      verticalAlign: 'top',
      columns: [makeColumn(), makeColumn()],
    },
  }),
  def({
    type: 'hero',
    label: 'Hero',
    description: 'Encabezado principal con título, subtítulo y botones.',
    category: 'Estructura',
    fields: [
      {
        key: 'layout',
        label: 'Distribución',
        type: 'select',
        options: [
          { value: 'left', label: 'Texto a la izquierda' },
          { value: 'center', label: 'Centrado' },
          { value: 'split', label: 'Texto + imagen lateral' },
        ],
      },
      { key: 'kicker', label: 'Kicker (texto superior)', type: 'text', placeholder: 'PLATAFORMA DE LIDERAZGO' },
      {
        key: 'kickerColor',
        label: 'Color del kicker',
        type: 'select',
        options: [
          { value: 'accent', label: 'Acento (marca)' },
          { value: 'auto', label: 'Automático' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      { key: 'kickerColorCustom', label: 'Kicker — color personalizado', type: 'color', showIf: (p) => p.kickerColor === 'custom' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'sideImageUrl', label: 'Imagen lateral', type: 'image', showIf: (p) => p.layout === 'split' },
      buttonsField(),
      {
        key: 'backgroundVideoUrl',
        label: 'Video de fondo MP4 (opcional)',
        type: 'text',
        group: 'style',
        help: 'URL directa a un archivo .mp4. Tiene prioridad sobre el fondo elegido.',
      },
      {
        key: 'height',
        label: 'Altura',
        type: 'select',
        group: 'style',
        options: [
          { value: 'compact', label: 'Compacta' },
          { value: 'normal', label: 'Normal' },
          { value: 'tall', label: 'Alta' },
        ],
      },
    ],
    defaults: {
      layout: 'left',
      kicker: 'Plataforma de liderazgo',
      kickerColor: 'accent',
      kickerColorCustom: '#D4AF37',
      title: 'Un título potente para tu página.',
      subtitle: 'Describe en una o dos frases el valor de esta sección.',
      sideImageUrl: '',
      buttons: [defaultButton(), defaultButton({ label: 'Ver planes', href: '/planes-precios', variant: 'outline', color: 'white' })],
      backgroundVideoUrl: '',
      height: 'normal',
      background: 'dark',
      titleSize: 'xl',
    },
  }),
  def({
    type: 'stats',
    label: 'Métricas',
    description: 'Fila de cifras destacadas (ej. +1.000 líderes).',
    category: 'Contenido',
    hideStyleFields: TITLE_STYLE_FIELDS,
    fields: [
      {
        key: 'valueColor',
        label: 'Color de las cifras',
        type: 'select',
        group: 'style',
        options: [
          { value: 'accent', label: 'Acento (marca)' },
          { value: 'primary', label: 'Primario (marca)' },
          { value: 'auto', label: 'Automático (según fondo)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      {
        key: 'labelColor',
        label: 'Color de las etiquetas',
        type: 'select',
        group: 'style',
        options: [
          { value: 'auto', label: 'Automático (según fondo)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      {
        key: 'labelColorCustom',
        label: 'Etiquetas — color personalizado',
        type: 'color',
        group: 'style',
        showIf: (p) => p.labelColor === 'custom',
      },
      { key: 'valueColorCustom', label: 'Cifras — color personalizado', type: 'color', group: 'style', showIf: (p) => p.valueColor === 'custom' },
      { key: 'showDividers', label: 'Líneas divisorias', type: 'toggle', group: 'style' },
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
      valueColor: 'accent',
      valueColorCustom: '#D4AF37',
      labelColor: 'auto',
      labelColorCustom: '#FFFFFF',
      showDividers: true,
      paddingY: 'compact',
      items: [
        { value: '+1.000', label: 'Líderes activos' },
        { value: '6', label: 'Meses de programa' },
        { value: '4', label: 'Pilares de liderazgo' },
        { value: '+25', label: 'Advisors certificados' },
      ],
    },
  }),
  def({
    type: 'richText',
    label: 'Texto',
    description: 'Bloque de texto con título. Soporta Markdown.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'body', label: 'Contenido (Markdown)', type: 'textarea' },
      alignField,
      buttonsField('Botones (opcional)'),
    ],
    defaults: {
      kicker: '',
      title: 'Un título de sección.',
      body: 'Escribe aquí el contenido. Puedes usar **negritas**, listas y enlaces.',
      align: 'left',
      buttons: [],
      contentWidth: 'narrow',
    },
  }),
  def({
    type: 'textColumns',
    label: 'Columnas de texto',
    description: 'Varias columnas de texto con título, para distribuir contenido.',
    category: 'Estructura',
    fields: [
      { key: 'title', label: 'Título de la sección', type: 'textarea' },
      columnsField(4),
      {
        key: 'items',
        label: 'Columnas',
        type: 'list',
        itemLabel: 'Columna',
        itemFields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'body', label: 'Contenido (Markdown)', type: 'textarea' },
        ],
      },
    ],
    defaults: {
      title: '',
      columns: '3',
      items: [
        { title: 'Primera columna', body: 'Contenido de la primera columna.' },
        { title: 'Segunda columna', body: 'Contenido de la segunda columna.' },
        { title: 'Tercera columna', body: 'Contenido de la tercera columna.' },
      ],
    },
  }),
  def({
    type: 'imageText',
    label: 'Imagen + texto',
    description: 'Texto a un lado e imagen al otro, con botones opcionales.',
    category: 'Estructura',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
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
      {
        key: 'imageWidth',
        label: 'Ancho de la imagen',
        type: 'select',
        options: [
          { value: 'half', label: 'Mitad (50/50)' },
          { value: 'small', label: 'Pequeña (40%)' },
          { value: 'large', label: 'Grande (60%)' },
        ],
      },
      {
        key: 'imageShape',
        label: 'Forma de la imagen',
        type: 'select',
        group: 'style',
        options: [
          { value: 'rounded', label: 'Esquinas redondeadas' },
          { value: 'square', label: 'Recta' },
          { value: 'circle', label: 'Circular' },
        ],
      },
      { key: 'imageShadow', label: 'Sombra en la imagen', type: 'toggle', group: 'style' },
      buttonsField('Botones (opcional)'),
    ],
    defaults: {
      kicker: '',
      title: 'Para líderes que saben que hay más en ellos.',
      body: 'Describe el valor de tu propuesta con un par de párrafos claros.',
      imageUrl: '',
      imageSide: 'right',
      imageWidth: 'half',
      imageShape: 'rounded',
      imageShadow: true,
      buttons: [],
    },
  }),
  def({
    type: 'cards',
    label: 'Tarjetas',
    description: 'Grilla de tarjetas con color, ícono, título y descripción.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      columnsField(4),
      {
        key: 'style',
        label: 'Estilo de tarjeta',
        type: 'select',
        group: 'style',
        options: [
          { value: 'color', label: 'Con color de fondo' },
          { value: 'outline', label: 'Borde sutil' },
          { value: 'glass', label: 'Translúcida (glass)' },
        ],
      },
      {
        key: 'cardShape',
        label: 'Forma de las tarjetas',
        type: 'select',
        group: 'style',
        options: [
          { value: 'rounded', label: 'Redondeada' },
          { value: 'square', label: 'Recta' },
        ],
      },
      { key: 'showNumbers', label: 'Numerar tarjetas', type: 'toggle', group: 'style' },
      {
        key: 'items',
        label: 'Tarjetas',
        type: 'list',
        itemLabel: 'Tarjeta',
        itemFields: [
          iconField,
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'textarea' },
          { key: 'detail', label: 'Detalle (opcional)', type: 'textarea' },
          { key: 'color', label: 'Color', type: 'color' },
          { key: 'href', label: 'Enlace (opcional)', type: 'text' },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: 'Cuatro dimensiones. Una transformación completa.',
      subtitle: '',
      columns: '4',
      style: 'color',
      cardShape: 'rounded',
      showNumbers: true,
      items: [
        { icon: 'compass', title: 'Shine Within', description: 'Autoliderazgo, identidad y claridad personal.', detail: '', color: '#5b2d8a', href: '' },
        { icon: 'message', title: 'Shine Out', description: 'Comunicación estratégica y presencia ejecutiva.', detail: '', color: '#1e5fa8', href: '' },
        { icon: 'trending', title: 'Shine Up', description: 'Pensamiento estratégico e influencia.', detail: '', color: '#0e7a5a', href: '' },
        { icon: 'globe', title: 'Shine Beyond', description: 'Legado y liderazgo que transforma ecosistemas.', detail: '', color: '#a8420e', href: '' },
      ],
    },
  }),
  def({
    type: 'features',
    label: 'Características',
    description: 'Lista de características con ícono, sin tarjeta — más liviana.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      columnsField(4),
      alignField,
      {
        key: 'iconStyle',
        label: 'Estilo del ícono',
        type: 'select',
        group: 'style',
        options: [
          { value: 'plain', label: 'Solo ícono' },
          { value: 'circle', label: 'En círculo de color' },
          { value: 'square', label: 'En cuadro redondeado' },
        ],
      },
      {
        key: 'iconColor',
        label: 'Color de íconos',
        type: 'select',
        group: 'style',
        options: [
          { value: 'accent', label: 'Acento (marca)' },
          { value: 'primary', label: 'Primario (marca)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      { key: 'iconColorCustom', label: 'Íconos — color personalizado', type: 'color', group: 'style', showIf: (p) => p.iconColor === 'custom' },
      {
        key: 'items',
        label: 'Características',
        type: 'list',
        itemLabel: 'Característica',
        itemFields: [
          iconField,
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'textarea' },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: 'Todo lo que incluye.',
      subtitle: '',
      columns: '3',
      align: 'left',
      iconStyle: 'circle',
      iconColor: 'accent',
      iconColorCustom: '#D4AF37',
      items: [
        { icon: 'map', title: 'Trayectoria estructurada', description: 'Ruta clara semana a semana con hitos concretos.' },
        { icon: 'chart', title: 'Diagnóstico profundo', description: 'Mide tu punto de partida con herramientas validadas.' },
        { icon: 'users', title: 'Comunidad activa', description: 'Comparte el camino con líderes con tu mismo nivel de ambición.' },
      ],
    },
  }),
  def({
    type: 'phasedList',
    label: 'Lista por fases',
    description: 'Lista numerada con meta y etiqueta de fase coloreada (p. ej. los workbooks).',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      columnsField(3),
      {
        key: 'items',
        label: 'Elementos',
        type: 'list',
        itemLabel: 'Elemento',
        itemFields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'meta', label: 'Meta (p. ej. "Sem. 1–2")', type: 'text' },
          { key: 'tag', label: 'Etiqueta de fase', type: 'text' },
          { key: 'color', label: 'Color de la fase', type: 'color' },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: '10 guías de trabajo práctico, una por fase y momento.',
      subtitle: '',
      columns: '2',
      items: [
        { title: 'Propósito y Visión', meta: 'Sem. 1–2', tag: 'Shine Within', color: '#7c3aad' },
        { title: 'Mapa de Valores', meta: 'Sem. 3–4', tag: 'Shine Within', color: '#7c3aad' },
        { title: 'Autoliderazgo Consciente', meta: 'Sem. 5–6', tag: 'Shine Within', color: '#7c3aad' },
        { title: 'Comunicación Auténtica', meta: 'Sem. 7–8', tag: 'Shine Out', color: '#2d7dd2' },
        { title: 'Presencia Ejecutiva', meta: 'Sem. 9–10', tag: 'Shine Out', color: '#2d7dd2' },
        { title: 'Narrativa de Impacto', meta: 'Sem. 11–12', tag: 'Shine Out', color: '#2d7dd2' },
        { title: 'Pensamiento Estratégico', meta: 'Sem. 13–15', tag: 'Shine Up', color: '#15a37a' },
        { title: 'Influencia sin Autoridad', meta: 'Sem. 16–18', tag: 'Shine Up', color: '#15a37a' },
        { title: 'Equipos de Alto Desempeño', meta: 'Sem. 19–21', tag: 'Shine Beyond', color: '#d45a0f' },
        { title: 'Legado y Expansión', meta: 'Sem. 22–24', tag: 'Shine Beyond', color: '#d45a0f' },
      ],
    },
  }),
  def({
    type: 'featureGroups',
    label: 'Grupos de características',
    description: 'Bloques temáticos, cada uno con un resumen y varios sub-ítems.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      {
        key: 'items',
        label: 'Grupos',
        type: 'list',
        itemLabel: 'Grupo',
        itemFields: [
          { key: 'title', label: 'Título del grupo', type: 'text' },
          { key: 'summary', label: 'Resumen', type: 'textarea' },
          {
            key: 'subItems',
            label: 'Sub-ítems',
            type: 'list',
            itemLabel: 'Sub-ítem',
            itemFields: [
              { key: 'title', label: 'Título', type: 'text' },
              { key: 'text', label: 'Texto', type: 'textarea' },
            ],
          },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: 'Todo lo que necesitas para crecer, en un solo lugar.',
      subtitle: 'Diagnóstico, ruta, contenido, mentoría y comunidad. Sin dispersión.',
      items: [
        {
          title: 'Contenido exclusivo',
          summary: 'Clases, masterclasses y material de apoyo diseñados para aplicar en tu realidad profesional inmediata.',
          subItems: [
            { title: 'Video-clases por fase', text: 'Lecciones cortas y accionables alineadas a cada workbook.' },
            { title: 'Masterclasses de Advisors', text: 'Sesiones de expertos sobre temas de liderazgo de alto impacto.' },
            { title: 'Biblioteca de recursos', text: 'Lecturas, frameworks y herramientas curadas por especialistas.' },
          ],
        },
        {
          title: 'Sesiones de mentoría con expertos',
          summary: 'Acompañamiento 1:1 y grupal con Advisors especializados que te ayudan a tomar decisiones con mayor claridad y velocidad.',
          subItems: [
            { title: 'Advisor Guía', text: 'Acompañamiento continuo a lo largo de tu ruta. Seguimiento semanal, retroalimentación y accountability.' },
            { title: 'Advisor Experto', text: 'Sesiones focalizadas con especialistas según la fase que estés transitando en el programa.' },
            { title: 'Estructura probada', text: 'Cada sesión tiene un marco de preparación, conversación y compromisos que aceleran el avance real.' },
          ],
        },
        {
          title: 'Comunidad · Networking',
          summary: 'Una red de líderes con el mismo nivel de ambición y compromiso. Colaboración real, no solo contactos.',
          subItems: [
            { title: 'Sesiones grupales en vivo', text: 'Encuentros semanales con el grupo del programa para compartir avances y desafíos reales.' },
            { title: 'Workshops y convocatorias', text: 'Eventos de profundización, talleres temáticos y encuentros presenciales o virtuales.' },
            { title: 'Red de líderes 4Shine', text: 'Acceso permanente a la comunidad: más de 1.000 líderes activos en distintas industrias.' },
          ],
        },
      ],
    },
  }),
  def({
    type: 'discoveryReport',
    label: 'Informe Descubrimiento (ejemplo)',
    description: 'Muestra del informe: índice global, score por pilar, radar, 16 competencias y análisis IA de ejemplo.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Etiqueta superior', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'aiBadge', label: 'Etiqueta del análisis IA', type: 'text' },
      { key: 'aiLabel', label: 'Sub-etiqueta IA', type: 'text' },
      { key: 'aiText', label: 'Texto del análisis IA (párrafos separados por una línea en blanco)', type: 'textarea' },
      { key: 'disclaimer', label: 'Aviso al pie', type: 'textarea' },
    ],
    defaults: {
      kicker: 'Ejemplo del informe',
      title: 'Así luce tu resultado.',
      subtitle: 'Datos de ejemplo. Tu diagnóstico real generará scores propios con análisis IA personalizado.',
      aiBadge: 'Análisis IA · Shine Up',
      aiLabel: 'Ejemplo de lectura ejecutiva',
      aiText:
        'Tu perfil muestra una orientación estratégica sólida — Shine Up es tu pilar más desarrollado, lo que indica claridad sobre hacia dónde vas y capacidad real para generar tracción en proyectos complejos. Esta fortaleza es un activo diferencial cuando necesitas articular visión o convencer stakeholders.\n\nShine Out es el área con mayor potencial de desarrollo: la brecha entre tu visión (Up, 81) y tu capacidad de comunicarla con impacto (Out, 58) es frecuente en líderes técnicos que han crecido por resultados más que por influencia directa. Desarrollar deliberadamente tu presencia ejecutiva y comunicación estratégica es la palanca de mayor retorno en esta etapa de tu carrera.',
      disclaimer: 'Este análisis es un ejemplo. El informe real se genera con IA a partir de tus respuestas específicas.',
    },
  }),
  def({
    type: 'steps',
    label: 'Pasos / Proceso',
    description: 'Proceso numerado en horizontal o vertical.',
    category: 'Contenido',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      {
        key: 'direction',
        label: 'Distribución',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal (columnas)' },
          { value: 'vertical', label: 'Vertical (línea de tiempo)' },
        ],
      },
      {
        key: 'numberColor',
        label: 'Color de los números',
        type: 'select',
        group: 'style',
        options: [
          { value: 'accent', label: 'Acento (marca)' },
          { value: 'primary', label: 'Primario (marca)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      { key: 'numberColorCustom', label: 'Números — color personalizado', type: 'color', group: 'style', showIf: (p) => p.numberColor === 'custom' },
      {
        key: 'items',
        label: 'Pasos',
        type: 'list',
        itemLabel: 'Paso',
        itemFields: [
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'textarea' },
        ],
      },
    ],
    defaults: {
      kicker: 'Cómo funciona',
      title: 'Tu ruta en tres pasos.',
      direction: 'horizontal',
      numberColor: 'accent',
      numberColorCustom: '#D4AF37',
      items: [
        { title: 'Diagnóstico', description: 'Mide tu punto de partida en los 4 pilares.' },
        { title: 'Ruta guiada', description: '24 semanas con workbooks y mentoría experta.' },
        { title: 'Resultados', description: 'Hitos claros y transformación medible.' },
      ],
    },
  }),
  def({
    type: 'testimonials',
    label: 'Testimonios',
    description: 'Citas de clientes o participantes con nombre y cargo.',
    category: 'Social',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
      columnsField(3),
      {
        key: 'style',
        label: 'Estilo',
        type: 'select',
        group: 'style',
        options: [
          { value: 'border', label: 'Línea lateral de color' },
          { value: 'card', label: 'Tarjeta' },
        ],
      },
      {
        key: 'items',
        label: 'Testimonios',
        type: 'list',
        itemLabel: 'Testimonio',
        itemFields: [
          { key: 'text', label: 'Cita', type: 'textarea' },
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'role', label: 'Cargo / contexto', type: 'text' },
          { key: 'avatarUrl', label: 'Foto (opcional)', type: 'image' },
          { key: 'color', label: 'Color', type: 'color' },
        ],
      },
    ],
    defaults: {
      title: 'Resultados reales en líderes reales.',
      columns: '3',
      style: 'border',
      background: 'dark',
      items: [
        {
          text: '"En 12 semanas convertí mi visión en una ruta concreta."',
          name: 'Pablo R.',
          role: 'Director de Tecnología',
          avatarUrl: '',
          color: '#5b2d8a',
        },
      ],
    },
  }),
  def({
    type: 'quote',
    label: 'Cita destacada',
    description: 'Una sola cita grande con autor, para dar peso a un mensaje.',
    category: 'Social',
    fields: [
      { key: 'text', label: 'Cita', type: 'textarea' },
      { key: 'name', label: 'Autor', type: 'text' },
      { key: 'role', label: 'Cargo / contexto', type: 'text' },
      { key: 'avatarUrl', label: 'Foto (opcional)', type: 'image' },
      { key: 'showQuoteMark', label: 'Mostrar comillas decorativas', type: 'toggle', group: 'style' },
    ],
    defaults: {
      text: 'El liderazgo real no se improvisa: se construye con método, conciencia y comunidad.',
      name: '',
      role: '',
      avatarUrl: '',
      showQuoteMark: true,
      background: 'darker',
      contentWidth: 'narrow',
    },
  }),
  def({
    type: 'team',
    label: 'Equipo / Personas',
    description: 'Personas con foto o avatar, nombre, cargo y descripción.',
    category: 'Social',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      columnsField(4),
      {
        key: 'photoShape',
        label: 'Forma de la foto',
        type: 'select',
        group: 'style',
        options: [
          { value: 'circle', label: 'Circular' },
          { value: 'rounded', label: 'Redondeada' },
          { value: 'square', label: 'Recta' },
        ],
      },
      {
        key: 'items',
        label: 'Personas',
        type: 'list',
        itemLabel: 'Persona',
        itemFields: [
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'role', label: 'Cargo / especialidad', type: 'text' },
          { key: 'detail', label: 'Detalle (opcional)', type: 'text' },
          { key: 'photoUrl', label: 'Foto', type: 'image' },
          { key: 'color', label: 'Color del avatar (si no hay foto)', type: 'color' },
        ],
      },
    ],
    defaults: {
      kicker: '',
      title: 'Aprende de quienes ya lo han vivido.',
      subtitle: '',
      columns: '3',
      photoShape: 'circle',
      items: [
        { name: 'María Torres', role: 'Liderazgo Estratégico', detail: '15 años de experiencia', photoUrl: '', color: '#5b2d8a' },
        { name: 'Jorge Espinosa', role: 'Comunicación Ejecutiva', detail: '12 años de experiencia', photoUrl: '', color: '#1e5fa8' },
        { name: 'Laura Méndez', role: 'Transformación Organizacional', detail: '18 años de experiencia', photoUrl: '', color: '#0e7a5a' },
      ],
    },
  }),
  def({
    type: 'advisors',
    label: 'Advisors (dinámico)',
    description: 'Perfiles públicos de los advisors activos en la plataforma: foto, nombre, LinkedIn y biografía. Se actualiza solo.',
    category: 'Social',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      {
        key: 'layout',
        label: 'Presentación',
        type: 'select',
        options: [
          { value: 'grid', label: 'Grilla simple' },
          { value: 'cards', label: 'Tarjetas' },
          { value: 'accordion', label: 'Acordeón' },
          { value: 'slider', label: 'Slider / carrusel' },
        ],
      },
      {
        key: 'mode',
        label: '¿Quiénes se muestran?',
        type: 'select',
        options: [
          { value: 'all', label: 'Todos los advisors activos' },
          { value: 'selected', label: 'Solo los seleccionados' },
        ],
        help: 'Los advisors desactivados en la plataforma nunca se muestran.',
      },
      {
        key: 'selectedIds',
        label: 'Selecciona los advisors',
        type: 'advisors',
        showIf: (p) => p.mode === 'selected',
      },
      { ...columnsField(4), showIf: (p) => p.layout === 'grid' || p.layout === 'cards' },
      {
        key: 'limit',
        label: 'Máximo de advisors (0 = todos)',
        type: 'range',
        min: 0,
        max: 24,
        step: 1,
      },
      { key: 'showBio', label: 'Mostrar biografía', type: 'toggle' },
      { key: 'showTopics', label: 'Mostrar temas que trabaja', type: 'toggle' },
      { key: 'showLocation', label: 'Mostrar ubicación', type: 'toggle' },
      { key: 'showExperience', label: 'Mostrar años de experiencia', type: 'toggle' },
      { key: 'showLinkedIn', label: 'Mostrar LinkedIn', type: 'toggle' },
      { key: 'showWebsite', label: 'Mostrar sitio web y Twitter/X', type: 'toggle' },
      {
        key: 'photoShape',
        label: 'Forma de la foto',
        type: 'select',
        group: 'style',
        options: [
          { value: 'circle', label: 'Circular' },
          { value: 'rounded', label: 'Redondeada' },
          { value: 'square', label: 'Recta' },
        ],
      },
    ],
    defaults: {
      kicker: 'Nuestros Advisors',
      title: 'Aprende de quienes ya lo han vivido.',
      subtitle: 'Practicantes del liderazgo que acompañan desde la experiencia real.',
      layout: 'grid',
      mode: 'all',
      selectedIds: [],
      columns: '3',
      limit: 0,
      showBio: true,
      showTopics: true,
      showLocation: true,
      showExperience: true,
      showLinkedIn: true,
      showWebsite: true,
      photoShape: 'circle',
    },
  }),
  def({
    type: 'logos',
    label: 'Logos',
    description: 'Franja de logos de clientes o aliados.',
    category: 'Social',
    fields: [
      { key: 'title', label: 'Título (opcional)', type: 'text', placeholder: 'Confían en nosotros' },
      { key: 'grayscale', label: 'Logos en escala de grises', type: 'toggle', group: 'style' },
      {
        key: 'logoHeight',
        label: 'Altura de los logos',
        type: 'select',
        group: 'style',
        options: [
          { value: 'sm', label: 'Pequeña' },
          { value: 'md', label: 'Mediana' },
          { value: 'lg', label: 'Grande' },
        ],
      },
      {
        key: 'items',
        label: 'Logos',
        type: 'list',
        itemLabel: 'Logo',
        itemFields: [
          { key: 'imageUrl', label: 'Imagen del logo', type: 'image' },
          { key: 'name', label: 'Nombre (alt)', type: 'text' },
          { key: 'href', label: 'Enlace (opcional)', type: 'text' },
        ],
      },
    ],
    defaults: {
      title: 'Confían en nosotros',
      grayscale: true,
      logoHeight: 'md',
      paddingY: 'compact',
      items: [],
    },
  }),
  def({
    type: 'gallery',
    label: 'Galería',
    description: 'Grilla de imágenes con pie opcional.',
    category: 'Media',
    fields: [
      { key: 'title', label: 'Título (opcional)', type: 'textarea' },
      columnsField(4),
      {
        key: 'imageShape',
        label: 'Forma de las imágenes',
        type: 'select',
        group: 'style',
        options: [
          { value: 'rounded', label: 'Redondeadas' },
          { value: 'square', label: 'Rectas' },
        ],
      },
      {
        key: 'aspect',
        label: 'Proporción',
        type: 'select',
        group: 'style',
        options: [
          { value: 'landscape', label: 'Horizontal (4:3)' },
          { value: 'square', label: 'Cuadrada (1:1)' },
          { value: 'portrait', label: 'Vertical (3:4)' },
          { value: 'wide', label: 'Panorámica (16:9)' },
        ],
      },
      {
        key: 'items',
        label: 'Imágenes',
        type: 'list',
        itemLabel: 'Imagen',
        itemFields: [
          { key: 'imageUrl', label: 'Imagen', type: 'image' },
          { key: 'caption', label: 'Pie (opcional)', type: 'text' },
        ],
      },
    ],
    defaults: {
      title: '',
      columns: '3',
      imageShape: 'rounded',
      aspect: 'landscape',
      items: [],
    },
  }),
  def({
    type: 'pricing',
    label: 'Planes y precios',
    description: 'Tarjetas de precios con lista de características.',
    category: 'Conversión',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
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
  }),
  def({
    type: 'pricingMatrix',
    label: 'Planes y precios (dinámico)',
    description:
      'Matriz de planes y productos tomada AUTOMÁTICAMENTE de Administración → Planes. Planes, precios, productos puntuales y botones se actualizan solos; aquí solo editas el encabezado.',
    category: 'Conversión',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    ],
    defaults: {
      kicker: '',
      title: 'Planes y precios',
      subtitle:
        'Elige el acceso que mejor se ajusta a tu momento. Todos los caminos llevan a un pago seguro o a un asesor.',
      background: 'dark',
      paddingY: 'normal',
      contentWidth: 'full',
    },
  }),
  def({
    type: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Lista de preguntas expandibles.',
    category: 'Contenido',
    fields: [
      { key: 'title', label: 'Título', type: 'textarea' },
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
      contentWidth: 'narrow',
      items: [{ question: '¿Cómo funciona el programa?', answer: 'Es una ruta estructurada de 24 semanas.' }],
    },
  }),
  def({
    type: 'cta',
    label: 'Llamado a la acción',
    description: 'Sección de cierre con título y botones.',
    category: 'Conversión',
    fields: [
      {
        key: 'layout',
        label: 'Distribución',
        type: 'select',
        options: [
          { value: 'center', label: 'Centrado' },
          { value: 'split', label: 'Texto a la izquierda, botones a la derecha' },
        ],
      },
      { key: 'title', label: 'Título', type: 'textarea' },
      { key: 'body', label: 'Texto', type: 'textarea' },
      buttonsField(),
    ],
    defaults: {
      layout: 'center',
      title: '¿Listo para transformar tu liderazgo?',
      body: 'Empieza hoy con un diagnóstico o únete al programa completo.',
      buttons: [defaultButton({ label: 'Comenzar ahora', href: '/acceso' })],
      background: 'dark',
      paddingY: 'spacious',
    },
  }),
  def({
    type: 'banner',
    label: 'Banner / Franja',
    description: 'Franja angosta con mensaje y botón, ideal para anuncios.',
    category: 'Conversión',
    hideStyleFields: TITLE_STYLE_FIELDS,
    fields: [
      { key: 'text', label: 'Mensaje', type: 'text' },
      buttonsField('Botón'),
    ],
    defaults: {
      text: 'Cupos abiertos para la próxima cohorte.',
      buttons: [defaultButton({ label: 'Inscribirme', href: '/acceso', size: 'sm' })],
      background: 'accent',
      paddingY: 'none',
    },
  }),
  def({
    type: 'video',
    label: 'Video',
    description: 'Video destacado (YouTube, Vimeo o MP4).',
    category: 'Media',
    fields: [
      { key: 'title', label: 'Título (opcional)', type: 'textarea' },
      {
        key: 'videoUrl',
        label: 'URL del video',
        type: 'text',
        help: 'Acepta enlaces de YouTube, Vimeo o archivos .mp4.',
      },
      { key: 'caption', label: 'Pie de video', type: 'text' },
    ],
    defaults: { title: '', videoUrl: '', caption: '', background: 'surface', contentWidth: 'narrow' },
  }),
  def({
    type: 'image',
    label: 'Imagen',
    description: 'Imagen destacada con pie opcional.',
    category: 'Media',
    hideStyleFields: TITLE_STYLE_FIELDS,
    fields: [
      { key: 'imageUrl', label: 'Imagen', type: 'image' },
      { key: 'caption', label: 'Pie de imagen', type: 'text' },
      {
        key: 'imageShape',
        label: 'Forma',
        type: 'select',
        group: 'style',
        options: [
          { value: 'rounded', label: 'Redondeada' },
          { value: 'square', label: 'Recta' },
        ],
      },
      { key: 'shadow', label: 'Sombra', type: 'toggle', group: 'style' },
    ],
    defaults: { imageUrl: '', caption: '', imageShape: 'rounded', shadow: false },
  }),
  def({
    type: 'html',
    label: 'HTML personalizado',
    description: 'Inserta HTML libre (avanzado).',
    category: 'Avanzado',
    hideStyleFields: [...TITLE_STYLE_FIELDS, ...TEXT_STYLE_FIELDS],
    fields: [{ key: 'html', label: 'HTML', type: 'textarea' }],
    defaults: {
      html: '<div style="padding:40px;text-align:center;">Contenido personalizado</div>',
      paddingY: 'none',
      contentWidth: 'full',
    },
  }),
  def({
    type: 'divider',
    label: 'Separador',
    description: 'Línea divisoria entre secciones.',
    category: 'Estructura',
    hideStyleFields: [...TITLE_STYLE_FIELDS, ...TEXT_STYLE_FIELDS],
    fields: [
      {
        key: 'lineColor',
        label: 'Color de la línea',
        type: 'select',
        group: 'style',
        options: [
          { value: 'border', label: 'Sutil (marca)' },
          { value: 'accent', label: 'Acento (marca)' },
          { value: 'custom', label: 'Personalizado' },
        ],
      },
      { key: 'lineColorCustom', label: 'Línea — color personalizado', type: 'color', group: 'style', showIf: (p) => p.lineColor === 'custom' },
      { key: 'lineOpacity', label: 'Opacidad de la línea (%)', type: 'range', group: 'style', min: 5, max: 100, step: 5 },
      {
        key: 'lineWidth',
        label: 'Ancho de la línea',
        type: 'select',
        group: 'style',
        options: [
          { value: 'full', label: 'Ancho completo' },
          { value: 'normal', label: 'Contenido (1240px)' },
          { value: 'short', label: 'Corta (centrada)' },
        ],
      },
      { key: 'thickness', label: 'Grosor (px)', type: 'range', group: 'style', min: 1, max: 8, step: 1 },
    ],
    defaults: {
      lineColor: 'border',
      lineColorCustom: '#D4AF37',
      lineOpacity: 100,
      lineWidth: 'normal',
      thickness: 1,
      paddingY: 'compact',
    },
  }),
  def({
    type: 'spacer',
    label: 'Espaciador',
    description: 'Espacio vertical entre secciones.',
    category: 'Estructura',
    hideStyleFields: [...TITLE_STYLE_FIELDS, ...TEXT_STYLE_FIELDS],
    fields: [{ key: 'height', label: 'Altura (px)', type: 'range', min: 8, max: 320, step: 8 }],
    defaults: { height: 64, paddingY: 'none' },
  }),
];

export const BLOCK_DEFINITION_MAP: Record<string, BlockDefinition> = Object.fromEntries(
  BLOCK_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export const BLOCK_CATEGORIES: BlockDefinition['category'][] = [
  'Estructura',
  'Contenido',
  'Social',
  'Conversión',
  'Media',
  'Avanzado',
];

export function isKnownBlockType(value: unknown): value is SiteBlockType {
  return typeof value === 'string' && value in BLOCK_DEFINITION_MAP;
}

export function createBlock(type: SiteBlockType): SiteBlock {
  const definition = BLOCK_DEFINITION_MAP[type];
  const props = JSON.parse(JSON.stringify(definition?.defaults ?? {})) as SiteBlockProps;
  if (type === 'section') {
    const layout = typeof props.layout === 'string' ? props.layout : '1-1';
    const count = SECTION_LAYOUTS[layout]?.length ?? 2;
    props.columns = Array.from({ length: count }, () => makeColumn());
  }
  return {
    blockId: `blk_${Math.random().toString(36).slice(2, 10)}`,
    type,
    isVisible: true,
    props,
  };
}

/** Crea un widget destinado a vivir dentro de una columna: hereda el fondo de la sección y no gestiona su propio espaciado. */
export function createEmbeddedBlock(type: SiteBlockType): SiteBlock {
  const block = createBlock(type);
  block.props.background = 'inherit';
  block.props.paddingY = 'none';
  block.props.contentWidth = 'full';
  return block;
}

/** Ajusta el arreglo de columnas de una sección cuando cambia el layout: conserva los widgets y funde las columnas sobrantes en la última. */
export function reconcileSectionColumns(props: SiteBlockProps, layout: string): SiteBlockProps {
  const widths = SECTION_LAYOUTS[layout] ?? [1, 1];
  const existing = Array.isArray(props.columns) ? (props.columns as { columnId?: string; blocks?: unknown[] }[]) : [];
  const columns = existing
    .filter((col) => col && typeof col === 'object')
    .map((col) => ({
      columnId: typeof col.columnId === 'string' && col.columnId ? col.columnId : makeColumn().columnId,
      blocks: Array.isArray(col.blocks) ? col.blocks : [],
    }));
  while (columns.length < widths.length) columns.push(makeColumn() as { columnId: string; blocks: unknown[] });
  while (columns.length > widths.length) {
    const removed = columns.pop();
    if (removed && columns.length > 0) {
      columns[columns.length - 1].blocks = [...columns[columns.length - 1].blocks, ...removed.blocks];
    }
  }
  return { ...props, layout, columns };
}
