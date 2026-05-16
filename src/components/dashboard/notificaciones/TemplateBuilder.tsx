'use client';

import React, { useCallback, useRef, useState } from 'react';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/ui/RichTextEditor';
import type {
  NotificationTemplateRecord,
  CreateTemplateInput,
  NotificationInAppType,
} from '@/features/notificaciones/types';
import type { NotificationEventDef, VariableKey } from '@/features/notificaciones/types';
import { VARIABLE_DEFS } from '@/features/notificaciones/events-catalog';
import {
  Mail, Bell, Eye, Save, CheckCircle, AlertCircle, Info,
  MessageSquare, Layers, Zap, Send,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type FocusedField = 'subject' | 'inAppTitle' | 'inAppBody' | 'bodyHtml' | 'bodyText' | null;
type RightTab = 'variables' | 'preview';
type PreviewChannel = 'email' | 'inapp';

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
  onSendTest?: (toEmail: string) => Promise<{ ok: boolean; error?: string }>;
  saving?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IN_APP_TYPE_OPTIONS: { value: NotificationInAppType; label: string; icon: React.ReactNode; dot: string }[] = [
  { value: 'info',    label: 'Informativa', icon: <Info size={13} />,          dot: 'bg-blue-500'    },
  { value: 'success', label: 'Éxito',       icon: <CheckCircle size={13} />,   dot: 'bg-emerald-500' },
  { value: 'alert',   label: 'Alerta',      icon: <AlertCircle size={13} />,   dot: 'bg-amber-500'   },
  { value: 'message', label: 'Mensaje',     icon: <MessageSquare size={13} />, dot: 'bg-purple-500'  },
];

const INAPP_PREVIEW_STYLES: Record<NotificationInAppType, { bg: string; border: string; title: string; dot: string }> = {
  info:    { bg: 'bg-blue-50',    border: 'border-blue-200',    title: 'text-blue-900',    dot: 'bg-blue-500'    },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-900', dot: 'bg-emerald-500' },
  alert:   { bg: 'bg-amber-50',   border: 'border-amber-200',   title: 'text-amber-900',   dot: 'bg-amber-500'   },
  message: { bg: 'bg-purple-50',  border: 'border-purple-200',  title: 'text-purple-900',  dot: 'bg-purple-500'  },
};

const INAPP_TITLE_MAX = 60;
const INAPP_BODY_MAX = 160;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderVars(template: string, sampleVars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVars[key] ?? `[${key}]`);
}

function buildSampleVars(eventDef: NotificationEventDef): Record<string, string> {
  return Object.fromEntries(
    eventDef.variables.map((key) => [key, VARIABLE_DEFS[key]?.example ?? key]),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CharCount({ value, max, recommended }: { value: string; max: number; recommended: number }) {
  const len = value.length;
  return (
    <span className={clsx(
      'text-[10px] tabular-nums',
      len > max ? 'text-red-500 font-bold' : len > recommended ? 'text-amber-500' : 'text-[var(--app-muted)]',
    )}>
      {len}<span className="opacity-50">/{max}</span>
    </span>
  );
}

function CompletionPill({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  if (!active) return null;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors',
      done ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)]',
    )}>
      {done ? '✓' : '○'} {label}
    </span>
  );
}

function VariableChip({ varKey, onInsert }: { varKey: VariableKey; onInsert: (v: VariableKey) => void }) {
  const def = VARIABLE_DEFS[varKey];
  const [flashed, setFlashed] = useState(false);

  function handleClick() {
    onInsert(varKey);
    setFlashed(true);
    setTimeout(() => setFlashed(false), 900);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${def?.description ?? ''} · Ej: ${def?.example ?? ''}`}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-mono font-medium transition-all',
        flashed
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 scale-95'
          : 'border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]',
      )}
    >
      {`{{${varKey}}}`}
    </button>
  );
}

function FieldFocusLabel({ field, focusedField }: { field: FocusedField; focusedField: FocusedField }) {
  if (field !== focusedField) return null;
  return (
    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)]">
      <Zap size={9} />
      Campo activo
    </span>
  );
}

// ─── Email Preview ────────────────────────────────────────────────────────────

function EmailPreview({ subject, bodyHtml, sampleVars }: { subject: string; bodyHtml: string; sampleVars: Record<string, string> }) {
  const renderedSubject = renderVars(subject, sampleVars);
  const renderedBody = renderVars(bodyHtml, sampleVars);

  return (
    <div className="overflow-hidden rounded-[1rem] border border-[var(--app-border)] bg-[#f5f5f5]">
      {/* Email chrome */}
      <div className="flex items-center gap-1.5 border-b border-[var(--app-border)] bg-white px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 flex-1 truncate text-center text-[10px] text-[var(--app-muted)]">Vista previa de email</span>
      </div>

      <div className="p-4">
        {/* Subject line */}
        <div className="rounded-t-[0.75rem] border border-b-0 border-[var(--app-border)] bg-white px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Asunto</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--app-ink)]">
            {renderedSubject || <span className="italic text-[var(--app-muted)]">Sin asunto</span>}
          </p>
        </div>

        {/* Body */}
        <div className="min-h-[180px] rounded-b-[0.75rem] border border-[var(--app-border)] bg-white px-5 py-4">
          {bodyHtml ? (
            <div
              className="prose prose-sm max-w-none text-sm text-[var(--app-ink)] [&_a]:text-[var(--brand-primary)] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: renderedBody }}
            />
          ) : (
            <p className="text-sm italic text-[var(--app-muted)]">El cuerpo del email aparecerá aquí…</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── In-app Preview ───────────────────────────────────────────────────────────

function InAppPreview({
  title, body, inAppType, actionUrl, sampleVars,
}: {
  title: string; body: string; inAppType: NotificationInAppType; actionUrl: string; sampleVars: Record<string, string>;
}) {
  const styles = INAPP_PREVIEW_STYLES[inAppType];
  const typeOpt = IN_APP_TYPE_OPTIONS.find((o) => o.value === inAppType);
  const renderedTitle = renderVars(title, sampleVars) || 'Título de la notificación';
  const renderedBody = renderVars(body, sampleVars) || 'El mensaje de la notificación aparecerá aquí.';
  const renderedUrl = renderVars(actionUrl, sampleVars);

  return (
    <div className="space-y-3">
      {/* Notification card */}
      <div className={clsx('rounded-[1rem] border p-4', styles.bg, styles.border)}>
        <div className="flex items-start gap-3">
          <div className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white', styles.dot)}>
            {typeOpt?.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={clsx('text-sm font-bold leading-tight', styles.title)}>{renderedTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{renderedBody}</p>
            {renderedUrl && (
              <p className="mt-2 text-[10px] font-mono text-[var(--app-muted)] truncate">{renderedUrl}</p>
            )}
          </div>
          <div className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', styles.dot)} />
        </div>
      </div>

      {/* Bell icon simulation */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--app-muted)]">
        <Bell size={12} />
        <span>Así verá el usuario la notificación en su bandeja</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TemplateBuilder({ eventDef, initial, onSave, onPreview, onSendTest, saving = false }: Props) {
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
  const [rightTab, setRightTab] = useState<RightTab>('variables');
  const [previewChannel, setPreviewChannel] = useState<PreviewChannel>('email');
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const inAppTitleRef = useRef<HTMLInputElement>(null);
  const inAppBodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyTextRef = useRef<HTMLTextAreaElement>(null);
  const htmlEditorRef = useRef<RichTextEditorHandle>(null);

  const set = useCallback(<K extends keyof TemplateForm>(key: K, val: TemplateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const sampleVars = buildSampleVars(eventDef);

  // ── Completion status ───────────────────────────────────────────────────────

  const emailFilled = !form.channelEmail || (form.subjectTemplate.trim().length > 0 && form.bodyHtmlTemplate.trim().length > 0);
  const inAppFilled = !form.channelInApp || (form.inAppTitleTemplate.trim().length > 0 && form.inAppBodyTemplate.trim().length > 0);
  const completionCount = [
    form.name.trim().length > 0,
    !form.channelEmail || form.subjectTemplate.trim().length > 0,
    !form.channelEmail || form.bodyHtmlTemplate.trim().length > 0,
    !form.channelInApp || form.inAppTitleTemplate.trim().length > 0,
    !form.channelInApp || form.inAppBodyTemplate.trim().length > 0,
  ].filter(Boolean).length;
  const totalFields = 5;

  // ── Variable insertion ──────────────────────────────────────────────────────

  function insertVariable(varKey: VariableKey) {
    const token = `{{${varKey}}}`;

    if (focusedField === 'bodyHtml') {
      htmlEditorRef.current?.insertText(token);
      return;
    }
    if (focusedField === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      set('subjectTemplate', el.value.slice(0, start) + token + el.value.slice(end));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
      return;
    }
    if (focusedField === 'inAppTitle' && inAppTitleRef.current) {
      const el = inAppTitleRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      set('inAppTitleTemplate', el.value.slice(0, start) + token + el.value.slice(end));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
      return;
    }
    if (focusedField === 'inAppBody' && inAppBodyRef.current) {
      const el = inAppBodyRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      set('inAppBodyTemplate', el.value.slice(0, start) + token + el.value.slice(end));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
      return;
    }
    if (focusedField === 'bodyText' && bodyTextRef.current) {
      const el = bodyTextRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      set('bodyTextTemplate', el.value.slice(0, start) + token + el.value.slice(end));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
      return;
    }
    // Fallback: append to subject
    set('subjectTemplate', form.subjectTemplate + token);
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

  async function handleSendTest() {
    if (!onSendTest || !testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const result = await onSendTest(testEmail.trim());
    setTestResult(result);
    setTestSending(false);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

      {/* ── LEFT: Main editor ───────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* ── Metadata ── */}
        <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)]">Información general</h3>
            {/* Completion bar */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                  style={{ width: `${(completionCount / totalFields) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-[var(--app-muted)]">{completionCount}/{totalFields}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-ink)]">Nombre de la plantilla <span className="text-red-500">*</span></label>
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
              <label className="text-xs font-semibold text-[var(--app-ink)]">Descripción <span className="font-normal text-[var(--app-muted)]">(uso interno)</span></label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="app-input w-full"
                placeholder="Notas para el equipo, opcional"
              />
            </div>
          </div>

          {/* Event pill */}
          <div className="flex items-start gap-3 rounded-[0.875rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
            <Layers size={14} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--app-ink)]">{eventDef.label}</span>
              <span className="mx-2 text-[var(--app-muted)]">·</span>
              <span className="text-xs text-[var(--app-muted)]">{eventDef.description}</span>
            </div>
          </div>

          {/* Completion pills */}
          <div className="flex flex-wrap gap-1.5">
            <CompletionPill label="Nombre" done={form.name.trim().length > 0} active />
            <CompletionPill label="Asunto email" done={form.subjectTemplate.trim().length > 0} active={form.channelEmail} />
            <CompletionPill label="Cuerpo HTML" done={form.bodyHtmlTemplate.trim().length > 0} active={form.channelEmail} />
            <CompletionPill label="Título in-app" done={form.inAppTitleTemplate.trim().length > 0} active={form.channelInApp} />
            <CompletionPill label="Cuerpo in-app" done={form.inAppBodyTemplate.trim().length > 0} active={form.channelInApp} />
          </div>
        </div>

        {/* ── Channels ── */}
        <div className="rounded-[1.25rem] border border-[var(--app-border)] bg-white p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--app-muted)]">Canales de envío</h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => { set('channelEmail', !form.channelEmail); if (!form.channelEmail) setActiveTab('email'); }}
              className={clsx(
                'flex items-center gap-2 rounded-[0.875rem] border px-4 py-2.5 text-sm font-semibold transition-all',
                form.channelEmail
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:border-[var(--app-ink)] hover:text-[var(--app-ink)]',
              )}
            >
              <Mail size={15} />
              Email
              {form.channelEmail
                ? <span className="rounded-full bg-[var(--brand-primary)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">ON</span>
                : <span className="rounded-full bg-[var(--app-border)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[var(--app-muted)]">OFF</span>
              }
            </button>
            <button
              type="button"
              onClick={() => { set('channelInApp', !form.channelInApp); if (!form.channelInApp) setActiveTab('inapp'); }}
              className={clsx(
                'flex items-center gap-2 rounded-[0.875rem] border px-4 py-2.5 text-sm font-semibold transition-all',
                form.channelInApp
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:border-[var(--app-ink)] hover:text-[var(--app-ink)]',
              )}
            >
              <Bell size={15} />
              Notificación in-app
              {form.channelInApp
                ? <span className="rounded-full bg-[var(--brand-primary)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">ON</span>
                : <span className="rounded-full bg-[var(--app-border)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[var(--app-muted)]">OFF</span>
              }
            </button>
          </div>
        </div>

        {/* ── Channel editors ── */}
        {(form.channelEmail || form.channelInApp) && (
          <div className="overflow-hidden rounded-[1.25rem] border border-[var(--app-border)] bg-white">
            {/* Tab bar */}
            <div className="flex border-b border-[var(--app-border)] bg-[var(--app-surface-muted)]">
              {form.channelEmail && (
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
                    activeTab === 'email'
                      ? 'border-b-2 border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                  )}
                >
                  <Mail size={14} />
                  Email
                  {form.channelEmail && !form.subjectTemplate && !form.bodyHtmlTemplate && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" title="Incompleto" />
                  )}
                </button>
              )}
              {form.channelInApp && (
                <button
                  type="button"
                  onClick={() => setActiveTab('inapp')}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
                    activeTab === 'inapp'
                      ? 'border-b-2 border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]'
                      : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                  )}
                >
                  <Bell size={14} />
                  In-app
                  {form.channelInApp && !form.inAppTitleTemplate && !form.inAppBodyTemplate && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" title="Incompleto" />
                  )}
                </button>
              )}
            </div>

            {/* Email editor */}
            {activeTab === 'email' && form.channelEmail && (
              <div className="p-5 space-y-5">
                {/* Subject */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--app-ink)]">Asunto del email <span className="text-red-500">*</span></label>
                    <FieldFocusLabel field="subject" focusedField={focusedField} />
                  </div>
                  <input
                    ref={subjectRef}
                    type="text"
                    value={form.subjectTemplate}
                    onChange={(e) => set('subjectTemplate', e.target.value)}
                    onFocus={() => setFocusedField('subject')}
                    className="app-input w-full font-mono text-sm"
                    placeholder="Ej. {{plataforma}} · Mentoría confirmada: {{titulo}}"
                  />
                  <p className="text-[10px] text-[var(--app-muted)]">
                    Haz clic aquí y luego en una variable del panel derecho para insertarla.
                  </p>
                </div>

                {/* HTML Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--app-ink)]">Cuerpo del email (HTML enriquecido) <span className="text-red-500">*</span></label>
                    <FieldFocusLabel field="bodyHtml" focusedField={focusedField} />
                  </div>
                  <RichTextEditor
                    ref={htmlEditorRef}
                    value={form.bodyHtmlTemplate}
                    onChange={(html) => set('bodyHtmlTemplate', html)}
                    onFocus={() => setFocusedField('bodyHtml')}
                    placeholder="Escribe el cuerpo del email. Usa las variables del panel → para personalizar…"
                    minHeight="220px"
                  />
                  <p className="text-[10px] text-[var(--app-muted)]">
                    Haz clic dentro del editor y luego en una variable → se insertará en el cursor.
                  </p>
                </div>

                {/* Plain text */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--app-ink)]">Versión texto plano</label>
                    <FieldFocusLabel field="bodyText" focusedField={focusedField} />
                    <span className="ml-auto text-[10px] text-[var(--app-muted)]">Fallback para clientes sin HTML</span>
                  </div>
                  <textarea
                    ref={bodyTextRef}
                    rows={4}
                    value={form.bodyTextTemplate}
                    onChange={(e) => set('bodyTextTemplate', e.target.value)}
                    onFocus={() => setFocusedField('bodyText')}
                    className="app-input w-full font-mono text-xs resize-none"
                    placeholder="Hola {{nombre}}, tu mentoría {{titulo}} está confirmada para el {{fecha}} a las {{hora}}…"
                  />
                </div>
              </div>
            )}

            {/* In-app editor */}
            {activeTab === 'inapp' && form.channelInApp && (
              <div className="p-5 space-y-5">
                {/* Type selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--app-ink)]">Tipo de notificación</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {IN_APP_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('inAppType', opt.value)}
                        className={clsx(
                          'flex flex-col items-center gap-1.5 rounded-[0.875rem] border p-3 text-xs font-semibold transition-all',
                          form.inAppType === opt.value
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            : 'border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-ink)] hover:text-[var(--app-ink)]',
                        )}
                      >
                        <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full text-white', opt.dot)}>
                          {opt.icon}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--app-ink)]">Título <span className="text-red-500">*</span></label>
                    <FieldFocusLabel field="inAppTitle" focusedField={focusedField} />
                    <span className="ml-auto">
                      <CharCount value={form.inAppTitleTemplate} max={INAPP_TITLE_MAX} recommended={45} />
                    </span>
                  </div>
                  <input
                    ref={inAppTitleRef}
                    type="text"
                    value={form.inAppTitleTemplate}
                    onChange={(e) => set('inAppTitleTemplate', e.target.value)}
                    onFocus={() => setFocusedField('inAppTitle')}
                    className="app-input w-full font-mono text-sm"
                    placeholder="Ej. Mentoría confirmada: {{titulo}}"
                    maxLength={INAPP_TITLE_MAX + 50}
                  />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--app-ink)]">Mensaje <span className="text-red-500">*</span></label>
                    <FieldFocusLabel field="inAppBody" focusedField={focusedField} />
                    <span className="ml-auto">
                      <CharCount value={form.inAppBodyTemplate} max={INAPP_BODY_MAX} recommended={120} />
                    </span>
                  </div>
                  <textarea
                    ref={inAppBodyRef}
                    rows={3}
                    value={form.inAppBodyTemplate}
                    onChange={(e) => set('inAppBodyTemplate', e.target.value)}
                    onFocus={() => setFocusedField('inAppBody')}
                    className="app-input w-full font-mono text-sm resize-none"
                    placeholder="Ej. Hola {{nombre}}, tu sesión con {{adviser_nombre}} es el {{fecha}} a las {{hora}}."
                  />
                </div>

                {/* Action URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--app-ink)]">
                    URL de acción
                    <span className="ml-1.5 font-normal text-[var(--app-muted)]">— al hacer clic en la notificación</span>
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
        )}

        {/* ── Status toggle ── */}
        <div className="flex items-center justify-between rounded-[1.25rem] border border-[var(--app-border)] bg-white px-5 py-4">
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
            <span className={clsx(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              form.isActive ? 'left-5' : 'left-0.5',
            )} />
          </button>
        </div>

        {/* ── Test email panel ── */}
        {onSendTest && showTestPanel && (
          <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--app-ink)]">Enviar email de prueba</p>
            <p className="text-[11px] text-[var(--app-muted)]">
              Se usarán valores de ejemplo para las variables. Asegúrate de que la configuración de email esté activa.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                className="app-input flex-1 text-sm"
                placeholder="destinatario@ejemplo.com"
              />
              <button
                type="button"
                disabled={testSending || !testEmail.trim()}
                onClick={() => void handleSendTest()}
                className="flex items-center gap-1.5 rounded-[0.875rem] bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Send size={13} />
                {testSending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
            {testResult && (
              <p className={clsx('text-xs font-semibold', testResult.ok ? 'text-emerald-600' : 'text-red-500')}>
                {testResult.ok ? '✓ Email enviado correctamente' : `Error: ${testResult.error}`}
              </p>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPreview(sampleVars)}
            className="flex items-center gap-2 rounded-[0.875rem] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <Eye size={15} />
            Vista previa completa
          </button>
          {onSendTest && (
            <button
              type="button"
              onClick={() => { setShowTestPanel(!showTestPanel); setTestResult(null); }}
              className={clsx(
                'flex items-center gap-2 rounded-[0.875rem] border px-4 py-2.5 text-sm font-semibold transition',
                showTestPanel
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]',
              )}
            >
              <Send size={15} />
              Enviar prueba
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !emailFilled || !inAppFilled}
            className="app-button-primary ml-auto flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Guardando…' : 'Guardar plantilla'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Variables + Preview ──────────────────────────────────── */}
      <aside className="space-y-0">
        <div className="sticky top-24 space-y-0 overflow-hidden rounded-[1.25rem] border border-[var(--app-border)] bg-white">

          {/* Tab bar */}
          <div className="flex border-b border-[var(--app-border)] bg-[var(--app-surface-muted)]">
            <button
              type="button"
              onClick={() => setRightTab('variables')}
              className={clsx(
                'flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                rightTab === 'variables'
                  ? 'border-b-2 border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]'
                  : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
              )}
            >
              Variables
            </button>
            <button
              type="button"
              onClick={() => setRightTab('preview')}
              className={clsx(
                'flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors',
                rightTab === 'preview'
                  ? 'border-b-2 border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]'
                  : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
              )}
            >
              Vista previa
            </button>
          </div>

          {/* Variables tab */}
          {rightTab === 'variables' && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                  Haz clic en el campo que quieres editar en el editor, luego en la variable para insertarla.
                  {focusedField && (
                    <span className="mt-1 block font-semibold text-[var(--brand-primary)]">
                      → Insertando en: {
                        focusedField === 'subject' ? 'Asunto email' :
                        focusedField === 'bodyHtml' ? 'Cuerpo HTML' :
                        focusedField === 'bodyText' ? 'Texto plano' :
                        focusedField === 'inAppTitle' ? 'Título in-app' :
                        'Mensaje in-app'
                      }
                    </span>
                  )}
                </p>
              </div>

              {/* Variable chips */}
              <div className="flex flex-wrap gap-1.5">
                {eventDef.variables.map((varKey) => (
                  <VariableChip key={varKey} varKey={varKey} onInsert={insertVariable} />
                ))}
              </div>

              {/* Reference table */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--app-border)]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)]">Referencia</p>
                {eventDef.variables.map((varKey) => {
                  const def = VARIABLE_DEFS[varKey];
                  if (!def) return null;
                  return (
                    <button
                      key={varKey}
                      type="button"
                      onClick={() => insertVariable(varKey)}
                      className="w-full rounded-[0.75rem] bg-[var(--app-surface-muted)] px-3 py-2 text-left transition hover:bg-[var(--brand-primary)]/5"
                    >
                      <p className="font-mono text-[11px] font-bold text-[var(--app-ink)]">{`{{${varKey}}}`}</p>
                      <p className="text-[10px] text-[var(--app-muted)]">{def.description}</p>
                      <p className="text-[10px] italic text-[var(--app-muted)] opacity-75">{def.example}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview tab */}
          {rightTab === 'preview' && (
            <div className="p-4 space-y-4">
              {/* Channel toggle */}
              <div className="flex gap-1.5 rounded-[0.875rem] border border-[var(--app-border)] p-1">
                {form.channelEmail && (
                  <button
                    type="button"
                    onClick={() => setPreviewChannel('email')}
                    className={clsx(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-[0.625rem] py-1.5 text-xs font-semibold transition-colors',
                      previewChannel === 'email'
                        ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                    )}
                  >
                    <Mail size={12} /> Email
                  </button>
                )}
                {form.channelInApp && (
                  <button
                    type="button"
                    onClick={() => setPreviewChannel('inapp')}
                    className={clsx(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-[0.625rem] py-1.5 text-xs font-semibold transition-colors',
                      previewChannel === 'inapp'
                        ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                        : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]',
                    )}
                  >
                    <Bell size={12} /> In-app
                  </button>
                )}
              </div>

              {/* Email preview */}
              {previewChannel === 'email' && form.channelEmail && (
                <EmailPreview
                  subject={form.subjectTemplate}
                  bodyHtml={form.bodyHtmlTemplate}
                  sampleVars={sampleVars}
                />
              )}

              {/* In-app preview */}
              {previewChannel === 'inapp' && form.channelInApp && (
                <InAppPreview
                  title={form.inAppTitleTemplate}
                  body={form.inAppBodyTemplate}
                  inAppType={form.inAppType}
                  actionUrl={form.inAppActionUrlTemplate}
                  sampleVars={sampleVars}
                />
              )}

              {/* No channel available */}
              {(previewChannel === 'email' && !form.channelEmail) || (previewChannel === 'inapp' && !form.channelInApp) ? (
                <p className="text-sm text-center text-[var(--app-muted)] py-8">Canal desactivado</p>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
