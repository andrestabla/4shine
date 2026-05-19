'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  Users,
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

// ── YouTube helpers ────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function getYouTubeIds(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];
  return urls.map(extractYouTubeId).filter(Boolean) as string[];
}

function renderText(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part;
    if (extractYouTubeId(part)) return null; // shown as preview card
    return (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all hover:opacity-80"
      >
        {part}
      </a>
    );
  });
}

// ── YouTube preview card ───────────────────────────────────────────────────────

function YouTubePreview({ videoId }: { videoId: string }) {
  const [showEmbed, setShowEmbed] = React.useState(false);
  return (
    <div className="w-64 overflow-hidden rounded-xl border border-[var(--app-border)] bg-white shadow-sm">
      {showEmbed ? (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <button onClick={() => setShowEmbed(true)} className="group relative block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="YouTube video"
            className="aspect-video w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-t-xl bg-black/20 transition group-hover:bg-black/35">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 shadow-lg">
              <svg viewBox="0 0 24 24" fill="white" className="ml-0.5 h-5 w-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <svg viewBox="0 0 24 24" fill="#FF0000" className="h-3.5 w-3.5 shrink-0">
          <path d="M21.8 8a2.75 2.75 0 0 0-1.94-1.95C18.2 5.6 12 5.6 12 5.6s-6.2 0-7.86.45A2.75 2.75 0 0 0 2.2 8 28.6 28.6 0 0 0 1.8 12a28.6 28.6 0 0 0 .4 4 2.75 2.75 0 0 0 1.94 1.95C5.8 18.4 12 18.4 12 18.4s6.2 0 7.86-.45A2.75 2.75 0 0 0 21.8 16a28.6 28.6 0 0 0 .4-4 28.6 28.6 0 0 0-.4-4zM9.75 14.85V9.15L15.5 12l-5.75 2.85z" />
        </svg>
        <span className="truncate text-[11px] text-[var(--app-muted)]">YouTube</span>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto shrink-0 text-[11px] text-[var(--app-muted)] underline hover:text-[var(--app-ink)]"
        >
          Abrir ↗
        </a>
      </div>
    </div>
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
  const emojiBtnRef = React.useRef<HTMLButtonElement>(null);
  const [emojiAnchor, setEmojiAnchor] = React.useState<{ bottom: number; left: number } | null>(null);
  const [isOtherTyping, setIsOtherTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = React.useRef(0);

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

    channel.bind('client-typing', () => {
      setIsOtherTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
    });

    return () => {
      pusher.unsubscribe(`private-thread-${selectedThreadId}`);
      setIsOtherTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
      const target = e.target as Node;
      const clickedBtn = emojiBtnRef.current?.contains(target);
      const clickedPanel = emojiRef.current?.contains(target);
      if (!clickedBtn && !clickedPanel) {
        setShowEmoji(false);
        setEmojiAnchor(null);
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

  const lastMyMessageId = [...messages]
    .reverse()
    .find((m) => m.senderUserId === sessionUser?.id && !m.deletedAt)?.messageId ?? null;

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

  const sendTypingEvent = React.useCallback(() => {
    if (!selectedThreadId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const ch = pusher.channel(`private-thread-${selectedThreadId}`);
    if (!ch) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ch as any).trigger('client-typing', {});
      lastTypingSentRef.current = now;
    } catch {
      // client events not enabled in Pusher dashboard — silently ignore
    }
  }, [selectedThreadId]);

  const insertEmoji = (emoji: string) => {
    setMessageText((t) => t + emoji);
    setShowEmoji(false);
    setEmojiAnchor(null);
    inputRef.current?.focus();
  };

  const toggleEmoji = () => {
    if (!showEmoji && emojiBtnRef.current) {
      const rect = emojiBtnRef.current.getBoundingClientRect();
      setEmojiAnchor({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setShowEmoji((v) => !v);
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
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header fijo: título + buscador + aviso (nunca se pierde al scrollear) */}
      <div className="shrink-0 border-b border-[var(--app-border)] px-3 pt-3 pb-2.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowContacts(false); setContactSearch(''); }}
            className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] transition"
          >
            <ArrowLeft size={16} />
          </button>
          <h3 className="text-sm font-bold text-[var(--app-ink)]">Nueva conversación</h3>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--app-muted)]" />
          <input
            autoFocus
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Buscar contacto..."
            className="flex-1 bg-transparent text-sm text-[var(--app-ink)] outline-none placeholder:text-[var(--app-muted)]"
          />
          {contactSearch && (
            <button onClick={() => setContactSearch('')} className="text-[var(--app-muted)] hover:text-[var(--app-ink)]">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Aviso líderes — fijo en header, siempre visible */}
        {currentRole === 'lider' && (
          <div className="flex items-center gap-2 rounded-lg bg-[#f3e8ff] px-3 py-2">
            <Users size={13} className="shrink-0 text-[#5b2d8a]" />
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-[#5b2d8a]">
              Solo ves tus conexiones de Networking.
            </p>
            <a
              href="/dashboard/networking"
              className="shrink-0 rounded-full bg-[#5b2d8a] px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 transition"
            >
              Conectar
            </a>
          </div>
        )}
      </div>

      {/* Lista scrollable */}
      <div className="flex-1 min-h-0 divide-y divide-[var(--app-border)] overflow-y-auto">
        {filteredContacts.length === 0 ? (
          currentRole === 'lider' ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3e8ff]">
                <Users size={20} style={{ color: '#5b2d8a' }} />
              </div>
              <p className="text-sm font-semibold text-[var(--app-ink)]">Aún no tienes conexiones</p>
              <p className="max-w-[14rem] text-xs text-[var(--app-muted)]">
                Conecta con líderes en Networking para poder enviarles mensajes.
              </p>
              <a
                href="/dashboard/networking"
                className="mt-1 rounded-full bg-[#5b2d8a] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
              >
                Ir a Networking
              </a>
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-[var(--app-muted)]">Sin resultados.</p>
          )
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
    <div className="flex flex-1 min-h-0 flex-col">
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

      <div className="flex-1 min-h-0 divide-y divide-[var(--app-border)] overflow-y-auto">
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
          className={`flex flex-col overflow-hidden border-r border-[var(--app-border)] ${
            showChatOnMobile ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {showContacts ? leftContacts : leftThreads}
        </div>

        {/* Right panel: chat */}
        <div
          className={`flex flex-col overflow-hidden ${showChatOnMobile ? 'flex' : 'hidden lg:flex'}`}
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
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5">
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

                        const ytIds = getYouTubeIds(msg.messageText);
                        const textOnly = msg.messageText.replace(/https?:\/\/[^\s]+/g, '').trim();
                        const hasText = textOnly.length > 0;

                        const isSeen =
                          isMine &&
                          selectedThread?.otherParticipantLastReadAt != null &&
                          msg.createdAt <= selectedThread.otherParticipantLastReadAt;

                        return (
                          <div
                            key={msg.messageId}
                            className={`group flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isMine && (
                              <Avatar name={msg.senderName} avatarUrl={msg.senderAvatarUrl} size="sm" />
                            )}

                            <div
                              className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}
                            >
                              {!isMine && (
                                <span className="px-1 text-[11px] font-semibold text-[var(--app-muted)]">
                                  {msg.senderName}
                                </span>
                              )}

                              {isDeleted ? (
                                <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2.5">
                                  <Trash2 size={11} className="shrink-0 text-[var(--app-muted)]" />
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
                                  {/* Text bubble — solo si hay texto además de la URL */}
                                  {hasText && (
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
                                  )}

                                  {/* YouTube previews */}
                                  {ytIds.map((id, idx) => (
                                    <YouTubePreview key={idx} videoId={id} />
                                  ))}

                                  {/* Edit / Delete — aparece en hover a la izquierda de la burbuja enviada */}
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
                                  <>
                                    <Pencil size={9} className="text-[var(--app-muted)]" />
                                    <span className="text-[10px] italic text-[var(--app-muted)]">editado</span>
                                  </>
                                )}
                                {isMine && !isDeleted && msg.messageId === lastMyMessageId && (
                                  isSeen
                                    ? <CheckCheck size={13} className="text-[#5b2d8a]" />
                                    : <Check size={13} className="text-[var(--app-muted)]" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                {isOtherTyping && selectedThread && (
                  <div className="flex gap-2.5">
                    <Avatar
                      name={selectedThread.otherParticipantName ?? '?'}
                      avatarUrl={selectedThread.otherParticipantAvatarUrl}
                      size="sm"
                    />
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[var(--app-surface-muted)] px-4 py-3">
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--app-muted)]" style={{ animationDelay: '0ms' }} />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--app-muted)]" style={{ animationDelay: '160ms' }} />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--app-muted)]" style={{ animationDelay: '320ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              {can('mensajes', 'create') && (
                <div className="flex items-end gap-2 border-t border-[var(--app-border)] px-4 py-3">
                  {/* Emoji picker — portal para evitar overflow:hidden del contenedor */}
                  <div ref={emojiRef}>
                    <button
                      ref={emojiBtnRef}
                      type="button"
                      onClick={toggleEmoji}
                      className="rounded-full p-2 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                    >
                      <Smile size={20} />
                    </button>
                  </div>
                  {showEmoji && emojiAnchor && typeof document !== 'undefined' &&
                    ReactDOM.createPortal(
                      <div
                        ref={emojiRef}
                        style={{ position: 'fixed', bottom: emojiAnchor.bottom, left: emojiAnchor.left, zIndex: 9999 }}
                        className="animate-fade-in rounded-2xl border border-[var(--app-border)] bg-white p-3 shadow-xl"
                      >
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="rounded-lg p-1.5 text-lg leading-none transition hover:bg-[var(--app-surface-muted)]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>,
                      document.body,
                    )
                  }

                  <input
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => { setMessageText(e.target.value); if (e.target.value) sendTypingEvent(); }}
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
