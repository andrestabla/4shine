'use client';

import React, { useCallback, useRef, useState } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type {
  NotificationTemplateRecord,
  CreateTemplateInput,
  UpdateTemplateInput,
  NotificationInAppType,
} from '@/features/notificaciones/types';
import type { NotificationEventDef, VariableKey } from '@/features/notificaciones/types';
import { VARIABLE_DEFS } from '@/features/notificaciones/events-catalog';
import {
  Mail,
  Bell,
  Eye,
  Save,
  ChevronDown,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type FocusedField = 'subject' | 'inAppTitle' | 'inAppBody' | 'bodyHtml' | null;

interface TemplateForm {
  name: string;
  description: string;
  channelEmail: boolean;
  channelInApp: boolean;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate: string;
  inAppTitleTemplate: string;
  inAppBodyTemplate: string;
  inAppType: NotificationInAppType;
  inAppActionUrlTemplate: string;
  isActive: boolean;
}

interface Props {
  eventDef: NotificationEventDef;
  initial?: NotificationTemplateRecord | null;
  onSave: (data: CreateTemplateInput) => Promise<void>;
  onPreview: (sampleVars: Record<string, string>) => void;
  saving?: boolean;
}

const IN_APP_TYPE_OPTIONS: { value: NotificationInAppType; label: string; icon: React.ReactNode }[] = [
  { value: 'info', label: 'Informativa', icon: <Info size={14} /> },
  { value: 'success', label: 'Éxito', icon: <CheckCircle size={14} /> },
  { value: 'alert', label: 'Alerta', icon: <AlertCircle size={14} /> },
  { value: 'message', label: 'Mensaje', icon: <MessageSquare size={14} /> },
];

// ─── VariableChip ─────────────────────────────────────────────────────────────

function VariableChip({
  varKey,
  onInsert,
}: {
  varKey: VariableKey;
  onInsert: (v: VariableKey) => void;
}) {
  const def = VARIABLE_DEFS[varKey];
  const [copied, setCopied] = useState(false);

  function handleClick() {
    onInsert(varKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${def?.description ?? ''} · Ejemplo: ${def?.example ?? ''}`}
      className={clsx(
        'group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-mono transition-all',
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:bg-white',
      )}
    >
      <Copy size={10} className="opacity-50 group-hover:opacity-100" />
      {`{{${varKey}}}`}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TemplateBuilder({ eventDef, initial, onSave, onPreview, saving = false }: Props) {
  const [form, setForm] = useState<TemplateForm>({
    name: initial?.name ?? `${eventDef.label} · Plantilla`,
    description: initial?.description ?? '',
    channelEmail: initial?.channelEmail ?? true,
    channelInApp: initial?.channelInApp ?? true,
    subjectTemplate: initial?.subjectTemplate ?? '',
    bodyHtmlTemplate: initial?.bodyHtmlTemplate ?? '',
    bodyTextTemplate: initial?.bodyTextTemplate ?? '',
    inAppTitleTemplate: initial?.inAppTitleTemplate ?? '',
    inAppBodyTemplate: initial?.inAppBodyTemplate ?? '',
    inAppType: initial?.inAppType ?? eventDef.defaultInAppType,
    inAppActionUrlTemplate: initial?.inAppActionUrlTemplate ?? '',
    isActive: initial?.isActive ?? true,
  });

  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'inapp'>('email');

  // Refs for plain-text input fields
  const subjectRef = useRef<HTMLInputElement>(null);
  const inAppTitleRef = useRef<HTMLInputElement>(null);
  const inAppBodyRef = useRef<HTMLTextAreaElement>(null);

  const set = useCallback(<K extends keyof TemplateForm>(key: K, val: TemplateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Variable insertion logic ────────────────────────────────────────────────

  function insertVariable(varKey: VariableKey) {
    const token = `{{${varKey}}}`;

    if (focusedField === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      set('subjectTemplate', next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    if (focusedField === 'inAppTitle' && inAppTitleRef.current) {
      const el = inAppTitleRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      set('inAppTitleTemplate', next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    if (focusedField === 'inAppBody' && inAppBodyRef.current) {
      const el = inAppBodyRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      set('inAppBodyTemplate', next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    // Default: append to subject
    set('subjectTemplate', form.subjectTemplate + token);
  }

  // ── Build sample vars for preview ──────────────────────────────────────────

  function buildSampleVars(): Record<string, string> {
    return Object.fromEntries(
      eventDef.variables.map((key) => [key, VARIABLE_DEFS[key]?.example ?? `{{${key}}}`]),
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      name: form.name,
      description: form.description,
      eventKey: eventDef.key,
      moduleCode: eventDef.moduleCode,
      channelEmail: form.channelEmail,
      channelInApp: form.channelInApp,
      subjectTemplate: form.subjectTemplate,
      bodyHtmlTemplate: form.bodyHtmlTemplate,
      bodyTextTemplate: form.bodyTextTemplate,
      inAppTitleTemplate: form.inAppTitleTemplate,
      inAppBodyTemplate: form.inAppBodyTemplate,
      inAppType: form.inAppType,
      inAppActionUrlTemplate: form.inAppActionUrlTemplate,
      isActive: form.isActive,
    });
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

      {/* ── Left: main editor ───────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Metadata */}
        <div className="rounded-[1rem] border border-[var(--app-border)] bg-white p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)]">Información general</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-ink)]">Nombre de la plantilla</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="app-input w-full"
                placeholder="Ej. Mentoría agendada – Líder"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-ink)]">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="app-input w-full"
                placeholder="Uso interno, opcional"
              />
            </div>
          </div>

          {/* Event info pill */}
          <div className="flex items-start gap-3 rounded-[0.75rem] bg-[var(--app-surface-muted)] px-4 py-3 text-sm">
            <Info size={14} className="mt-0.5 shrink-0 text-[var(--app-muted)]" />
            <div>
              <span className="font-semibold text-[var(--app-ink)]">{eventDef.label}</span>
              <span className="mx-2 text-[var(--app-muted)]">·</span>
              <span className="text-[var(--app-muted)]">{eventDef.description}</span>
            </div>
          </div>
        </div>

        {/* Channels toggle */}
        <div className="rounded-[1rem] border border-[var(--app-border)] bg-white p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)]">Canales de envío</h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => { set('channelEmail', !form.channelEmail); if (!form.channelEmail) setActiveTab('email'); }}
              className={clsx(
                'flex items-center gap-2 rounded-[0.75rem] border px-4 py-2.5 text-sm font-semibold transition-all',
                form.channelEmail
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-ink)]',
              )}
            >
              <Mail size={15} />
              Email
              {form.channelEmail && <CheckCircle size={13} />}
            </button>
            <button
              type="button"
              onClick={() => { set('channelInApp', !form.channelInApp); if (!form.channelInApp) setActiveTab('inapp'); }}
              className={clsx(
                'flex items-center gap-2 rounded-[0.75rem] border px-4 py-2.5 text-sm font-semibold transition-all',
                form.channelInApp
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-ink)]',
              )}
            >
              <Bell size={15} />
              Notificación in-app
              {form.channelInApp && <CheckCircle size={13} />}
            </button>
          </div>
        </div>

        {/* Channel editors */}
        <div className="rounded-[1rem] border border-[var(--app-border)] bg-white overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-[var(--app-border)]">
            {form.channelEmail && (
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={clsx(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors',
                  activeTab === 'email'
                    ? 'border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                )}
              >
                <Mail size={14} />
                Email
              </button>
            )}
            {form.channelInApp && (
              <button
                type="button"
                onClick={() => setActiveTab('inapp')}
                className={clsx(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors',
                  activeTab === 'inapp'
                    ? 'border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                )}
              >
                <Bell size={14} />
                In-app
              </button>
            )}
          </div>

          {/* Email editor */}
          {activeTab === 'email' && form.channelEmail && (
            <div className="p-5 space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Asunto del email</label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={form.subjectTemplate}
                  onChange={(e) => set('subjectTemplate', e.target.value)}
                  onFocus={() => setFocusedField('subject')}
                  className="app-input w-full font-mono text-sm"
                  placeholder="Ej. {{plataforma}} · Mentoría agendada: {{titulo}}"
                />
                <p className="text-[11px] text-[var(--app-muted)]">Usa las variables del panel derecho. Haz clic en el campo y luego en la variable para insertarla.</p>
              </div>

              {/* Body HTML */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Cuerpo del email (HTML enriquecido)</label>
                <div onClick={() => setFocusedField('bodyHtml')}>
                  <RichTextEditor
                    value={form.bodyHtmlTemplate}
                    onChange={(html) => set('bodyHtmlTemplate', html)}
                    placeholder="Escribe el cuerpo del email. Puedes pegar variables como {{nombre}} directamente en el texto…"
                    minHeight="240px"
                  />
                </div>
              </div>

              {/* Plain text fallback */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">
                  Versión de texto plano
                  <span className="ml-1.5 text-[var(--app-muted)] font-normal">(fallback para clientes que no soporten HTML)</span>
                </label>
                <textarea
                  rows={5}
                  value={form.bodyTextTemplate}
                  onChange={(e) => set('bodyTextTemplate', e.target.value)}
                  className="app-input w-full font-mono text-xs resize-none"
                  placeholder="Hola {{nombre}}, tu mentoría {{titulo}} ha sido agendada para el {{fecha}}…"
                />
              </div>
            </div>
          )}

          {/* In-app editor */}
          {activeTab === 'inapp' && form.channelInApp && (
            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Tipo de notificación</label>
                <div className="flex flex-wrap gap-2">
                  {IN_APP_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('inAppType', opt.value)}
                      className={clsx(
                        'flex items-center gap-1.5 rounded-[0.75rem] border px-3 py-1.5 text-xs font-semibold transition-all',
                        form.inAppType === opt.value
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                          : 'border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Título de la notificación</label>
                <input
                  ref={inAppTitleRef}
                  type="text"
                  value={form.inAppTitleTemplate}
                  onChange={(e) => set('inAppTitleTemplate', e.target.value)}
                  onFocus={() => setFocusedField('inAppTitle')}
                  className="app-input w-full font-mono text-sm"
                  placeholder="Ej. Mentoría agendada: {{titulo}}"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">Cuerpo de la notificación</label>
                <textarea
                  ref={inAppBodyRef}
                  rows={3}
                  value={form.inAppBodyTemplate}
                  onChange={(e) => set('inAppBodyTemplate', e.target.value)}
                  onFocus={() => setFocusedField('inAppBody')}
                  className="app-input w-full font-mono text-sm resize-none"
                  placeholder="Ej. Hola {{nombre}}, tienes una sesión con {{adviser_nombre}} el {{fecha}} a las {{hora}}."
                />
              </div>

              {/* Action URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--app-ink)]">
                  URL de acción
                  <span className="ml-1.5 text-[var(--app-muted)] font-normal">(al hacer clic en la notificación)</span>
                </label>
                <input
                  type="text"
                  value={form.inAppActionUrlTemplate}
                  onChange={(e) => set('inAppActionUrlTemplate', e.target.value)}
                  className="app-input w-full font-mono text-sm"
                  placeholder="Ej. /dashboard/mentorias"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status toggle */}
        <div className="flex items-center justify-between rounded-[1rem] border border-[var(--app-border)] bg-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--app-ink)]">Estado de la plantilla</p>
            <p className="text-xs text-[var(--app-muted)]">
              {form.isActive ? 'Activa — se usará cuando el evento se dispare' : 'Inactiva — no se enviará hasta activarla'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            className={clsx(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors',
              form.isActive ? 'bg-[var(--brand-primary)]' : 'bg-[var(--app-border)]',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                form.isActive ? 'left-5' : 'left-0.5',
              )}
            />
          </button>
        </div>

        {/* Save & Preview actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onPreview(buildSampleVars())}
            className="flex items-center gap-2 rounded-[0.875rem] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <Eye size={15} />
            Vista previa
          </button>
          <button
            type="submit"
            disabled={saving}
            className="app-button-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Guardando…' : 'Guardar plantilla'}
          </button>
        </div>
      </div>

      {/* ── Right: variables panel ───────────────────────────────────────── */}
      <aside className="space-y-4">
        <div className="rounded-[1rem] border border-[var(--app-border)] bg-white p-4 sticky top-24">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)] mb-3">
            Variables disponibles
          </h3>
          <p className="text-[11px] text-[var(--app-muted)] mb-3 leading-relaxed">
            Haz clic en una variable para insertarla en el campo activo (asunto, título o cuerpo de texto plano).
            En el editor HTML, pégala manualmente.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {eventDef.variables.map((varKey) => (
              <VariableChip key={varKey} varKey={varKey} onInsert={insertVariable} />
            ))}
          </div>

          {/* Variable reference table */}
          <div className="mt-4 space-y-1.5">
            {eventDef.variables.map((varKey) => {
              const def = VARIABLE_DEFS[varKey];
              if (!def) return null;
              return (
                <div key={varKey} className="rounded-[0.625rem] bg-[var(--app-surface-muted)] px-2.5 py-2">
                  <p className="font-mono text-[11px] font-bold text-[var(--app-ink)]">{`{{${varKey}}}`}</p>
                  <p className="text-[10px] text-[var(--app-muted)] leading-tight">{def.description}</p>
                  <p className="text-[10px] text-[var(--app-muted)] italic">{def.example}</p>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </form>
  );
}
