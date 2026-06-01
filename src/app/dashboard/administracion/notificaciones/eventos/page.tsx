'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import {
  listEventConfigs,
  listTemplates,
  updateEventConfig,
} from '@/features/notificaciones/client';
import type {
  NotificationEventConfigRecord,
  NotificationTemplateRecord,
  UpdateEventConfigInput,
} from '@/features/notificaciones/types';
import { NOTIFICATION_EVENTS, MODULE_LABELS } from '@/features/notificaciones/events-catalog';
import type { NotificationEventDef } from '@/features/notificaciones/types';
import { Mail, Bell, ChevronDown, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

// Group events by module
const GROUPED_EVENTS = NOTIFICATION_EVENTS.reduce<Record<string, NotificationEventDef[]>>(
  (acc, ev) => { (acc[ev.moduleCode] ??= []).push(ev); return acc; },
  {},
);
const MODULE_ORDER = ['usuarios', 'mentorias', 'descubrimiento', 'aprendizaje', 'convocatorias', 'networking', 'mensajes', 'workshops'];

const MODULE_BORDER_COLORS: Record<string, string> = {
  usuarios: 'border-l-blue-400',
  mentorias: 'border-l-purple-400',
  descubrimiento: 'border-l-violet-500',
  aprendizaje: 'border-l-green-400',
  convocatorias: 'border-l-amber-400',
  networking: 'border-l-teal-400',
  mensajes: 'border-l-rose-400',
  workshops: 'border-l-orange-400',
};

interface EventRowProps {
  eventDef: NotificationEventDef;
  config: NotificationEventConfigRecord | undefined;
  templates: NotificationTemplateRecord[];
  onUpdate: (eventKey: string, moduleCode: string, input: UpdateEventConfigInput) => Promise<void>;
}

function EventRow({ eventDef, config, templates, onUpdate }: EventRowProps) {
  const [saving, setSaving] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const currentTemplateId = config?.templateId ?? null;
  const currentTemplate = templates.find((t) => t.templateId === currentTemplateId);

  const channelEmail = config?.channelEmail ?? true;
  const channelInApp = config?.channelInApp ?? true;
  const isEnabled = config?.isEnabled ?? true;

  async function toggle(field: keyof UpdateEventConfigInput, value: boolean | string | null) {
    setSaving(true);
    await onUpdate(eventDef.key, eventDef.moduleCode, { [field]: value });
    setSaving(false);
  }

  async function assignTemplate(templateId: string | null) {
    setShowTemplatePicker(false);
    setSaving(true);
    await onUpdate(eventDef.key, eventDef.moduleCode, { templateId });
    setSaving(false);
  }

  const relevantTemplates = templates.filter((t) => t.eventKey === eventDef.key && t.isActive);

  return (
    <div className={clsx(
      'rounded-[1rem] border border-[var(--app-border)] border-l-4 bg-white p-4 space-y-3',
      MODULE_BORDER_COLORS[eventDef.moduleCode] ?? 'border-l-slate-300',
      !isEnabled && 'opacity-60',
    )}>
      {/* Row header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[var(--app-ink)]">{eventDef.label}</span>
            {saving && <Loader2 size={12} className="animate-spin text-[var(--app-muted)]" />}
          </div>
          <p className="text-xs text-[var(--app-muted)] mt-0.5 leading-tight">{eventDef.description}</p>
          <p className="text-[10px] font-mono text-[var(--app-muted)]/70 mt-1">{eventDef.key}</p>
        </div>

        {/* Enable toggle */}
        <button
          type="button"
          onClick={() => void toggle('isEnabled', !isEnabled)}
          title={isEnabled ? 'Desactivar evento' : 'Activar evento'}
          className={clsx(
            'relative shrink-0 h-5 w-9 rounded-full transition-colors mt-0.5',
            isEnabled ? 'bg-[var(--brand-primary)]' : 'bg-[var(--app-border)]',
          )}
        >
          <span className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            isEnabled ? 'left-[18px]' : 'left-0.5',
          )} />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Channel toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Canales:</span>
            <button
              type="button"
              onClick={() => void toggle('channelEmail', !channelEmail)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
                channelEmail
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-[var(--app-border)] text-[var(--app-muted)]',
              )}
            >
              <Mail size={11} />
              Email
              {channelEmail ? <CheckCircle size={10} /> : <XCircle size={10} />}
            </button>
            <button
              type="button"
              onClick={() => void toggle('channelInApp', !channelInApp)}
              className={clsx(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
                channelInApp
                  ? 'border-[var(--brand-border-strong)] bg-[var(--brand-surface-strong)] text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] text-[var(--app-muted)]',
              )}
            >
              <Bell size={11} />
              In-app
              {channelInApp ? <CheckCircle size={10} /> : <XCircle size={10} />}
            </button>
          </div>

          {/* Template assignment */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Plantilla:</span>

            {currentTemplate ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/20"
                >
                  {currentTemplate.name}
                  <ChevronDown size={10} className={clsx('transition-transform', showTemplatePicker && 'rotate-180')} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--app-border)] px-2.5 py-1 text-[11px] text-[var(--app-muted)] transition hover:border-[var(--app-ink)] hover:text-[var(--app-ink)]"
              >
                <Plus size={10} />
                Asignar plantilla
              </button>
            )}

            {showTemplatePicker && (
              <div className="absolute z-10 mt-1 w-72 rounded-[1rem] border border-[var(--app-border)] bg-white shadow-xl animate-fade-in">
                <div className="px-3 py-2.5 border-b border-[var(--app-border)]">
                  <p className="text-xs font-bold text-[var(--app-ink)]">Seleccionar plantilla</p>
                  <p className="text-[10px] text-[var(--app-muted)]">Solo plantillas activas para este evento</p>
                </div>
                <div className="py-1 max-h-48 overflow-y-auto">
                  {currentTemplateId && (
                    <button
                      onClick={() => void assignTemplate(null)}
                      className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Quitar plantilla asignada
                    </button>
                  )}
                  {relevantTemplates.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-[var(--app-muted)]">No hay plantillas para este evento.</p>
                      <Link
                        href={`/dashboard/administracion/notificaciones/plantillas/nueva?event=${eventDef.key}`}
                        className="text-xs text-[var(--brand-primary)] font-semibold hover:underline"
                      >
                        Crear plantilla →
                      </Link>
                    </div>
                  ) : (
                    relevantTemplates.map((t) => (
                      <button
                        key={t.templateId}
                        onClick={() => void assignTemplate(t.templateId)}
                        className={clsx(
                          'w-full px-3 py-2 text-left text-xs transition hover:bg-[var(--app-surface-muted)]',
                          t.templateId === currentTemplateId && 'font-semibold text-[var(--brand-primary)]',
                        )}
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {!currentTemplate && (
              <Link
                href={`/dashboard/administracion/notificaciones/plantillas/nueva?event=${eventDef.key}`}
                className="text-[10px] text-[var(--brand-primary)] hover:underline"
              >
                Crear plantilla →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventosConfigPage() {
  const [configs, setConfigs] = useState<NotificationEventConfigRecord[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(MODULE_ORDER));

  async function load() {
    setLoading(true);
    const [evRes, tmplRes] = await Promise.all([listEventConfigs(), listTemplates()]);
    if (evRes.ok && tmplRes.ok) {
      setConfigs(evRes.data ?? []);
      setTemplates(tmplRes.data ?? []);
    } else {
      setError('Error al cargar la configuración');
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const configByKey: Record<string, NotificationEventConfigRecord> = Object.fromEntries(
    configs.map((c) => [c.eventKey, c]),
  );

  const handleUpdate = useCallback(async (eventKey: string, moduleCode: string, input: UpdateEventConfigInput) => {
    const res = await updateEventConfig(eventKey, moduleCode, {
      channelEmail: configByKey[eventKey]?.channelEmail ?? true,
      channelInApp: configByKey[eventKey]?.channelInApp ?? true,
      isEnabled: configByKey[eventKey]?.isEnabled ?? true,
      ...input,
    });
    if (res.ok && res.data) {
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.eventKey === eventKey);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = res.data!;
          return next;
        }
        return [...prev, res.data!];
      });
    }
  }, [configByKey]);

  function toggleModule(mod: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Configuración de eventos"
        subtitle="Activa o desactiva cada notificación del sistema, selecciona los canales de envío y asigna plantillas personalizadas por evento."
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-[var(--app-muted)] text-sm">
          <Loader2 size={16} className="animate-spin" /> Cargando configuración…
        </div>
      )}

      {error && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      )}

      {!loading && MODULE_ORDER.filter((m) => GROUPED_EVENTS[m]).map((mod) => {
        const isOpen = openModules.has(mod);
        const events = GROUPED_EVENTS[mod] ?? [];
        const activeCount = events.filter((ev) => configByKey[ev.key]?.isEnabled !== false).length;

        return (
          <section key={mod} className="space-y-3">
            <button
              type="button"
              onClick={() => toggleModule(mod)}
              className="flex w-full items-center justify-between rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3.5 text-left transition hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--app-ink)]">{MODULE_LABELS[mod] ?? mod}</span>
                <span className="rounded-full bg-white border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]">
                  {activeCount}/{events.length} activos
                </span>
              </div>
              <ChevronDown size={16} className={clsx('text-[var(--app-muted)] transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pl-2">
                {events.map((eventDef) => (
                  <EventRow
                    key={eventDef.key}
                    eventDef={eventDef}
                    config={configByKey[eventDef.key]}
                    templates={templates}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
