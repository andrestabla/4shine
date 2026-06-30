'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, ArrowUpRight } from 'lucide-react';
import type { PublicAssistantConfig, PublicAssistantOption } from '@/features/chatbot/types';

function buildWhatsappUrl(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function PublicAssistantWidget({ config }: { config: PublicAssistantConfig }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  if (!config.enabled || !config.whatsappNumber) return null;

  function redirectToWhatsApp(interest: string) {
    const page = typeof window !== 'undefined' ? window.location.href : '';
    const parts = [config.whatsappIntro?.trim(), interest.trim(), page ? `— Enviado desde: ${page}` : '']
      .filter(Boolean)
      .join('\n\n');
    const url = buildWhatsappUrl(config.whatsappNumber, parts);
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  }

  function pickOption(opt: PublicAssistantOption) {
    redirectToWhatsApp(opt.message?.trim() ? `Me interesa: ${opt.label}\n${opt.message}` : `Me interesa: ${opt.label}`);
  }

  function submitText() {
    const value = text.trim();
    if (!value) return;
    redirectToWhatsApp(value);
    setText('');
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div
          className="flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-[20px] border bg-white shadow-2xl"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          role="dialog"
          aria-label={`Chat con ${config.assistantName}`}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: 'var(--brand-primary)' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
              {config.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.avatarUrl} alt={config.assistantName} className="h-full w-full object-cover" />
              ) : (
                <MessageCircle size={20} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold leading-tight">{config.assistantName}</p>
              <p className="flex items-center gap-1 text-[11px] text-white/80">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> En línea
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto bg-[var(--app-surface-muted,#f6f7f9)] px-4 py-4">
            {config.greeting && (
              <div className="max-w-[90%] self-start rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--app-ink,#1a1a1a)] shadow-sm">
                {config.greeting}
              </div>
            )}
            {config.intro && (
              <div className="max-w-[90%] self-start rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--app-ink,#1a1a1a)] shadow-sm">
                {config.intro}
              </div>
            )}

            {config.options.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {config.options.map((opt, i) => (
                  <button
                    key={`${opt.label}-${i}`}
                    type="button"
                    onClick={() => pickOption(opt)}
                    className="group flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold text-[var(--brand-primary,#1a2b50)] transition hover:bg-[var(--brand-primary,#1a2b50)] hover:text-white"
                    style={{ borderColor: 'var(--brand-primary,#1a2b50)' }}
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    <ArrowUpRight size={15} className="shrink-0 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer / free text */}
          <form
            onSubmit={(e) => { e.preventDefault(); submitText(); }}
            className="flex items-center gap-2 border-t bg-white px-3 py-2.5"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu consulta…"
              aria-label="Escribe tu consulta"
              className="min-w-0 flex-1 rounded-full border px-3.5 py-2 text-[13px] text-[var(--app-ink,#1a1a1a)] outline-none focus:border-[var(--brand-primary,#1a2b50)]"
              style={{ borderColor: 'rgba(0,0,0,0.12)' }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Enviar por WhatsApp"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-40"
              style={{ background: 'var(--brand-primary,#1a2b50)' }}
            >
              <Send size={16} />
            </button>
          </form>
          <p className="bg-white px-4 pb-3 text-center text-[10px] text-[var(--app-muted,#888)]">
            Al continuar te conectamos por WhatsApp con {config.assistantName}.
          </p>
        </div>
      )}

      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar chat' : `Chatea con ${config.assistantName}`}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105"
        style={{ background: 'var(--brand-primary,#1a2b50)' }}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
