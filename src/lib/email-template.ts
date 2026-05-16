export interface EmailBranding {
  platformName: string;
  logoUrl: string | null;
  headerBg?: string;
  footerTagline?: string;
  footerSupport?: string;
  footerLegal?: string;
}

// Directive: every <a> link in a template body is rendered as a pill button.
function applyButtonStylesToLinks(html: string, color: string): string {
  const style =
    `display:inline-block;background-color:${color};color:#ffffff;` +
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

export function buildBrandedEmailHtml(bodyHtml: string, branding: EmailBranding): string {
  const platformName = branding.platformName || '4Shine';
  const headerBg = branding.headerBg || '#1e293b';
  const footerTagline = branding.footerTagline || 'Plataforma de desarrollo de equipos';
  const footerSupport = branding.footerSupport || 'soporte@4shine.co';
  const footerLegal = branding.footerLegal || '';

  const headerContent = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${platformName}" style="height:48px;width:auto;display:block;margin:0 auto;" />`
    : `<span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${platformName}</span>`;

  const processedBody = applyButtonStylesToLinks(bodyHtml, headerBg);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Inter,Arial,sans-serif;">
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
          <td style="padding:36px 40px;">
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
