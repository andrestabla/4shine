'use client';

import React from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import { getPusherClient } from '@/lib/pusher-client';
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function toThreadTime(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff < 7) return d.toLocaleDateString('es-CO', { weekday: 'short' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function toMsgTime(value: string): string {
  return new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function toDayLabel(value: string): string {
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

const ROLE_LABELS: Record<string, string> = {
  lider: 'Líder',
  mentor: 'Adviser',
  gestor: 'Gestor',
  admin: 'Admin',
};

const EMOJIS = ['😊', '👍', '🎉', '❤️', '🙌', '💪', '✅', '🔥', '🤝', '👏', '😂', '🙏', '💡', '⭐', '🚀', '👀'];

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-11 w-11 text-base'
        : 'h-9 w-9 text-sm';
  return (
    <div
      className={`${cls} shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: '#5b2d8a' }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MensajesPage() {
  const { can, currentRole, refreshBootstrap, sessionUser, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [threads, setThreads] = React.useState<ThreadRecord[]>([]);
  const [participants, setParticipants] = React.useState<MessageParticipantRecord[]>([]);
  const [messages, setMessages] = React.useState<MessageRecord[]>([]);
  const [selectedThreadId, setSelectedThreadId] = React.useState('');
  const [messageText, setMessageText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [threadSearch, setThreadSearch] = React.useState('');
  const [showContacts, setShowContacts] = React.useState(false);
  const [contactSearch, setContactSearch] = React.useState('');
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState('');
  const [showChatOnMobile, setShowChatOnMobile] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const emojiRef = React.useRef<HTMLDivElement>(null);

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, { codes: ['program_4shine'] });

  const showError = React.useCallback(
    async (msg: string, err: unknown) => {
      await alert({ title: 'Error', message: err instanceof Error ? err.message : msg, tone: 'error' });
    },
    [alert],
  );

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ts, ps] = await Promise.all([listThreads(), listParticipants()]);
      setThreads(ts);
      setParticipants(ps);
      setSelectedThreadId((cur) => {
        if (cur && ts.some((t) => t.threadId === cur)) return cur;
        return ts[0]?.threadId ?? '';
      });
    } catch (err) {
      await showError('No se pudieron cargar los mensajes', err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadMessages = React.useCallback(
    async (threadId: string) => {
      if (!threadId) {
        setMessages([]);
        return;
      }
      setMessagesLoading(true);
      try {
        const data = await listMessages(threadId);
        setMessages(data);
      } catch (err) {
        await showError('No se pudieron cargar los mensajes', err);
      } finally {
        setMessagesLoading(false);
      }
    },
    [showError],
  );

  React.useEffect(() => {
    if (isCommunityLocked) {
      setLoading(false);
      return;
    }
    void loadAll();
  }, [isCommunityLocked, loadAll]);

  React.useEffect(() => {
    if (isCommunityLocked) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedThreadId);
  }, [isCommunityLocked, loadMessages, selectedThreadId]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Pusher: suscripción al thread activo ───────────────────────────────────
  React.useEffect(() => {
    if (!selectedThreadId || isCommunityLocked) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`private-thread-${selectedThreadId}`);

    channel.bind('new-message', (data: MessageRecord) => {
      setMessages((prev) =>
        prev.some((m) => m.messageId === data.messageId) ? prev : [...prev, data],
      );
    });

    channel.bind('message-updated', (data: MessageRecord) => {
      setMessages((prev) => prev.map((m) => (m.messageId === data.messageId ? data : m)));
    });

    channel.bind('message-deleted', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === data.messageId ? { ...m, deletedAt: new Date().toISOString() } : m,
        ),
      );
    });

    return () => {
      pusher.unsubscribe(`private-thread-${selectedThreadId}`);
    };
  }, [selectedThreadId, isCommunityLocked]);

  // ── Pusher: canal personal para actualizar lista de threads ────────────────
  React.useEffect(() => {
    if (!sessionUser?.id || isCommunityLocked) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`private-user-${sessionUser.id}`);
    channel.bind('thread-updated', () => {
      void loadAll();
    });

    return () => {
      pusher.unsubscribe(`private-user-${sessionUser.id}`);
    };
  }, [sessionUser?.id, isCommunityLocked, loadAll]);

  // ── Polling fallback cuando Pusher no está configurado ─────────────────────
  React.useEffect(() => {
    if (isCommunityLocked || !selectedThreadId || getPusherClient()) return;
    const interval = setInterval(() => {
      void loadMessages(selectedThreadId);
      void loadAll();
    }, 5000);
    return () => clearInterval(interval);
  }, [isCommunityLocked, selectedThreadId, loadMessages, loadAll]);

  React.useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId);

  const filteredThreads = threadSearch
    ? threads.filter((t) =>
        (t.otherParticipantName ?? t.title ?? '')
          .toLowerCase()
          .includes(threadSearch.toLowerCase()),
      )
    : threads;

  const filteredContacts = contactSearch
    ? participants.filter((p) =>
        p.displayName.toLowerCase().includes(contactSearch.toLowerCase()),
      )
    : participants;

  const messagesByDay = messages.reduce<{ day: string; msgs: MessageRecord[] }[]>((acc, msg) => {
    const day = new Date(msg.createdAt).toDateString();
    if (acc[acc.length - 1]?.day === day) {
      acc[acc.length - 1].msgs.push(msg);
    } else {
      acc.push({ day, msgs: [msg] });
    }
    return acc;
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const onSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowChatOnMobile(true);
  };

  const onStartThread = async (participantId: string) => {
    setShowContacts(false);
    setContactSearch('');
    try {
      const thread = await createDirectThread({ participantUserId: participantId });
      await Promise.all([loadAll(), refreshBootstrap()]);
      setSelectedThreadId(thread.threadId);
      setShowChatOnMobile(true);
    } catch (err) {
      await showError('No se pudo iniciar la conversación', err);
    }
  };

  const onSend = async () => {
    if (!selectedThreadId || !messageText.trim()) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      await sendMessage(selectedThreadId, { messageText: text });
      await Promise.all([loadMessages(selectedThreadId), loadAll(), refreshBootstrap()]);
      inputRef.current?.focus();
    } catch (err) {
      setMessageText(text);
      await showError('No se pudo enviar el mensaje', err);
    }
  };

  const onDelete = async (msg: MessageRecord) => {
    const ok = await confirm({
      title: 'Eliminar mensaje',
      message: '¿Deseas eliminar este mensaje?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteMessage(msg.messageId);
      await Promise.all([loadMessages(selectedThreadId), loadAll(), refreshBootstrap()]);
    } catch (err) {
      await showError('No se pudo eliminar el mensaje', err);
    }
  };

  const onStartEdit = (msg: MessageRecord) => {
    setEditingId(msg.messageId);
    setEditText(msg.messageText);
  };

  const onSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      await updateMessage(editingId, { messageText: editText.trim() });
      setEditingId(null);
      setEditText('');
      await loadMessages(selectedThreadId);
    } catch (err) {
      await showError('No se pudo editar el mensaje', err);
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const insertEmoji = (emoji: string) => {
    setMessageText((t) => t + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // ── Locked ─────────────────────────────────────────────────────────────────

  if (isCommunityLocked) {
    return (
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-7 py-10 text-center sm:py-12">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem]"
            style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #dceeff 100%)' }}
          >
            <MessageCircle size={22} style={{ color: '#3f6fa8' }} />
          </div>
          <h1 className="mt-5 text-[1.6rem] font-black leading-tight text-[var(--app-ink)] sm:text-[1.9rem]">
            Mensajes se activa<br />con el programa.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
            Aquí conversas con tu Adviser, tu red de líderes y el equipo del programa en tiempo real.
          </p>
          <a
            href="https://www.4shine.co/planes-precios"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Activar programa · $3,000 USD
          </a>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
            Qué incluye Mensajes
          </p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">
            Comunicación en tiempo real con tu red.
          </h2>
          <div className="mt-4 space-y-2 opacity-60">
            {[
              { label: 'Chat con tu Adviser', desc: 'Conversaciones directas con tu mentor asignado.' },
              { label: 'Red de líderes', desc: 'Mensajería con otros líderes del programa.' },
              { label: 'Equipo 4Shine', desc: 'Comunicación con el equipo de acompañamiento.' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3.5 rounded-[1rem] bg-[var(--app-surface-muted)] px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-white">
                  <Lock size={12} className="text-[var(--app-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--app-ink)]">{f.label}</p>
                  <p className="text-[11px] text-[var(--app-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Activa Mensajes con el programa 4Shine."
          description="Este módulo forma parte de la experiencia colaborativa del programa. Al activar el plan podrás conversar con tu red, tus Advisers y otros actores del ecosistema."
          products={programOffers}
          primaryAction={{ href: '/dashboard', label: 'Ver plan 4Shine' }}
          note="La cuenta free conserva acceso a contenido abierto en Aprendizaje y a compra de mentorías adicionales."
        />
      </div>
    );
  }

  // ── Contact picker left panel ──────────────────────────────────────────────

  const leftContacts = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--app-border)] px-4 py-3">
        <button
          onClick={() => {
            setShowContacts(false);
            setContactSearch('');
          }}
          className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] transition"
        >
          <ArrowLeft size={16} />
        </button>
        <h3 className="text-sm font-bold text-[var(--app-ink)]">Nueva conversación</h3>
      </div>
      <div className="border-b border-[var(--app-border)] px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--app-muted)]" />
          <input
            autoFocus
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Buscar contacto..."
            className="flex-1 bg-transparent text-sm text-[var(--app-ink)] outline-none placeholder:text-[var(--app-muted)]"
          />
        </div>
      </div>
      <div className="flex-1 divide-y divide-[var(--app-border)] overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--app-muted)]">Sin resultados.</p>
        ) : (
          filteredContacts.map((p) => (
            <button
              key={p.userId}
              onClick={() => void onStartThread(p.userId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--app-surface-muted)]"
            >
              <Avatar name={p.displayName} avatarUrl={p.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--app-ink)]">{p.displayName}</p>
                <p className="text-xs text-[var(--app-muted)]">
                  {ROLE_LABELS[p.primaryRole] ?? p.primaryRole}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ── Thread list left panel ─────────────────────────────────────────────────

  const leftThreads = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--app-border)] px-3 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--app-muted)]" />
          <input
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm text-[var(--app-ink)] outline-none placeholder:text-[var(--app-muted)]"
          />
          {threadSearch && (
            <button onClick={() => setThreadSearch('')} className="text-[var(--app-muted)] hover:text-[var(--app-ink)]">
              <X size={13} />
            </button>
          )}
        </div>
        {can('mensajes', 'create') && (
          <button
            onClick={() => setShowContacts(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b2d8a] text-white transition hover:opacity-90"
            title="Nueva conversación"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 divide-y divide-[var(--app-border)] overflow-y-auto">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--app-muted)]">Cargando...</p>
        ) : filteredThreads.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3e8ff]">
              <MessageCircle size={20} style={{ color: '#5b2d8a' }} />
            </div>
            <p className="text-sm text-[var(--app-muted)]">
              {threadSearch ? 'Sin resultados.' : 'Inicia tu primera conversación.'}
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const name = thread.otherParticipantName ?? thread.title ?? 'Chat';
            const isSelected = thread.threadId === selectedThreadId;
            return (
              <button
                key={thread.threadId}
                onClick={() => onSelectThread(thread.threadId)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                  isSelected ? 'bg-[#f3e8ff]' : 'hover:bg-[var(--app-surface-muted)]'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={name} avatarUrl={thread.otherParticipantAvatarUrl} />
                  {thread.unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#5b2d8a] px-0.5 text-[10px] font-black text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p
                      className={`truncate text-sm ${
                        isSelected ? 'font-bold text-[#5b2d8a]' : 'font-semibold text-[var(--app-ink)]'
                      }`}
                    >
                      {name}
                    </p>
                    <span className="shrink-0 text-[11px] text-[var(--app-muted)]">
                      {toThreadTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--app-muted)]">
                    {thread.lastMessage ?? 'Sin mensajes aún'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[520px] flex-col">
      <div className="grid flex-1 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white shadow-sm lg:grid-cols-[20rem_1fr]">

        {/* Left panel */}
        <div
          className={`flex flex-col border-r border-[var(--app-border)] ${
            showChatOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {showContacts ? leftContacts : leftThreads}
        </div>

        {/* Right panel: chat */}
        <div
          className={`flex flex-col ${showChatOnMobile ? 'flex' : 'hidden lg:flex'}`}
        >
          {!selectedThread ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e8ff]">
                <MessageCircle size={28} style={{ color: '#5b2d8a' }} />
              </div>
              <p className="max-w-[16rem] text-sm text-[var(--app-muted)]">
                Selecciona una conversación o inicia una nueva con el botón +
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-white px-4 py-3">
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="rounded-full p-1.5 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] lg:hidden"
                >
                  <ArrowLeft size={16} />
                </button>
                <Avatar
                  name={selectedThread.otherParticipantName ?? selectedThread.title ?? 'Chat'}
                  avatarUrl={selectedThread.otherParticipantAvatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--app-ink)]">
                    {selectedThread.otherParticipantName ?? selectedThread.title ?? 'Chat'}
                  </p>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                {messagesLoading ? (
                  <p className="text-center text-sm text-[var(--app-muted)]">Cargando mensajes...</p>
                ) : messagesByDay.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm text-[var(--app-muted)]">Sé el primero en escribir algo.</p>
                  </div>
                ) : (
                  messagesByDay.map(({ day, msgs }) => (
                    <div key={day} className="space-y-3">
                      {/* Day separator */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-[var(--app-border)]" />
                        <span className="shrink-0 rounded-full bg-[var(--app-surface-muted)] px-3 py-0.5 text-[11px] font-semibold text-[var(--app-muted)]">
                          {toDayLabel(msgs[0].createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-[var(--app-border)]" />
                      </div>

                      {msgs.map((msg) => {
                        const isMine = msg.senderUserId === sessionUser?.id;
                        const isDeleted = !!msg.deletedAt;
                        const isEditing = editingId === msg.messageId;

                        return (
                          <div
                            key={msg.messageId}
                            className={`group flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isMine && (
                              <Avatar name={msg.senderName} avatarUrl={msg.senderAvatarUrl} size="sm" />
                            )}

                            <div
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}
                            >
                              {!isMine && (
                                <span className="mb-1 px-1 text-[11px] font-semibold text-[var(--app-muted)]">
                                  {msg.senderName}
                                </span>
                              )}

                              {isDeleted ? (
                                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5">
                                  <p className="text-xs italic text-[var(--app-muted)]">Mensaje eliminado</p>
                                </div>
                              ) : isEditing ? (
                                <div className="w-full min-w-[16rem]">
                                  <textarea
                                    autoFocus
                                    rows={3}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full resize-none rounded-xl border border-[var(--app-border-strong)] px-3 py-2 text-sm text-[var(--app-ink)] outline-none focus:ring-2 ring-[#c9b0e1]/30"
                                  />
                                  <div className="mt-1.5 flex justify-end gap-1.5">
                                    <button
                                      onClick={onCancelEdit}
                                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                                    >
                                      <X size={11} /> Cancelar
                                    </button>
                                    <button
                                      onClick={() => void onSaveEdit()}
                                      className="flex items-center gap-1 rounded-full bg-[#5b2d8a] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
                                    >
                                      <Check size={11} /> Guardar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <div
                                    className={`px-4 py-2.5 ${
                                      isMine
                                        ? 'rounded-2xl rounded-tr-sm bg-[#5b2d8a] text-white'
                                        : 'rounded-2xl rounded-tl-sm bg-[var(--app-surface-muted)] text-[var(--app-ink)]'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                      {renderText(msg.messageText)}
                                    </p>
                                  </div>

                                  {/* Edit / Delete — appears on hover, left of sent bubble */}
                                  {isMine && (
                                    <div className="absolute right-full top-1 mr-2 hidden items-center gap-1 group-hover:flex">
                                      {can('mensajes', 'update') && (
                                        <button
                                          onClick={() => onStartEdit(msg)}
                                          className="rounded-full border border-[var(--app-border)] bg-white p-1.5 text-[var(--app-muted)] shadow-sm transition hover:text-[var(--app-ink)]"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                      )}
                                      {can('mensajes', 'delete') && (
                                        <button
                                          onClick={() => void onDelete(msg)}
                                          className="rounded-full border border-[var(--app-border)] bg-white p-1.5 text-rose-400 shadow-sm transition hover:text-rose-600"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-1 flex items-center gap-1 px-1">
                                <span className="text-[10px] text-[var(--app-muted)]">
                                  {toMsgTime(msg.createdAt)}
                                </span>
                                {msg.editedAt && !isDeleted && (
                                  <span className="text-[10px] italic text-[var(--app-muted)]">· editado</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              {can('mensajes', 'create') && (
                <div className="flex items-end gap-2 border-t border-[var(--app-border)] px-4 py-3">
                  {/* Emoji picker */}
                  <div ref={emojiRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmoji((v) => !v)}
                      className="rounded-full p-2 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-12 left-0 z-20 animate-fade-in rounded-2xl border border-[var(--app-border)] bg-white p-3 shadow-lg">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="rounded-lg p-1 text-xl transition hover:bg-[var(--app-surface-muted)]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void onSend();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5 text-sm text-[var(--app-ink)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--app-border-strong)] focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => void onSend()}
                    disabled={!messageText.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5b2d8a] text-white transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
