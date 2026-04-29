'use client';

import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

// ─── Design constants ─────────────────────────────────────────────────────────

const GOLD   = '#C9A84C';
const GOLD_L = '#E8D090';
const GOLD_D = '#A07830';

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = (hex ?? '#5f3471').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [isNaN(r) ? 95 : r, isNaN(g) ? 52 : g, isNaN(b) ? 113 : b];
}

function colorDarken([r, g, b]: [number, number, number], t: number): string {
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
}

function colorLighten([r, g, b]: [number, number, number], t: number): string {
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * t))},${Math.min(255, Math.round(g + (255 - g) * t))},${Math.min(255, Math.round(b + (255 - b) * t))})`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}

function imgTag(src: string | null | undefined, style: string): string {
  if (!src) return '';
  return `<img src="${src}" style="${style}" />`;
}

function goldSeal(size = 72): string {
  const inner = size - 16;
  return `
<div style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 36% 36%,${GOLD_L},${GOLD_D});display:flex;align-items:center;justify-content:center;flex-shrink:0;">
  <div style="width:${inner}px;height:${inner}px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.45);display:flex;align-items:center;justify-content:center;">
    <span style="color:#fff;font-size:${Math.round(size * 0.32)}px;line-height:1;">&#9733;</span>
  </div>
</div>`;
}

function goldDivider(width = 300): string {
  return `
<div style="display:flex;align-items:center;gap:12px;width:${width}px;margin:0 auto;">
  <div style="flex:1;height:1px;background:${GOLD}60;"></div>
  <div style="width:7px;height:7px;background:${GOLD};transform:rotate(45deg);flex-shrink:0;"></div>
  <div style="flex:1;height:1px;background:${GOLD}60;"></div>
</div>`;
}

function goldStrip(): string {
  return `<div style="height:5px;background:linear-gradient(to right,${GOLD_D},${GOLD_L},${GOLD},${GOLD_L},${GOLD_D});flex-shrink:0;"></div>`;
}

function sigBlock(
  t: ResolvedTemplate,
  nameColor = '#333',
  titleColor = '#888',
  lineColor = '#ccc',
): string {
  if (!t.signatoryName) return '<div style="min-width:160px;"></div>';
  return `
<div style="text-align:center;min-width:160px;">
  ${imgTag(t.signatureDataUrl, 'height:38px;max-width:130px;object-fit:contain;display:block;margin:0 auto 6px;')}
  <div style="width:150px;height:1px;background:${lineColor};margin:0 auto 6px;"></div>
  <p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;font-weight:700;color:${nameColor};margin:0;letter-spacing:0.04em;">${esc(t.signatoryName)}</p>
  ${t.signatoryTitle ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;color:${titleColor};margin:3px 0 0;">${esc(t.signatoryTitle)}</p>` : ''}
</div>`;
}

// ─── Resolved template (images already converted to data URLs) ────────────────

interface ResolvedTemplate extends CertificateTemplateRecord {
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
}

// ─── Template 1 — Ejecutiva ───────────────────────────────────────────────────
// Header band · gold strip · centered body · light footer
// Total height: 794px
// Header: 206px  |  Strip: 5px  |  Footer: 118px  |  Body: 465px

function htmlEjecutiva(t: ResolvedTemplate, name: string, course: string, date: string): string {
  const a = esc(t.accentColor ?? '#5f3471');
  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;background:#fff;font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;">
  <!-- Corner ornaments -->
  <div style="position:absolute;top:0;right:0;width:130px;height:130px;border-top:2px solid ${GOLD}50;border-right:2px solid ${GOLD}50;z-index:10;pointer-events:none;"></div>
  <div style="position:absolute;bottom:0;left:0;width:130px;height:130px;border-bottom:2px solid ${GOLD}50;border-left:2px solid ${GOLD}50;z-index:10;pointer-events:none;"></div>

  <!-- HEADER (206px) -->
  <div style="height:206px;flex-shrink:0;background:linear-gradient(135deg,${a}f2,${a}aa);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;text-align:center;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(255,255,255,0.15),transparent 65%);"></div>
    <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
      ${t.logoDataUrl
        ? imgTag(t.logoDataUrl, 'height:44px;max-width:200px;object-fit:contain;display:block;')
        : (t.organizationName ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.68);margin:0;">${esc(t.organizationName)}</p>` : '')}
      <div style="display:flex;align-items:center;gap:20px;">
        <div style="height:1px;width:70px;background:${GOLD};"></div>
        <p style="font-family:Montserrat,Arial,sans-serif;font-size:26px;letter-spacing:0.22em;text-transform:uppercase;color:#fff;font-weight:700;margin:0;">CERTIFICADO</p>
        <div style="height:1px;width:70px;background:${GOLD};"></div>
      </div>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${GOLD_L};margin:0;">DE LOGRO</p>
    </div>
  </div>

  <!-- GOLD STRIP (5px) -->
  ${goldStrip()}

  <!-- BODY (flex:1 = 465px) — vertically centered -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 110px;text-align:center;position:relative;">
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:#bbb;margin:0 0 14px;">SE CERTIFICA QUE</p>
    <p style="font-size:58px;color:${a};margin:0;font-style:italic;font-weight:400;line-height:1.05;">${esc(name)}</p>
    <div style="margin:16px auto;">${goldDivider(360)}</div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#555;margin:0 0 6px;letter-spacing:0.02em;">${esc(t.headlineText)}</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;color:#777;margin:0 0 10px;line-height:1.5;">${esc(t.bodyText)}</p>
    <p style="font-size:15px;color:${a};font-style:italic;margin:0 0 10px;">"${esc(course)}"</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;color:#ccc;letter-spacing:0.1em;margin:0;">${esc(date)}</p>
  </div>

  <!-- FOOTER (118px) -->
  <div style="height:118px;flex-shrink:0;background:#f9f7f1;border-top:1px solid ${GOLD}30;display:flex;align-items:center;justify-content:space-between;padding:0 110px;">
    ${sigBlock(t)}
    ${goldSeal(72)}
    <div style="text-align:right;max-width:240px;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:#bbb;margin:0;line-height:1.8;">${esc(t.footerText)}</p>
    </div>
  </div>
</div>`;
}

// ─── Template 2 — Premium ─────────────────────────────────────────────────────
// Dark luxury derived from accent. No clip-path (html2canvas compat).

function htmlPremium(t: ResolvedTemplate, name: string, course: string, date: string): string {
  const rgb      = hexToRgb(t.accentColor ?? '#5f3471');
  const bgDark   = colorDarken(rgb, 0.82);
  const bgMid    = colorDarken(rgb, 0.72);
  const bgFooter = colorDarken(rgb, 0.88);
  const acLight  = colorLighten(rgb, 0.60);
  const a        = esc(t.accentColor ?? '#5f3471');

  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;background:${bgDark};font-family:Georgia,'Times New Roman',serif;">
  <!-- Outer accent border -->
  <div style="position:absolute;inset:0;border:6px solid ${a};pointer-events:none;z-index:20;"></div>
  <!-- Inner thin border -->
  <div style="position:absolute;inset:15px;border:1px solid ${acLight};pointer-events:none;z-index:20;opacity:0.55;"></div>
  <!-- Mid panel -->
  <div style="position:absolute;top:10%;right:10%;bottom:20%;left:10%;background:${bgMid};border-radius:4px;z-index:2;"></div>

  <!-- MAIN CONTENT -->
  <div style="position:absolute;top:0;left:0;right:0;bottom:21%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 18%;text-align:center;z-index:5;">
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;letter-spacing:0.28em;color:${acLight};font-weight:700;text-transform:uppercase;margin:0 0 18px;">CERTIFICADO DE EXCELENCIA</p>
    ${t.logoDataUrl
      ? imgTag(t.logoDataUrl, 'height:44px;max-width:160px;object-fit:contain;display:block;margin:0 auto 14px;')
      : (t.organizationName
          ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;color:rgba(220,215,240,0.85);margin:0 0 14px;letter-spacing:0.05em;">${esc(t.organizationName)}</p>`
          : '')}
    <div style="width:60px;height:2px;background:${a};margin:0 auto 20px;border-radius:1px;"></div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:rgba(220,215,235,0.80);margin:0 0 16px;letter-spacing:0.03em;">${esc(t.headlineText)}</p>
    <p style="font-size:58px;color:#ffffff;margin:0 0 12px;font-style:italic;font-weight:400;line-height:1.05;">${esc(name)}</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;color:rgba(200,195,220,0.75);margin:0 0 10px;line-height:1.5;">${esc(t.bodyText)}</p>
    <p style="font-size:14px;color:${acLight};font-style:italic;margin:0 0 8px;">"${esc(course)}"</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;color:rgba(180,175,205,0.65);margin:0;">${esc(date)}</p>
    <div style="width:60px;height:2px;background:${a};margin:18px auto 0;border-radius:1px;"></div>
  </div>

  <!-- FOOTER -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:21%;background:${bgFooter};display:flex;align-items:center;justify-content:space-between;padding:0 90px;border-top:1px solid ${acLight};z-index:6;">
    ${sigBlock(t, 'rgba(220,215,240,1)', 'rgba(180,175,205,0.75)', 'rgba(180,175,205,0.4)')}
    ${goldSeal(76)}
    <div style="text-align:right;max-width:230px;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:rgba(180,175,205,0.60);margin:0;line-height:1.8;">${esc(t.footerText)}</p>
    </div>
  </div>
</div>`;
}

// ─── Template 3 — Estándar ────────────────────────────────────────────────────
// Accent sidebar with diagonal SVG edge · right content area

function htmlEstandar(t: ResolvedTemplate, name: string, course: string, date: string): string {
  const a = esc(t.accentColor ?? '#5f3471');
  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;font-family:Georgia,'Times New Roman',serif;background:#fff;">

  <!-- SIDEBAR shape: diagonal right edge via SVG polygon -->
  <svg style="position:absolute;top:0;left:0;" width="388" height="794" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,0 388,0 326,794 0,794" fill="${a}"/>
  </svg>

  <!-- SIDEBAR CONTENT (safe zone within the trapezoid) -->
  <div style="position:absolute;top:0;left:0;width:316px;height:794px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 26px;text-align:center;z-index:2;">
    ${goldSeal(96)}
    <div style="height:18px;"></div>
    ${t.logoDataUrl
      ? imgTag(t.logoDataUrl, 'height:38px;max-width:140px;object-fit:contain;display:block;margin:0 auto;')
      : (t.organizationName
          ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.90);font-weight:700;margin:0;line-height:1.5;">${esc(t.organizationName)}</p>`
          : '')}
    <div style="height:16px;"></div>
    <div style="width:54px;height:1px;background:${GOLD};margin:0 auto;"></div>
    <div style="height:12px;"></div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;letter-spacing:0.36em;text-transform:uppercase;color:${GOLD_L};margin:0;">CERTIFICADO</p>
  </div>

  <!-- RIGHT CONTENT AREA -->
  <div style="position:absolute;top:0;left:358px;right:0;bottom:0;background:#fff;display:flex;flex-direction:column;z-index:1;">
    ${goldStrip()}
    <!-- Body — flex:1 vertically centers content -->
    <div style="flex:1;padding:24px 60px 0 54px;display:flex;flex-direction:column;justify-content:center;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:#bbb;margin:0 0 12px;">SE CERTIFICA QUE</p>
      <p style="font-size:54px;color:${a};margin:0 0 6px;font-style:italic;font-weight:400;line-height:1.1;">${esc(name)}</p>
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0;">
        <div style="width:40px;height:1px;background:${GOLD};flex-shrink:0;"></div>
        <div style="width:6px;height:6px;background:${GOLD};transform:rotate(45deg);flex-shrink:0;"></div>
        <div style="flex:1;height:1px;background:${GOLD}40;"></div>
      </div>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#555;margin:0 0 8px;">${esc(t.headlineText)}</p>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;color:#777;margin:0 0 10px;line-height:1.55;">${esc(t.bodyText)}</p>
      <p style="font-size:15px;color:${a};font-style:italic;margin:0 0 10px;">"${esc(course)}"</p>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;color:#bbb;letter-spacing:0.06em;margin:0;">${esc(date)}</p>
    </div>
    <!-- Footer -->
    <div style="height:116px;background:#f9f7f1;border-top:1px solid ${GOLD}30;display:flex;align-items:center;justify-content:space-between;padding:0 60px 0 54px;flex-shrink:0;">
      ${sigBlock(t)}
      <div style="text-align:right;max-width:240px;">
        <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:#bbb;margin:0;line-height:1.8;">${esc(t.footerText)}</p>
      </div>
    </div>
    ${goldStrip()}
  </div>
</div>`;
}

// ─── Image pre-fetch ──────────────────────────────────────────────────────────
// Converts remote images to data URLs so html2canvas never makes image requests.

async function blobToDataUrl(blob: Blob): Promise<string | null> {
  if (blob.size === 0) return null;
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;

  // Strategy 1: direct browser fetch (works when R2 CORS allows the origin)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.type.startsWith('image/')) {
        const dataUrl = await blobToDataUrl(blob);
        if (dataUrl) return dataUrl;
      }
    }
  } catch { /* CORS blocked or network error — fall through */ }

  // Strategy 2: server-side proxy (bypasses browser CORS completely)
  try {
    const res = await fetch(`/api/v1/image-proxy?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl) return dataUrl;
    }
  } catch { /* ignore */ }

  return null;
}

// ─── Font loading ─────────────────────────────────────────────────────────────

async function ensureFontsLoaded(): Promise<void> {
  if (!document.querySelector('link[data-cert-fonts]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap';
    link.setAttribute('data-cert-fonts', 'true');
    document.head.appendChild(link);
  }
  try {
    await document.fonts.ready;
    await new Promise<void>((r) => setTimeout(r, 350));
  } catch { /* proceed with system fonts */ }
}

// ─── HTML → canvas ────────────────────────────────────────────────────────────

async function htmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1123px;height:794px;overflow:hidden;';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  // Explicitly wait for every img element to decode before capturing.
  // img.decode() is the most reliable way — it resolves when pixels are ready to paint.
  const imgs = Array.from(wrap.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    imgs.map(async (img) => {
      try {
        // img.decode() resolves when pixels are ready to paint — most reliable approach.
        const decodable = img as HTMLImageElement & { decode?(): Promise<void> };
        if (typeof decodable.decode === 'function') {
          await decodable.decode();
        } else if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = img.onerror = () => resolve();
            setTimeout(resolve, 5000);
          });
        }
      } catch { /* ignore decode errors — proceed without this image */ }
    }),
  );

  // One final tick for layout to settle after image decode
  await new Promise<void>((r) => setTimeout(r, 80));

  const canvas = await html2canvas(wrap, {
    scale: 2,
    useCORS: false,
    allowTaint: true,
    width: 1123,
    height: 794,
    logging: false,
    backgroundColor: null,
  });

  document.body.removeChild(wrap);
  return canvas;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function downloadCourseCertificate({
  template,
  recipientName,
  courseName,
  completedAt,
}: {
  template: CertificateTemplateRecord;
  recipientName: string;
  courseName: string;
  completedAt: string;
}): Promise<void> {
  await ensureFontsLoaded();

  // Pre-fetch images as data URLs before building HTML.
  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    fetchAsDataUrl(template.logoUrl),
    fetchAsDataUrl(template.signatureUrl),
  ]);

  const t: ResolvedTemplate = { ...template, logoDataUrl, signatureDataUrl };
  const date = formatDate(completedAt);

  let html: string;
  switch (template.templateNumber) {
    case 2:  html = htmlPremium(t, recipientName, courseName, date);  break;
    case 3:  html = htmlEstandar(t, recipientName, courseName, date); break;
    default: html = htmlEjecutiva(t, recipientName, courseName, date);
  }

  const canvas = await htmlToCanvas(html);

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

  const safeName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  doc.save(`certificado-${safeName}.pdf`);
}
