'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { TemplateBuilder } from '@/components/dashboard/notificaciones/TemplateBuilder';
import { TemplatePreviewModal } from '@/components/dashboard/notificaciones/TemplatePreviewModal';
import { NOTIFICATION_EVENTS, EVENTS_BY_KEY } from '@/features/notificaciones/events-catalog';
import { createTemplate, previewTemplate } from '@/features/notificaciones/client';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

const MODULE_ORDER = ['usuarios', 'mentorias', 'aprendizaje', 'convocatorias', 'networking', 'mensajes', 'workshops'];

function groupByModule() {
  const groups: Record<string, typeof NOTIFICATION_EVENTS> = {};
  for (const ev of NOTIFICATION_EVENTS) {
    (groups[ev.moduleCode] ??= []).push(ev);
  }
  return groups;
}

export default function NuevaPlantillaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEventKey = searchParams.get('event') ?? NOTIFICATION_EVENTS[0].key;

  const [selectedEventKey, setSelectedEventKey] = useState(defaultEventKey);
  const [showEventPicker, setShowEventPicker] = useState(!searchParams.get('event'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSampleVars, setPreviewSampleVars] = useState<Record<string, string> | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  const eventDef = EVENTS_BY_KEY[selectedEventKey] ?? NOTIFICATION_EVENTS[0];
  const groups = groupByModule();

  async function handleSave(data: import('@/features/notificaciones/types').CreateTemplateInput) {
    setSaving(true);
    setError(null);
    const res = await createTemplate(data);
    if (res.ok && res.data) {
      setSavedTemplateId(res.data.templateId);
      router.push('/dashboard/administracion/notificaciones/plantillas');
    } else {
      setError(res.error ?? 'Error al guardar');
      setSaving(false);
    }
  }

  async function fetchPreview(_id: string, vars: Record<string, string>) {
    if (!savedTemplateId) return null;
    const res = await previewTemplate(savedTemplateId, vars);
    return res.ok ? res.data ?? null : null;
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Nueva plantilla"
        subtitle="Construye un mensaje personalizado para un evento específico de la plataforma."
      />

      <Link
        href="/dashboard/administracion/notificaciones/plantillas"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-ink)]"
      >
        <ChevronLeft size={14} />
        Volver a plantillas
      </Link>

      {/* Event selector */}
      <div className="rounded-[1rem] border border-[var(--app-border)] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)]">Evento de la plataforma</p>
            <p className="mt-1 text-sm font-semibold text-[var(--app-ink)]">{eventDef.label}</p>
            <p className="text-xs text-[var(--app-muted)]">{eventDef.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowEventPicker(!showEventPicker)}
            className="flex items-center gap-1.5 rounded-[0.75rem] border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          >
            Cambiar <ChevronDown size={12} className={clsx('transition-transform', showEventPicker && 'rotate-180')} />
          </button>
        </div>

        {showEventPicker && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[var(--app-border)]">
            {MODULE_ORDER.filter((m) => groups[m]).map((mod) => (
              <div key={mod} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] px-1 pt-1">{groups[mod][0].moduleLabel}</p>
                {groups[mod].map((ev) => (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => { setSelectedEventKey(ev.key); setShowEventPicker(false); }}
                    className={clsx(
                      'w-full rounded-[0.75rem] px-3 py-2 text-left text-xs transition',
                      selectedEventKey === ev.key
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold'
                        : 'text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]',
                    )}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
      )}

      <TemplateBuilder
        eventDef={eventDef}
        initial={null}
        onSave={handleSave}
        onPreview={(vars) => setPreviewSampleVars(vars)}
        saving={saving}
      />

      {previewSampleVars && savedTemplateId && (
        <TemplatePreviewModal
          templateId={savedTemplateId}
          sampleVars={previewSampleVars}
          onClose={() => setPreviewSampleVars(null)}
          onFetch={fetchPreview}
        />
      )}
    </div>
  );
}
