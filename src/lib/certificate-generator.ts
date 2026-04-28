'use client';

import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return {
    r: isNaN(r) ? 95 : r,
    g: isNaN(g) ? 52 : g,
    b: isNaN(b) ? 113 : b,
  };
}

function lighten(channel: number, amount: number): number {
  return Math.min(255, Math.round(channel + (255 - channel) * amount));
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function dataUrlFormat(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

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

  const W = 297; // A4 landscape mm
  const H = 210;
  const accent = template.accentColor || '#5f3471';
  const { r, g, b } = hexToRgb(accent);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, W, 44, 'F');

  // ── Light tinted body background ──────────────────────────────────────────
  doc.setFillColor(lighten(r, 0.96), lighten(g, 0.96), lighten(b, 0.96));
  doc.rect(0, 44, W, 122, 'F');

  // ── Footer band ───────────────────────────────────────────────────────────
  doc.setFillColor(249, 247, 252);
  doc.rect(0, 166, W, 44, 'F');

  // ── Org name in header (right-aligned, white) ─────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(template.organizationName, W - 20, 26, { align: 'right' });

  // ── Decorative top divider ────────────────────────────────────────────────
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.7);
  doc.line(W / 2 - 28, 60, W / 2 + 28, 60);

  // ── Headline text ─────────────────────────────────────────────────────────
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(template.headlineText, W / 2, 74, { align: 'center' });

  // ── Recipient name ────────────────────────────────────────────────────────
  doc.setTextColor(r, g, b);
  doc.setFontSize(34);
  doc.setFont('helvetica', 'bold');
  doc.text(recipientName, W / 2, 96, { align: 'center' });

  // ── Body text + course title ──────────────────────────────────────────────
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${template.bodyText} "${courseName}"`, W / 2, 112, {
    align: 'center',
    maxWidth: 220,
  });

  // ── Decorative bottom divider ─────────────────────────────────────────────
  doc.line(W / 2 - 28, 126, W / 2 + 28, 126);

  // ── Completion date ───────────────────────────────────────────────────────
  const dateStr = new Date(completedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(dateStr, W / 2, 137, { align: 'center' });

  // ── Footer: signatory (left) ──────────────────────────────────────────────
  if (template.signatoryName) {
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(template.signatoryName, 30, 184);
    if (template.signatoryTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(130, 130, 130);
      doc.text(template.signatoryTitle, 30, 191);
    }
  }

  // ── Footer: footer text (right) ───────────────────────────────────────────
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(template.footerText, W - 20, 184, { align: 'right' });

  // ── Logo image ────────────────────────────────────────────────────────────
  if (template.logoUrl) {
    const logoData = await urlToDataUrl(template.logoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, dataUrlFormat(logoData), 20, 12, 0, 20);
      } catch {
        // Skip: logo couldn't be embedded
      }
    }
  }

  // ── Signature image ───────────────────────────────────────────────────────
  if (template.signatureUrl) {
    const sigData = await urlToDataUrl(template.signatureUrl);
    if (sigData) {
      try {
        doc.addImage(sigData, dataUrlFormat(sigData), 30, 170, 0, 12);
      } catch {
        // Skip: signature couldn't be embedded
      }
    }
  }

  const safeCourseName = courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);

  doc.save(`certificado-${safeCourseName}.pdf`);
}
