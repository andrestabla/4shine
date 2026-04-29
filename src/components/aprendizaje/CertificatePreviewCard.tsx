'use client';

import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';

// ── Design constants (mirror certificate-generator.ts) ────────────────────────

const GOLD   = '#C9A84C';
const GOLD_L = '#E8D090';
const GOLD_D = '#A07830';

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

// ── Shared sub-components ─────────────────────────────────────────────────────

function GoldSeal({ size = 30 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 36% 36%, ${GOLD_L}, ${GOLD_D})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#fff', fontSize: size * 0.38, lineHeight: 1 }}>★</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CertificatePreviewCardProps {
  template: Partial<CertificateTemplateRecord>;
  recipientName?: string;
  courseName?: string;
}

export function CertificatePreviewCard({
  template,
  recipientName = 'Nombre del Participante',
  courseName,
}: CertificatePreviewCardProps) {
  const accent      = template.accentColor ?? '#5f3471';
  const rgb         = cpHex(accent);
  const n           = template.templateNumber ?? 1;
  const orgLabel    = template.organizationName ?? 'Organización';
  const headlineText = template.headlineText ?? 'Se certifica que';
  const bodyText    = template.bodyText ?? 'ha completado satisfactoriamente el curso';
  const sigName     = template.signatoryName ?? '';
  const sigTitle    = template.signatoryTitle ?? '';
  const footerText  = template.footerText ?? '';

  const logo = template.logoUrl
    ? <img src={template.logoUrl} alt="Logo" style={{ height: 16, maxWidth: 70, objectFit: 'contain', display: 'block' }} />
    : null;

  const SigBlock = ({ nameColor = '#333', titleColor = '#888' }: { nameColor?: string; titleColor?: string }) => (
    <div>
      {template.signatureUrl && (
        <img src={template.signatureUrl} alt="Firma"
          style={{ height: 11, maxWidth: 44, objectFit: 'contain', display: 'block', marginBottom: 2 }} />
      )}
      {sigName  && <p style={{ fontSize: 5.5, fontWeight: 700, color: nameColor,  margin: 0 }}>{sigName}</p>}
      {sigTitle && <p style={{ fontSize: 5,   color: titleColor, margin: '1px 0 0' }}>{sigTitle}</p>}
    </div>
  );

  // ── Template 2 — Premium ─────────────────────────────────────────────────
  if (n === 2) {
    const bgDark   = cpDarken(rgb, 0.82);
    const bgMid    = cpDarken(rgb, 0.72);
    const bgFooter = cpDarken(rgb, 0.88);
    const acLight  = cpLighten(rgb, 0.60);
    return (
      <div className="w-full overflow-hidden rounded-[12px] shadow-lg"
        style={{ aspectRatio: '1.414', background: bgDark, position: 'relative' }}>
        {/* Borders */}
        <div style={{ position: 'absolute', inset: 0, border: `4px solid ${accent}`, borderRadius: 12, zIndex: 5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 8, border: `0.5px solid ${acLight}`, borderRadius: 8, zIndex: 5, pointerEvents: 'none', opacity: 0.55 }} />
        {/* Mid panel */}
        <div style={{ position: 'absolute', top: '10%', right: '10%', bottom: '20%', left: '10%', background: bgMid, borderRadius: 3 }} />
        {/* Main content */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 17%', textAlign: 'center', zIndex: 3 }}>
          <p style={{ fontSize: 5, letterSpacing: '0.22em', color: acLight, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 7px' }}>CERTIFICADO DE EXCELENCIA</p>
          {logo
            ? <div style={{ marginBottom: 6 }}>{logo}</div>
            : orgLabel ? <p style={{ fontSize: 7, color: 'rgba(220,215,240,0.85)', margin: '0 0 6px' }}>{orgLabel}</p> : null
          }
          <div style={{ width: 24, height: 1.5, background: accent, borderRadius: 1, margin: '0 0 7px' }} />
          <p style={{ fontSize: 6, color: 'rgba(220,215,235,0.80)', margin: '0 0 7px', lineHeight: 1.4 }}>{headlineText}</p>
          <p style={{ fontSize: 19, color: '#fff', margin: '0 0 5px', fontStyle: 'italic', lineHeight: 1.05, fontFamily: 'Georgia,serif' }}>{recipientName}</p>
          <p style={{ fontSize: 5.5, color: 'rgba(200,195,220,0.75)', margin: '0 0 4px', lineHeight: 1.4 }}>{bodyText}</p>
          {courseName && <p style={{ fontSize: 7, color: acLight, fontStyle: 'italic', margin: '0 0 4px', fontFamily: 'Georgia,serif' }}>"{courseName}"</p>}
          <div style={{ width: 24, height: 1.5, background: accent, borderRadius: 1, marginTop: 7 }} />
        </div>
        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%', background: bgFooter, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8%', borderTop: `0.5px solid ${acLight}44`, zIndex: 4 }}>
          <SigBlock nameColor="rgba(220,215,240,1)" titleColor="rgba(180,175,205,0.75)" />
          <GoldSeal size={26} />
          <p style={{ fontSize: 5, color: 'rgba(180,175,205,0.60)', textAlign: 'right', maxWidth: '30%', lineHeight: 1.6, margin: 0 }}>{footerText}</p>
        </div>
      </div>
    );
  }

  // ── Template 3 — Estándar ────────────────────────────────────────────────
  // Sidebar uses CSS clip-path for diagonal edge (safe in browser; PDF uses SVG polygon).
  if (n === 3) {
    return (
      <div className="w-full overflow-hidden rounded-[12px] shadow-lg"
        style={{ aspectRatio: '1.414', position: 'relative', background: '#fff' }}>
        {/* Diagonal accent sidebar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%',
          background: accent,
          clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 6, padding: '0 5%',
        }}>
          <GoldSeal size={30} />
          <div style={{ width: 22, height: 0.5, background: `${GOLD}80` }} />
          {logo
            ? logo
            : <p style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.88)', textAlign: 'center', margin: 0, letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1.4 }}>{orgLabel}</p>
          }
          <div style={{ width: 22, height: 0.5, background: `${GOLD}80` }} />
          <p style={{ fontSize: 5, color: `${GOLD_L}cc`, letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>CERT.</p>
        </div>

        {/* Right panel — starts at 30% to clear the diagonal */}
        <div style={{ position: 'absolute', top: 0, left: '30%', right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 2.5, background: `linear-gradient(to right, ${GOLD_D}, ${GOLD_L}, ${GOLD})`, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '7% 8% 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 5px' }}>SE CERTIFICA QUE</p>
            <p style={{ fontSize: 17, color: accent, margin: '0 0 3px', fontStyle: 'italic', lineHeight: 1.1, fontFamily: 'Georgia,serif' }}>{recipientName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '5px 0' }}>
              <div style={{ width: 18, height: 0.5, background: GOLD, flexShrink: 0 }} />
              <div style={{ width: 4, height: 4, background: GOLD, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 0.5, background: `${GOLD}45` }} />
            </div>
            <p style={{ fontSize: 6, color: '#555', margin: '0 0 3px', lineHeight: 1.4 }}>{headlineText}</p>
            <p style={{ fontSize: 5.5, color: '#777', margin: '0 0 4px', lineHeight: 1.45 }}>{bodyText}</p>
            {courseName && <p style={{ fontSize: 7, color: accent, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia,serif' }}>"{courseName}"</p>}
          </div>
          <div style={{ height: '22%', background: '#f9f7f1', borderTop: `0.5px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8%', flexShrink: 0 }}>
            <SigBlock />
            <p style={{ fontSize: 5, color: '#bbb', textAlign: 'right', maxWidth: '40%', lineHeight: 1.6, margin: 0 }}>{footerText}</p>
          </div>
          <div style={{ height: 2.5, background: `linear-gradient(to right, ${GOLD_D}, ${GOLD_L}, ${GOLD})`, flexShrink: 0 }} />
        </div>
      </div>
    );
  }

  // ── Template 1 — Ejecutiva (default) ─────────────────────────────────────
  return (
    <div className="w-full overflow-hidden rounded-[12px] shadow-md border border-gray-100"
      style={{ aspectRatio: '1.414', background: '#fff', position: 'relative' }}>
      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderTop: `1px solid ${GOLD}50`, borderRight: `1px solid ${GOLD}50`, pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 36, height: 36, borderBottom: `1px solid ${GOLD}50`, borderLeft: `1px solid ${GOLD}50`, pointerEvents: 'none', zIndex: 5 }} />

      {/* Header band */}
      <div style={{ height: '26%', background: `linear-gradient(135deg, ${accent}f2, ${accent}aa)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 12%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(255,255,255,0.15), transparent 65%)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {logo ?? <p style={{ fontSize: 5, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: 0 }}>{orgLabel}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <div style={{ height: 0.5, width: 24, background: GOLD }} />
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', fontWeight: 700, margin: 0 }}>CERTIFICADO</p>
            <div style={{ height: 0.5, width: 24, background: GOLD }} />
          </div>
          <p style={{ fontSize: 5, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD_L, margin: 0 }}>DE LOGRO</p>
        </div>
      </div>

      {/* Gold strip */}
      <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD_D}, ${GOLD_L}, ${GOLD}, ${GOLD_L}, ${GOLD_D})` }} />

      {/* Body */}
      <div style={{ padding: '4% 9% 0', textAlign: 'center' }}>
        <p style={{ fontSize: 4.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#bbb', margin: '0 0 5px' }}>SE CERTIFICA QUE</p>
        <p style={{ fontSize: 19, color: accent, margin: 0, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.05, fontFamily: 'Georgia,serif' }}>{recipientName}</p>
        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '55%', margin: '5px auto' }}>
          <div style={{ flex: 1, height: 0.5, background: `${GOLD}60` }} />
          <div style={{ width: 5, height: 5, background: GOLD, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 0.5, background: `${GOLD}60` }} />
        </div>
        <p style={{ fontSize: 5.5, color: '#555', margin: '0 0 2px' }}>{headlineText}</p>
        <p style={{ fontSize: 5, color: '#777', lineHeight: 1.45, margin: '0 0 3px' }}>{bodyText}</p>
        {courseName && <p style={{ fontSize: 7, color: accent, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia,serif' }}>"{courseName}"</p>}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', background: '#f9f7f1', borderTop: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 9%' }}>
        <SigBlock />
        <GoldSeal size={26} />
        <p style={{ fontSize: 5, color: '#bbb', textAlign: 'right', maxWidth: '30%', lineHeight: 1.6, margin: 0 }}>{footerText}</p>
      </div>
    </div>
  );
}
