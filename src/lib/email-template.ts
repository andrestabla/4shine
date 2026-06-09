export interface EmailBranding {
  platformName: string;
  /** Logo principal (sobre fondos claros). */
  logoUrl: string | null;
  /** Logo alterno (sobre fondos oscuros). Si no se setea, se usa logoUrl. */
  logoDarkUrl?: string | null;
  /** Color primario del branding (ej: '#311f44'). Se usa para el header. */
  primaryColor?: string | null;
  /** Color de acento (ej: '#f59e0b'). Se usa para los botones pill. */
  accentColor?: string | null;
  /** Texto sobre fondo de acento (auto-derivado si no se pasa). */
  accentOnText?: string | null;
  /** Tipografía de marca (ej: 'Poppins', 'Roboto'). Se aplica al body. */
  typography?: string | null;
  /** Override manual del header (si se pasa, se ignora primaryColor). */
  headerBg?: string;
  footerTagline?: string;
  footerSupport?: string;
  footerLegal?: string;
}

// Convierte hex (#rrggbb) a luminancia perceptiva 0-1 para elegir el color
// del texto sobre ese fondo (blanco si es oscuro, negro si es claro).
function relativeLuminance(hex: string): number {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return 0;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].substring(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function autoTextOn(bg: string | null | undefined): string {
  if (!bg) return '#ffffff';
  return relativeLuminance(bg) < 0.5 ? '#ffffff' : '#0f172a';
}

// Directive: every <a> link in a template body is rendered as a pill button.
function applyButtonStylesToLinks(html: string, bg: string, fg: string): string {
  const style =
    `display:inline-block;background-color:${bg};color:${fg};` +
    `text-decoration:none;padding:12px 24px;border-radius:999px;` +
    `font-weight:700;font-size:14px;line-height:1;margin:4px 0;`;

  return html.replace(/<a(\s[^>]*)?>/gi, (_, rawAttrs) => {
    const attrs = rawAttrs ?? '';
    if (/\bstyle\s*=/i.test(attrs)) {
      // Append to existing style attribute
      return `<a${attrs.replace(/(\bstyle\s*=\s*["'])([^"']*)/i, `$1$2;${style}`)}>`;
    }
    return `<a${attrs} style="${style}">`;
  });
}

// Sanea la tipografía recibida del branding y construye el font-stack final.
// Fallback siempre a Inter/Arial sans-serif para clientes que no soportan
// fuentes externas (Gmail, Outlook desktop ignoran @font-face).
function buildFontStack(typography: string | null | undefined): string {
  const raw = typography?.trim();
  if (!raw) return 'Inter,Arial,sans-serif';
  // Quitar caracteres potencialmente peligrosos (HTML injection vía style attr).
  const safe = raw.replace(/["';<>]/g, '').trim();
  if (!safe) return 'Inter,Arial,sans-serif';
  // Si el nombre tiene espacios, lo envolvemos en comillas simples al inicio.
  const head = /\s/.test(safe) ? `'${safe}'` : safe;
  return `${head},Inter,Arial,sans-serif`;
}

export function buildBrandedEmailHtml(bodyHtml: string, branding: EmailBranding): string {
  const platformName = branding.platformName || '4Shine';
  // headerBg: override manual > primaryColor del branding > fallback slate-800.
  const headerBg = branding.headerBg || branding.primaryColor?.trim() || '#1e293b';
  // Botones pill: accent_color si lo configuraron, sino primary_color, sino headerBg.
  const buttonBg = branding.accentColor?.trim() || branding.primaryColor?.trim() || headerBg;
  const buttonFg = branding.accentOnText?.trim() || autoTextOn(buttonBg);
  const footerTagline = branding.footerTagline || 'Plataforma de desarrollo de equipos';
  const footerSupport = branding.footerSupport || 'soporte@4shine.co';
  const footerLegal = branding.footerLegal || '';
  const fontStack = buildFontStack(branding.typography);

  // El header del email tiene fondo oscuro/primario — preferimos el logo
  // alterno (logoDarkUrl) diseñado para contrastar. Fallback a logoUrl.
  const headerLogo = branding.logoDarkUrl?.trim() || branding.logoUrl?.trim() || null;
  const headerTextColor = autoTextOn(headerBg);
  const headerContent = headerLogo
    ? `<img src="${headerLogo}" alt="${platformName}" style="height:48px;width:auto;display:block;margin:0 auto;" />`
    : `<span style="color:${headerTextColor};font-size:22px;font-weight:700;letter-spacing:0.5px;">${platformName}</span>`;

  const processedBody = applyButtonStylesToLinks(bodyHtml, buttonBg, buttonFg);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${fontStack};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background-color:${headerBg};padding:28px 40px;text-align:center;">
            ${headerContent}
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;font-family:${fontStack};">
            ${processedBody}
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">${platformName} &middot; ${footerTagline}</p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">${footerSupport}</p>
            ${footerLegal ? `<p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">${footerLegal}</p>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
