'use client';

import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

// ─── Design constants ─────────────────────────────────────────────────────────

const GOLD   = '#C9A84C';
const GOLD_L = '#E8D090';
const GOLD_D = '#A07830';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function px(url: string | null | undefined): string {
  if (!url) return '';
  return `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}

function imgTag(url: string | null | undefined, style: string): string {
  if (!url) return '';
  return `<img src="${px(url)}" crossorigin="anonymous" style="${style}" />`;
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

function goldDivider(width = 320): string {
  return `
<div style="display:flex;align-items:center;gap:14px;width:${width}px;margin:0 auto;">
  <div style="flex:1;height:1px;background:${GOLD}60;"></div>
  <div style="width:7px;height:7px;background:${GOLD};transform:rotate(45deg);flex-shrink:0;"></div>
  <div style="flex:1;height:1px;background:${GOLD}60;"></div>
</div>`;
}

function goldStrip(): string {
  return `<div style="height:5px;background:linear-gradient(to right,${GOLD_D},${GOLD_L},${GOLD},${GOLD_L},${GOLD_D});flex-shrink:0;"></div>`;
}

function sigBlock(t: CertificateTemplateRecord, nameColor = '#333', titleColor = '#888', lineColor = '#ccc'): string {
  if (!t.signatoryName) return '<div style="min-width:160px;"></div>';
  return `
<div style="text-align:center;min-width:160px;">
  ${imgTag(t.signatureUrl, 'height:38px;max-width:130px;object-fit:contain;display:block;margin:0 auto 6px;')}
  <div style="width:150px;height:1px;background:${lineColor};margin:0 auto 6px;"></div>
  <p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;font-weight:700;color:${nameColor};margin:0;letter-spacing:0.04em;">${esc(t.signatoryName)}</p>
  ${t.signatoryTitle ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;color:${titleColor};margin:3px 0 0;">${esc(t.signatoryTitle)}</p>` : ''}
</div>`;
}

// ─── Template 1 — Ejecutiva ───────────────────────────────────────────────────
// Accent header band · gold separator · clean white body · corner ornaments

function htmlEjecutiva(t: CertificateTemplateRecord, name: string, course: string, date: string): string {
  const a = esc(t.accentColor);
  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;background:#fff;font-family:Georgia,'Times New Roman',serif;">
  <!-- Corner ornaments -->
  <div style="position:absolute;top:0;right:0;width:120px;height:120px;border-top:2px solid ${GOLD}45;border-right:2px solid ${GOLD}45;z-index:10;pointer-events:none;"></div>
  <div style="position:absolute;bottom:0;left:0;width:120px;height:120px;border-bottom:2px solid ${GOLD}45;border-left:2px solid ${GOLD}45;z-index:10;pointer-events:none;"></div>

  <!-- HEADER BAND -->
  <div style="background:${a};height:228px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;text-align:center;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(255,255,255,0.13),transparent 65%);"></div>
    <div style="position:absolute;top:-80px;right:-80px;width:260px;height:260px;border-radius:50%;border:1px solid rgba(255,255,255,0.06);"></div>
    <div style="position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;border-radius:50%;border:1px solid rgba(255,255,255,0.06);"></div>
    <div style="position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center;">
      ${t.logoUrl
        ? imgTag(t.logoUrl, 'height:38px;max-width:180px;object-fit:contain;display:block;margin:0 auto 12px;')
        : `<p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin:0 0 12px;">${esc(t.organizationName)}</p>`}
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:10px;">
        <div style="height:1px;width:80px;background:${GOLD};"></div>
        <p style="font-family:Montserrat,Arial,sans-serif;font-size:28px;letter-spacing:0.24em;text-transform:uppercase;color:#fff;font-weight:700;margin:0;">CERTIFICADO</p>
        <div style="height:1px;width:80px;background:${GOLD};"></div>
      </div>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${GOLD_L};margin:0;">DE LOGRO</p>
    </div>
  </div>
  ${goldStrip()}

  <!-- BODY -->
  <div style="padding:32px 120px 0;text-align:center;">
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9.5px;letter-spacing:0.28em;text-transform:uppercase;color:#bbb;margin:0 0 16px;">SE CERTIFICA QUE</p>
    <p style="font-size:52px;color:${a};margin:0 0 2px;font-style:italic;font-weight:400;line-height:1.05;">${esc(name)}</p>
    <div style="margin:14px auto;">${goldDivider(320)}</div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:11.5px;color:#555;margin:0 0 5px;letter-spacing:0.02em;">${esc(t.headlineText)}</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:10.5px;color:#777;margin:0 0 6px;">${esc(t.bodyText)}</p>
    <p style="font-size:13px;color:${a};font-style:italic;margin:0 0 8px;">"${esc(course)}"</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;color:#ccc;letter-spacing:0.1em;margin:0;">${esc(date)}</p>
  </div>

  <!-- FOOTER -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:112px;background:#f9f7f1;border-top:1px solid ${GOLD}28;display:flex;align-items:center;justify-content:space-between;padding:0 120px;">
    ${sigBlock(t)}
    ${goldSeal(68)}
    <div style="text-align:right;max-width:240px;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:#bbb;margin:0;line-height:1.75;">${esc(t.footerText)}</p>
    </div>
  </div>
</div>`;
}

// ─── Template 2 — Premium ─────────────────────────────────────────────────────
// Light textured background · dark diagonal corner shapes · gold name

function htmlPremium(t: CertificateTemplateRecord, name: string, course: string, date: string): string {
  const a = esc(t.accentColor);
  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;background:#f6f5f0;font-family:Georgia,'Times New Roman',serif;">
  <!-- Diagonal stripe texture -->
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(-55deg,transparent,transparent 22px,rgba(0,0,0,0.018) 22px,rgba(0,0,0,0.018) 23px);pointer-events:none;"></div>

  <!-- TOP-RIGHT dark triangle -->
  <div style="position:absolute;top:0;right:0;width:420px;height:268px;background:${a};clip-path:polygon(100% 0,0 0,100% 100%);"></div>
  <!-- Gold shimmer on top triangle -->
  <div style="position:absolute;top:0;right:0;width:420px;height:268px;clip-path:polygon(100% 0,0 0,100% 100%);background:linear-gradient(135deg,${GOLD}55,transparent 55%);pointer-events:none;"></div>

  <!-- BOTTOM-LEFT dark triangle -->
  <div style="position:absolute;bottom:0;left:0;width:360px;height:238px;background:${a};clip-path:polygon(0 0,0 100%,100% 100%);"></div>
  <!-- Gold shimmer on bottom triangle -->
  <div style="position:absolute;bottom:0;left:0;width:360px;height:238px;clip-path:polygon(0 0,0 100%,100% 100%);background:linear-gradient(315deg,${GOLD}55,transparent 55%);pointer-events:none;"></div>

  <!-- Outer frame line -->
  <div style="position:absolute;inset:16px;border:1px solid ${GOLD}38;pointer-events:none;"></div>

  <!-- Company badge (pentagon, top center) -->
  <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:96px;height:80px;background:${a};clip-path:polygon(0 0,100% 0,100% 74%,50% 100%,0 74%);display:flex;align-items:center;justify-content:center;padding-bottom:18px;z-index:10;">
    ${t.logoUrl
      ? imgTag(t.logoUrl, 'height:46px;width:70px;object-fit:contain;')
      : `<span style="color:rgba(255,255,255,0.85);font-size:28px;line-height:1;">&#9733;</span>`}
  </div>

  <!-- MAIN CONTENT -->
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 160px 100px;text-align:center;z-index:5;">
    ${!t.logoUrl ? `<p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#999;margin:0 0 4px;">${esc(t.organizationName)}</p>` : ''}
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:26px;letter-spacing:0.22em;text-transform:uppercase;color:${a};font-weight:700;margin:0 0 2px;">CERTIFICADO</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:${GOLD_D};margin:0 0 18px;">DE EXCELENCIA</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:11px;letter-spacing:0.1em;color:#666;margin:0 0 12px;">${esc(t.headlineText)}</p>
    <p style="font-size:54px;color:${GOLD_D};margin:0 0 4px;font-style:italic;font-weight:400;line-height:1.05;">${esc(name)}</p>
    <div style="margin:12px auto;">${goldDivider(300)}</div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:11px;color:#555;margin:0 0 5px;">${esc(t.bodyText)}</p>
    <p style="font-size:13.5px;color:${a};font-style:italic;margin:0 0 5px;">"${esc(course)}"</p>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:9.5px;color:#bbb;margin:0;">${esc(date)}</p>
  </div>

  <!-- BOTTOM FOOTER -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:108px;display:flex;align-items:center;justify-content:space-between;padding:0 150px;z-index:6;">
    ${sigBlock(t)}
    ${goldSeal(72)}
    <div style="text-align:right;max-width:220px;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:#bbb;margin:0;line-height:1.75;">${esc(t.footerText)}</p>
    </div>
  </div>
</div>`;
}

// ─── Template 3 — Estándar ────────────────────────────────────────────────────
// Accent sidebar with diagonal cut · gold strip · white content area

function htmlEstandar(t: CertificateTemplateRecord, name: string, course: string, date: string): string {
  const a = esc(t.accentColor);
  return `
<div style="width:1123px;height:794px;overflow:hidden;position:relative;font-family:Georgia,'Times New Roman',serif;background:#fff;">

  <!-- SIDEBAR BACKGROUND SHAPE (diagonal right edge) -->
  <div style="position:absolute;top:0;left:0;width:380px;height:794px;background:${a};clip-path:polygon(0 0,100% 0,84% 100%,0 100%);z-index:1;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,0.1),transparent 65%);"></div>
    <div style="position:absolute;top:-55px;left:-55px;width:190px;height:190px;border-radius:50%;border:1px solid rgba(255,255,255,0.07);"></div>
    <div style="position:absolute;bottom:-35px;right:30px;width:140px;height:140px;border-radius:50%;border:1px solid rgba(255,255,255,0.06);"></div>
  </div>

  <!-- SIDEBAR CONTENT (separate layer, no clip) -->
  <div style="position:absolute;top:0;left:0;width:320px;height:794px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 30px;text-align:center;z-index:2;">
    ${goldSeal(90)}
    <div style="height:20px;"></div>
    ${t.logoUrl
      ? imgTag(t.logoUrl, 'height:34px;max-width:140px;object-fit:contain;display:block;margin:0 auto 14px;')
      : `<p style="font-family:Montserrat,Arial,sans-serif;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:rgba(255,255,255,0.82);font-weight:700;margin:0 0 14px;">${esc(t.organizationName)}</p>`}
    <div style="width:52px;height:1px;background:${GOLD};margin:0 auto 12px;"></div>
    <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;letter-spacing:0.34em;text-transform:uppercase;color:${GOLD_L};margin:0;">CERTIFICADO</p>
  </div>

  <!-- RIGHT CONTENT AREA -->
  <div style="position:absolute;top:0;left:348px;right:0;bottom:0;background:#fff;display:flex;flex-direction:column;z-index:1;">
    ${goldStrip()}
    <!-- Body -->
    <div style="flex:1;padding:36px 62px 0 52px;display:flex;flex-direction:column;justify-content:center;">
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#bbb;margin:0 0 8px;">SE CERTIFICA QUE</p>
      <p style="font-size:50px;color:${a};margin:0 0 4px;font-style:italic;font-weight:400;line-height:1.1;">${esc(name)}</p>
      <div style="display:flex;align-items:center;gap:12px;margin:12px 0;">
        <div style="width:40px;height:1px;background:${GOLD};flex-shrink:0;"></div>
        <div style="width:6px;height:6px;background:${GOLD};transform:rotate(45deg);flex-shrink:0;"></div>
        <div style="flex:1;height:1px;background:${GOLD}45;"></div>
      </div>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:12px;color:#555;margin:0 0 6px;">${esc(t.headlineText)}</p>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:11px;color:#777;margin:0 0 6px;line-height:1.5;">${esc(t.bodyText)}</p>
      <p style="font-size:13.5px;color:${a};font-style:italic;margin:0 0 8px;">"${esc(course)}"</p>
      <p style="font-family:Montserrat,Arial,sans-serif;font-size:9.5px;color:#bbb;letter-spacing:0.06em;margin:0;">${esc(date)}</p>
    </div>
    <!-- Footer -->
    <div style="height:114px;background:#f9f7f1;border-top:1px solid ${GOLD}28;display:flex;align-items:center;justify-content:space-between;padding:0 62px 0 52px;flex-shrink:0;">
      ${sigBlock(t)}
      <div style="text-align:right;max-width:240px;">
        <p style="font-family:Montserrat,Arial,sans-serif;font-size:8px;color:#bbb;margin:0;line-height:1.75;">${esc(t.footerText)}</p>
      </div>
    </div>
    ${goldStrip()}
  </div>
</div>`;
}

// ─── Font loading ──────────────────────────────────────────────────────────────

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

  // Wait for all images
  await Promise.all(
    Array.from(wrap.querySelectorAll<HTMLImageElement>('img')).map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) { res(); return; }
          img.onload = () => res();
          img.onerror = () => res();
        }),
    ),
  );

  const canvas = await html2canvas(wrap, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    width: 1123,
    height: 794,
    logging: false,
    backgroundColor: '#ffffff',
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

  const date = formatDate(completedAt);
  let html: string;

  switch (template.templateNumber) {
    case 2:
      html = htmlPremium(template, recipientName, courseName, date);
      break;
    case 3:
      html = htmlEstandar(template, recipientName, courseName, date);
      break;
    default:
      html = htmlEjecutiva(template, recipientName, courseName, date);
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
