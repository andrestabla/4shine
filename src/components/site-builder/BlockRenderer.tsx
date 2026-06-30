import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { CSSProperties, ReactNode } from 'react';
import type { SiteBlock, SiteBlockProps } from '@/features/site-builder/types';
import { SECTION_LAYOUTS } from '@/features/site-builder/registry';
import { SITE_ICONS, hasSiteIcon } from '@/features/site-builder/icons';
import { AdvisorsBlockClient } from './AdvisorsBlockClient';
import { PricingMatrixBlockClient } from './PricingMatrixBlockClient';
import {
  DiscoveryRadarChart,
  DiscoveryCompetenciesChart,
  GlobalIndexDisplay,
  PillarScoreBars,
} from '@/app/descubrimiento/DiscoveryShowcaseCharts';

/* ─────────────────────────── Prop helpers ─────────────────────────── */

function str(props: SiteBlockProps, key: string): string {
  const value = props[key];
  return typeof value === 'string' ? value : '';
}

function bool(props: SiteBlockProps, key: string, fallback = false): boolean {
  const value = props[key];
  return typeof value === 'boolean' ? value : fallback;
}

function num(props: SiteBlockProps, key: string, fallback: number): number {
  const value = props[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function items(props: SiteBlockProps, key = 'items'): SiteBlockProps[] {
  const value = props[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SiteBlockProps => !!item && typeof item === 'object');
}

/* ─────────────────────────── Color helpers ─────────────────────────── */

function parseHex(value: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function isDarkColor(value: string): boolean {
  const rgb = parseHex(value);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.6;
}

function withAlpha(color: string, alphaPct: number): string {
  if (alphaPct >= 100) return color;
  return `color-mix(in srgb, ${color} ${Math.max(0, alphaPct)}%, transparent)`;
}

/* ─────────────────────────── Estilo de sección ───────────────────────────
 * Resuelve los controles compartidos de estilo (fondo por token de marca,
 * color personalizado con opacidad, degradado, imagen con capa, colores de
 * título/texto, espaciado y ancho) hacia estilos concretos.
 */

interface SectionPalette {
  baseStyle: CSSProperties;
  backgroundKind: string;
  isDark: boolean;
  heading: string;
  text: string;
  muted: string;
  titleColor: string;
  titleClass: string;
  paddingClass: string;
  width: 'normal' | 'narrow' | 'full';
}

const TITLE_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-2xl md:text-3xl',
  md: 'text-4xl md:text-5xl',
  lg: 'text-5xl md:text-6xl',
  xl: 'text-5xl md:text-6xl lg:text-7xl',
};

const PADDING_CLASSES: Record<string, string> = {
  none: 'py-0',
  compact: 'py-10',
  normal: 'py-20',
  spacious: 'py-24 md:py-32',
};

export function resolveSectionPalette(props: SiteBlockProps): SectionPalette {
  const backgroundKind = str(props, 'background') || 'light';
  const baseStyle: CSSProperties = {};
  let isDark = false;
  let onAccent = false;

  switch (backgroundKind) {
    case 'inherit':
      baseStyle.background = 'transparent';
      isDark = props.__parentDark === true;
      break;
    case 'surface':
      baseStyle.background = 'var(--brand-surface)';
      break;
    case 'dark':
      baseStyle.background = 'var(--brand-dark)';
      isDark = true;
      break;
    case 'darker':
      baseStyle.background = 'var(--brand-darker)';
      isDark = true;
      break;
    case 'primary':
      baseStyle.background = 'var(--brand-primary)';
      isDark = true;
      break;
    case 'secondary':
      baseStyle.background = 'var(--brand-secondary)';
      isDark = true;
      break;
    case 'accent':
      baseStyle.background = 'var(--brand-accent)';
      onAccent = true;
      break;
    case 'custom': {
      const hex = str(props, 'backgroundCustom') || '#0D1B2A';
      baseStyle.background = withAlpha(hex, num(props, 'backgroundOpacity', 100));
      isDark = isDarkColor(hex);
      break;
    }
    case 'gradient': {
      const from = str(props, 'gradientFrom') || '#0D1B2A';
      const to = str(props, 'gradientTo') || '#D4AF37';
      const angle = num(props, 'gradientAngle', 135);
      baseStyle.background = `linear-gradient(${angle}deg, ${from}, ${to})`;
      isDark = isDarkColor(from);
      break;
    }
    case 'image':
      baseStyle.background = 'var(--brand-dark)';
      isDark = true;
      break;
    default:
      baseStyle.background = '#ffffff';
      break;
  }

  let heading = onAccent ? 'var(--brand-on-accent)' : isDark ? '#ffffff' : 'var(--brand-primary)';
  let text = onAccent
    ? 'color-mix(in srgb, var(--brand-on-accent) 85%, transparent)'
    : isDark
      ? 'rgba(255,255,255,0.85)'
      : 'var(--brand-ink-soft)';
  let muted = onAccent
    ? 'color-mix(in srgb, var(--brand-on-accent) 65%, transparent)'
    : isDark
      ? 'rgba(255,255,255,0.6)'
      : 'var(--brand-ink-muted)';

  if (str(props, 'textColor') === 'custom') {
    const custom = str(props, 'textColorCustom') || '#FFFFFF';
    text = custom;
    muted = withAlpha(custom, 65);
    heading = custom;
  }

  const titleColorKind = str(props, 'titleColor') || 'auto';
  const titleColor =
    titleColorKind === 'accent'
      ? 'var(--brand-accent)'
      : titleColorKind === 'primary'
        ? 'var(--brand-primary)'
        : titleColorKind === 'custom'
          ? str(props, 'titleColorCustom') || heading
          : heading;

  return {
    baseStyle,
    backgroundKind,
    isDark,
    heading,
    text,
    muted,
    titleColor,
    titleClass: TITLE_SIZE_CLASSES[str(props, 'titleSize')] ?? TITLE_SIZE_CLASSES.md,
    paddingClass: PADDING_CLASSES[str(props, 'paddingY')] ?? PADDING_CLASSES.normal,
    width: str(props, 'contentWidth') === 'narrow' ? 'narrow' : str(props, 'contentWidth') === 'full' ? 'full' : 'normal',
  };
}

export function SectionShell({
  props,
  palette,
  children,
  widthOverride,
}: {
  props: SiteBlockProps;
  palette: SectionPalette;
  children: ReactNode;
  widthOverride?: 'normal' | 'narrow' | 'full';
}) {
  const width = widthOverride ?? palette.width;
  const imageUrl = palette.backgroundKind === 'image' ? str(props, 'backgroundImageUrl') : '';
  const overlayColor = str(props, 'overlayColor') || '#0D1B2A';
  const overlayOpacity = num(props, 'overlayOpacity', 70);

  return (
    <section className="relative overflow-hidden" style={palette.baseStyle}>
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: withAlpha(overlayColor, overlayOpacity) }} />
        </>
      )}
      <div
        className={`relative mx-auto w-full ${
          width === 'full' ? '' : width === 'narrow' ? 'max-w-[900px] px-6 md:px-10 lg:px-14' : 'max-w-[1240px] px-6 md:px-10 lg:px-14'
        }`}
      >
        <div className={palette.paddingClass}>{children}</div>
      </div>
    </section>
  );
}

function Markdown({ text, color }: { text: string; color: string }) {
  if (!text.trim()) return null;
  return (
    <div className="space-y-4 text-base leading-relaxed md:text-lg" style={{ color }}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

function SectionHeading({
  props,
  palette,
  center,
  className = '',
}: {
  props: SiteBlockProps;
  palette: SectionPalette;
  center?: boolean;
  className?: string;
}) {
  const kicker = str(props, 'kicker');
  const title = str(props, 'title');
  const subtitle = str(props, 'subtitle');
  if (!kicker && !title && !subtitle) return null;
  return (
    <div className={`${center ? 'text-center' : ''} ${className}`}>
      {kicker && (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>
          {kicker}
        </p>
      )}
      {title && (
        <h2
          className={`${center ? 'mx-auto' : ''} max-w-[24ch] font-black tracking-tight ${palette.titleClass}`}
          style={{ color: palette.titleColor }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={`mt-4 max-w-[52ch] text-base md:text-lg ${center ? 'mx-auto' : ''}`} style={{ color: palette.text }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────── Botones ─────────────────────────── */

interface ButtonSpec {
  label: string;
  href: string;
  variant: string;
  color: string;
  customColor: string;
  shape: string;
  size: string;
}

function normalizeButton(raw: SiteBlockProps): ButtonSpec | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  if (!label) return null;
  return {
    label,
    href: typeof raw.href === 'string' && raw.href ? raw.href : '#',
    variant: typeof raw.variant === 'string' ? raw.variant : 'solid',
    color: typeof raw.color === 'string' ? raw.color : 'accent',
    customColor: typeof raw.customColor === 'string' ? raw.customColor : '#D4AF37',
    shape: typeof raw.shape === 'string' ? raw.shape : 'brand',
    size: typeof raw.size === 'string' ? raw.size : 'md',
  };
}

/** Soporta el formato nuevo (props.buttons) y el legado (primaryLabel/secondaryLabel/buttonLabel). */
function resolveButtons(props: SiteBlockProps): ButtonSpec[] {
  if (Array.isArray(props.buttons)) {
    return (props.buttons as SiteBlockProps[]).map(normalizeButton).filter((b): b is ButtonSpec => b !== null);
  }
  const legacy: ButtonSpec[] = [];
  if (str(props, 'primaryLabel')) {
    legacy.push({
      label: str(props, 'primaryLabel'),
      href: str(props, 'primaryHref') || '#',
      variant: 'solid',
      color: 'accent',
      customColor: '#D4AF37',
      shape: 'pill',
      size: 'md',
    });
  }
  if (str(props, 'secondaryLabel')) {
    legacy.push({
      label: str(props, 'secondaryLabel'),
      href: str(props, 'secondaryHref') || '#',
      variant: 'outline',
      color: 'white',
      customColor: '#FFFFFF',
      shape: 'pill',
      size: 'md',
    });
  }
  if (str(props, 'buttonLabel')) {
    legacy.push({
      label: str(props, 'buttonLabel'),
      href: str(props, 'buttonHref') || '#',
      variant: 'outline',
      color: 'primary',
      customColor: '#0D1B2A',
      shape: 'pill',
      size: 'md',
    });
  }
  return legacy;
}

function buttonPalette(spec: ButtonSpec): { main: string; on: string } {
  switch (spec.color) {
    case 'primary':
      return { main: 'var(--brand-primary)', on: '#ffffff' };
    case 'secondary':
      return { main: 'var(--brand-secondary)', on: '#ffffff' };
    case 'white':
      return { main: '#ffffff', on: 'var(--brand-primary)' };
    case 'custom':
      return { main: spec.customColor, on: isDarkColor(spec.customColor) ? '#ffffff' : '#10131a' };
    case 'accent':
    default:
      return { main: 'var(--brand-accent)', on: 'var(--brand-on-accent)' };
  }
}

const BUTTON_RADIUS: Record<string, string> = {
  brand: 'calc(var(--brand-radius-rem) * 1rem + 0.5rem)',
  pill: '9999px',
  rounded: '0.75rem',
  square: '0px',
};

const BUTTON_SIZE: Record<string, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-7 py-3 text-sm',
  lg: 'px-9 py-4 text-base',
};

export function SiteButton({ spec, sectionDark }: { spec: ButtonSpec; sectionDark: boolean }) {
  const { main, on } = buttonPalette(spec);
  const radius = BUTTON_RADIUS[spec.shape] ?? BUTTON_RADIUS.brand;
  const sizeClass = BUTTON_SIZE[spec.size] ?? BUTTON_SIZE.md;

  if (spec.variant === 'link') {
    return (
      <Link
        href={spec.href}
        className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4 transition hover:opacity-75"
        style={{ color: spec.color === 'white' || (spec.color === 'auto' && sectionDark) ? '#ffffff' : main }}
      >
        {spec.label} →
      </Link>
    );
  }

  const style: CSSProperties = { borderRadius: radius };
  if (spec.variant === 'outline') {
    style.border = `2px solid ${main}`;
    style.color = main;
    style.background = 'transparent';
  } else if (spec.variant === 'ghost') {
    style.color = main;
    style.background = withAlpha(main, 14);
  } else {
    style.background = main;
    style.color = on;
  }

  return (
    <Link href={spec.href} className={`inline-block font-extrabold transition hover:opacity-90 ${sizeClass}`} style={style}>
      {spec.label}
    </Link>
  );
}

function ButtonsRow({
  props,
  palette,
  center,
  className = 'mt-9',
}: {
  props: SiteBlockProps;
  palette: SectionPalette;
  center?: boolean;
  className?: string;
}) {
  const buttons = resolveButtons(props);
  if (buttons.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''} ${className}`}>
      {buttons.map((spec, i) => (
        <SiteButton key={`${spec.label}-${i}`} spec={spec} sectionDark={palette.isDark} />
      ))}
    </div>
  );
}

/* ─────────────────────────── Íconos ─────────────────────────── */

function BlockIcon({
  name,
  color,
  iconStyle,
  size = 20,
}: {
  name: unknown;
  color: string;
  iconStyle?: string;
  size?: number;
}) {
  if (!hasSiteIcon(name)) return null;
  const Icon = SITE_ICONS[name];
  if (iconStyle === 'circle' || iconStyle === 'square') {
    return (
      <span
        className="inline-flex h-11 w-11 items-center justify-center"
        style={{
          background: withAlpha(color, 15),
          color,
          borderRadius: iconStyle === 'circle' ? '9999px' : 'calc(var(--brand-radius-rem) * 1rem + 0.35rem)',
        }}
      >
        <Icon size={size} strokeWidth={1.8} />
      </span>
    );
  }
  return <Icon size={size + 2} strokeWidth={1.6} color={color} />;
}

function brandColorOption(kind: string, custom: string, fallback = 'var(--brand-accent)'): string {
  switch (kind) {
    case 'accent':
      return 'var(--brand-accent)';
    case 'primary':
      return 'var(--brand-primary)';
    case 'custom':
      return custom || fallback;
    default:
      return fallback;
  }
}

const SHAPE_RADIUS_CLASS: Record<string, string> = {
  rounded: 'rounded-3xl',
  square: 'rounded-none',
  circle: 'rounded-full',
};

function gridColsClass(columns: number): string {
  switch (columns) {
    case 2:
      return 'sm:grid-cols-2';
    case 3:
      return 'sm:grid-cols-2 lg:grid-cols-3';
    case 5:
      return 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    default:
      return 'sm:grid-cols-2 lg:grid-cols-4';
  }
}

/* ─────────────────── Sección > Columna > Widget ───────────────────
 * Modelo tipo Elementor: una sección contenedora define la distribución
 * de columnas (grid + fracciones fr); cada columna apila widgets en
 * flex-direction column. Los widgets embebidos heredan la paleta de la
 * sección (fondo 'inherit') y no gestionan su propio ancho/espaciado.
 */

export function sectionGridAttrs(props: SiteBlockProps): { className: string; style: CSSProperties } {
  const layout = str(props, 'layout') || '1-1';
  const widths = SECTION_LAYOUTS[layout] ?? [1, 1];
  const gap = str(props, 'gap') || 'md';
  const gapClass = gap === 'sm' ? 'gap-4' : gap === 'lg' ? 'gap-14' : 'gap-8';
  const align = str(props, 'verticalAlign') || 'top';
  const alignClass = align === 'center' ? 'items-center' : align === 'stretch' ? 'items-stretch' : 'items-start';
  return {
    className: `grid grid-cols-1 ${gapClass} ${alignClass} md:[grid-template-columns:var(--site-cols)]`,
    style: { '--site-cols': widths.map((w) => `${w}fr`).join(' ') } as CSSProperties,
  };
}

export function sectionColumns(props: SiteBlockProps): { columnId: string; blocks: SiteBlock[] }[] {
  const value = props.columns;
  if (!Array.isArray(value)) return [];
  return value
    .filter((col): col is SiteBlockProps => !!col && typeof col === 'object')
    .map((col, i) => ({
      columnId: typeof col.columnId === 'string' && col.columnId ? col.columnId : `col_${i}`,
      blocks: Array.isArray(col.blocks)
        ? (col.blocks as unknown[]).filter(
            (b): b is SiteBlock => !!b && typeof b === 'object' && typeof (b as SiteBlock).blockId === 'string',
          )
        : [],
    }));
}

/** Renderiza un widget dentro de una columna: hereda tono de la sección y cede el control de espaciado/ancho a la columna. */
export function EmbeddedBlock({ block, parentDark }: { block: SiteBlock; parentDark: boolean }) {
  const overridden: SiteBlock = {
    ...block,
    props: {
      ...block.props,
      background: typeof block.props.background === 'string' && block.props.background ? block.props.background : 'inherit',
      paddingY: 'none',
      contentWidth: 'full',
      __parentDark: parentDark,
    },
  };
  return <SiteBlockView block={overridden} />;
}

function SectionContainerBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const columns = sectionColumns(props);
  const grid = sectionGridAttrs(props);
  return (
    <SectionShell props={props} palette={palette}>
      <div className={grid.className} style={grid.style}>
        {columns.map((column) => (
          <div key={column.columnId} className="flex min-w-0 flex-col gap-8">
            {column.blocks
              .filter((child) => child.isVisible !== false)
              .map((child) => (
                <EmbeddedBlock key={child.blockId} block={child} parentDark={palette.isDark} />
              ))}
          </div>
        ))}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

/* ─────────────────────────── Bloques ─────────────────────────── */

function HeroBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'dark', ...props });
  const layout = str(props, 'layout') || (str(props, 'align') === 'center' ? 'center' : 'left');
  const center = layout === 'center';
  const split = layout === 'split' && str(props, 'sideImageUrl');
  const compatHeight = bool(props, 'compact') ? 'compact' : str(props, 'height') || 'normal';
  const heightClass = compatHeight === 'compact' ? 'py-16' : compatHeight === 'tall' ? 'py-32 md:py-44' : 'py-24 md:py-32';
  const videoUrl = str(props, 'backgroundVideoUrl');
  const legacyImage = palette.backgroundKind !== 'image' ? str(props, 'backgroundImageUrl') : '';
  const hasMedia = Boolean(videoUrl || legacyImage || palette.backgroundKind === 'image');
  const kickerColor =
    str(props, 'kickerColor') === 'custom'
      ? str(props, 'kickerColorCustom') || 'var(--brand-accent-soft)'
      : str(props, 'kickerColor') === 'auto'
        ? palette.muted
        : 'var(--brand-accent-soft)';

  const heading = hasMedia ? '#ffffff' : palette.titleColor;
  const subtitleColor = hasMedia ? 'rgba(255,255,255,0.85)' : palette.text;

  const content = (
    <div className={`${center ? 'mx-auto flex flex-col items-center text-center' : ''} ${split ? '' : 'max-w-[1240px]'}`}>
      {str(props, 'kicker') && (
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em]" style={{ color: kickerColor }}>
          {str(props, 'kicker')}
        </p>
      )}
      <h1 className={`max-w-[16ch] font-black leading-[0.95] tracking-tight ${palette.titleClass}`} style={{ color: heading }}>
        {str(props, 'title')}
      </h1>
      {str(props, 'subtitle') && (
        <p className="mt-6 max-w-[54ch] text-base leading-relaxed md:text-lg" style={{ color: subtitleColor }}>
          {str(props, 'subtitle')}
        </p>
      )}
      <ButtonsRow props={props} palette={{ ...palette, isDark: hasMedia || palette.isDark }} center={center} />
    </div>
  );

  return (
    <section className="relative overflow-hidden" style={palette.baseStyle}>
      {videoUrl ? (
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : palette.backgroundKind === 'image' && str(props, 'backgroundImageUrl') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={str(props, 'backgroundImageUrl')} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      ) : legacyImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={legacyImage} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      ) : null}
      {hasMedia && (
        <div
          className="absolute inset-0"
          style={{
            background:
              palette.backgroundKind === 'image'
                ? withAlpha(str(props, 'overlayColor') || '#0D1B2A', num(props, 'overlayOpacity', 70))
                : 'linear-gradient(108deg, color-mix(in srgb, var(--brand-primary) 92%, black) 10%, color-mix(in srgb, var(--brand-primary) 72%, black) 60%, color-mix(in srgb, var(--brand-primary) 55%, black) 100%)',
            opacity: palette.backgroundKind === 'image' ? 1 : 0.92,
          }}
        />
      )}
      <div className="relative mx-auto w-full max-w-[1240px] px-6 md:px-10 lg:px-14">
        <div className={heightClass}>
          {split ? (
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              {content}
              <div className="relative overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={str(props, 'sideImageUrl')} alt="" className="h-full w-full object-cover" style={{ aspectRatio: '4/3' }} />
              </div>
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </section>
  );
}

function StatsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'darker', paddingY: 'compact', ...props });
  const list = items(props);
  if (list.length === 0) return null;
  const valueKind = str(props, 'valueColor') || 'accent';
  const valueColor =
    valueKind === 'auto' ? palette.heading : brandColorOption(valueKind, str(props, 'valueColorCustom'));
  const labelColor =
    str(props, 'labelColor') === 'custom' ? str(props, 'labelColorCustom') || palette.muted : palette.muted;
  const showDividers = bool(props, 'showDividers', true);
  return (
    <SectionShell props={props} palette={palette}>
      <div className={`grid grid-cols-2 ${list.length >= 4 ? 'md:grid-cols-4' : list.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {list.map((item, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center px-6 py-6 text-center ${
              showDividers && i < list.length - 1 ? 'md:border-r' : ''
            }`}
            style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.1)' : 'var(--brand-border)' }}
          >
            <span className="text-4xl font-black md:text-5xl" style={{ color: valueColor }}>
              {typeof item.value === 'string' ? item.value : ''}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: labelColor }}>
              {typeof item.label === 'string' ? item.label : ''}
            </span>
          </div>
        ))}
      </div>
      <ButtonsRow props={props} palette={palette} center className="mt-8" />
    </SectionShell>
  );
}

function RichTextBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const center = str(props, 'align') === 'center';
  return (
    <SectionShell props={props} palette={palette} widthOverride={palette.width === 'full' ? 'full' : palette.width}>
      <div className={center ? 'text-center' : ''}>
        <SectionHeading props={props} palette={palette} center={center} />
        <div className={`mt-6 ${center ? 'mx-auto max-w-[60ch]' : 'max-w-[68ch]'}`}>
          <Markdown text={str(props, 'body')} color={palette.text} />
        </div>
        <ButtonsRow props={props} palette={palette} center={center} className="mt-8" />
      </div>
    </SectionShell>
  );
}

function TextColumnsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-12" />
      <div className={`grid gap-10 ${gridColsClass(columns)}`}>
        {list.map((item, i) => (
          <div key={i}>
            {typeof item.title === 'string' && item.title && (
              <h3 className="mb-3 text-lg font-black tracking-tight" style={{ color: palette.heading }}>
                {item.title}
              </h3>
            )}
            <Markdown text={typeof item.body === 'string' ? item.body : ''} color={palette.text} />
          </div>
        ))}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function ImageTextBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const imageLeft = str(props, 'imageSide') === 'left';
  const imageUrl = str(props, 'imageUrl');
  const imageWidth = str(props, 'imageWidth') || 'half';
  const gridClass =
    imageWidth === 'small'
      ? imageLeft
        ? 'lg:grid-cols-[2fr_3fr]'
        : 'lg:grid-cols-[3fr_2fr]'
      : imageWidth === 'large'
        ? imageLeft
          ? 'lg:grid-cols-[3fr_2fr]'
          : 'lg:grid-cols-[2fr_3fr]'
        : 'lg:grid-cols-2';
  const shapeClass = SHAPE_RADIUS_CLASS[str(props, 'imageShape')] ?? 'rounded-3xl';
  const shadow = bool(props, 'imageShadow', true);

  return (
    <SectionShell props={props} palette={palette}>
      <div className={`grid items-center gap-16 ${gridClass}`}>
        <div className={imageLeft ? 'lg:order-2' : ''}>
          {str(props, 'kicker') && (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>
              {str(props, 'kicker')}
            </p>
          )}
          <h2 className={`max-w-[22ch] font-black leading-[1.05] tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
            {str(props, 'title')}
          </h2>
          <div className="mt-6 max-w-[52ch]">
            <Markdown text={str(props, 'body')} color={palette.text} />
          </div>
          <ButtonsRow props={props} palette={palette} className="mt-8" />
        </div>
        {imageUrl ? (
          <div
            className={`relative overflow-hidden ${shapeClass} ${shadow ? 'shadow-[0_24px_64px_rgba(0,0,0,0.18)]' : ''} ${imageLeft ? 'lg:order-1' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={str(props, 'title')}
              className="h-full w-full object-cover"
              style={{ aspectRatio: str(props, 'imageShape') === 'circle' ? '1/1' : '4/3' }}
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center border border-dashed ${shapeClass} ${imageLeft ? 'lg:order-1' : ''}`}
            style={{
              aspectRatio: '4/3',
              borderColor: palette.isDark ? 'rgba(255,255,255,0.25)' : 'var(--brand-border-strong)',
              color: palette.muted,
            }}
          >
            <span className="text-sm">Agrega una imagen</span>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function CardsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '4', 10) || 4));
  const cardStyle = str(props, 'style') || 'color';
  const radiusClass = str(props, 'cardShape') === 'square' ? 'rounded-none' : 'rounded-3xl';
  const showNumbers = bool(props, 'showNumbers', true);

  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-14" />
      <div className={`grid gap-5 ${gridColsClass(columns)}`}>
        {list.map((item, i) => {
          const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-primary)';
          const title = typeof item.title === 'string' ? item.title : '';
          const description = typeof item.description === 'string' ? item.description : '';
          const detail = typeof item.detail === 'string' ? item.detail : '';
          const href = typeof item.href === 'string' ? item.href : '';

          const inner =
            cardStyle === 'color' ? (
              <article
                className={`group relative h-full overflow-hidden p-7 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,0,0,0.22)] ${radiusClass}`}
                style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, white))` }}
              >
                {showNumbers && (
                  <span className="pointer-events-none absolute -right-3 -top-5 select-none text-[8.5rem] font-black leading-none text-white/[0.07]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
                <BlockIcon name={item.icon} color="rgba(255,255,255,0.88)" size={24} />
                <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-snug text-white/80">{description}</p>
                {detail && <p className="mt-3 text-[13px] leading-relaxed text-white/60">{detail}</p>}
              </article>
            ) : (
              <article
                className={`h-full p-7 transition duration-300 hover:-translate-y-1 ${radiusClass} ${cardStyle === 'glass' ? 'backdrop-blur' : 'border'}`}
                style={
                  cardStyle === 'glass'
                    ? { background: palette.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }
                    : {
                        borderColor: palette.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
                        background: palette.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                      }
                }
              >
                <div className="flex items-center gap-3">
                  <BlockIcon name={item.icon} color={color} size={20} />
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color, display: hasSiteIcon(item.icon) ? 'none' : 'inline-block' }} />
                </div>
                <h3 className="mt-4 text-lg font-black tracking-tight" style={{ color: palette.heading }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-snug" style={{ color: palette.text }}>
                  {description}
                </p>
                {detail && (
                  <p className="mt-3 text-[13px] leading-relaxed" style={{ color: palette.muted }}>
                    {detail}
                  </p>
                )}
              </article>
            );

          return href ? (
            <Link key={i} href={href} className="block h-full">
              {inner}
            </Link>
          ) : (
            <div key={i} className="h-full">
              {inner}
            </div>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function FeaturesBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  const center = str(props, 'align') === 'center';
  const iconColor = brandColorOption(str(props, 'iconColor') || 'accent', str(props, 'iconColorCustom'));
  const iconStyle = str(props, 'iconStyle') || 'circle';

  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} center={center} className="mb-12" />
      <div className={`grid gap-10 ${gridColsClass(columns)}`}>
        {list.map((item, i) => (
          <div key={i} className={center ? 'flex flex-col items-center text-center' : ''}>
            <BlockIcon name={item.icon} color={iconColor} iconStyle={iconStyle} />
            <h3 className="mt-4 text-base font-black" style={{ color: palette.heading }}>
              {typeof item.title === 'string' ? item.title : ''}
            </h3>
            <p className="mt-2 max-w-[38ch] text-sm leading-relaxed" style={{ color: palette.text }}>
              {typeof item.description === 'string' ? item.description : ''}
            </p>
          </div>
        ))}
      </div>
      <ButtonsRow props={props} palette={palette} center={center} className="mt-10" />
    </SectionShell>
  );
}

function PhasedListBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(3, Math.max(1, parseInt(str(props, 'columns') || '2', 10) || 2));
  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-10" />
      <div className={`grid gap-x-10 ${gridColsClass(columns)}`}>
        {list.map((item, i) => {
          const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-primary)';
          const title = typeof item.title === 'string' ? item.title : '';
          const meta = typeof item.meta === 'string' ? item.meta : '';
          const tag = typeof item.tag === 'string' ? item.tag : '';
          return (
            <div
              key={i}
              className="flex items-center gap-4 border-b py-4"
              style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.10)' : 'var(--brand-border)' }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: color }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-black leading-tight" style={{ color: palette.heading }}>
                  {title}
                </p>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: palette.muted }}>
                  {meta}
                  {meta && tag ? ' · ' : ''}
                  {tag}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function FeatureGroupsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-12" />
      <div className="space-y-9">
        {list.map((group, i) => {
          const gtitle = typeof group.title === 'string' ? group.title : '';
          const summary = typeof group.summary === 'string' ? group.summary : '';
          const subs = Array.isArray(group.subItems) ? (group.subItems as SiteBlockProps[]) : [];
          return (
            <div
              key={i}
              className="grid gap-6 border-t pt-8 md:grid-cols-[240px_1fr]"
              style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.12)' : 'var(--brand-border)' }}
            >
              <div>
                <span className="text-sm font-black" style={{ color: 'var(--brand-accent-strong)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-xl font-black" style={{ color: palette.heading }}>
                  {gtitle}
                </h3>
                {summary && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: palette.text }}>
                    {summary}
                  </p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                {subs.map((s, j) => (
                  <div key={j}>
                    <p className="text-sm font-black" style={{ color: palette.heading }}>
                      {typeof s.title === 'string' ? s.title : ''}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: palette.muted }}>
                      {typeof s.text === 'string' ? s.text : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function DiscoveryReportBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const kicker = str(props, 'kicker');
  const title = str(props, 'title');
  const subtitle = str(props, 'subtitle');
  const aiBadge = str(props, 'aiBadge');
  const aiLabel = str(props, 'aiLabel');
  const aiText = str(props, 'aiText');
  const disclaimer = str(props, 'disclaimer');
  const cardBorder = { borderColor: 'var(--brand-border)' };
  return (
    <SectionShell props={props} palette={palette}>
      {kicker && (
        <span
          className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
          style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-accent-strong)' }}
        >
          {kicker}
        </span>
      )}
      {title && (
        <h2 className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight lg:text-[3rem]" style={{ color: palette.titleColor }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed" style={{ color: palette.text }}>
          {subtitle}
        </p>
      )}
      <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]" style={cardBorder}>
          <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>Índice global</p>
          <GlobalIndexDisplay />
          <div className="mt-4 border-t pt-5" style={cardBorder}>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--brand-accent-strong)' }}>Score por pilar</p>
            <PillarScoreBars />
          </div>
        </div>
        <div className="rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]" style={cardBorder}>
          <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>Mapa de pilares</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--brand-ink-soft)' }}>Visualización radial de los 4 ejes de liderazgo</p>
          <DiscoveryRadarChart />
        </div>
      </div>
      <div className="mt-6 rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]" style={cardBorder}>
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>16 competencias · Score individual</p>
        <p className="mb-5 text-sm" style={{ color: 'var(--brand-ink-soft)' }}>Cada barra representa una competencia coloreada por pilar.</p>
        <DiscoveryCompetenciesChart />
      </div>
      {(aiText || aiBadge) && (
        <div className="mt-6 rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-strong) 100%)' }}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {aiBadge && (
              <span className="rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.26em]" style={{ background: 'var(--brand-primary)', color: 'white' }}>
                {aiBadge}
              </span>
            )}
            {aiLabel && <span className="text-[11px] font-semibold" style={{ color: 'var(--brand-ink-muted)' }}>{aiLabel}</span>}
          </div>
          <div className="space-y-4 text-[0.95rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
            {aiText.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {disclaimer && (
            <p className="mt-5 text-[11px] italic" style={{ color: 'var(--brand-ink-muted)' }}>{disclaimer}</p>
          )}
        </div>
      )}
    </SectionShell>
  );
}

function StepsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const vertical = str(props, 'direction') === 'vertical';
  const numberColor = brandColorOption(str(props, 'numberColor') || 'accent', str(props, 'numberColorCustom'));

  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-12" />
      {vertical ? (
        <div className="space-y-10">
          {list.map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black"
                  style={{ background: withAlpha(numberColor, 15), color: numberColor }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < list.length - 1 && <span className="mt-2 w-px flex-1" style={{ background: withAlpha(numberColor, 30) }} />}
              </div>
              <div className="pb-2">
                <h3 className="text-lg font-black" style={{ color: palette.heading }}>
                  {typeof item.title === 'string' ? item.title : ''}
                </h3>
                <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed" style={{ color: palette.text }}>
                  {typeof item.description === 'string' ? item.description : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-10 ${gridColsClass(Math.min(4, Math.max(2, list.length)))}`}>
          {list.map((item, i) => (
            <div key={i}>
              <span className="text-4xl font-black" style={{ color: numberColor }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-lg font-black" style={{ color: palette.heading }}>
                {typeof item.title === 'string' ? item.title : ''}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: palette.text }}>
                {typeof item.description === 'string' ? item.description : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function TestimonialsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'dark', ...props });
  const list = items(props);
  const columns = Math.min(3, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  const card = str(props, 'style') === 'card';

  return (
    <SectionShell props={props} palette={palette}>
      {str(props, 'title') && (
        <h2 className={`mb-14 max-w-[22ch] font-black tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
          {str(props, 'title')}
        </h2>
      )}
      <div className={`grid ${card ? 'gap-6' : 'gap-10'} ${gridColsClass(columns)}`}>
        {list.map((item, i) => {
          const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-accent)';
          const name = typeof item.name === 'string' ? item.name : '';
          const avatarUrl = typeof item.avatarUrl === 'string' ? item.avatarUrl : '';
          return (
            <div
              key={i}
              className={card ? 'rounded-3xl border p-7' : 'border-l-2 pl-6'}
              style={
                card
                  ? {
                      borderColor: palette.isDark ? 'rgba(255,255,255,0.12)' : 'var(--brand-border)',
                      background: palette.isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    }
                  : { borderColor: color }
              }
            >
              <p className="text-[15px] leading-relaxed" style={{ color: palette.text }}>
                {typeof item.text === 'string' ? item.text : ''}
              </p>
              <div className="mt-6 flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ background: color }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-black" style={{ color: palette.heading }}>
                    {name}
                  </p>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    {typeof item.role === 'string' ? item.role : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-12" />
    </SectionShell>
  );
}

function QuoteBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'darker', ...props });
  const avatarUrl = str(props, 'avatarUrl');
  const name = str(props, 'name');
  return (
    <SectionShell props={props} palette={palette}>
      <figure className="mx-auto max-w-[820px] text-center">
        {bool(props, 'showQuoteMark', true) && (
          <span aria-hidden="true" className="block text-7xl font-black leading-none" style={{ color: 'var(--brand-accent)' }}>
            “
          </span>
        )}
        <blockquote className="mt-2 text-2xl font-bold leading-snug tracking-tight md:text-3xl" style={{ color: palette.heading }}>
          {str(props, 'text')}
        </blockquote>
        {(name || avatarUrl) && (
          <figcaption className="mt-8 flex items-center justify-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name} className="h-11 w-11 rounded-full object-cover" />
            )}
            <div className="text-left">
              <p className="text-sm font-black" style={{ color: palette.heading }}>
                {name}
              </p>
              {str(props, 'role') && (
                <p className="text-xs" style={{ color: palette.muted }}>
                  {str(props, 'role')}
                </p>
              )}
            </div>
          </figcaption>
        )}
        <ButtonsRow props={props} palette={palette} center className="mt-8" />
      </figure>
    </SectionShell>
  );
}

function TeamBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  const photoShape = str(props, 'photoShape') || 'circle';
  const photoClass = photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none';

  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-12" />
      <div className={`grid gap-10 ${gridColsClass(columns)}`}>
        {list.map((item, i) => {
          const name = typeof item.name === 'string' ? item.name : '';
          const photoUrl = typeof item.photoUrl === 'string' ? item.photoUrl : '';
          const color = typeof item.color === 'string' && item.color ? item.color : 'var(--brand-primary)';
          return (
            <div key={i} className="flex flex-col items-start">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={name} className={`h-24 w-24 object-cover ${photoClass}`} />
              ) : (
                <div className={`flex h-24 w-24 items-center justify-center text-3xl font-black text-white ${photoClass}`} style={{ background: color }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-base font-black" style={{ color: palette.heading }}>
                {name}
              </p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: palette.text }}>
                {typeof item.role === 'string' ? item.role : ''}
              </p>
              {typeof item.detail === 'string' && item.detail && (
                <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>
                  {item.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function AdvisorsBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  const photoShape = str(props, 'photoShape') || 'circle';
  const photoClass = photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const layoutRaw = str(props, 'layout');
  const layout = layoutRaw === 'cards' || layoutRaw === 'accordion' || layoutRaw === 'slider' ? layoutRaw : 'grid';
  const selectedIds = Array.isArray(props.selectedIds)
    ? (props.selectedIds as unknown[]).filter((id): id is string => typeof id === 'string')
    : [];

  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-12" />
      <AdvisorsBlockClient
        layout={layout}
        columnsClass={gridColsClass(columns)}
        photoClass={photoClass}
        mode={str(props, 'mode') === 'selected' ? 'selected' : 'all'}
        selectedIds={selectedIds}
        limit={num(props, 'limit', 0)}
        showBio={bool(props, 'showBio', true)}
        showLinkedIn={bool(props, 'showLinkedIn', true)}
        showLocation={bool(props, 'showLocation', true)}
        showExperience={bool(props, 'showExperience', true)}
        showTopics={bool(props, 'showTopics', true)}
        showWebsite={bool(props, 'showWebsite', true)}
        headingColor={palette.heading}
        textColor={palette.text}
        mutedColor={palette.muted}
        isDark={palette.isDark}
      />
      <ButtonsRow props={props} palette={palette} className="mt-10" />
    </SectionShell>
  );
}

function PricingMatrixBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} className="mb-8" />
      <PricingMatrixBlockClient />
    </SectionShell>
  );
}

function LogosBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ paddingY: 'compact', ...props });
  const list = items(props);
  const heightClass = str(props, 'logoHeight') === 'sm' ? 'h-8' : str(props, 'logoHeight') === 'lg' ? 'h-16' : 'h-11';
  const grayscale = bool(props, 'grayscale', true);
  return (
    <SectionShell props={props} palette={palette}>
      {str(props, 'title') && (
        <p className="mb-8 text-center text-xs font-black uppercase tracking-[0.3em]" style={{ color: palette.muted }}>
          {str(props, 'title')}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
        {list.map((item, i) => {
          const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl : '';
          if (!imageUrl) return null;
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={typeof item.name === 'string' ? item.name : ''}
              className={`${heightClass} w-auto object-contain transition ${grayscale ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
            />
          );
          return typeof item.href === 'string' && item.href ? (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer">
              {img}
            </a>
          ) : (
            <span key={i}>{img}</span>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} center className="mt-8" />
    </SectionShell>
  );
}

const GALLERY_ASPECT: Record<string, string> = {
  landscape: '4/3',
  square: '1/1',
  portrait: '3/4',
  wide: '16/9',
};

function GalleryBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  const columns = Math.min(4, Math.max(2, parseInt(str(props, 'columns') || '3', 10) || 3));
  const radius = str(props, 'imageShape') === 'square' ? 'rounded-none' : 'rounded-2xl';
  const aspect = GALLERY_ASPECT[str(props, 'aspect')] ?? '4/3';
  return (
    <SectionShell props={props} palette={palette}>
      {str(props, 'title') && (
        <h2 className={`mb-10 font-black tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
          {str(props, 'title')}
        </h2>
      )}
      <div className={`grid gap-4 ${gridColsClass(columns)}`}>
        {list.map((item, i) => {
          const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl : '';
          if (!imageUrl) return null;
          return (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={typeof item.caption === 'string' ? item.caption : ''} className={`w-full object-cover ${radius}`} style={{ aspectRatio: aspect }} />
              {typeof item.caption === 'string' && item.caption && (
                <figcaption className="mt-2 text-xs" style={{ color: palette.muted }}>
                  {item.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-8" />
    </SectionShell>
  );
}

function PricingBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'surface', ...props });
  const list = items(props);
  const cols = list.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : list.length === 2 ? 'sm:grid-cols-2' : '';
  return (
    <SectionShell props={props} palette={palette}>
      <SectionHeading props={props} palette={palette} center className="mb-14" />
      <div className={`mx-auto grid max-w-[1100px] gap-6 ${cols}`}>
        {list.map((item, i) => {
          const highlighted = item.highlighted === true;
          const features =
            typeof item.features === 'string' ? item.features.split('\n').map((f) => f.trim()).filter(Boolean) : [];
          return (
            <article
              key={i}
              className="relative flex flex-col overflow-hidden rounded-3xl border"
              style={
                highlighted
                  ? { background: 'var(--brand-dark)', color: 'white', borderColor: 'var(--brand-primary)', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }
                  : { background: 'white', color: 'var(--brand-ink)', borderColor: 'var(--brand-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }
              }
            >
              {highlighted && (
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(to right, var(--brand-accent), var(--brand-accent-strong))' }} />
              )}
              <div className="p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {typeof item.label === 'string' && item.label && (
                      <span
                        className="rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider"
                        style={
                          highlighted
                            ? { background: 'color-mix(in srgb, var(--brand-accent) 20%, transparent)', color: 'var(--brand-accent)' }
                            : { background: 'var(--brand-surface-strong)', color: 'var(--brand-primary)' }
                        }
                      >
                        {item.label}
                      </span>
                    )}
                    <h3 className="mt-3 text-xl font-black">{typeof item.name === 'string' ? item.name : ''}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    {typeof item.currency === 'string' && item.currency && (
                      <span className="text-xs font-bold" style={{ color: highlighted ? 'rgba(255,255,255,0.65)' : 'var(--brand-primary)' }}>
                        {item.currency}
                      </span>
                    )}
                    <p className="text-3xl font-black leading-none" style={{ color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }}>
                      {typeof item.price === 'string' ? item.price : ''}
                    </p>
                  </div>
                </div>
                {typeof item.description === 'string' && item.description && (
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: highlighted ? 'rgba(255,255,255,0.8)' : 'var(--brand-ink-soft)' }}>
                    {item.description}
                  </p>
                )}
                {features.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg className="mt-0.5 shrink-0" style={{ color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ color: highlighted ? 'rgba(255,255,255,0.85)' : 'var(--brand-ink-soft)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {typeof item.ctaLabel === 'string' && item.ctaLabel && (
                <div className="mt-auto px-8 pb-8">
                  <Link
                    href={typeof item.ctaHref === 'string' && item.ctaHref ? item.ctaHref : '#'}
                    className="block w-full py-3 text-center text-sm font-extrabold transition hover:opacity-90"
                    style={{
                      borderRadius: 'calc(var(--brand-radius-rem) * 1rem + 0.5rem)',
                      ...(highlighted
                        ? { background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }
                        : { border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', background: 'transparent' }),
                    }}
                  >
                    {item.ctaLabel}
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <ButtonsRow props={props} palette={palette} center className="mt-10" />
    </SectionShell>
  );
}

function FaqBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const list = items(props);
  return (
    <SectionShell props={props} palette={palette} widthOverride={palette.width === 'normal' ? 'narrow' : palette.width}>
      {str(props, 'title') && (
        <h2 className={`mb-10 font-black tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
          {str(props, 'title')}
        </h2>
      )}
      <div className="space-y-3">
        {list.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border px-6 py-4"
            style={{
              borderColor: palette.isDark ? 'rgba(255,255,255,0.15)' : 'var(--brand-border)',
              background: palette.isDark ? 'rgba(255,255,255,0.05)' : 'white',
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold" style={{ color: palette.heading }}>
              {typeof item.question === 'string' ? item.question : ''}
              <span className="text-xl transition group-open:rotate-45" style={{ color: 'var(--brand-accent-strong)' }}>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: palette.text }}>
              {typeof item.answer === 'string' ? item.answer : ''}
            </p>
          </details>
        ))}
      </div>
      <ButtonsRow props={props} palette={palette} className="mt-8" />
    </SectionShell>
  );
}

function CtaBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'dark', paddingY: 'spacious', ...props });
  const split = str(props, 'layout') === 'split';

  if (split) {
    return (
      <SectionShell props={props} palette={palette}>
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className={`max-w-[26ch] font-black leading-[1.05] tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
              {str(props, 'title')}
            </h2>
            {str(props, 'body') && (
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed md:text-lg" style={{ color: palette.text }}>
                {str(props, 'body')}
              </p>
            )}
          </div>
          <ButtonsRow props={props} palette={palette} className="shrink-0" />
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell props={props} palette={palette} widthOverride={palette.width === 'normal' ? 'narrow' : palette.width}>
      <div className="text-center">
        <h2 className={`mx-auto max-w-[24ch] font-black leading-[1.05] tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
          {str(props, 'title')}
        </h2>
        {str(props, 'body') && (
          <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed md:text-lg" style={{ color: palette.text }}>
            {str(props, 'body')}
          </p>
        )}
        <ButtonsRow props={props} palette={palette} center />
      </div>
    </SectionShell>
  );
}

function BannerBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'accent', paddingY: 'none', ...props });
  return (
    <SectionShell props={props} palette={palette}>
      <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
        <p className="text-sm font-bold" style={{ color: palette.heading }}>
          {str(props, 'text')}
        </p>
        <ButtonsRow props={props} palette={palette} className="" />
      </div>
    </SectionShell>
  );
}

function getEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (url.hostname.includes('vimeo.com')) {
      return `https://player.vimeo.com/video${url.pathname}`;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ background: 'surface', ...props });
  const videoUrl = str(props, 'videoUrl');
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  return (
    <SectionShell props={props} palette={palette} widthOverride={palette.width === 'normal' ? 'narrow' : palette.width}>
      {str(props, 'title') && (
        <h2 className={`mb-12 text-center font-black tracking-tight ${palette.titleClass}`} style={{ color: palette.titleColor }}>
          {str(props, 'title')}
        </h2>
      )}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.22)]" style={{ background: 'var(--brand-dark)' }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={str(props, 'title') || 'Video'}
          />
        ) : videoUrl ? (
          <video className="aspect-video w-full" controls preload="metadata">
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <p className="text-sm text-white/40">Agrega la URL de un video</p>
          </div>
        )}
      </div>
      {str(props, 'caption') && (
        <p className="mt-4 text-center text-sm" style={{ color: palette.muted }}>
          {str(props, 'caption')}
        </p>
      )}
      <ButtonsRow props={props} palette={palette} center className="mt-8" />
    </SectionShell>
  );
}

function ImageBlock({ props }: { props: SiteBlockProps }) {
  const fullWidth = bool(props, 'fullWidth') || str(props, 'contentWidth') === 'full';
  const palette = resolveSectionPalette({ ...props, contentWidth: fullWidth ? 'full' : str(props, 'contentWidth') || 'normal' });
  const imageUrl = str(props, 'imageUrl');
  const radius = fullWidth ? '' : str(props, 'imageShape') === 'square' ? 'rounded-none' : 'rounded-3xl';
  const shadow = bool(props, 'shadow') ? 'shadow-[0_24px_64px_rgba(0,0,0,0.18)]' : '';
  return (
    <SectionShell props={props} palette={palette}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={str(props, 'caption')} className={`w-full object-cover ${radius} ${shadow}`} />
      ) : (
        <div
          className="flex items-center justify-center rounded-3xl border border-dashed py-24"
          style={{ borderColor: palette.isDark ? 'rgba(255,255,255,0.25)' : 'var(--brand-border-strong)', color: palette.muted }}
        >
          <span className="text-sm">Agrega una imagen</span>
        </div>
      )}
      {str(props, 'caption') && (
        <p className="pt-3 text-center text-sm" style={{ color: palette.muted }}>
          {str(props, 'caption')}
        </p>
      )}
      <ButtonsRow props={props} palette={palette} center className="mt-6" />
    </SectionShell>
  );
}

function HtmlBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette(props);
  const buttons = resolveButtons(props);
  return (
    <section className="relative overflow-hidden" style={palette.baseStyle}>
      <div dangerouslySetInnerHTML={{ __html: str(props, 'html') }} />
      {buttons.length > 0 && (
        <div className="mx-auto w-full max-w-[1240px] px-6 pb-10 md:px-10 lg:px-14">
          <ButtonsRow props={props} palette={palette} center className="mt-2" />
        </div>
      )}
    </section>
  );
}

function DividerBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ paddingY: 'compact', ...props });
  const kind = str(props, 'lineColor') || 'border';
  const color =
    kind === 'accent'
      ? 'var(--brand-accent)'
      : kind === 'custom'
        ? str(props, 'lineColorCustom') || 'var(--brand-border)'
        : palette.isDark
          ? 'rgba(255,255,255,0.2)'
          : 'var(--brand-border)';
  const lineWidth = str(props, 'lineWidth') || 'normal';
  const widthClass = lineWidth === 'short' ? 'mx-auto w-24' : 'w-full';
  return (
    <SectionShell props={props} palette={palette} widthOverride={lineWidth === 'full' ? 'full' : 'normal'}>
      <hr
        className={`border-0 ${widthClass}`}
        style={{ height: num(props, 'thickness', 1), background: withAlpha(color, num(props, 'lineOpacity', 100)) }}
      />
      <ButtonsRow props={props} palette={palette} center className="mt-6" />
    </SectionShell>
  );
}

function SpacerBlock({ props }: { props: SiteBlockProps }) {
  const palette = resolveSectionPalette({ paddingY: 'none', ...props });
  const buttons = resolveButtons(props);
  return (
    <div
      className={buttons.length > 0 ? 'flex items-center justify-center' : undefined}
      style={{ ...palette.baseStyle, minHeight: `${num(props, 'height', 64)}px` }}
      aria-hidden={buttons.length === 0 ? 'true' : undefined}
    >
      {buttons.length > 0 && <ButtonsRow props={props} palette={palette} center className="" />}
    </div>
  );
}

/* ─────────────────────────── Renderer ─────────────────────────── */

export function SiteBlockView({ block }: { block: SiteBlock }) {
  switch (block.type) {
    case 'section':
      return <SectionContainerBlock props={block.props} />;
    case 'hero':
      return <HeroBlock props={block.props} />;
    case 'stats':
      return <StatsBlock props={block.props} />;
    case 'richText':
      return <RichTextBlock props={block.props} />;
    case 'textColumns':
      return <TextColumnsBlock props={block.props} />;
    case 'imageText':
      return <ImageTextBlock props={block.props} />;
    case 'cards':
      return <CardsBlock props={block.props} />;
    case 'features':
      return <FeaturesBlock props={block.props} />;
    case 'phasedList':
      return <PhasedListBlock props={block.props} />;
    case 'featureGroups':
      return <FeatureGroupsBlock props={block.props} />;
    case 'discoveryReport':
      return <DiscoveryReportBlock props={block.props} />;
    case 'steps':
      return <StepsBlock props={block.props} />;
    case 'testimonials':
      return <TestimonialsBlock props={block.props} />;
    case 'quote':
      return <QuoteBlock props={block.props} />;
    case 'team':
      return <TeamBlock props={block.props} />;
    case 'advisors':
      return <AdvisorsBlock props={block.props} />;
    case 'logos':
      return <LogosBlock props={block.props} />;
    case 'gallery':
      return <GalleryBlock props={block.props} />;
    case 'pricing':
      return <PricingBlock props={block.props} />;
    case 'pricingMatrix':
      return <PricingMatrixBlock props={block.props} />;
    case 'faq':
      return <FaqBlock props={block.props} />;
    case 'cta':
      return <CtaBlock props={block.props} />;
    case 'banner':
      return <BannerBlock props={block.props} />;
    case 'video':
      return <VideoBlock props={block.props} />;
    case 'image':
      return <ImageBlock props={block.props} />;
    case 'html':
      return <HtmlBlock props={block.props} />;
    case 'divider':
      return <DividerBlock props={block.props} />;
    case 'spacer':
      return <SpacerBlock props={block.props} />;
    default:
      return null;
  }
}

export function BlockRenderer({ sections }: { sections: SiteBlock[] }) {
  return (
    <>
      {sections
        .filter((block) => block.isVisible !== false)
        .map((block) => (
          <SiteBlockView key={block.blockId} block={block} />
        ))}
    </>
  );
}
