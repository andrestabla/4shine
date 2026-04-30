// ─── Certificate element types ────────────────────────────────────────────────
// Elements are positioned on a fixed 1123 × 794 px canvas (A4 landscape).
// Positions are stored as px values in that coordinate space and scaled at
// render time both in the builder UI and in the React preview card.

export const CERT_W = 1123;
export const CERT_H = 794;

export type CertElementType = 'text' | 'image';
export type CertFontFamily = 'Georgia' | 'Montserrat';
export type CertTextAlign = 'left' | 'center' | 'right';
export type CertImageField = 'logo' | 'signature';

export interface CertificateElement {
  id: string;
  type: CertElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  locked?: boolean;
  visible?: boolean;

  // ── Text ──────────────────────────────────────────────────────────────────
  // content: literal string or template vars {{recipientName}} {{courseName}}
  // {{date}} {{headlineText}} {{bodyText}} {{signatoryName}} {{signatoryTitle}}
  // {{footerText}} {{organizationName}}
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: CertFontFamily;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: CertTextAlign;
  letterSpacing?: number; // em
  textTransform?: 'none' | 'uppercase';
  lineHeight?: number;
  opacity?: number;

  // ── Image ─────────────────────────────────────────────────────────────────
  imageField?: CertImageField;
  objectFit?: 'contain' | 'cover';
}

// ─── Template variable substitution ──────────────────────────────────────────

export interface CertVars {
  recipientName?: string;
  courseName?: string;
  date?: string;
  headlineText?: string;
  bodyText?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  footerText?: string;
  organizationName?: string;
}

const VAR_DISPLAY: Record<string, string> = {
  '{{recipientName}}': '[Nombre del Participante]',
  '{{courseName}}': '[Nombre del Curso]',
  '{{date}}': '[Fecha]',
  '{{headlineText}}': '[Encabezado]',
  '{{bodyText}}': '[Cuerpo]',
  '{{signatoryName}}': '[Firmante]',
  '{{signatoryTitle}}': '[Cargo]',
  '{{footerText}}': '[Pie]',
  '{{organizationName}}': '[Organización]',
};

export function resolveContent(content: string, vars: CertVars, forDisplay = false): string {
  const map: Record<string, string> = forDisplay
    ? VAR_DISPLAY
    : {
        '{{recipientName}}': vars.recipientName ?? 'Nombre del Participante',
        '{{courseName}}': vars.courseName ?? '',
        '{{date}}': vars.date ?? '',
        '{{headlineText}}': vars.headlineText ?? '',
        '{{bodyText}}': vars.bodyText ?? '',
        '{{signatoryName}}': vars.signatoryName ?? '',
        '{{signatoryTitle}}': vars.signatoryTitle ?? '',
        '{{footerText}}': vars.footerText ?? '',
        '{{organizationName}}': vars.organizationName ?? '',
      };
  return Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), content);
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = (hex ?? '#5f3471').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [isNaN(r) ? 95 : r, isNaN(g) ? 52 : g, isNaN(b) ? 113 : b];
}

function lighten([r, g, b]: [number, number, number], t: number): string {
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * t))},${Math.min(255, Math.round(g + (255 - g) * t))},${Math.min(255, Math.round(b + (255 - b) * t))})`;
}

// ─── Default element layouts ──────────────────────────────────────────────────

const GL = '#E8D090'; // GOLD_L

function t(
  id: string, label: string, content: string,
  x: number, y: number, w: number, h: number,
  style: Partial<CertificateElement>,
): CertificateElement {
  return { id, type: 'text', label, content, x, y, width: w, height: h, ...style };
}

function i(
  id: string, label: string, imageField: CertImageField,
  x: number, y: number, w: number, h: number,
): CertificateElement {
  return { id, type: 'image', label, imageField, x, y, width: w, height: h, objectFit: 'contain' };
}

export function getDefaultElements(templateNumber: number, accent: string): CertificateElement[] {
  switch (templateNumber) {
    case 2: return defaultsPremium(accent);
    case 3: return defaultsEstandar(accent);
    default: return defaultsEjecutiva(accent);
  }
}

function defaultsEjecutiva(accent: string): CertificateElement[] {
  return [
    // Header area (0–206 px)
    i('logo', 'Logo', 'logo', 461, 48, 200, 54),
    t('org_name', 'Organización', '{{organizationName}}', 80, 68, 963, 20,
      { fontFamily: 'Montserrat', fontSize: 10, color: 'rgba(255,255,255,0.65)', textAlign: 'center', letterSpacing: 0.32, textTransform: 'uppercase' }),
    t('cert_title', 'Título "CERTIFICADO"', 'CERTIFICADO', 80, 108, 963, 46,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 26, color: '#ffffff', textAlign: 'center', letterSpacing: 0.22, textTransform: 'uppercase' }),
    t('cert_sub', 'Subtítulo "DE LOGRO"', 'DE LOGRO', 80, 162, 963, 22,
      { fontFamily: 'Montserrat', fontSize: 10, color: GL, textAlign: 'center', letterSpacing: 0.24, textTransform: 'uppercase' }),
    // Body area (211–676 px)
    t('se_certifica', 'Leyenda "Se certifica que"', 'SE CERTIFICA QUE', 80, 244, 963, 20,
      { fontFamily: 'Montserrat', fontSize: 9, color: '#bbbbbb', textAlign: 'center', letterSpacing: 0.32, textTransform: 'uppercase' }),
    t('recipient', 'Nombre del participante', '{{recipientName}}', 80, 270, 963, 86,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 58, color: accent, textAlign: 'center', lineHeight: 1.05 }),
    t('headline', 'Encabezado', '{{headlineText}}', 80, 374, 963, 22,
      { fontFamily: 'Montserrat', fontSize: 13, color: '#555555', textAlign: 'center', letterSpacing: 0.02 }),
    t('body_text', 'Cuerpo del texto', '{{bodyText}}', 80, 404, 963, 36,
      { fontFamily: 'Montserrat', fontSize: 12, color: '#777777', textAlign: 'center', lineHeight: 1.5 }),
    t('course', 'Nombre del curso', '"{{courseName}}"', 80, 448, 963, 26,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, color: accent, textAlign: 'center' }),
    t('date', 'Fecha', '{{date}}', 80, 484, 963, 18,
      { fontFamily: 'Montserrat', fontSize: 10, color: '#cccccc', textAlign: 'center', letterSpacing: 0.1 }),
    // Footer area (676–794 px)
    i('sig_img', 'Imagen de firma', 'signature', 110, 690, 130, 38),
    t('sig_name', 'Nombre del firmante', '{{signatoryName}}', 110, 736, 220, 18,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 10, color: '#333333', letterSpacing: 0.04 }),
    t('sig_title', 'Cargo del firmante', '{{signatoryTitle}}', 110, 756, 220, 16,
      { fontFamily: 'Montserrat', fontSize: 9, color: '#888888' }),
    t('footer_text', 'Pie de página', '{{footerText}}', 750, 714, 265, 52,
      { fontFamily: 'Montserrat', fontSize: 8, color: '#bbbbbb', textAlign: 'right', lineHeight: 1.8 }),
  ];
}

function defaultsPremium(accent: string): CertificateElement[] {
  const rgb = hexToRgb(accent);
  const acLight = lighten(rgb, 0.6);
  // Footer starts at 79 % of 794 ≈ 627 px
  return [
    t('cert_excel', 'Leyenda "Certificado de Excelencia"', 'CERTIFICADO DE EXCELENCIA', 80, 72, 963, 20,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 9, color: acLight, textAlign: 'center', letterSpacing: 0.28, textTransform: 'uppercase' }),
    i('logo', 'Logo', 'logo', 461, 102, 200, 52),
    t('org_name', 'Organización', '{{organizationName}}', 80, 118, 963, 22,
      { fontFamily: 'Montserrat', fontSize: 12, color: 'rgba(220,215,240,0.85)', textAlign: 'center', letterSpacing: 0.05 }),
    t('headline', 'Encabezado', '{{headlineText}}', 80, 182, 963, 22,
      { fontFamily: 'Montserrat', fontSize: 13, color: 'rgba(220,215,235,0.80)', textAlign: 'center', letterSpacing: 0.03 }),
    t('recipient', 'Nombre del participante', '{{recipientName}}', 80, 212, 963, 86,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 58, color: '#ffffff', textAlign: 'center', lineHeight: 1.05 }),
    t('body_text', 'Cuerpo del texto', '{{bodyText}}', 80, 312, 963, 36,
      { fontFamily: 'Montserrat', fontSize: 12, color: 'rgba(200,195,220,0.75)', textAlign: 'center', lineHeight: 1.5 }),
    t('course', 'Nombre del curso', '"{{courseName}}"', 80, 356, 963, 26,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 14, color: acLight, textAlign: 'center' }),
    t('date', 'Fecha', '{{date}}', 80, 392, 963, 18,
      { fontFamily: 'Montserrat', fontSize: 9, color: 'rgba(180,175,205,0.65)', textAlign: 'center' }),
    // Footer (627–794)
    i('sig_img', 'Imagen de firma', 'signature', 90, 648, 130, 38),
    t('sig_name', 'Nombre del firmante', '{{signatoryName}}', 90, 694, 220, 18,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 10, color: 'rgba(220,215,240,1)', letterSpacing: 0.04 }),
    t('sig_title', 'Cargo del firmante', '{{signatoryTitle}}', 90, 714, 220, 16,
      { fontFamily: 'Montserrat', fontSize: 9, color: 'rgba(180,175,205,0.75)' }),
    t('footer_text', 'Pie de página', '{{footerText}}', 750, 706, 233, 46,
      { fontFamily: 'Montserrat', fontSize: 8, color: 'rgba(180,175,205,0.60)', textAlign: 'right', lineHeight: 1.8 }),
  ];
}

function defaultsEstandar(accent: string): CertificateElement[] {
  // Sidebar safe zone: 0–316 px  |  Right panel: 358–1123 px
  return [
    // Sidebar
    i('logo', 'Logo (barra lateral)', 'logo', 73, 304, 170, 46),
    t('org_name', 'Organización (barra lateral)', '{{organizationName}}', 0, 316, 316, 50,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 10, color: 'rgba(255,255,255,0.88)', textAlign: 'center', letterSpacing: 0.26, textTransform: 'uppercase', lineHeight: 1.5 }),
    t('cert_label', 'Etiqueta "CERTIFICADO"', 'CERTIFICADO', 73, 418, 170, 18,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 8, color: GL, textAlign: 'center', letterSpacing: 0.36, textTransform: 'uppercase' }),
    // Right panel — body
    t('se_certifica', 'Leyenda "Se certifica que"', 'SE CERTIFICA QUE', 412, 60, 665, 20,
      { fontFamily: 'Montserrat', fontSize: 9, color: '#bbbbbb', letterSpacing: 0.32, textTransform: 'uppercase' }),
    t('recipient', 'Nombre del participante', '{{recipientName}}', 412, 88, 665, 78,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 54, color: accent, lineHeight: 1.1 }),
    t('headline', 'Encabezado', '{{headlineText}}', 412, 190, 665, 22,
      { fontFamily: 'Montserrat', fontSize: 13, color: '#555555' }),
    t('body_text', 'Cuerpo del texto', '{{bodyText}}', 412, 220, 665, 36,
      { fontFamily: 'Montserrat', fontSize: 12, color: '#777777', lineHeight: 1.55 }),
    t('course', 'Nombre del curso', '"{{courseName}}"', 412, 264, 665, 26,
      { fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 15, color: accent }),
    t('date', 'Fecha', '{{date}}', 412, 300, 665, 18,
      { fontFamily: 'Montserrat', fontSize: 10, color: '#bbbbbb', letterSpacing: 0.06 }),
    // Right panel — footer (bottom 121 px: from 673 to 789)
    i('sig_img', 'Imagen de firma', 'signature', 412, 688, 130, 38),
    t('sig_name', 'Nombre del firmante', '{{signatoryName}}', 412, 732, 220, 18,
      { fontFamily: 'Montserrat', fontWeight: 'bold', fontSize: 10, color: '#333333', letterSpacing: 0.04 }),
    t('sig_title', 'Cargo del firmante', '{{signatoryTitle}}', 412, 752, 220, 16,
      { fontFamily: 'Montserrat', fontSize: 9, color: '#888888' }),
    t('footer_text', 'Pie de página', '{{footerText}}', 808, 718, 250, 48,
      { fontFamily: 'Montserrat', fontSize: 8, color: '#bbbbbb', textAlign: 'right', lineHeight: 1.8 }),
  ];
}
