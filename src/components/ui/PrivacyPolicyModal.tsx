'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/format-date';

interface Props {
  onAccept: () => Promise<void>;
}

function renderPolicyContent(content: string): React.ReactNode[] {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;

    // Numbered section header: "1. Title" or "12. Title"
    if (lines.length === 1 && /^\d+\.\s+\S/.test(lines[0])) {
      return (
        <p key={i} className="font-semibold text-slate-900 mt-4 mb-1 first:mt-0">
          {lines[0]}
        </p>
      );
    }

    // Sub-header line ending with colon (short label)
    if (lines.length === 1 && lines[0].endsWith(':') && lines[0].length < 60) {
      return (
        <p key={i} className="font-medium text-slate-800 mt-2 mb-0.5">
          {lines[0]}
        </p>
      );
    }

    // List block — all lines start with "-"
    if (lines.every((l) => l.startsWith('-'))) {
      return (
        <ul key={i} className="list-disc list-inside space-y-0.5 ml-2 text-slate-600">
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^-\s*/, '')}</li>
          ))}
        </ul>
      );
    }

    // Mixed block: some lines are list items, some are text
    if (lines.some((l) => l.startsWith('-'))) {
      return (
        <div key={i} className="space-y-1">
          {lines.map((l, j) =>
            l.startsWith('-') ? (
              <p key={j} className="ml-4 text-slate-600 text-sm">
                &bull; {l.replace(/^-\s*/, '')}
              </p>
            ) : (
              <p key={j} className="leading-relaxed text-slate-700">
                {l}
              </p>
            ),
          )}
        </div>
      );
    }

    // Normal paragraph
    return (
      <p key={i} className="leading-relaxed text-slate-700">
        {lines.join(' ')}
      </p>
    );
  }).filter(Boolean) as React.ReactNode[];
}

export function PrivacyPolicyModal({ onAccept }: Props) {
  const [checked, setChecked] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [version, setVersion] = React.useState('7 de mayo de 2026');
  const [content, setContent] = React.useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/v1/public/privacy-policy');
        const data = (await res.json()) as { version?: string; content?: string };
        if (data.content) setContent(data.content);
        if (data.version) {
          try {
            const formatted = formatDate(data.version);
            setVersion(formatted || data.version);
          } catch {
            setVersion(data.version);
          }
        }
      } catch {
        // keep defaults — content stays null, will show fallback
      } finally {
        setIsLoadingContent(false);
      }
    })();
  }, []);

  const handleAccept = async () => {
    if (!checked || isSaving) return;
    setIsSaving(true);
    try {
      await onAccept();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">4Shine</p>
          <h2 className="text-lg font-bold text-slate-900">
            Política de Privacidad y Tratamiento de Datos Personales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Fecha de actualización: {version}</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm space-y-3">
          {isLoadingContent ? (
            <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span>Cargando política...</span>
            </div>
          ) : content ? (
            renderPolicyContent(content)
          ) : (
            <p className="text-slate-500 text-center py-8">
              No fue posible cargar el texto de la política. Contacta a soporte@4shine.co.
            </p>
          )}
        </div>

        {/* Footer / accept area */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 leading-snug">
              He leído y acepto las{' '}
              <strong>Políticas de Privacidad y Tratamiento de Datos Personales</strong>{' '}
              de 4Shine.
            </span>
          </label>
          <button
            type="button"
            disabled={!checked || isSaving || isLoadingContent}
            onClick={() => void handleAccept()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  );
}
