'use client';

import React, { useEffect, useState } from 'react';
import { X, Mail, Bell, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface PreviewData {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  inAppTitle: string;
  inAppBody: string;
}

interface Props {
  templateId: string | null;
  sampleVars: Record<string, string>;
  onClose: () => void;
  onFetch: (templateId: string, sampleVars: Record<string, string>) => Promise<PreviewData | null>;
}

export function TemplatePreviewModal({ templateId, sampleVars, onClose, onFetch }: Props) {
  const [tab, setTab] = useState<'email' | 'inapp'>('email');
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    void onFetch(templateId, sampleVars).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [templateId, sampleVars, onFetch]);

  if (!templateId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-[1.25rem] border border-[var(--app-border)] bg-white shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
          <h2 className="font-bold text-[var(--app-ink)]">Vista previa con datos de ejemplo</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--app-border)] px-5">
          <button
            onClick={() => setTab('email')}
            className={clsx(
              'flex items-center gap-2 py-3 pr-5 text-sm font-semibold transition-colors',
              tab === 'email'
                ? 'border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
            )}
          >
            <Mail size={14} /> Email
          </button>
          <button
            onClick={() => setTab('inapp')}
            className={clsx(
              'flex items-center gap-2 py-3 pr-5 text-sm font-semibold transition-colors',
              tab === 'inapp'
                ? 'border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
            )}
          >
            <Bell size={14} /> In-app
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--app-muted)] text-sm">
              <Loader2 size={16} className="animate-spin" />
              Generando vista previa…
            </div>
          )}

          {!loading && data && tab === 'email' && (
            <div className="space-y-4">
              {/* Subject */}
              <div className="rounded-[0.75rem] bg-[var(--app-surface-muted)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] mb-1">Asunto</p>
                <p className="text-sm font-semibold text-[var(--app-ink)]">{data.subject || '(sin asunto)'}</p>
              </div>

              {/* Email body rendered */}
              <div className="overflow-hidden rounded-[0.75rem] border border-[var(--app-border)]">
                <p className="bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Previsualización HTML
                </p>
                <div
                  className="p-4 text-sm prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.bodyHtml || '<p style="color:#94a3b8">(sin contenido)</p>' }}
                />
              </div>

              {/* Plain text */}
              {data.bodyText && (
                <div className="overflow-hidden rounded-[0.75rem] border border-[var(--app-border)]">
                  <p className="bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Texto plano
                  </p>
                  <pre className="whitespace-pre-wrap p-4 text-xs text-[var(--app-muted)] font-mono leading-relaxed">
                    {data.bodyText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {!loading && data && tab === 'inapp' && (
            <div className="space-y-4">
              <div className="rounded-[1rem] border border-[var(--app-border)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] mb-3">
                  Así se verá en el centro de notificaciones
                </p>
                <div className="flex gap-3 rounded-[0.75rem] bg-[rgba(245,183,209,0.14)] border border-[rgba(91,52,117,0.08)] px-4 py-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[var(--app-ink)]">{data.inAppTitle || '(sin título)'}</p>
                    <p className="text-xs text-[var(--app-muted)] mt-1 leading-snug">{data.inAppBody || '(sin cuerpo)'}</p>
                    <p className="text-[10px] text-[var(--app-muted)]/70 mt-1.5">ahora mismo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !data && (
            <div className="py-8 text-center text-sm text-[var(--app-muted)]">
              No se pudo cargar la vista previa.
            </div>
          )}
        </div>

        <div className="border-t border-[var(--app-border)] px-5 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-[0.875rem] border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
