'use client';

import React from 'react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  createDirectThread,
  deleteMessage,
  listMessages,
  listParticipants,
  listThreads,
  sendMessage,
  updateMessage,
  type MessageParticipantRecord,
  type MessageRecord,
  type ThreadRecord,
} from '@/features/mensajes/client';

function toTime(value: string | null): string {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function MensajesPage() {
  const { can, currentRole, refreshBootstrap, sessionUser, viewerAccess } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [threads, setThreads] = React.useState<ThreadRecord[]>([]);
  const [participants, setParticipants] = React.useState<MessageParticipantRecord[]>([]);
  const [messages, setMessages] = React.useState<MessageRecord[]>([]);
  const [selectedThreadId, setSelectedThreadId] = React.useState('');
  const [selectedParticipantId, setSelectedParticipantId] = React.useState('');
  const [messageText, setMessageText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const isCommunityLocked =
    currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ['program_4shine'],
  });

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const loadThreadsAndParticipants = React.useCallback(async () => {
    setLoading(true);
    try {
      const [threadData, participantData] = await Promise.all([listThreads(), listParticipants()]);
      setThreads(threadData);
      setParticipants(participantData);
      setSelectedThreadId((current) => {
        if (current && threadData.some((thread) => thread.threadId === current)) return current;
        return threadData[0]?.threadId ?? '';
      });
      setSelectedParticipantId((current) => {
        if (current && participantData.some((participant) => participant.userId === current)) return current;
        return participantData[0]?.userId ?? '';
      });
    } catch (loadError) {
      await showError('No se pudieron cargar los mensajes', loadError);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadMessages = React.useCallback(async (threadId: string) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    try {
      const data = await listMessages(threadId);
      setMessages(data);
    } catch (loadError) {
      await showError('No se pudieron cargar los mensajes del chat', loadError);
    } finally {
      setMessagesLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isCommunityLocked) {
      setLoading(false);
      return;
    }
    void loadThreadsAndParticipants();
  }, [isCommunityLocked, loadThreadsAndParticipants]);

  React.useEffect(() => {
    if (isCommunityLocked) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedThreadId);
  }, [isCommunityLocked, loadMessages, selectedThreadId]);

  const onCreateThread = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedParticipantId) return;

    try {
      const thread = await createDirectThread({ participantUserId: selectedParticipantId });
      await Promise.all([loadThreadsAndParticipants(), refreshBootstrap()]);
      setSelectedThreadId(thread.threadId);
    } catch (createError) {
      await showError('No se pudo crear el chat', createError);
    }
  };

  const onSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedThreadId || !messageText.trim()) return;

    try {
      await sendMessage(selectedThreadId, { messageText: messageText.trim() });
      setMessageText('');
      await Promise.all([loadMessages(selectedThreadId), loadThreadsAndParticipants(), refreshBootstrap()]);
    } catch (sendError) {
      await showError('No se pudo enviar el mensaje', sendError);
    }
  };

  const onDeleteMessage = async (message: MessageRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar mensaje',
      message: '¿Deseas eliminar este mensaje?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteMessage(message.messageId);
      await Promise.all([loadMessages(selectedThreadId), loadThreadsAndParticipants(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar el mensaje', deleteError);
    }
  };

  const onEditMessage = async (message: MessageRecord) => {
    const nextText = await prompt({
      title: 'Editar mensaje',
      message: 'Actualiza el contenido del mensaje.',
      label: 'Mensaje',
      defaultValue: message.messageText,
      placeholder: 'Escribe el nuevo mensaje',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
      multiline: true,
    });

    if (!nextText || !nextText.trim() || nextText.trim() === message.messageText) return;

    try {
      await updateMessage(message.messageId, { messageText: nextText.trim() });
      await Promise.all([loadMessages(selectedThreadId), loadThreadsAndParticipants()]);
    } catch (updateError) {
      await showError('No se pudo editar el mensaje', updateError);
    }
  };

  if (isCommunityLocked) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Mensajes"
          subtitle="La mensajería entre líderes, Advisers y red del programa se habilita con el plan 4Shine."
        />
        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Activa Mensajes con el programa 4Shine."
          description="Este módulo forma parte de la experiencia colaborativa del programa. Al activar el plan podrás conversar con tu red, tus Advisers y otros actores del ecosistema."
          products={programOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver plan 4Shine',
          }}
          note="La cuenta free conserva acceso a contenido abierto en Aprendizaje y a compra de mentorías adicionales."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Mensajes" subtitle="Conversaciones en tiempo real con operaciones CRUD." />

      {can('mensajes', 'create') && (
        <form className="app-panel flex flex-wrap gap-2 p-4" onSubmit={onCreateThread}>
          <select
            className="app-select min-w-72"
            value={selectedParticipantId}
            onChange={(event) => setSelectedParticipantId(event.target.value)}
            disabled={participants.length === 0}
          >
            {participants.length === 0 && <option value="">Sin participantes disponibles</option>}
            {participants.map((participant) => (
              <option key={participant.userId} value={participant.userId}>
                {participant.displayName} · {participant.primaryRole}
              </option>
            ))}
          </select>
          <button
            className="app-button-primary disabled:opacity-50"
            type="submit"
            disabled={!selectedParticipantId || participants.length === 0}
          >
            Nuevo chat directo
          </button>
        </form>
      )}
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando...</div>
      ) : threads.length === 0 ? (
        <EmptyState message="No hay chats activos." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="app-panel max-h-[72vh] overflow-y-auto p-3">
            <h3 className="px-2 py-1 text-sm font-semibold text-[var(--app-ink)]">Chats</h3>
            <div className="space-y-2 mt-2">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  type="button"
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    selectedThreadId === thread.threadId
                      ? 'border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]'
                      : 'border-[rgba(91,52,117,0.08)] hover:border-[var(--app-border)] hover:bg-white/88'
                  }`}
                  onClick={() => setSelectedThreadId(thread.threadId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-[var(--app-ink)]">{thread.title ?? `Chat ${thread.threadId.slice(0, 8)}`}</p>
                    {thread.unreadCount > 0 && (
                      <span className="app-badge border-red-200 bg-red-50 text-red-700">{thread.unreadCount}</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--app-muted)]">{thread.lastMessage ?? 'Sin mensajes'}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]/74">{toTime(thread.lastMessageAt)}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="app-panel lg:col-span-2 flex max-h-[72vh] flex-col">
            <div className="border-b border-[rgba(91,52,117,0.08)] px-4 py-3">
              <h3 className="font-semibold text-[var(--app-ink)]">
                {threads.find((thread) => thread.threadId === selectedThreadId)?.title ?? 'Conversación'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <p className="text-sm text-[var(--app-muted)]">Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">Sin mensajes en este chat.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderUserId === sessionUser?.id;

                  return (
                    <article
                      key={message.messageId}
                      className={`rounded-lg p-3 border ${
                        isMine
                          ? 'ml-12 border-[var(--app-ink)] bg-[var(--app-ink)] text-white'
                          : 'mr-12 border-[rgba(91,52,117,0.08)] bg-[var(--app-surface-muted)] text-[var(--app-ink)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs ${isMine ? 'text-white/72' : 'text-[var(--app-muted)]'}`}>{message.senderName}</p>
                        <p className={`text-xs ${isMine ? 'text-white/62' : 'text-[var(--app-muted)]/76'}`}>{toDateTime(message.createdAt)}</p>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{message.messageText}</p>
                      {isMine && (
                        <div className="flex items-center gap-2 mt-2">
                          {can('mensajes', 'update') && (
                            <button
                              className={`text-xs ${isMine ? 'text-amber-200' : 'text-slate-600'}`}
                              type="button"
                              onClick={() => void onEditMessage(message)}
                            >
                              Editar
                            </button>
                          )}
                          {can('mensajes', 'delete') && (
                            <button
                              className={`text-xs ${isMine ? 'text-red-200' : 'text-red-600'}`}
                              type="button"
                              onClick={() => void onDeleteMessage(message)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            {can('mensajes', 'create') && (
              <form className="flex gap-2 border-t border-[rgba(91,52,117,0.08)] p-3" onSubmit={onSendMessage}>
                <input
                  className="app-input flex-1"
                  placeholder="Escribe un mensaje..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
                <button
                  className="app-button-primary disabled:opacity-50"
                  type="submit"
                  disabled={!selectedThreadId || !messageText.trim()}
                >
                  Enviar
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
