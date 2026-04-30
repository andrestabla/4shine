'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, GripVertical, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { CertificateTemplateRecord } from '@/features/aprendizaje/service';
import {
  CERT_H,
  CERT_W,
  type CertificateElement,
  type CertImageField,
  type CertTextAlign,
  getDefaultElements,
  resolveContent,
} from '@/lib/certificate-elements';

// ─── Preview background components (structural, no content) ───────────────────

const GOLD = '#C9A84C';
const GOLD_L = '#E8D090';
const GOLD_D = '#A07830';

function hexToRgb(hex: string): [number, number, number] {
  const c = (hex ?? '#5f3471').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return [isNaN(r) ? 95 : r, isNaN(g) ? 52 : g, isNaN(b) ? 113 : b];
}
function colorDarken([r, g, b]: [number, number, number], t: number) {
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
}
function colorLighten([r, g, b]: [number, number, number], t: number) {
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * t))},${Math.min(255, Math.round(g + (255 - g) * t))},${Math.min(255, Math.round(b + (255 - b) * t))})`;
}

function GoldSeal({ size = 72 }: { size?: number }) {
  const starPx = Math.round(size * 0.38);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 36% 36%, ${GOLD_L}, ${GOLD_D})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#fff', fontSize: starPx, lineHeight: 1 }}>★</span>
    </div>
  );
}

function EjecutivaBackground({ accent }: { accent: string }) {
  return (
    <div style={{ width: CERT_W, height: CERT_H, position: 'relative', background: '#fff', overflow: 'hidden' }}>
      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 130, height: 130, borderTop: `2px solid ${GOLD}50`, borderRight: `2px solid ${GOLD}50`, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 130, height: 130, borderBottom: `2px solid ${GOLD}50`, borderLeft: `2px solid ${GOLD}50`, zIndex: 1, pointerEvents: 'none' }} />
      {/* Header band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 206, background: `linear-gradient(135deg,${accent}f2,${accent}aa)` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%,rgba(255,255,255,0.15),transparent 65%)' }} />
      </div>
      {/* Gold strip */}
      <div style={{ position: 'absolute', top: 206, left: 0, right: 0, height: 5, background: `linear-gradient(to right,${GOLD_D},${GOLD_L},${GOLD},${GOLD_L},${GOLD_D})` }} />
      {/* Footer band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 118, background: '#f9f7f1', borderTop: `1px solid ${GOLD}30` }} />
    </div>
  );
}

function PremiumBackground({ accent }: { accent: string }) {
  const rgb = hexToRgb(accent);
  const bgDark = colorDarken(rgb, 0.82);
  const bgMid = colorDarken(rgb, 0.72);
  const bgFooter = colorDarken(rgb, 0.88);
  const acLight = colorLighten(rgb, 0.6);
  return (
    <div style={{ width: CERT_W, height: CERT_H, position: 'relative', background: bgDark, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, border: `6px solid ${accent}`, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 15, border: `1px solid ${acLight}`, opacity: 0.55, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '10%', right: '10%', bottom: '21%', left: '10%', background: bgMid, borderRadius: 4 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(CERT_H * 0.21), background: bgFooter, borderTop: `1px solid ${acLight}` }} />
    </div>
  );
}

function EstandarBackground({ accent }: { accent: string }) {
  return (
    <div style={{ width: CERT_W, height: CERT_H, position: 'relative', background: '#fff', overflow: 'hidden' }}>
      {/* SVG diagonal sidebar */}
      <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} width={388} height={CERT_H} xmlns="http://www.w3.org/2000/svg">
        <polygon points={`0,0 388,0 326,${CERT_H} 0,${CERT_H}`} fill={accent} />
      </svg>
      {/* Gold strip at top of right panel only */}
      <div style={{ position: 'absolute', top: 0, left: 358, right: 0, height: 5, background: `linear-gradient(to right,${GOLD_D},${GOLD_L},${GOLD},${GOLD_L},${GOLD_D})`, zIndex: 2 }} />
      {/* Full-width footer band — z-index 2 overlays bottom of sidebar polygon */}
      <div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, height: 116, background: '#f9f7f1', borderTop: `1px solid ${GOLD}30`, zIndex: 2 }} />
      {/* Full-width bottom gold strip */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: `linear-gradient(to right,${GOLD_D},${GOLD_L},${GOLD},${GOLD_L},${GOLD_D})`, zIndex: 2 }} />
    </div>
  );
}

function TemplateBackground({ template }: { template: CertificateTemplateRecord }) {
  const accent = template.accentColor || '#5f3471';
  if (template.templateNumber === 2) return <PremiumBackground accent={accent} />;
  if (template.templateNumber === 3) return <EstandarBackground accent={accent} />;
  return <EjecutivaBackground accent={accent} />;
}

// ─── Element renderer on canvas ───────────────────────────────────────────────

function ElementOnCanvas({
  el, scale, selected, template,
  onSelect, onMouseDown,
}: {
  el: CertificateElement;
  scale: number;
  selected: boolean;
  template: CertificateTemplateRecord;
  onSelect: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  if (el.visible === false) return null;

  const displayText = el.type === 'text' && el.content
    ? resolveContent(el.content, {}, true)
    : '';

  const imgSrc = el.type === 'image' && el.imageField !== 'seal'
    ? (el.imageField === 'logo' ? template.logoUrl : template.signatureUrl)
    : null;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height: el.height * scale,
    boxSizing: 'border-box',
    cursor: el.locked ? 'default' : 'move',
    outline: selected ? '2px solid #6366f1' : '1px solid transparent',
    outlineOffset: selected ? 1 : 0,
    zIndex: selected ? 20 : 10,
    userSelect: 'none',
  };

  return (
    <div style={style} onMouseDown={(e) => { e.stopPropagation(); onSelect(); onMouseDown(e); }} onClick={(e) => e.stopPropagation()}>
      {el.type === 'text' ? (
        <div style={{
          width: '100%', height: '100%', overflow: 'hidden',
          fontSize: (el.fontSize ?? 14) * scale,
          color: el.color ?? '#333',
          fontFamily: el.fontFamily === 'Georgia' ? "Georgia,'Times New Roman',serif" : "Montserrat,Arial,sans-serif",
          fontWeight: el.fontWeight ?? 'normal',
          fontStyle: el.fontStyle ?? 'normal',
          textAlign: el.textAlign ?? 'left',
          letterSpacing: `${el.letterSpacing ?? 0}em`,
          textTransform: el.textTransform ?? 'none',
          lineHeight: el.lineHeight ?? 1.3,
          opacity: el.opacity ?? 1,
          whiteSpace: 'pre-wrap',
        }}>
          {displayText}
        </div>
      ) : el.imageField === 'seal' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GoldSeal size={Math.min(el.width, el.height) * scale} />
        </div>
      ) : imgSrc ? (
        <img src={imgSrc} alt={el.label} style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'contain', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%', border: '1.5px dashed #bbb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10 * scale, color: '#bbb', background: 'rgba(200,200,200,0.08)',
        }}>
          {el.imageField === 'logo' ? 'Logo' : 'Firma'}
        </div>
      )}
    </div>
  );
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropInput({ label, value, type = 'text', onChange }: {
  label: string; value: string | number; type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)] mb-0.5">{label}</label>
      <input
        type={type}
        className="app-input text-xs py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PropSelect({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)] mb-0.5">{label}</label>
      <select className="app-input text-xs py-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PropertiesPanel({
  el, onChange, onDelete,
}: {
  el: CertificateElement;
  onChange: (changes: Partial<CertificateElement>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--app-fg)]">{el.label}</p>
        {!el.locked && (
          <button onClick={onDelete} className="text-red-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Position + size */}
      <div className="grid grid-cols-2 gap-2">
        <PropInput label="X (px)" type="number" value={Math.round(el.x)}
          onChange={(v) => onChange({ x: Math.max(0, Number(v)) })} />
        <PropInput label="Y (px)" type="number" value={Math.round(el.y)}
          onChange={(v) => onChange({ y: Math.max(0, Number(v)) })} />
        <PropInput label="Ancho (px)" type="number" value={Math.round(el.width)}
          onChange={(v) => onChange({ width: Math.max(10, Number(v)) })} />
        <PropInput label="Alto (px)" type="number" value={Math.round(el.height)}
          onChange={(v) => onChange({ height: Math.max(10, Number(v)) })} />
      </div>

      {el.type === 'text' && (
        <>
          <PropInput label="Contenido" value={el.content ?? ''}
            onChange={(v) => onChange({ content: v })} />
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="Tamaño fuente (px)" type="number" value={el.fontSize ?? 14}
              onChange={(v) => onChange({ fontSize: Math.max(6, Number(v)) })} />
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)] mb-0.5">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={el.color ?? '#333333'}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-[var(--app-border)] p-0.5" />
                <span className="font-mono text-[10px] text-[var(--app-muted)]">{el.color ?? '#333333'}</span>
              </div>
            </div>
          </div>
          <PropSelect label="Fuente" value={el.fontFamily ?? 'Montserrat'}
            options={[{ value: 'Montserrat', label: 'Montserrat (sans)' }, { value: 'Georgia', label: 'Georgia (serif)' }]}
            onChange={(v) => onChange({ fontFamily: v as CertificateElement['fontFamily'] })} />
          <div className="grid grid-cols-2 gap-2">
            <PropSelect label="Peso" value={el.fontWeight ?? 'normal'}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Negrita' }]}
              onChange={(v) => onChange({ fontWeight: v as 'normal' | 'bold' })} />
            <PropSelect label="Estilo" value={el.fontStyle ?? 'normal'}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Cursiva' }]}
              onChange={(v) => onChange({ fontStyle: v as 'normal' | 'italic' })} />
          </div>
          <PropSelect label="Alineación" value={el.textAlign ?? 'left'}
            options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]}
            onChange={(v) => onChange({ textAlign: v as CertTextAlign })} />
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="Interlineado" type="number" value={el.lineHeight ?? 1.3}
              onChange={(v) => onChange({ lineHeight: Number(v) })} />
            <PropInput label="Espaciado letras (em)" type="number" value={el.letterSpacing ?? 0}
              onChange={(v) => onChange({ letterSpacing: Number(v) })} />
          </div>
          <PropSelect label="Mayúsculas" value={el.textTransform ?? 'none'}
            options={[{ value: 'none', label: 'Normal' }, { value: 'uppercase', label: 'MAYÚSCULAS' }]}
            onChange={(v) => onChange({ textTransform: v as 'none' | 'uppercase' })} />
          <PropInput label="Opacidad (0-1)" type="number" value={el.opacity ?? 1}
            onChange={(v) => onChange({ opacity: Math.min(1, Math.max(0, Number(v))) })} />
          <div className="rounded-[8px] bg-[var(--app-subtle)] p-2.5">
            <p className="text-[10px] font-semibold text-[var(--app-muted)] mb-1">Variables disponibles</p>
            <div className="flex flex-wrap gap-1">
              {[
                ['{{recipientName}}', 'Participante'],
                ['{{courseName}}', 'Curso'],
                ['{{date}}', 'Fecha'],
                ['{{headlineText}}', 'Encabezado'],
                ['{{bodyText}}', 'Cuerpo'],
                ['{{signatoryName}}', 'Firmante'],
                ['{{signatoryTitle}}', 'Cargo'],
                ['{{footerText}}', 'Pie'],
                ['{{organizationName}}', 'Organización'],
              ].map(([v, label]) => (
                <button key={v} onClick={() => onChange({ content: (el.content ?? '') + v })}
                  className="rounded-[4px] bg-white border border-[var(--app-border)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--app-muted)] hover:border-indigo-400 hover:text-indigo-600">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {el.type === 'image' && (
        el.imageField === 'seal' ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)] mb-0.5">Tipo</p>
            <p className="text-xs text-[var(--app-muted)]">Sello decorativo</p>
          </div>
        ) : (
          <PropSelect label="Imagen" value={el.imageField ?? 'logo'}
            options={[{ value: 'logo', label: 'Logo de organización' }, { value: 'signature', label: 'Firma' }]}
            onChange={(v) => onChange({ imageField: v as CertImageField })} />
        )
      )}
    </div>
  );
}

// ─── Main builder component ───────────────────────────────────────────────────

interface CertificateBuilderProps {
  template: CertificateTemplateRecord;
  onSave: (elements: CertificateElement[]) => Promise<void>;
  onCancel: () => void;
}

export function CertificateBuilder({ template, onSave, onCancel }: CertificateBuilderProps) {
  const [elements, setElements] = useState<CertificateElement[]>(() =>
    template.elements && template.elements.length > 0
      ? template.elements
      : getDefaultElements(template.templateNumber, template.accentColor || '#5f3471'),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  // Compute scale from container width
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      setScale(Math.min(1, w / CERT_W));
    };
    update();
    const obs = new ResizeObserver(update);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const selectedEl = elements.find((el) => el.id === selectedId) ?? null;

  const updateEl = useCallback((id: string, changes: Partial<CertificateElement>) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...changes } : el));
  }, []);

  // Drag handling — positions in canvas px, divided/multiplied by scale
  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    const el = elements.find((el) => el.id === id);
    if (!el || el.locked) return;
    e.preventDefault();
    const startCX = e.clientX;
    const startCY = e.clientY;
    const startX = el.x;
    const startY = el.y;

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startCX) / scale;
      const dy = (me.clientY - startCY) / scale;
      setElements((prev) => prev.map((item) =>
        item.id === id
          ? { ...item, x: Math.round(Math.max(0, Math.min(CERT_W - item.width, startX + dx))), y: Math.round(Math.max(0, Math.min(CERT_H - item.height, startY + dy))) }
          : item,
      ));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [elements, scale]);

  const addTextElement = () => {
    const newEl: CertificateElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      label: 'Texto',
      x: 200, y: 350,
      width: 400, height: 40,
      content: 'Texto nuevo',
      fontSize: 16,
      color: '#333333',
      fontFamily: 'Montserrat',
      textAlign: 'center',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const addImageElement = () => {
    const newEl: CertificateElement = {
      id: `img_${Date.now()}`,
      type: 'image',
      label: 'Imagen',
      x: 200, y: 200,
      width: 200, height: 60,
      imageField: 'logo',
      objectFit: 'contain',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(elements); } finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!confirm('¿Restaurar el layout por defecto? Perderás los cambios actuales.')) return;
    const defaults = getDefaultElements(template.templateNumber, template.accentColor || '#5f3471');
    setElements(defaults);
    setSelectedId(null);
  };

  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* ── Left: element list ─────────────────────────────────────────────── */}
      <div className="flex w-48 shrink-0 flex-col border-r border-[var(--app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2">
          <p className="text-xs font-bold text-[var(--app-fg)]">Elementos</p>
          <div className="flex gap-1">
            <button onClick={addTextElement} title="Añadir texto"
              className="rounded-[6px] p-1 text-[var(--app-muted)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-fg)]">
              <Plus size={13} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {elements.map((el) => (
            <button
              key={el.id}
              onClick={() => setSelectedId(el.id)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${selectedId === el.id ? 'bg-indigo-50 text-indigo-700' : 'text-[var(--app-fg)] hover:bg-[var(--app-subtle)]'}`}
            >
              <GripVertical size={11} className="shrink-0 text-[var(--app-muted)]" />
              <span className="min-w-0 flex-1 truncate">{el.label}</span>
              <div className="flex shrink-0 gap-0.5">
                {el.locked && <Lock size={10} className="text-[var(--app-muted)]" />}
                <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { visible: el.visible === false ? true : false }); }}
                  className="text-[var(--app-muted)] hover:text-[var(--app-fg)]">
                  {el.visible === false ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-[var(--app-border)] p-2 space-y-1.5">
          <button onClick={addTextElement} className="app-button-secondary w-full justify-center text-xs py-1.5">
            + Texto
          </button>
          <button onClick={addImageElement} className="app-button-secondary w-full justify-center text-xs py-1.5">
            + Imagen
          </button>
        </div>
      </div>

      {/* ── Center: canvas ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f0eef8]">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">← Volver</button>
            <span className="text-xs text-[var(--app-muted)]">{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="app-button-secondary flex items-center gap-1.5 text-xs py-1.5">
              <RotateCcw size={12} /> Restaurar defaults
            </button>
            <button onClick={handleSave} disabled={saving}
              className="app-button-primary flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar layout'}
            </button>
          </div>
        </div>

        {/* Canvas container */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div ref={containerRef} style={{ width: '100%', maxWidth: CERT_W }}>
            <div style={{ position: 'relative', width: CERT_W * scale, height: CERT_H * scale, boxShadow: '0 8px 40px rgba(55,32,80,0.18)', borderRadius: 4, overflow: 'hidden' }}
              onClick={() => setSelectedId(null)}>
              {/* Background layer */}
              <div style={{ position: 'absolute', inset: 0, transformOrigin: 'top left', transform: `scale(${scale})`, width: CERT_W, height: CERT_H }}>
                <TemplateBackground template={template} />
              </div>
              {/* Elements layer */}
              {elements.map((el) => (
                <ElementOnCanvas
                  key={el.id}
                  el={el}
                  scale={scale}
                  selected={selectedId === el.id}
                  template={template}
                  onSelect={() => setSelectedId(el.id)}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: properties ──────────────────────────────────────────────── */}
      <div className="flex w-64 shrink-0 flex-col border-l border-[var(--app-border)] bg-white">
        <div className="border-b border-[var(--app-border)] px-4 py-2">
          <p className="text-xs font-bold text-[var(--app-fg)]">
            {selectedEl ? 'Propiedades' : 'Selecciona un elemento'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedEl ? (
            <PropertiesPanel
              el={selectedEl}
              onChange={(changes) => updateEl(selectedEl.id, changes)}
              onDelete={() => {
                setElements((prev) => prev.filter((e) => e.id !== selectedEl.id));
                setSelectedId(null);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                Haz clic en cualquier elemento del canvas para editar sus propiedades.
              </p>
              <p className="mt-3 text-xs text-[var(--app-muted)] leading-relaxed">
                Arrastra los elementos para reposicionarlos libremente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Read-only scaled preview (reuses builder canvas rendering) ───────────────

export function CertificateBuilderPreview({ template }: { template: CertificateTemplateRecord }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.65);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.offsetWidth / CERT_W));
    };
    update();
    const obs = new ResizeObserver(update);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const elements: CertificateElement[] =
    template.elements && template.elements.length > 0
      ? template.elements
      : getDefaultElements(template.templateNumber, template.accentColor || '#5f3471');

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: CERT_W * scale, height: CERT_H * scale, overflow: 'hidden', borderRadius: 4 }}>
        {/* Background layer */}
        <div style={{ position: 'absolute', inset: 0, transformOrigin: 'top left', transform: `scale(${scale})`, width: CERT_W, height: CERT_H }}>
          <TemplateBackground template={template} />
        </div>
        {/* Content elements */}
        {elements.filter((el) => el.visible !== false).map((el) => (
          <div key={el.id} style={{
            position: 'absolute',
            left: el.x * scale, top: el.y * scale,
            width: el.width * scale, height: el.height * scale,
            overflow: 'hidden', zIndex: 10,
          }}>
            {el.type === 'text' ? (
              <div style={{
                width: '100%', height: '100%', overflow: 'hidden',
                fontSize: (el.fontSize ?? 14) * scale,
                color: el.color ?? '#333',
                fontFamily: el.fontFamily === 'Georgia' ? "Georgia,'Times New Roman',serif" : 'Montserrat,Arial,sans-serif',
                fontWeight: el.fontWeight ?? 'normal',
                fontStyle: el.fontStyle ?? 'normal',
                textAlign: el.textAlign ?? 'left',
                letterSpacing: `${el.letterSpacing ?? 0}em`,
                textTransform: el.textTransform ?? 'none',
                lineHeight: el.lineHeight ?? 1.3,
                opacity: el.opacity ?? 1,
                whiteSpace: 'pre-wrap',
              }}>
                {resolveContent(el.content ?? '', {}, true)}
              </div>
            ) : el.imageField === 'seal' ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GoldSeal size={Math.min(el.width, el.height) * scale} />
              </div>
            ) : el.imageField === 'logo' && template.logoUrl ? (
              <img src={template.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'contain', display: 'block' }} />
            ) : el.imageField === 'signature' && template.signatureUrl ? (
              <img src={template.signatureUrl} alt="Firma" style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'contain', display: 'block' }} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
