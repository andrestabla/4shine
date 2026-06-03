'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, Send, Sparkles, Users } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  previewAudience,
  sendBroadcast,
} from '@/features/notificaciones/broadcast-client';
import type {
  BulkAudienceFilter,
  BulkAudiencePreview,
  BulkAudienceUserType,
  NotificationChannel,
  NotificationTemplateRecord,
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

export default function EnviarMensajesPage() {
  const router = useRouter();
  const { alert, confirm } = useAppDialog();

  const [filter, setFilter] = React.useState<BulkAudienceFilter>({
    isActive: true,
    requireEmail: false,
  });
  const [preview, setPreview] = React.useState<BulkAudiencePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

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

  React.useEffect(() => {
    listTemplates()
      .then((res) => {
        if (res.ok && res.data) {
          setTemplates(res.data.filter((t) => t.isActive));
        } else {
          setTemplates([]);
        }
      })
      .catch(() => setTemplates([]));
  }, []);

  const refreshPreview = React.useCallback(
    async (next?: BulkAudienceFilter) => {
      setIsPreviewing(true);
      try {
        const data = await previewAudience(next ?? filter);
        setPreview(data);
      } catch (error) {
        await alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'No se pudo cargar la audiencia.',
          tone: 'error',
        });
      } finally {
        setIsPreviewing(false);
      }
    },
    [alert, filter],
  );

  React.useEffect(() => {
    const requireEmail = channels.includes('email');
    setFilter((prev) =>
      prev.requireEmail === requireEmail ? prev : { ...prev, requireEmail },
    );
  }, [channels]);

  const toggleChannel = (ch: NotificationChannel) => {
    setChannels((current) =>
      current.includes(ch) ? current.filter((c) => c !== ch) : [...current, ch],
    );
  };

  const toggleUserType = (ut: BulkAudienceUserType) => {
    setFilter((current) => {
      const set = new Set(current.userTypes ?? []);
      if (set.has(ut)) set.delete(ut);
      else set.add(ut);
      return { ...current, userTypes: Array.from(set) };
    });
  };

  const onSubmit = async () => {
    if (channels.length === 0) {
      await alert({
        title: 'Selecciona un canal',
        message: 'Elige al menos un canal (Email o In-app).',
        tone: 'warning',
      });
      return;
    }

    const audience = preview ?? (await previewAudience(filter));
    setPreview(audience);

    const recipientCount =
      channels.includes('email') && !channels.includes('in_app')
        ? audience.withEmail
        : audience.totalMatching;

    if (recipientCount === 0) {
      await alert({
        title: 'Sin destinatarios',
        message: 'El filtro actual no devuelve ningún usuario.',
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

    const ok = await confirm({
      title: 'Confirmar envío',
      message: `Se enviará a ${recipientCount} usuarios vía ${channels
        .map((c) => (c === 'email' ? 'email' : 'in-app'))
        .join(' + ')}. ¿Continuar?`,
      tone: 'warning',
      confirmText: 'Enviar ahora',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    setIsSending(true);
    try {
      const result = await sendBroadcast({
        filter,
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
        message: `Total destinatarios: ${result.totalRecipients}. In-app: ${result.inAppCreated}. Emails encolados: ${result.emailsQueued}.${
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
        subtitle="Segmenta usuarios y envía un mensaje vía email, in-app o ambos. Usa una plantilla o redacta desde cero."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.6fr)]">
        {/* Editor */}
        <div className="space-y-5">
          {/* Canal */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">Canales</h3>
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
          </section>

          {/* Filtros */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">Segmentación</h3>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
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

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  Días restantes de plan (min)
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
                  Días restantes de plan (max)
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
                  placeholder="Ej. 0"
                  value={filter.daysSinceSubscriptionStartMin ?? ''}
                  onChange={(e) =>
                    setFilter((p) => ({
                      ...p,
                      daysSinceSubscriptionStartMin: e.target.value ? Number(e.target.value) : undefined,
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
                  placeholder="Ej. 30"
                  value={filter.daysSinceSubscriptionStartMax ?? ''}
                  onChange={(e) =>
                    setFilter((p) => ({
                      ...p,
                      daysSinceSubscriptionStartMax: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </label>
            </div>

            <label className="mt-5 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filter.hasAcceptedPolicy === true}
                onChange={(e) =>
                  setFilter((p) => ({
                    ...p,
                    hasAcceptedPolicy: e.target.checked ? true : undefined,
                  }))
                }
              />
              <span>Solo usuarios con políticas aceptadas</span>
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void refreshPreview()}
                disabled={isPreviewing}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-bold disabled:opacity-60"
              >
                {isPreviewing ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                Calcular audiencia
              </button>
            </div>
          </section>

          {/* Mensaje */}
          <section className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">Mensaje</h3>
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
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  Las variables {'{{nombre}}'} y {'{{plataforma}}'} se reemplazan automáticamente
                  por cada destinatario.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {channels.includes('email') && (
                  <>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Asunto del email
                      </span>
                      <input
                        className="app-input mt-1"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ej. {{nombre}}, una novedad para ti"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo HTML del email
                      </span>
                      <textarea
                        className="app-textarea mt-1 min-h-40"
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        placeholder="<p>Hola {{nombre}}...</p>"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo texto plano del email
                      </span>
                      <textarea
                        className="app-textarea mt-1 min-h-24"
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Hola {{nombre}}..."
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
                        className="app-input mt-1"
                        value={inAppTitle}
                        onChange={(e) => setInAppTitle(e.target.value)}
                        placeholder="Ej. Tenemos una novedad"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cuerpo in-app
                      </span>
                      <textarea
                        className="app-textarea mt-1 min-h-24"
                        value={inAppBody}
                        onChange={(e) => setInAppBody(e.target.value)}
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

        {/* Sidebar resumen */}
        <aside className="space-y-4">
          <section className="app-panel p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Audiencia estimada
            </p>
            {preview ? (
              <>
                <p className="mt-2 text-4xl font-extrabold text-[var(--app-ink)]">
                  {preview.totalMatching}
                </p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {preview.withEmail} con correo válido · {preview.withoutEmail} sin correo
                </p>
                {preview.sample.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[var(--app-muted)]">
                      Muestra (primeros {preview.sample.length})
                    </p>
                    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs">
                      {preview.sample.map((s) => (
                        <li
                          key={s.userId}
                          className="rounded-lg border border-[var(--app-border)] bg-white px-2 py-1.5"
                        >
                          <p className="font-semibold text-[var(--app-ink)]">{s.displayName}</p>
                          <p className="text-[var(--app-muted)]">
                            {s.email ?? '— sin correo'} · {USER_TYPE_LABEL[s.userType]}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--app-muted)]">
                Aplica filtros y haz clic en &quot;Calcular audiencia&quot; para ver el conteo.
              </p>
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
            <Sparkles size={12} className="mr-1 inline" />
            Los envíos manuales aparecerán en el historial con tu nombre como remitente.
            <br />
            <Mail size={12} className="mr-1 inline" />
            El estado de entrega/apertura de los emails se actualiza vía SES (puede tardar segundos).
          </p>
        </aside>
      </div>
    </div>
  );
}
