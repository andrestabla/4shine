'use client';

import { Award } from 'lucide-react';
import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

// ── Color helpers ─────────────────────────────────────────────────────────────

function cpHex(hex: string): [number, number, number] {
  const c = (hex ?? '#5f3471').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [isNaN(r) ? 95 : r, isNaN(g) ? 52 : g, isNaN(b) ? 113 : b];
}
function cpLighten([r, g, b]: [number, number, number], t: number): string {
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * t))},${Math.min(255, Math.round(g + (255 - g) * t))},${Math.min(255, Math.round(b + (255 - b) * t))})`;
}
function cpDarken([r, g, b]: [number, number, number], t: number): string {
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CertificatePreviewCardProps {
  template: Partial<CertificateTemplateRecord>;
  recipientName?: string;
}

export function CertificatePreviewCard({
  template,
  recipientName = 'Nombre del Participante',
}: CertificatePreviewCardProps) {
  const accent = template.accentColor ?? '#5f3471';
  const rgb = cpHex(accent);
  const n = template.templateNumber ?? 1;

  const orgLabel = template.organizationName ?? 'Organización';
  const headlineText = template.headlineText ?? 'Este certificado acredita que';
  const bodyText = template.bodyText ?? 'ha completado satisfactoriamente el curso';
  const sigName = template.signatoryName ?? '';
  const sigTitle = template.signatoryTitle ?? '';
  const footerText = template.footerText ?? '';

  const logo = template.logoUrl ? (
    <img src={template.logoUrl} alt="Logo" style={{ height: 22, maxWidth: 80, objectFit: 'contain' }} />
  ) : null;

  // ── Template 2 — Premium ─────────────────────────────────────────────────
  if (n === 2) {
    const bgDark = cpDarken(rgb, 0.82);
    const bgMid = cpDarken(rgb, 0.72);
    const bgFooter = cpDarken(rgb, 0.88);
    const accentLight = cpLighten(rgb, 0.55);
    return (
      <div
        className="w-full overflow-hidden rounded-[14px] shadow-lg"
        style={{ aspectRatio: '1.414', background: bgDark, position: 'relative' }}
      >
        <div style={{ position: 'absolute', inset: 0, border: `5px solid ${accent}`, borderRadius: 14, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 10, border: `0.5px solid ${accentLight}`, borderRadius: 8, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: '14%', background: bgMid, borderRadius: 4 }} />
        <div style={{ position: 'relative', zIndex: 3, height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16%', textAlign: 'center' }}>
          <p style={{ fontSize: '6px', letterSpacing: '0.22em', color: accentLight, fontWeight: 700, textTransform: 'uppercase', marginBottom: 7 }}>
            CERTIFICADO DE EXCELENCIA
          </p>
          {logo ? (
            <div style={{ marginBottom: 5 }}>{logo}</div>
          ) : (
            <p style={{ fontSize: '8px', color: 'rgba(220,215,240,0.8)', marginBottom: 5 }}>{orgLabel}</p>
          )}
          <div style={{ width: 28, height: 1.5, background: accent, marginBottom: 8, borderRadius: 2 }} />
          <p style={{ fontSize: '8px', color: 'rgba(220,215,235,0.85)', marginBottom: 5, lineHeight: 1.4 }}>{headlineText}</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 5 }}>{recipientName}</p>
          <p style={{ fontSize: '8px', color: 'rgba(200,195,220,0.8)', lineHeight: 1.4, maxWidth: '82%' }}>{bodyText}</p>
          <div style={{ width: 28, height: 1.5, background: accent, marginTop: 8, borderRadius: 2 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: '19%', background: bgFooter, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderTop: `0.5px solid ${accentLight}`, borderRadius: '0 0 8px 8px' }}>
          <div>
            {template.signatureUrl && <img src={template.signatureUrl} alt="Firma" style={{ height: 13, maxWidth: 55, objectFit: 'contain', display: 'block', marginBottom: 2 }} />}
            {sigName && <p style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(220,215,240,1)' }}>{sigName}</p>}
            {sigTitle && <p style={{ fontSize: '6px', color: 'rgba(180,175,205,0.8)' }}>{sigTitle}</p>}
          </div>
          <p style={{ fontSize: '6px', color: 'rgba(180,175,205,0.65)', textAlign: 'right', maxWidth: '45%', lineHeight: 1.4 }}>{footerText}</p>
        </div>
      </div>
    );
  }

  // ── Template 3 — Estándar ────────────────────────────────────────────────
  if (n === 3) {
    const accentLight = cpLighten(rgb, 0.9);
    return (
      <div
        className="w-full overflow-hidden rounded-[14px] shadow-lg"
        style={{ aspectRatio: '1.414', display: 'flex' }}
      >
        {/* Sidebar */}
        <div style={{ width: '27%', background: accent, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 7px', gap: 7, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={14} color="white" />
          </div>
          <div style={{ width: 24, height: 0.5, background: 'rgba(255,255,255,0.35)' }} />
          <p style={{ fontSize: '8px', fontWeight: 700, color: 'white', textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word', maxWidth: '90%' }}>{orgLabel}</p>
          <div style={{ width: 24, height: 0.5, background: 'rgba(255,255,255,0.35)' }} />
          <p style={{ fontSize: '5.5px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase' }}>CERT.</p>
        </div>
        {/* Content */}
        <div style={{ flex: 1, background: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 4, background: accentLight, flexShrink: 0 }} />
          {logo && <div style={{ position: 'absolute', top: 8, right: 10 }}>{logo}</div>}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 12px 4px 14px' }}>
            <div style={{ width: 36, height: 1.5, background: accent, marginBottom: 7, borderRadius: 2 }} />
            <p style={{ fontSize: '8px', color: '#777', marginBottom: 4, lineHeight: 1.4 }}>{headlineText}</p>
            <p style={{ fontSize: '14px', fontWeight: 800, color: accent, lineHeight: 1.2, marginBottom: 4 }}>{recipientName}</p>
            <div style={{ width: '75%', height: 0.5, background: `${accent}55`, marginBottom: 6 }} />
            <p style={{ fontSize: '7.5px', color: '#555', lineHeight: 1.4, marginBottom: 6 }}>{bodyText}</p>
            {sigName && (
              <div style={{ paddingTop: 5, borderTop: '0.5px solid #eaeaee' }}>
                {template.signatureUrl && <img src={template.signatureUrl} alt="Firma" style={{ height: 12, maxWidth: 50, objectFit: 'contain', display: 'block', marginBottom: 2 }} />}
                <p style={{ fontSize: '7px', fontWeight: 700, color: '#444' }}>{sigName}</p>
                {sigTitle && <p style={{ fontSize: '6px', color: '#888' }}>{sigTitle}</p>}
              </div>
            )}
          </div>
          <div style={{ height: 4, background: accentLight, flexShrink: 0 }} />
        </div>
      </div>
    );
  }

  // ── Template 1 — Ejecutiva (default) ─────────────────────────────────────
  const accentLight = cpLighten(rgb, 0.92);
  const accentMid = cpLighten(rgb, 0.55);
  return (
    <div
      className="w-full overflow-hidden rounded-[14px] shadow-lg border border-gray-100"
      style={{ aspectRatio: '1.414' }}
    >
      {/* Header band */}
      <div style={{ height: '22%', background: `linear-gradient(135deg, ${accent}ee, ${accent}99)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        {logo ?? (
          <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 6, padding: '3px 8px', fontSize: '8px', fontWeight: 700, color: 'white' }}>{orgLabel}</span>
        )}
        <Award size={14} color="rgba(255,255,255,0.4)" />
      </div>
      {/* Strip */}
      <div style={{ height: 2, background: accentMid }} />
      {/* Body */}
      <div style={{ height: '54%', background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 12px' }}>
        <div style={{ background: 'white', borderRadius: 6, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 14px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 0.5, background: `${accent}50` }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
            <div style={{ flex: 1, height: 0.5, background: `${accent}50` }} />
          </div>
          <p style={{ fontSize: '8.5px', color: '#777', marginBottom: 4 }}>{headlineText}</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: accent, lineHeight: 1.2, marginBottom: 4 }}>{recipientName}</p>
          <p style={{ fontSize: '8.5px', color: '#777', lineHeight: 1.4, marginBottom: 6, maxWidth: '88%' }}>{bodyText}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 0.5, background: `${accent}50` }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentMid }} />
            <div style={{ flex: 1, height: 0.5, background: `${accent}50` }} />
          </div>
        </div>
      </div>
      {/* Footer */}
      <div style={{ height: '22%', background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderTop: `1px solid ${accentMid}50` }}>
        <div>
          {template.signatureUrl && <img src={template.signatureUrl} alt="Firma" style={{ height: 14, maxWidth: 60, objectFit: 'contain', display: 'block', marginBottom: 2 }} />}
          {sigName && <p style={{ fontSize: '7px', fontWeight: 700, color: '#444' }}>{sigName}</p>}
          {sigTitle && <p style={{ fontSize: '6px', color: '#888' }}>{sigTitle}</p>}
        </div>
        <p style={{ fontSize: '6px', color: '#999', textAlign: 'right', maxWidth: '45%', lineHeight: 1.4 }}>{footerText}</p>
      </div>
    </div>
  );
}
