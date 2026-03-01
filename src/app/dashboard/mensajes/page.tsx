'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useUser } from '@/context/UserContext';
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
  const { can, refreshBootstrap, sessionUser } = useUser();
  const [threads, setThreads] = React.useState<ThreadRecord[]>([]);
  const [participants, setParticipants] = React.useState<MessageParticipantRecord[]>([]);
  const [messages, setMessages] = React.useState<MessageRecord[]>([]);
  const [selectedThreadId, setSelectedThreadId] = React.useState('');
  const [selectedParticipantId, setSelectedParticipantId] = React.useState('');
  const [messageText, setMessageText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadThreadsAndParticipants = React.useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = React.useCallback(async (threadId: string) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    setError(null);
    try {
      const data = await listMessages(threadId);
      setMessages(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los mensajes del chat');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadThreadsAndParticipants();
  }, [loadThreadsAndParticipants]);

  React.useEffect(() => {
    void loadMessages(selectedThreadId);
  }, [loadMessages, selectedThreadId]);

  const onCreateThread = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedParticipantId) return;

    try {
      const thread = await createDirectThread({ participantUserId: selectedParticipantId });
      await Promise.all([loadThreadsAndParticipants(), refreshBootstrap()]);
      setSelectedThreadId(thread.threadId);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el chat');
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
      setError(sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje');
    }
  };

  const onDeleteMessage = async (message: MessageRecord) => {
    const confirmed = window.confirm('Eliminar este mensaje?');
    if (!confirmed) return;

    try {
      await deleteMessage(message.messageId);
      await Promise.all([loadMessages(selectedThreadId), loadThreadsAndParticipants(), refreshBootstrap()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el mensaje');
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Mensajes" subtitle="Conversaciones en tiempo real con operaciones CRUD." />

      {can('mensajes', 'create') && (
        <form className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-2" onSubmit={onCreateThread}>
          <select
            className="border border-slate-300 rounded-md px-2 py-2 text-sm min-w-72"
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
            className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-50"
            type="submit"
            disabled={!selectedParticipantId || participants.length === 0}
          >
            Nuevo chat directo
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
      ) : threads.length === 0 ? (
        <EmptyState message="No hay chats activos." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm max-h-[72vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 px-2 py-1">Chats</h3>
            <div className="space-y-2 mt-2">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  type="button"
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    selectedThreadId === thread.threadId
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedThreadId(thread.threadId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-800 truncate">{thread.title ?? `Chat ${thread.threadId.slice(0, 8)}`}</p>
                    {thread.unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">{thread.unreadCount}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{thread.lastMessage ?? 'Sin mensajes'}</p>
                  <p className="text-xs text-slate-400 mt-1">{toTime(thread.lastMessageAt)}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[72vh]">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="font-semibold text-slate-800">
                {threads.find((thread) => thread.threadId === selectedThreadId)?.title ?? 'Conversación'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <p className="text-sm text-slate-500">Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">Sin mensajes en este chat.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderUserId === sessionUser?.id;

                  return (
                    <article
                      key={message.messageId}
                      className={`rounded-lg p-3 border ${
                        isMine ? 'bg-slate-900 text-white border-slate-900 ml-12' : 'bg-slate-50 text-slate-800 border-slate-200 mr-12'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs ${isMine ? 'text-slate-200' : 'text-slate-500'}`}>{message.senderName}</p>
                        <p className={`text-xs ${isMine ? 'text-slate-300' : 'text-slate-400'}`}>{toDateTime(message.createdAt)}</p>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{message.messageText}</p>
                      {isMine && (
                        <div className="flex items-center gap-2 mt-2">
                          {can('mensajes', 'update') && (
                            <button
                              className={`text-xs ${isMine ? 'text-amber-200' : 'text-slate-600'}`}
                              type="button"
                              onClick={async () => {
                                const nextText = window.prompt('Editar mensaje', message.messageText);
                                if (!nextText || !nextText.trim() || nextText.trim() === message.messageText) return;
                                try {
                                  await updateMessage(message.messageId, { messageText: nextText.trim() });
                                  await Promise.all([loadMessages(selectedThreadId), loadThreadsAndParticipants()]);
                                } catch (updateError) {
                                  setError(
                                    updateError instanceof Error
                                      ? updateError.message
                                      : 'No se pudo editar el mensaje',
                                  );
                                }
                              }}
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
              <form className="border-t border-slate-100 p-3 flex gap-2" onSubmit={onSendMessage}>
                <input
                  className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Escribe un mensaje..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />
                <button
                  className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-50"
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
