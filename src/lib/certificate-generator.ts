'use client';

import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

// ─── Color helpers ────────────────────────────────────────────────────────────

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [isNaN(r) ? 95 : r, isNaN(g) ? 52 : g, isNaN(b) ? 113 : b];
}

function lighten([r, g, b]: RGB, t: number): RGB {
  return [
    Math.min(255, Math.round(r + (255 - r) * t)),
    Math.min(255, Math.round(g + (255 - g) * t)),
    Math.min(255, Math.round(b + (255 - b) * t)),
  ];
}

function darken([r, g, b]: RGB, t: number): RGB {
  return [Math.round(r * (1 - t)), Math.round(g * (1 - t)), Math.round(b * (1 - t))];
}

interface LoadedImage {
  dataUrl: string;
  w: number;
  h: number;
}

async function loadImageViaProxy(url: string): Promise<LoadedImage | null> {
  try {
    const proxyUrl = `/api/v1/image-proxy?url=${encodeURIComponent(url)}`;
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 100;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0);
          resolve({ dataUrl: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = proxyUrl;
    });
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

function fill(doc: Doc, rgb: RGB) { doc.setFillColor(...rgb); }
function stroke(doc: Doc, rgb: RGB) { doc.setDrawColor(...rgb); }
function ink(doc: Doc, rgb: RGB) { doc.setTextColor(...rgb); }

// ─── Template 1 — Ejecutiva ───────────────────────────────────────────────────
// Professional horizontal bands. Centered typography. Distinct header / body / footer zones.

async function buildEjecutiva(
  doc: Doc,
  t: CertificateTemplateRecord,
  name: string,
  course: string,
  completedAt: string,
) {
  const W = 297;
  const accent: RGB = hexToRgb(t.accentColor);
  const accentLight: RGB = lighten(accent, 0.90);
  const accentMid: RGB = lighten(accent, 0.55);
  const gray: RGB = [90, 90, 90];
  const muted: RGB = [155, 155, 155];
  const white: RGB = [255, 255, 255];

  // ── 1. Header band ─────────────────────────────────────────────────────────
  fill(doc, accent);
  doc.rect(0, 0, W, 48, 'F');

  // Thin accent-mid strip below header
  fill(doc, accentMid);
  doc.rect(0, 48, W, 3, 'F');

  // ── 2. Body background ────────────────────────────────────────────────────
  fill(doc, accentLight);
  doc.rect(0, 51, W, 125, 'F');

  // White inner card (body)
  fill(doc, white);
  doc.rect(22, 57, W - 44, 113, 'F');

  // ── 3. Footer band ────────────────────────────────────────────────────────
  fill(doc, accentLight);
  doc.rect(0, 176, W, 34, 'F');
  stroke(doc, accentMid);
  doc.setLineWidth(0.4);
  doc.line(0, 176, W, 176);

  // ── 4. Header content ──────────────────────────────────────────────────────
  // Logo (top-left)
  const logoData = t.logoUrl ? await urlToDataUrl(t.logoUrl) : null;
  if (logoData) {
    try { doc.addImage(logoData, imgFormat(logoData), 18, 10, 0, 28); } catch { /* skip */ }
  }

  // Org name (top-right, white)
  ink(doc, white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t.organizationName, W - 18, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, lighten(accent, 0.65));
  doc.text('CERTIFICADO DE LOGRO', W - 18, 36, { align: 'right' });

  // ── 5. Body content ───────────────────────────────────────────────────────
  // Decorative lines with diamond centre
  stroke(doc, accentMid);
  doc.setLineWidth(0.7);
  const cx = W / 2;
  doc.line(cx - 50, 74, cx - 6, 74);
  doc.line(cx + 6, 74, cx + 50, 74);
  fill(doc, accent);
  doc.ellipse(cx, 74, 3, 3, 'F');

  // Headline
  ink(doc, gray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(t.headlineText, cx, 90, { align: 'center' });

  // Recipient name
  ink(doc, accent);
  doc.setFontSize(38);
  doc.setFont('helvetica', 'bold');
  doc.text(name, cx, 114, { align: 'center' });

  // Body text + course
  ink(doc, gray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const bodyLine = `${t.bodyText}`;
  doc.text(bodyLine, cx, 128, { align: 'center' });
  ink(doc, accentMid);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.text(`"${course}"`, cx, 139, { align: 'center', maxWidth: 220 });

  // Bottom decorative lines
  doc.setFont('helvetica', 'normal');
  stroke(doc, accentMid);
  doc.setLineWidth(0.7);
  doc.line(cx - 50, 151, cx - 6, 151);
  doc.line(cx + 6, 151, cx + 50, 151);
  fill(doc, accentMid);
  doc.ellipse(cx, 151, 3, 3, 'F');

  // Date
  ink(doc, muted);
  doc.setFontSize(9);
  doc.text(formatDate(completedAt), cx, 162, { align: 'center' });

  // ── 6. Footer content ─────────────────────────────────────────────────────
  // Signature image
  const sigData = t.signatureUrl ? await urlToDataUrl(t.signatureUrl) : null;
  if (sigData) {
    try { doc.addImage(sigData, imgFormat(sigData), 22, 178, 0, 12); } catch { /* skip */ }
  }

  if (t.signatoryName) {
    ink(doc, [50, 50, 50]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(t.signatoryName, 22, sigData ? 196 : 189);
    if (t.signatoryTitle) {
      ink(doc, muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(t.signatoryTitle, 22, sigData ? 202 : 196);
    }
  }

  ink(doc, muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(t.footerText, W - 18, 191, { align: 'right' });
}

// ─── Template 2 — Premium ─────────────────────────────────────────────────────
// Full dark background. Accent border frame. Bold all-white typography.

async function buildPremium(
  doc: Doc,
  t: CertificateTemplateRecord,
  name: string,
  course: string,
  completedAt: string,
) {
  const W = 297;
  const H = 210;
  const accent: RGB = hexToRgb(t.accentColor);
  const bgDark: RGB = darken(accent, 0.82);
  const bgMid: RGB = darken(accent, 0.72);
  const accentLight: RGB = lighten(accent, 0.55);
  const white: RGB = [255, 255, 255];
  const offWhite: RGB = [230, 225, 240];
  const dimWhite: RGB = [175, 165, 195];

  // ── 1. Dark full-page background ──────────────────────────────────────────
  fill(doc, bgDark);
  doc.rect(0, 0, W, H, 'F');

  // ── 2. Accent border strips (top / bottom / left / right) ─────────────────
  const bw = 7; // border width in mm
  fill(doc, accent);
  doc.rect(0, 0, W, bw, 'F');       // top
  doc.rect(0, H - bw, W, bw, 'F'); // bottom
  doc.rect(0, 0, bw, H, 'F');       // left
  doc.rect(W - bw, 0, bw, H, 'F'); // right

  // ── 3. Inner border line ──────────────────────────────────────────────────
  stroke(doc, accentLight);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, W - 28, H - 28, 'S');

  // ── 4. Subtle mid panel (centre body) ────────────────────────────────────
  fill(doc, bgMid);
  doc.rect(22, 22, W - 44, H - 44, 'F');

  // ── 5. Top label + decorative lines ──────────────────────────────────────
  ink(doc, dimWhite);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('C E R T I F I C A D O  D E  E X C E L E N C I A', W / 2, 36, { align: 'center' });

  // Two decorative lines flanking the label
  stroke(doc, accentLight);
  doc.setLineWidth(0.4);
  doc.line(24, 36, W / 2 - 78, 36);
  doc.line(W / 2 + 78, 36, W - 24, 36);

  // ── 6. Org name ───────────────────────────────────────────────────────────
  // Logo top-center or org name
  const logoData = t.logoUrl ? await urlToDataUrl(t.logoUrl) : null;
  if (logoData) {
    try { doc.addImage(logoData, imgFormat(logoData), W / 2 - 20, 42, 0, 16); } catch { /* skip */ }
  } else {
    ink(doc, offWhite);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(t.organizationName, W / 2, 50, { align: 'center' });
  }

  // ── 7. Thin accent divider ────────────────────────────────────────────────
  stroke(doc, accent);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 35, 60, W / 2 + 35, 60);

  // ── 8. Headline text ──────────────────────────────────────────────────────
  ink(doc, offWhite);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t.headlineText, W / 2, 76, { align: 'center' });

  // ── 9. Recipient name — very large, white ─────────────────────────────────
  ink(doc, white);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text(name, W / 2, 103, { align: 'center' });

  // ── 10. Body text + course ────────────────────────────────────────────────
  ink(doc, offWhite);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t.bodyText, W / 2, 118, { align: 'center' });
  ink(doc, accentLight);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.text(`"${course}"`, W / 2, 129, { align: 'center', maxWidth: 220 });

  // ── 11. Divider + date ────────────────────────────────────────────────────
  stroke(doc, accent);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 35, 140, W / 2 + 35, 140);

  ink(doc, dimWhite);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(completedAt), W / 2, 151, { align: 'center' });

  // ── 12. Footer zone (darker) ──────────────────────────────────────────────
  fill(doc, darken(accent, 0.88));
  doc.rect(bw, H - 48, W - bw * 2, 41, 'F');
  stroke(doc, accentLight);
  doc.setLineWidth(0.3);
  doc.line(bw, H - 48, W - bw, H - 48);

  // Signature image
  const sigData = t.signatureUrl ? await urlToDataUrl(t.signatureUrl) : null;
  if (sigData) {
    try { doc.addImage(sigData, imgFormat(sigData), 22, H - 44, 0, 12); } catch { /* skip */ }
  }

  if (t.signatoryName) {
    ink(doc, offWhite);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(t.signatoryName, 22, sigData ? H - 27 : H - 34);
    if (t.signatoryTitle) {
      ink(doc, dimWhite);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(t.signatoryTitle, 22, sigData ? H - 20 : H - 26);
    }
  }

  ink(doc, dimWhite);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(t.footerText, W - 22, H - 27, { align: 'right' });
}

// ─── Template 3 — Estándar ────────────────────────────────────────────────────
// Two-column: accent sidebar (left) + white content (right). Left-aligned layout.

async function buildEstandar(
  doc: Doc,
  t: CertificateTemplateRecord,
  name: string,
  course: string,
  completedAt: string,
) {
  const W = 297;
  const H = 210;
  const accent: RGB = hexToRgb(t.accentColor);
  const accentLight: RGB = lighten(accent, 0.88);
  const accentMid: RGB = lighten(accent, 0.50);
  const white: RGB = [255, 255, 255];
  const dark: RGB = [40, 40, 50];
  const gray: RGB = [90, 90, 100];
  const muted: RGB = [155, 155, 165];

  const SB = 58; // sidebar width (mm)
  const CX = SB + 22; // content left edge

  // ── 1. Sidebar ────────────────────────────────────────────────────────────
  fill(doc, accent);
  doc.rect(0, 0, SB, H, 'F');

  // Thin lighter strip at right edge of sidebar
  fill(doc, accentMid);
  doc.rect(SB - 3, 0, 3, H, 'F');

  // Sidebar decorative circle (top)
  fill(doc, lighten(accent, 0.25));
  doc.ellipse(SB / 2, 32, 16, 16, 'F');
  fill(doc, white);
  doc.ellipse(SB / 2, 32, 11, 11, 'F');
  // Award icon approximation: small circle + lines
  fill(doc, accent);
  doc.ellipse(SB / 2, 29, 4.5, 4.5, 'F');
  stroke(doc, accent);
  doc.setLineWidth(1.2);
  doc.line(SB / 2 - 3, 35, SB / 2, 38);
  doc.line(SB / 2 + 3, 35, SB / 2, 38);

  // Sidebar: org name (white, centered horizontally in sidebar)
  ink(doc, white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  // Multi-line wrap in sidebar
  const orgWords = t.organizationName.split(' ');
  let orgLine1 = '';
  let orgLine2 = '';
  for (const word of orgWords) {
    if ((orgLine1 + ' ' + word).trim().length <= 9) orgLine1 = (orgLine1 + ' ' + word).trim();
    else orgLine2 = (orgLine2 + ' ' + word).trim();
  }
  if (orgLine2) {
    doc.text(orgLine1, SB / 2, 104, { align: 'center' });
    doc.text(orgLine2, SB / 2, 114, { align: 'center' });
  } else {
    doc.text(t.organizationName, SB / 2, 109, { align: 'center' });
  }

  // Sidebar: small dividers above/below org name
  stroke(doc, lighten(accent, 0.45));
  doc.setLineWidth(0.4);
  const orgY = orgLine2 ? 97 : 100;
  doc.line(12, orgY, SB - 12, orgY);
  const orgY2 = orgLine2 ? 120 : 117;
  doc.line(12, orgY2, SB - 12, orgY2);

  // Sidebar: "CERTIFICADO" label (bottom, small rotated text using character approach)
  ink(doc, lighten(accent, 0.4));
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  // Write sideways using angle
  doc.text('C E R T I F I C A D O', SB / 2 + 1, 190, { align: 'center', angle: 0 });

  // ── 2. Content area background ────────────────────────────────────────────
  fill(doc, white);
  doc.rect(SB, 0, W - SB, H, 'F');

  // Top accent strip in content area
  fill(doc, accentLight);
  doc.rect(SB, 0, W - SB, 5, 'F');

  // Bottom accent strip
  fill(doc, accentLight);
  doc.rect(SB, H - 5, W - SB, 5, 'F');

  // ── 3. Logo (top-right of content area) ───────────────────────────────────
  const logoData = t.logoUrl ? await urlToDataUrl(t.logoUrl) : null;
  if (logoData) {
    try { doc.addImage(logoData, imgFormat(logoData), W - 60, 10, 0, 18); } catch { /* skip */ }
  }

  // ── 4. Content (left-aligned from CX) ────────────────────────────────────
  // Thin accent rule at top of content
  stroke(doc, accent);
  doc.setLineWidth(1.2);
  doc.line(CX, 18, CX + 70, 18);

  // Headline text
  ink(doc, gray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t.headlineText, CX, 36);

  // Recipient name (large, accent color, left-aligned)
  ink(doc, accent);
  doc.setFontSize(38);
  doc.setFont('helvetica', 'bold');
  doc.text(name, CX, 66);

  // Underline beneath name
  stroke(doc, accentMid);
  doc.setLineWidth(0.8);
  doc.line(CX, 72, W - 18, 72);

  // Body text
  ink(doc, dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t.bodyText, CX, 90);

  // Course name (accent, italic)
  ink(doc, accentMid);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.text(`"${course}"`, CX, 102, { maxWidth: W - CX - 18 });

  // Date
  ink(doc, muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatDate(completedAt), CX, 118);

  // ── 5. Signature section ──────────────────────────────────────────────────
  // Divider line before signatures
  stroke(doc, [210, 210, 215]);
  doc.setLineWidth(0.4);
  doc.line(CX, 138, W - 18, 138);

  const sigData = t.signatureUrl ? await urlToDataUrl(t.signatureUrl) : null;
  if (sigData) {
    try { doc.addImage(sigData, imgFormat(sigData), CX, 144, 0, 13); } catch { /* skip */ }
  }

  // Short signature line
  stroke(doc, [200, 200, 210]);
  doc.setLineWidth(0.4);
  doc.line(CX, sigData ? 160 : 155, CX + 58, sigData ? 160 : 155);

  if (t.signatoryName) {
    ink(doc, dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(t.signatoryName, CX, sigData ? 167 : 163);
    if (t.signatoryTitle) {
      ink(doc, muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(t.signatoryTitle, CX, sigData ? 174 : 171);
    }
  }

  // Footer text (bottom-right of content area)
  ink(doc, muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(t.footerText, W - 18, H - 10, { align: 'right' });
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
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
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  switch (template.templateNumber) {
    case 2:
      await buildPremium(doc, template, recipientName, courseName, completedAt);
      break;
    case 3:
      await buildEstandar(doc, template, recipientName, courseName, completedAt);
      break;
    default:
      await buildEjecutiva(doc, template, recipientName, courseName, completedAt);
  }

  const safeCourseName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  doc.save(`certificado-${safeCourseName}.pdf`);
}
