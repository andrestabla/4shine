'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckSquare,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  listAudienceList,
  searchUsers,
  sendBroadcast,
} from '@/features/notificaciones/broadcast-client';
import type {
  BulkAudienceFilter,
  BulkAudienceUserType,
  BulkRecipientRecord,
  ExternalRecipient,
  NotificationChannel,
  NotificationTemplateRecord,
  UserSearchResult,
} from '@/features/notificaciones/types';
import { listTemplates } from '@/features/notificaciones/client';

const USER_TYPE_LABEL: Record<BulkAudienceUserType, string> = {
  leader_with_subscription: 'Líder con suscripción',
  leader_without_subscription: 'Líder sin suscripción',
  mentor: 'Adviser',
  gestor: 'Gestor',
  admin: 'Administrador',
  invited: 'Invitado (solo descubrimiento)',
};

// ─── Variables disponibles para el builder ───────────────────────────────────
const VARIABLES = [
  { key: 'nombre', label: 'Nombre', desc: 'Primer nombre del destinatario' },
  { key: 'nombre_completo', label: 'Nombre completo', desc: 'Nombre + apellido' },
  { key: 'plataforma', label: 'Plataforma', desc: 'Nombre de la plataforma' },
  { key: 'enlace_plataforma', label: 'Enlace plataforma', desc: 'URL principal' },
] as const;

type RecipientEntry =
  | { kind: 'user'; user: BulkRecipientRecord | UserSearchResult }
  | { kind: 'external'; recipient: ExternalRecipient };

function entryKey(e: RecipientEntry): string {
  return e.kind === 'user' ? `u:${e.user.userId}` : `e:${e.recipient.email.toLowerCase()}`;
}

function entryName(e: RecipientEntry): string {
  if (e.kind === 'user') return e.user.displayName;
  return e.recipient.name ?? e.recipient.email;
}

function entryEmail(e: RecipientEntry): string | null {
  if (e.kind === 'user') return e.user.email;
  return e.recipient.email;
}

export default function EnviarMensajesPage() {
  const router = useRouter();
  const { alert, confirm } = useAppDialog();

  // Tab activo del selector de destinatarios
  const [recipientTab, setRecipientTab] = React.useState<'segment' | 'search' | 'external'>(
    'segment',
  );

  // Segmento
  const [filter, setFilter] = React.useState<BulkAudienceFilter>({
    isActive: true,
  });
  const [audience, setAudience] = React.useState<BulkRecipientRecord[]>([]);
  const [audienceTotal, setAudienceTotal] = React.useState(0);
  const [isLoadingAudience, setIsLoadingAudience] = React.useState(false);

  // Mapa de seleccionados (key = entryKey)
  const [selected, setSelected] = React.useState<Map<string, RecipientEntry>>(new Map());

  // Búsqueda
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Destinatarios externos en formulario
  const [externalEmail, setExternalEmail] = React.useState('');
  const [externalName, setExternalName] = React.useState('');

  // Canales y mensaje
  const [channels, setChannels] = React.useState<NotificationChannel[]>(['in_app']);
  const [mode, setMode] = React.useState<'template' | 'custom'>('custom');

  const [templates, setTemplates] = React.useState<NotificationTemplateRecord[]>([]);
  const [templateId, setTemplateId] = React.useState<string>('');

  const [subject, setSubject] = React.useState('');
  const [bodyHtml, setBodyHtml] = React.useState('');
  const [bodyText, setBodyText] = React.useState('');
  const [inAppTitle, setInAppTitle] = React.useState('');
  const [inAppBody, setInAppBody] = React.useState('');
  const [actionUrl, setActionUrl] = React.useState('');

  const [isSending, setIsSending] = React.useState(false);

  // Refs para insertar variable en el campo activo
  const subjectRef = React.useRef<HTMLInputElement>(null);
  const bodyHtmlRef = React.useRef<HTMLTextAreaElement>(null);
  const bodyTextRef = React.useRef<HTMLTextAreaElement>(null);
  const inAppTitleRef = React.useRef<HTMLInputElement>(null);
  const inAppBodyRef = React.useRef<HTMLTextAreaElement>(null);

  const [activeField, setActiveField] = React.useState<
    'subject' | 'bodyHtml' | 'bodyText' | 'inAppTitle' | 'inAppBody'
  >('bodyHtml');

  React.useEffect(() => {
    listTemplates()
      .then((res) => {
        if (res.ok && res.data) setTemplates(res.data.filter((t) => t.isActive));
        else setTemplates([]);
      })
      .catch(() => setTemplates([]));
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchUsers(searchQuery.trim(), 20);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const loadAudience = React.useCallback(
    async (override?: BulkAudienceFilter) => {
      setIsLoadingAudience(true);
      try {
        const data = await listAudienceList(override ?? filter, {
          limit: 500,
          offset: 0,
        });
        setAudience(data.rows);
        setAudienceTotal(data.total);
      } catch (error) {
        await alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'No se pudo cargar la audiencia',
          tone: 'error',
        });
      } finally {
        setIsLoadingAudience(false);
      }
    },
    [alert, filter],
  );

  const toggleSelected = (entry: RecipientEntry) => {
    const key = entryKey(entry);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, entry);
      return next;
    });
  };

  const selectAllAudience = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const u of audience) {
        next.set(entryKey({ kind: 'user', user: u }), { kind: 'user', user: u });
      }
      return next;
    });
  };

  const deselectAudience = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const u of audience) {
        next.delete(entryKey({ kind: 'user', user: u }));
      }
      return next;
    });
  };

  const clearAllSelected = () => {
    setSelected(new Map());
  };

  const addExternal = () => {
    const email = externalEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      void alert({
        title: 'Email inválido',
        message: 'Escribe una dirección de correo válida.',
        tone: 'warning',
      });
      return;
    }
    const entry: RecipientEntry = {
      kind: 'external',
      recipient: { email, name: externalName.trim() || undefined },
    };
    toggleSelected(entry);
    setExternalEmail('');
    setExternalName('');
  };

  const toggleChannel = (ch: NotificationChannel) => {
    setChannels((cur) =>
      cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch],
    );
  };

  const toggleUserType = (ut: BulkAudienceUserType) => {
    setFilter((cur) => {
      const set = new Set(cur.userTypes ?? []);
      if (set.has(ut)) set.delete(ut);
      else set.add(ut);
      return { ...cur, userTypes: Array.from(set) };
    });
  };

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    const map = {
      subject: { ref: subjectRef, value: subject, setter: setSubject },
      bodyHtml: { ref: bodyHtmlRef, value: bodyHtml, setter: setBodyHtml },
      bodyText: { ref: bodyTextRef, value: bodyText, setter: setBodyText },
      inAppTitle: { ref: inAppTitleRef, value: inAppTitle, setter: setInAppTitle },
      inAppBody: { ref: inAppBodyRef, value: inAppBody, setter: setInAppBody },
    } as const;
    const target = map[activeField];
    const el = target.ref.current;
    if (!el) {
      target.setter(target.value + token);
      return;
    }
    const start = el.selectionStart ?? target.value.length;
    const end = el.selectionEnd ?? target.value.length;
    const next = target.value.slice(0, start) + token + target.value.slice(end);
    target.setter(next);
    // Mantener cursor después del token
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  // ── Drag-and-drop de variable a campo (alternativa al click) ─────────────
  const onDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', `{{${key}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const onDropToField = (e: React.DragEvent) => {
    e.preventDefault();
    const token = e.dataTransfer.getData('text/plain');
    if (!token) return;
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    // Buscar qué campo es y actualizarlo
    if (el === subjectRef.current) setSubject(next);
    else if (el === bodyHtmlRef.current) setBodyHtml(next);
    else if (el === bodyTextRef.current) setBodyText(next);
    else if (el === inAppTitleRef.current) setInAppTitle(next);
    else if (el === inAppBodyRef.current) setInAppBody(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // ── Envío ─────────────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (channels.length === 0) {
      await alert({
        title: 'Selecciona un canal',
        message: 'Elige al menos un canal (Email o In-app).',
        tone: 'warning',
      });
      return;
    }
    if (selected.size === 0) {
      await alert({
        title: 'Sin destinatarios',
        message: 'Marca al menos un usuario o agrega un email externo.',
        tone: 'warning',
      });
      return;
    }
    if (mode === 'template' && !templateId) {
      await alert({
        title: 'Selecciona una plantilla',
        message: 'Elige una plantilla activa o cambia a redacción manual.',
        tone: 'warning',
      });
      return;
    }
    if (mode === 'custom' && !subject.trim() && !inAppTitle.trim()) {
      await alert({
        title: 'Mensaje vacío',
        message: 'Escribe al menos el asunto o el título in-app.',
        tone: 'warning',
      });
      return;
    }

    const userIds: string[] = [];
    const externals: ExternalRecipient[] = [];
    for (const entry of selected.values()) {
      if (entry.kind === 'user') userIds.push(entry.user.userId);
      else externals.push(entry.recipient);
    }

    const ok = await confirm({
      title: 'Confirmar envío',
      message: `Se enviará a ${selected.size} destinatario${selected.size === 1 ? '' : 's'} vía ${channels
        .map((c) => (c === 'email' ? 'email' : 'in-app'))
        .join(' + ')}.${externals.length > 0 ? ` (${externals.length} externos solo recibirán email)` : ''} ¿Continuar?`,
      tone: 'warning',
      confirmText: 'Enviar ahora',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    setIsSending(true);
    try {
      const result = await sendBroadcast({
        recipientUserIds: userIds,
        externalRecipients: externals,
        channels,
        templateId: mode === 'template' ? templateId : null,
        custom:
          mode === 'custom'
            ? {
                subject,
                bodyHtml: bodyHtml || `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
                bodyText,
                inAppTitle: inAppTitle || subject,
                inAppBody: inAppBody || bodyText,
                inAppActionUrl: actionUrl || undefined,
              }
            : undefined,
      });

      await alert({
        title: 'Envío completado',
        message: `Total: ${result.totalRecipients}. In-app: ${result.inAppCreated}. Emails: ${result.emailsQueued}.${
          result.emailsFailed > 0 ? ` Fallaron: ${result.emailsFailed}.` : ''
        }`,
        tone: 'success',
      });
      router.push('/dashboard/administracion/notificaciones/historial');
    } catch (error) {
      await alert({
        title: 'Error al enviar',
        message: error instanceof Error ? error.message : 'Error desconocido.',
        tone: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const selectedEntries = Array.from(selected.values());

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push('/dashboard/administracion/notificaciones')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
      >
        <ArrowLeft size={14} /> Volver al hub
      </button>

      <PageTitle
        title="Enviar mensajes masivos"
        subtitle="Segmenta, busca o agrega destinatarios manualmente. Luego elige canales y redacta el mensaje (con plantilla o desde cero)."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.6fr)]">
        {/* Editor principal */}
        <div className="space-y-5">
          {/* Canales */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">1. Canales</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['in_app', 'email'] as NotificationChannel[]).map((ch) => {
                const active = channels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                      active
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                        : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                    }`}
                  >
                    {ch === 'in_app' ? 'In-app' : 'Email'}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              Los destinatarios externos solo reciben email; no tienen cuenta para in-app.
            </p>
          </section>

          {/* Destinatarios */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">2. Destinatarios</h3>

            <div className="mt-3 flex gap-2 border-b border-[var(--app-border)]">
              {(
                [
                  { key: 'segment', label: 'Por segmento', icon: Users },
                  { key: 'search', label: 'Buscar usuarios', icon: Search },
                  { key: 'external', label: 'Externos', icon: Plus },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = recipientTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRecipientTab(tab.key)}
                    className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                      active
                        ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                        : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB: Segmento */}
            {recipientTab === 'segment' && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                    Tipo de usuario
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(Object.keys(USER_TYPE_LABEL) as BulkAudienceUserType[]).map((ut) => {
                      const active = filter.userTypes?.includes(ut) ?? false;
                      return (
                        <button
                          key={ut}
                          type="button"
                          onClick={() => toggleUserType(ut)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-[var(--app-ink)] bg-[var(--app-ink)] text-white'
                              : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                          }`}
                        >
                          {USER_TYPE_LABEL[ut]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                      Días restantes plan (min)
                    </span>
                    <input
                      type="number"
                      className="app-input mt-1"
                      placeholder="Ej. 0"
                      value={filter.daysUntilExpirationMin ?? ''}
                      onChange={(e) =>
                        setFilter((p) => ({
                          ...p,
                          daysUntilExpirationMin: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                      Días restantes plan (max)
                    </span>
                    <input
                      type="number"
                      className="app-input mt-1"
                      placeholder="Ej. 7"
                      value={filter.daysUntilExpirationMax ?? ''}
                      onChange={(e) =>
                        setFilter((p) => ({
                          ...p,
                          daysUntilExpirationMax: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                      Días desde inicio (min)
                    </span>
                    <input
                      type="number"
                      className="app-input mt-1"
                      value={filter.daysSinceSubscriptionStartMin ?? ''}
                      onChange={(e) =>
                        setFilter((p) => ({
                          ...p,
                          daysSinceSubscriptionStartMin: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                      Días desde inicio (max)
                    </span>
                    <input
                      type="number"
                      className="app-input mt-1"
                      value={filter.daysSinceSubscriptionStartMax ?? ''}
                      onChange={(e) =>
                        setFilter((p) => ({
                          ...p,
                          daysSinceSubscriptionStartMax: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadAudience()}
                    disabled={isLoadingAudience}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-bold disabled:opacity-60"
                  >
                    {isLoadingAudience ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Users size={13} />
                    )}
                    Calcular audiencia
                  </button>
                  {audience.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={selectAllAudience}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold"
                      >
                        <CheckSquare size={12} /> Marcar todos
                      </button>
                      <button
                        type="button"
                        onClick={deselectAudience}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold"
                      >
                        <Square size={12} /> Desmarcar todos
                      </button>
                    </>
                  )}
                  <span className="text-xs text-[var(--app-muted)]">
                    {audience.length} de {audienceTotal} cargados
                    {audienceTotal > audience.length ? ' (limite 500)' : ''}
                  </span>
                </div>

                {audience.length > 0 && (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--app-border)] bg-white">
                    {audience.map((u) => {
                      const entry: RecipientEntry = { kind: 'user', user: u };
                      const isSel = selected.has(entryKey(entry));
                      return (
                        <button
                          key={u.userId}
                          type="button"
                          onClick={() => toggleSelected(entry)}
                          className="flex w-full items-start gap-3 border-b border-[var(--app-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--app-chip)]"
                        >
                          {isSel ? (
                            <CheckSquare size={14} className="mt-0.5 text-[var(--brand-primary)]" />
                          ) : (
                            <Square size={14} className="mt-0.5 text-[var(--app-muted)]" />
                          )}
                          <div className="flex-1 text-xs">
                            <p className="font-semibold text-[var(--app-ink)]">{u.displayName}</p>
                            <p className="text-[var(--app-muted)]">
                              {u.email ?? '— sin correo'} · {USER_TYPE_LABEL[u.userType]}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Búsqueda */}
            {recipientTab === 'search' && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                  />
                  <input
                    type="text"
                    className="app-input pl-8"
                    placeholder="Buscar por nombre o correo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {isSearching && (
                  <p className="text-xs text-[var(--app-muted)]">Buscando...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--app-border)] bg-white">
                    {searchResults.map((u) => {
                      const entry: RecipientEntry = { kind: 'user', user: u };
                      const isSel = selected.has(entryKey(entry));
                      return (
                        <button
                          key={u.userId}
                          type="button"
                          onClick={() => toggleSelected(entry)}
                          className="flex w-full items-start gap-3 border-b border-[var(--app-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--app-chip)]"
                        >
                          {isSel ? (
                            <CheckSquare size={14} className="mt-0.5 text-[var(--brand-primary)]" />
                          ) : (
                            <Square size={14} className="mt-0.5 text-[var(--app-muted)]" />
                          )}
                          <div className="flex-1 text-xs">
                            <p className="font-semibold text-[var(--app-ink)]">{u.displayName}</p>
                            <p className="text-[var(--app-muted)]">
                              {u.email ?? '— sin correo'} · {USER_TYPE_LABEL[u.userType]}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <p className="text-xs text-[var(--app-muted)]">
                    Sin resultados para &quot;{searchQuery}&quot;.
                  </p>
                )}
              </div>
            )}

            {/* TAB: Externos */}
            {recipientTab === 'external' && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-[var(--app-muted)]">
                  Agrega correos que NO tienen cuenta en la plataforma. Solo recibirán email
                  (no in-app).
                </p>
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="email"
                    className="app-input"
                    placeholder="email@externo.com"
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExternal()}
                  />
                  <input
                    type="text"
                    className="app-input"
                    placeholder="Nombre (opcional)"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExternal()}
                  />
                  <button
                    type="button"
                    onClick={addExternal}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Mensaje */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">3. Mensaje</h3>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  mode === 'custom'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                    : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                }`}
              >
                Redactar manual
              </button>
              <button
                type="button"
                onClick={() => setMode('template')}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  mode === 'template'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                    : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                }`}
              >
                Usar plantilla
              </button>
            </div>

            {mode === 'template' ? (
              <div className="mt-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    Plantilla activa
                  </span>
                  <select
                    className="app-select mt-1"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <option value="">Selecciona una plantilla...</option>
                    {templates.map((t) => (
                      <option key={t.templateId} value={t.templateId}>
                        {t.name} · {t.eventKey}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Builder de variables */}
                <div className="rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    <Sparkles size={11} className="mr-1 inline" />
                    Insertar variable
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                    Haz clic en una variable para insertarla en el campo activo, o arrástrala al
                    campo destino.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        draggable
                        onDragStart={(e) => onDragStart(e, v.key)}
                        onClick={() => insertVariable(v.key)}
                        title={v.desc}
                        className="cursor-grab rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-ink)] active:cursor-grabbing hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                      >
                        {'{{'}{v.key}{'}}'}
                      </button>
                    ))}
                  </div>
                </div>

                {channels.includes('email') && (
                  <>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Asunto del email
                      </span>
                      <input
                        ref={subjectRef}
                        className="app-input mt-1"
                        value={subject}
                        onFocus={() => setActiveField('subject')}
                        onChange={(e) => setSubject(e.target.value)}
                        onDrop={onDropToField}
                        onDragOver={onDragOver}
                        placeholder="Ej. {{nombre}}, una novedad para ti"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo HTML del email
                      </span>
                      <textarea
                        ref={bodyHtmlRef}
                        className="app-textarea mt-1 min-h-40 font-mono text-xs"
                        value={bodyHtml}
                        onFocus={() => setActiveField('bodyHtml')}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        onDrop={onDropToField}
                        onDragOver={onDragOver}
                        placeholder="<p>Hola {{nombre}}...</p>"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo texto plano del email
                      </span>
                      <textarea
                        ref={bodyTextRef}
                        className="app-textarea mt-1 min-h-24"
                        value={bodyText}
                        onFocus={() => setActiveField('bodyText')}
                        onChange={(e) => setBodyText(e.target.value)}
                        onDrop={onDropToField}
                        onDragOver={onDragOver}
                      />
                    </label>
                  </>
                )}

                {channels.includes('in_app') && (
                  <>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Título in-app
                      </span>
                      <input
                        ref={inAppTitleRef}
                        className="app-input mt-1"
                        value={inAppTitle}
                        onFocus={() => setActiveField('inAppTitle')}
                        onChange={(e) => setInAppTitle(e.target.value)}
                        onDrop={onDropToField}
                        onDragOver={onDragOver}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo in-app
                      </span>
                      <textarea
                        ref={inAppBodyRef}
                        className="app-textarea mt-1 min-h-24"
                        value={inAppBody}
                        onFocus={() => setActiveField('inAppBody')}
                        onChange={(e) => setInAppBody(e.target.value)}
                        onDrop={onDropToField}
                        onDragOver={onDragOver}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        URL de acción (opcional)
                      </span>
                      <input
                        className="app-input mt-1"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="/dashboard/..."
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: destinatarios seleccionados + envío */}
        <aside className="space-y-4">
          <section className="app-panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Destinatarios seleccionados
              </p>
              {selectedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSelected}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
                >
                  <X size={11} /> Vaciar
                </button>
              )}
            </div>
            <p className="mt-2 text-4xl font-extrabold text-[var(--app-ink)]">
              {selectedEntries.length}
            </p>
            {selectedEntries.length === 0 ? (
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Aún no has marcado ningún destinatario.
              </p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-xs">
                {selectedEntries.map((e) => {
                  const key = entryKey(e);
                  return (
                    <li
                      key={key}
                      className="flex items-start justify-between gap-2 rounded-lg border border-[var(--app-border)] bg-white px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--app-ink)]">
                          {entryName(e)}
                          {e.kind === 'external' && (
                            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
                              Externo
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[var(--app-muted)]">
                          {entryEmail(e) ?? '— sin correo'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSelected(e)}
                        className="shrink-0 text-rose-700 hover:opacity-70"
                        aria-label="Quitar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Enviar ahora
          </button>

          <p className="text-xs leading-relaxed text-[var(--app-muted)]">
            <Mail size={12} className="mr-1 inline" />
            Email vía SES. Las variables {'{{nombre}}'} se reemplazan por cada destinatario.
          </p>
        </aside>
      </div>
    </div>
  );
}
