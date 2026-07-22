'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import {
  listEventConfigs,
  listTemplates,
  updateEventConfig,
  listCustomEvents,
  createCustomEvent,
  updateCustomEvent,
  deleteCustomEvent,
} from '@/features/notificaciones/client';
import type {
  NotificationEventConfigRecord,
  NotificationTemplateRecord,
  UpdateEventConfigInput,
  CustomEventRecord,
  CreateCustomEventInput,
} from '@/features/notificaciones/types';
import { NOTIFICATION_EVENTS, MODULE_LABELS, customEventToEventDef } from '@/features/notificaciones/events-catalog';
import type { NotificationEventDef } from '@/features/notificaciones/types';
import { Mail, Bell, ChevronDown, Plus, Loader2, CheckCircle, XCircle, Pencil, Trash2, Clock, X } from 'lucide-react';
import clsx from 'clsx';

const ANCHOR_LABELS: Record<string, string> = {
  registration: 'el registro del usuario',
  subscription_expiry: 'el vencimiento de la suscripción',
  program_start: 'el inicio del programa',
  last_login: 'el último acceso',
};

function triggerSummary(ce: CustomEventRecord, eventLabels: Record<string, string>): string {
  const unit = ce.offsetUnit === 'hours' ? 'h' : 'días';
  const dir = ce.offsetDirection === 'before' ? 'antes' : 'después';
  if (ce.triggerType === 'manual') return 'Manual / difusión';
  if (ce.triggerType === 'date_anchor') {
    return `${ce.offsetValue} ${unit} ${dir} de ${ANCHOR_LABELS[ce.triggerAnchor ?? ''] ?? 'una fecha'}`;
  }
  const parent = ce.triggerParentEvent ? eventLabels[ce.triggerParentEvent] ?? ce.triggerParentEvent : '—';
  return `${ce.offsetValue} ${unit} ${dir} del evento «${parent}»`;
}

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
  custom?: { summary: string; onEdit: () => void; onDelete: () => void };
}

function EventRow({ eventDef, config, templates, onUpdate, custom }: EventRowProps) {
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
            {custom && (
              <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                Personalizado
              </span>
            )}
            {saving && <Loader2 size={12} className="animate-spin text-[var(--app-muted)]" />}
          </div>
          <p className="text-xs text-[var(--app-muted)] mt-0.5 leading-tight">{eventDef.description}</p>
          {custom && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)]">
              <Clock size={11} /> {custom.summary}
            </p>
          )}
          <p className="text-[10px] font-mono text-[var(--app-muted)]/70 mt-1">{eventDef.key}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {custom && (
            <>
              <button
                type="button"
                onClick={custom.onEdit}
                title="Editar evento"
                className="rounded-lg p-1.5 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={custom.onDelete}
                title="Eliminar evento"
                className="rounded-lg p-1.5 text-[var(--app-muted)] transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
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
  const [customEvents, setCustomEvents] = useState<CustomEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(MODULE_ORDER));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomEventRecord | null>(null);
  const [savingModal, setSavingModal] = useState(false);

  async function load() {
    setLoading(true);
    const [evRes, tmplRes, customRes] = await Promise.all([
      listEventConfigs(),
      listTemplates(),
      listCustomEvents(),
    ]);
    if (evRes.ok && tmplRes.ok) {
      setConfigs(evRes.data ?? []);
      setTemplates(tmplRes.data ?? []);
      setCustomEvents(customRes.ok ? customRes.data ?? [] : []);
    } else {
      setError('Error al cargar la configuración');
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const configByKey: Record<string, NotificationEventConfigRecord> = Object.fromEntries(
    configs.map((c) => [c.eventKey, c]),
  );
  const customByKey: Record<string, CustomEventRecord> = Object.fromEntries(
    customEvents.map((c) => [c.eventKey, c]),
  );
  // Etiquetas de todos los eventos (catálogo + personalizados) para el resumen
  // del disparador y el selector de evento padre.
  const eventLabels: Record<string, string> = {
    ...Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.key, e.label])),
    ...Object.fromEntries(customEvents.map((e) => [e.eventKey, e.label])),
  };

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
    // Para eventos personalizados, el toggle de habilitado también pausa/activa
    // el disparo automático (is_active), que es lo que evalúa el cron.
    const custom = customByKey[eventKey];
    if (custom && typeof input.isEnabled === 'boolean') {
      const upd = await updateCustomEvent(custom.eventId, { isActive: input.isEnabled });
      if (upd.ok && upd.data) {
        setCustomEvents((prev) => prev.map((c) => (c.eventId === custom.eventId ? upd.data! : c)));
      }
    }
  }, [configByKey, customByKey]);

  async function handleSaveCustom(input: CreateCustomEventInput) {
    setSavingModal(true);
    const res = editing
      ? await updateCustomEvent(editing.eventId, input)
      : await createCustomEvent(input);
    setSavingModal(false);
    if (res.ok && res.data) {
      setCustomEvents((prev) => {
        const idx = prev.findIndex((c) => c.eventId === res.data!.eventId);
        if (idx >= 0) { const n = [...prev]; n[idx] = res.data!; return n; }
        return [...prev, res.data!];
      });
      setModalOpen(false);
      setEditing(null);
    } else {
      alert(res.error ?? 'No se pudo guardar el evento');
    }
  }

  async function handleDeleteCustom(ce: CustomEventRecord) {
    if (!confirm(`¿Eliminar el evento «${ce.label}»? Esta acción no se puede deshacer.`)) return;
    const res = await deleteCustomEvent(ce.eventId);
    if (res.ok) setCustomEvents((prev) => prev.filter((c) => c.eventId !== ce.eventId));
    else alert(res.error ?? 'No se pudo eliminar');
  }

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

      {/* ── Eventos personalizados ── */}
      {!loading && (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-[1rem] border border-[var(--brand-border-strong)] bg-[var(--brand-surface-strong)] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[var(--brand-primary)]">Eventos personalizados</span>
              <span className="rounded-full bg-white border border-[var(--app-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]">
                {customEvents.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-1.5 rounded-[0.75rem] bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={14} /> Nuevo evento
            </button>
          </div>

          {customEvents.length === 0 ? (
            <p className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-5 py-6 text-center text-xs text-[var(--app-muted)]">
              Aún no hay eventos personalizados. Crea uno para definir su módulo, cuándo se dispara
              (días/horas tras una fecha o tras otro evento) y la plantilla de correo que usa.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pl-2">
              {customEvents.map((ce) => (
                <EventRow
                  key={ce.eventKey}
                  eventDef={customEventToEventDef(ce)}
                  config={configByKey[ce.eventKey]}
                  templates={templates}
                  onUpdate={handleUpdate}
                  custom={{
                    summary: triggerSummary(ce, eventLabels),
                    onEdit: () => { setEditing(ce); setModalOpen(true); },
                    onDelete: () => void handleDeleteCustom(ce),
                  }}
                />
              ))}
            </div>
          )}
        </section>
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

      {modalOpen && (
        <CustomEventModal
          initial={editing}
          allEvents={[...NOTIFICATION_EVENTS, ...customEvents.map(customEventToEventDef)]}
          saving={savingModal}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSaveCustom}
        />
      )}
    </div>
  );
}

// ─── Modal de creación / edición de evento personalizado ──────────────────────

interface CustomEventModalProps {
  initial: CustomEventRecord | null;
  allEvents: NotificationEventDef[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateCustomEventInput) => void;
}

function CustomEventModal({ initial, allEvents, saving, onClose, onSave }: CustomEventModalProps) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [moduleCode, setModuleCode] = useState(initial?.moduleCode ?? 'usuarios');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [triggerType, setTriggerType] = useState<CreateCustomEventInput['triggerType']>(
    initial?.triggerType ?? 'date_anchor',
  );
  const [triggerAnchor, setTriggerAnchor] = useState(initial?.triggerAnchor ?? 'registration');
  const [triggerParentEvent, setTriggerParentEvent] = useState(
    initial?.triggerParentEvent ?? allEvents[0]?.key ?? '',
  );
  const [offsetValue, setOffsetValue] = useState(initial?.offsetValue ?? 0);
  const [offsetUnit, setOffsetUnit] = useState(initial?.offsetUnit ?? 'days');
  const [offsetDirection, setOffsetDirection] = useState(initial?.offsetDirection ?? 'after');

  const canSave = label.trim().length > 0 && moduleCode.length > 0;

  function submit() {
    onSave({
      label: label.trim(),
      moduleCode,
      description: description.trim(),
      triggerType,
      triggerAnchor: triggerType === 'date_anchor' ? (triggerAnchor as CreateCustomEventInput['triggerAnchor']) : null,
      triggerParentEvent: triggerType === 'event_dependency' ? triggerParentEvent : null,
      offsetValue: Number(offsetValue) || 0,
      offsetUnit: offsetUnit as CreateCustomEventInput['offsetUnit'],
      offsetDirection: offsetDirection as CreateCustomEventInput['offsetDirection'],
    });
  }

  const inputCls =
    'w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-sm text-[var(--app-ink)] focus:border-[var(--brand-primary)] focus:outline-none';
  const labelCls = 'block text-[11px] font-bold uppercase tracking-widest text-[var(--app-muted)] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[1.25rem] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--app-ink)]">
              {initial ? 'Editar evento' : 'Nuevo evento personalizado'}
            </h2>
            <p className="text-xs text-[var(--app-muted)]">
              Define el módulo, el nombre, cuándo se dispara y luego asígnale una plantilla de correo.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre del evento</label>
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej.: Bienvenida a los 3 días" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Módulo</label>
              <select className={inputCls} value={moduleCode} onChange={(e) => setModuleCode(e.target.value)}>
                {MODULE_ORDER.map((m) => (
                  <option key={m} value={m}>{MODULE_LABELS[m] ?? m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de disparador</label>
              <select
                className={inputCls}
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as CreateCustomEventInput['triggerType'])}
              >
                <option value="date_anchor">Relativo a una fecha</option>
                <option value="event_dependency">Tras otro evento</option>
                <option value="manual">Manual / difusión</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para qué sirve este evento" />
          </div>

          {triggerType !== 'manual' && (
            <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 space-y-3">
              {triggerType === 'date_anchor' ? (
                <div>
                  <label className={labelCls}>Fecha ancla</label>
                  <select className={inputCls} value={triggerAnchor} onChange={(e) => setTriggerAnchor(e.target.value as typeof triggerAnchor)}>
                    <option value="registration">Registro del usuario</option>
                    <option value="program_start">Inicio del programa (suscripción)</option>
                    <option value="subscription_expiry">Vencimiento de la suscripción</option>
                    <option value="last_login">Último acceso</option>
                  </select>
                  {triggerAnchor === 'last_login' && (
                    <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                      Útil para reenganche por inactividad. Se vuelve a evaluar tras cada nuevo acceso.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Evento padre</label>
                  <select className={inputCls} value={triggerParentEvent} onChange={(e) => setTriggerParentEvent(e.target.value)}>
                    {allEvents.map((ev) => (
                      <option key={ev.key} value={ev.key}>{ev.moduleLabel} — {ev.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Cantidad</label>
                  <input type="number" min={0} className={inputCls} value={offsetValue} onChange={(e) => setOffsetValue(Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Unidad</label>
                  <select className={inputCls} value={offsetUnit} onChange={(e) => setOffsetUnit(e.target.value as typeof offsetUnit)}>
                    <option value="days">Días</option>
                    <option value="hours">Horas</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Momento</label>
                  <select
                    className={inputCls}
                    value={offsetDirection}
                    onChange={(e) => setOffsetDirection(e.target.value as typeof offsetDirection)}
                    disabled={triggerType === 'event_dependency'}
                  >
                    <option value="after">Después</option>
                    <option value="before">Antes</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-[var(--app-muted)]">
                El evento se envía automáticamente cuando se cumple la condición (se revisa cada 15
                minutos), siempre que esté activo y tenga una plantilla asignada.
              </p>
            </div>
          )}

          <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-4 py-3">
            <p className={labelCls}>Variables disponibles en la plantilla</p>
            <div className="flex flex-wrap gap-1.5">
              {['nombre', 'nombre_completo', 'plataforma', 'enlace_plataforma', 'fecha'].map((v) => (
                <code key={v} className="rounded bg-[var(--app-surface-muted)] px-1.5 py-0.5 text-[11px] text-[var(--brand-primary)]">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--app-muted)]">
              «fecha» es la fecha de referencia del disparador (registro, inicio/vencimiento o el evento padre).
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[0.75rem] border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave || saving}
            className="flex items-center gap-1.5 rounded-[0.75rem] bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {initial ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
