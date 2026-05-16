'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Users,
  MessageSquare,
  UserPlus,
  Check,
  X,
  ChevronRight,
  MapPin,
  Send,
  Link2,
  Globe,
  ThumbsUp,
  Pencil,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import { createDirectThread } from '@/features/mensajes/client';
import {
  createCommunity,
  createCommunityPost,
  createConnection,
  deleteCommunity,
  deleteConnection,
  followUser,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listCommunityPosts,
  listConnections,
  listNetworkPeople,
  unfollowUser,
  updateCommunity,
  updateConnection,
  toggleReaction,
  listComments,
  createComment,
  type CommentRecord,
  type CommunityLink,
  type CommunityPostRecord,
  type CommunityRecord,
  type CommunityVisibility,
  type ConnectionRecord,
  type ConnectionStatus,
  type NetworkPersonRecord,
  type UpdateCommunityInput,
} from '@/features/networking/client';

type MainTab = 'inicio' | 'mi-red' | 'mensajes';
type NetworkSubTab = 'contactos' | 'comunidades' | 'descubre';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function roleLabel(role: string): string {
  if (role === 'lider') return 'Líder';
  if (role === 'mentor') return 'Adviser';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Administrador';
  return role;
}

function connectionTag(status: ConnectionStatus | 'none'): { label: string; color: string } {
  if (status === 'connected') return { label: '1er grado', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (status === 'pending') return { label: 'Pendiente', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (status === 'blocked') return { label: 'Bloqueado', color: 'text-red-700 bg-red-50 border-red-200' };
  return { label: '', color: '' };
}

function normalizeUrl(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

function getDirectVideoUrl(url: string): string | null {
  const clean = normalizeUrl(url);
  if (!clean) return null;
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(clean)) return clean;
  return null;
}

function getEmbeddedVideoUrl(url: string): string | null {
  const clean = normalizeUrl(url);
  if (!clean) return null;
  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;
    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes('youtu.be')) {
      const id = path.split('/').filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes('vimeo.com')) {
      const id = path.split('/').filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { return null; }
  return null;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-11 w-11 text-base';
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`${sz} shrink-0 rounded-2xl object-cover`} />;
  }
  return (
    <div className={`${sz} shrink-0 rounded-2xl flex items-center justify-center font-black text-white`}
      style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}>
      {(name[0] ?? 'U').toUpperCase()}
    </div>
  );
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────

function TabNav({ activeTab, onTabChange, pendingCount }: { activeTab: MainTab; onTabChange: (t: MainTab) => void; pendingCount: number }) {
  const tabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <Globe size={16} /> },
    { id: 'mi-red', label: 'Mi red', icon: <Users size={16} /> },
    { id: 'mensajes', label: 'Mensajes', icon: <MessageSquare size={16} /> },
  ];
  return (
    <nav className="app-panel overflow-hidden p-0">
      <div className="flex border-b border-[var(--app-border)]">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
            }`}>
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === 'mi-red' && pendingCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4f2360] px-1 text-[10px] font-black text-white">{pendingCount}</span>
            )}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#4f2360]" />}
          </button>
        ))}
      </div>
    </nav>
  );
}

function NetworkSubNav({ activeSubTab, onSubTabChange, pendingCount }: { activeSubTab: NetworkSubTab; onSubTabChange: (t: NetworkSubTab) => void; pendingCount: number }) {
  const tabs: { id: NetworkSubTab; label: string }[] = [
    { id: 'contactos', label: 'Contactos' },
    { id: 'comunidades', label: 'Comunidades' },
    { id: 'descubre', label: 'Descubre' },
  ];
  return (
    <div className="flex gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onSubTabChange(tab.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
            activeSubTab === tab.id ? 'bg-white text-[#4f2360] shadow-sm' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}>
          {tab.label}
          {tab.id === 'contactos' && pendingCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4f2360] px-1 text-[10px] font-black text-white">{pendingCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── UrlPreviewCard ───────────────────────────────────────────────────────────

interface UrlPreview { url: string; title?: string | null; description?: string | null; image?: string | null; siteName?: string | null }

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

function UrlPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = React.useState<UrlPreview | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isImageUrl(url)) { setPreview({ url, image: url }); setLoading(false); return; }
    let cancelled = false;
    void fetch(`/api/v1/url-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json() as Promise<{ ok: boolean; data: UrlPreview }>)
      .then(({ data }) => { if (!cancelled) { setPreview(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setPreview({ url }); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 text-sm font-semibold text-[#4f2360] transition hover:bg-white">
        <Link2 size={14} />
        <span className="truncate">{url}</span>
      </a>
    );
  }

  if (preview?.image && isImageUrl(preview.image)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[var(--app-border)] transition hover:opacity-90">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview.image} alt={preview.title ?? ''} className="w-full max-h-80 object-cover" />
        {preview.title && (
          <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
            <p className="text-xs font-semibold text-[var(--app-ink)] leading-snug line-clamp-1">{preview.title}</p>
            {preview.siteName && <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">{preview.siteName}</p>}
          </div>
        )}
      </a>
    );
  }

  if (preview?.image && !isImageUrl(preview.image)) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="flex overflow-hidden rounded-xl border border-[var(--app-border)] transition hover:shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview.image} alt={preview.title ?? ''} className="h-24 w-24 shrink-0 object-cover" />
        <div className="min-w-0 flex-1 p-3">
          {preview.siteName && <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">{preview.siteName}</p>}
          <p className="mt-0.5 text-sm font-bold text-[var(--app-ink)] line-clamp-2 leading-snug">{preview.title ?? url}</p>
          {preview.description && <p className="mt-1 text-[11px] text-[var(--app-muted)] line-clamp-2 leading-relaxed">{preview.description}</p>}
        </div>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5 transition hover:bg-white">
      {preview?.siteName && <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">{preview.siteName}</p>}
      <p className="text-sm font-bold text-[#4f2360] line-clamp-1 leading-snug">{preview?.title ?? url}</p>
      {preview?.description && <p className="mt-0.5 text-[11px] text-[var(--app-muted)] line-clamp-2">{preview.description}</p>}
      <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--app-muted)]"><Link2 size={10} />{url}</p>
    </a>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

function CommentBody({ body }: { body: string }) {
  const parts: { type: 'text' | 'url'; value: string }[] = [];
  let last = 0;
  for (const m of body.matchAll(URL_REGEX)) {
    if (m.index! > last) parts.push({ type: 'text', value: body.slice(last, m.index) });
    parts.push({ type: 'url', value: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < body.length) parts.push({ type: 'text', value: body.slice(last) });

  const urls = parts.filter((p) => p.type === 'url').map((p) => p.value);

  return (
    <div>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--app-muted)] whitespace-pre-wrap">
        {parts.map((p, i) =>
          p.type === 'url' ? (
            <a key={i} href={p.value} target="_blank" rel="noreferrer"
              className="text-[#4f2360] underline underline-offset-2 break-all">
              {p.value}
            </a>
          ) : (
            <span key={i}>{p.value}</span>
          ),
        )}
      </p>
      {urls.map((url) => (
        <div key={url} className="mt-2">
          <UrlPreviewCard url={url} />
        </div>
      ))}
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  onToggleReaction,
}: {
  post: CommunityPostRecord;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatarUrl?: string | null;
  onToggleReaction: (postId: string) => void;
}) {
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<CommentRecord[]>([]);
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [commentInput, setCommentInput] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const data = await listComments(post.postId);
        setComments(data);
        setCommentsLoaded(true);
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(post.postId, commentInput.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentInput('');
    } finally {
      setSubmitting(false);
    }
  };

  const directVideo = getDirectVideoUrl(post.resourceUrl ?? '');
  const embeddedVideo = getEmbeddedVideoUrl(post.resourceUrl ?? '');
  const normalizedUrl = normalizeUrl(post.resourceUrl);

  return (
    <article className="app-panel overflow-hidden p-0">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={post.authorName} avatarUrl={post.authorAvatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--app-ink)] leading-tight">{post.authorName}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-chip-border)] bg-[var(--app-chip)] px-2 py-0.5 text-[11px] font-semibold text-[#4f2360]">
                {post.groupName}
              </span>
              <span className="text-[11px] text-[var(--app-muted)]">{toRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <h4 className="mt-3 text-base font-bold text-[var(--app-ink)] leading-snug">{post.title}</h4>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">{post.body}</p>
      </div>

      {post.resourceUrl && (
        <div className="border-t border-[var(--app-border)] px-4 pb-4 pt-3">
          {directVideo ? (
            <video className="w-full rounded-xl border border-[var(--app-line)]" controls preload="metadata">
              <source src={directVideo} />
            </video>
          ) : embeddedVideo ? (
            <div className="overflow-hidden rounded-xl border border-[var(--app-line)]">
              <iframe title={`video-${post.postId}`} src={embeddedVideo} className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            </div>
          ) : normalizedUrl && /^https?:\/\//i.test(normalizedUrl) ? (
            <UrlPreviewCard url={normalizedUrl} />
          ) : (
            <p className="text-xs text-[var(--app-muted)]">{post.resourceUrl}</p>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex border-t border-[var(--app-border)]">
        <button type="button"
          onClick={() => onToggleReaction(post.postId)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            post.hasReacted ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}>
          <ThumbsUp size={13} className={post.hasReacted ? 'fill-[#4f2360]' : ''} />
          Recomendar{post.reactionCount > 0 ? ` · ${post.reactionCount}` : ''}
        </button>
        <button type="button"
          onClick={() => void handleToggleComments()}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            showComments ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}>
          <MessageSquare size={13} />
          Comentar{post.commentCount > 0 ? ` · ${post.commentCount}` : ''}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 space-y-3">
          {commentsLoading ? (
            <p className="text-xs text-[var(--app-muted)]">Cargando comentarios...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-xs text-[var(--app-muted)]">Sé el primero en comentar.</p>
              )}
              {comments.map((c) => (
                <div key={c.commentId} className="flex items-start gap-2">
                  <Avatar name={c.authorName} avatarUrl={c.authorAvatarUrl} size="sm" />
                  <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 border border-[var(--app-border)]">
                    <p className="text-xs font-bold text-[var(--app-ink)]">
                      {c.authorName}
                      {c.authorUserId === currentUserId && (
                        <span className="ml-1.5 font-normal text-[var(--app-muted)]">· Tú</span>
                      )}
                    </p>
                    <CommentBody body={c.body} />
                    <p className="mt-1 text-[10px] text-[var(--app-muted)]">{toRelativeTime(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Comment input */}
          <form className="flex items-center gap-2" onSubmit={(e) => void handleSubmitComment(e)}>
            <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
            <input
              className="flex-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs text-[var(--app-ink)] placeholder:text-[var(--app-muted)] focus:outline-none focus:border-[var(--app-border-strong)]"
              placeholder="Agrega un comentario..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button type="submit" disabled={submitting || !commentInput.trim()}
              className="shrink-0 rounded-full bg-[#4f2360] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#3b1649] disabled:opacity-40">
              <Send size={11} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

// ─── PersonCard ───────────────────────────────────────────────────────────────

function PersonCard({ person, onFollow, onContact, onMessage, onViewProfile, compact = false }: {
  person: NetworkPersonRecord;
  onFollow: () => void;
  onContact: () => void;
  onMessage: () => void;
  onViewProfile: () => void;
  compact?: boolean;
}) {
  const tag = connectionTag(person.connectionStatus);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white p-3 transition hover:shadow-sm">
        <Avatar name={person.displayName} avatarUrl={person.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--app-ink)]">{person.displayName}</p>
          <p className="truncate text-[11px] text-[var(--app-muted)]">{person.profession ?? roleLabel(person.primaryRole)}</p>
        </div>
        <button type="button" onClick={person.isFollowing ? onFollow : onContact}
          className="shrink-0 rounded-full border border-[#4f2360] px-3 py-1 text-[11px] font-bold text-[#4f2360] transition hover:bg-[#4f2360] hover:text-white">
          {person.isFollowing ? 'Siguiendo' : person.connectionStatus === 'none' ? 'Conectar' : 'Mensaje'}
        </button>
      </div>
    );
  }

  return (
    <article className="app-panel overflow-hidden p-0">
      <div className="h-10 bg-gradient-to-r from-[#2c136e] via-[#45208f] to-[#25124f]" />
      <div className="-mt-5 p-4">
        <Avatar name={person.displayName} avatarUrl={person.avatarUrl} size="md" />
        <div className="mt-2">
          <p className="text-sm font-bold text-[var(--app-ink)]">{person.displayName}</p>
          <p className="text-xs text-[var(--app-muted)]">{person.profession ?? roleLabel(person.primaryRole)}</p>
          {person.location && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--app-muted)]"><MapPin size={10} />{person.location}</p>
          )}
          {tag.label && (
            <span className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tag.color}`}>{tag.label}</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {person.connectionStatus !== 'connected' && person.connectionStatus !== 'pending' && (
            <button type="button" onClick={onContact}
              className="flex items-center gap-1.5 rounded-full border border-[#4f2360] px-3 py-1.5 text-xs font-bold text-[#4f2360] transition hover:bg-[#4f2360] hover:text-white">
              <UserPlus size={12} />Conectar
            </button>
          )}
          <button type="button" onClick={onFollow}
            className="rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs font-bold text-[var(--app-muted)] transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]">
            {person.isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
          {person.connectionStatus === 'connected' && (
            <button type="button" onClick={onMessage}
              className="flex items-center gap-1.5 rounded-full bg-[#4f2360] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3b1649]">
              <MessageSquare size={12} />Mensaje
            </button>
          )}
          {person.connectionStatus === 'connected' && (
            <button type="button" onClick={onViewProfile} className="text-xs font-semibold text-[#4f2360] underline underline-offset-2">
              Ver perfil
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── CommunityCard ────────────────────────────────────────────────────────────

function CommunityCard({ community, onToggleMembership, canManage, onToggleStatus, onDelete, onSave }: {
  community: CommunityRecord;
  onToggleMembership: () => void;
  canManage: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
  onSave: (groupId: string, updates: UpdateCommunityInput) => Promise<void>;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: community.name,
    category: community.category ?? '',
    description: community.description ?? '',
    coverImageUrl: community.coverImageUrl ?? '',
    links: community.links,
    visibility: community.visibility,
  });
  const [newLinkTitle, setNewLinkTitle] = React.useState('');
  const [newLinkUrl, setNewLinkUrl] = React.useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(community.groupId, {
        name: form.name || undefined,
        category: form.category || null,
        description: form.description || null,
        coverImageUrl: form.coverImageUrl || null,
        links: form.links,
        visibility: form.visibility,
      });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    const title = newLinkTitle.trim();
    const url = newLinkUrl.trim();
    if (!title || !url) return;
    setForm((prev) => ({ ...prev, links: [...prev.links, { title, url }] }));
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const removeLink = (index: number) => {
    setForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  return (
    <article className="app-panel overflow-hidden p-0">
      {community.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={community.coverImageUrl} alt={community.name} className="h-28 w-full object-cover" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
            style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}>
            {(community.name[0] ?? 'C').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[var(--app-ink)]">{community.name}</p>
              {community.isGeneral && (
                <span className="rounded-full bg-[#4f2360]/10 px-2 py-0.5 text-[10px] font-bold text-[#4f2360]">General</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {community.category && (
                <span className="rounded-full border border-[var(--app-chip-border)] bg-[var(--app-chip)] px-2 py-0.5 text-[11px] font-semibold text-[#4f2360]">
                  {community.category}
                </span>
              )}
              <span className="text-[11px] text-[var(--app-muted)]">{community.memberCount} miembros</span>
            </div>
            {community.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-[var(--app-muted)]">{community.description}</p>
            )}
          </div>
        </div>

        {/* Links */}
        {community.links.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {community.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-[#4f2360] transition hover:bg-white">
                <Link2 size={11} />
                <span className="truncate">{link.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!community.isGeneral && (
            <button type="button" onClick={onToggleMembership}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                community.isMember
                  ? 'border border-[var(--app-border)] text-[var(--app-muted)] hover:border-red-200 hover:text-red-600'
                  : 'bg-[#4f2360] text-white hover:bg-[#3b1649]'
              }`}>
              {community.isMember ? 'Salir' : '+ Unirme'}
            </button>
          )}
          {!community.isActive && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Cerrada</span>
          )}
          {canManage && (
            <div className="ml-auto flex gap-1.5">
              <button type="button" onClick={() => setEditOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full border border-[var(--app-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-muted)] hover:border-[#4f2360] hover:text-[#4f2360]">
                <Pencil size={11} />Editar
              </button>
              <button type="button" onClick={onToggleStatus}
                className="rounded-full border border-[var(--app-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-muted)] hover:border-[var(--app-border-strong)]">
                {community.isActive ? 'Cerrar' : 'Abrir'}
              </button>
              {!community.isGeneral && (
                <button type="button" onClick={onDelete}
                  className="rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50">
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {canManage && editOpen && (
        <form onSubmit={(e) => void handleSave(e)} className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">Editar comunidad</p>

          <input className="app-input text-sm" placeholder="Nombre" value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />

          <input className="app-input text-sm" placeholder="Categoría (ej. Liderazgo, Innovación…)" value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />

          <textarea className="app-textarea min-h-20 text-sm" placeholder="Descripción de la comunidad…" value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

          <select className="app-select text-sm" value={form.visibility}
            onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value as CommunityVisibility }))}>
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
          </select>

          {/* Cover image */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-[var(--app-muted)]">Foto de portada</p>
            <div className="flex gap-2">
              <input className="app-input flex-1 text-sm" placeholder="URL de imagen…" value={form.coverImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))} />
              <R2UploadButton
                moduleCode="networking"
                action="update"
                pathPrefix="networking/communities/covers"
                entityTable="app_networking.interest_groups"
                fieldName="cover_image_url"
                accept="image/*"
                buttonLabel="Subir foto"
                className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]"
                onUploaded={(url) => setForm((p) => ({ ...p, coverImageUrl: url }))}
              />
            </div>
            {form.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverImageUrl} alt="preview" className="mt-2 h-20 w-full rounded-xl object-cover border border-[var(--app-border)]" />
            )}
          </div>

          {/* Links */}
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-[var(--app-muted)]">Enlaces de interés</p>
            <div className="space-y-1.5">
              {form.links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-white px-3 py-2">
                  <Link2 size={12} className="shrink-0 text-[var(--app-muted)]" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--app-ink)]">{link.title}</span>
                  <span className="truncate text-[11px] text-[var(--app-muted)]">{link.url}</span>
                  <button type="button" onClick={() => removeLink(i)} className="shrink-0 text-red-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="app-input flex-1 py-1.5 text-xs" placeholder="Título del enlace"
                  value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} />
                <input className="app-input flex-1 py-1.5 text-xs" placeholder="https://..."
                  value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
                <button type="button" onClick={addLink}
                  className="flex items-center gap-1 rounded-full bg-[#4f2360] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#3b1649]">
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditOpen(false)}
              className="rounded-full border border-[var(--app-border)] px-4 py-1.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-ink)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="rounded-full bg-[#4f2360] px-5 py-1.5 text-xs font-bold text-white transition hover:bg-[#3b1649] disabled:opacity-40">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

// ─── ConnectionCard ───────────────────────────────────────────────────────────

function ConnectionCard({ connection, isInbound, onAccept, onReject, onDelete, onViewProfile }: {
  connection: ConnectionRecord;
  isInbound: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
  onViewProfile: () => void;
}) {
  return (
    <article className="app-panel p-4">
      <div className="flex items-start gap-3">
        <Avatar name={connection.counterpartName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--app-ink)]">{connection.counterpartName}</p>
          <span className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            connection.status === 'connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : isInbound ? 'border-[#4f2360]/20 bg-[#4f2360]/5 text-[#4f2360]'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {connection.status === 'connected' ? '1er grado' : isInbound ? 'Te invitó' : 'Invitación enviada'}
          </span>
        </div>
        {connection.status === 'connected' && (
          <button type="button" onClick={onViewProfile}
            className="shrink-0 rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs font-bold text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]">
            Ver perfil
          </button>
        )}
      </div>
      {connection.status === 'pending' && isInbound && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onAccept}
            className="flex items-center gap-1.5 rounded-full bg-[#4f2360] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#3b1649]">
            <Check size={12} />Aceptar
          </button>
          <button type="button" onClick={onReject}
            className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] px-4 py-1.5 text-xs font-bold text-[var(--app-muted)] transition hover:border-red-200 hover:text-red-600">
            <X size={12} />Rechazar
          </button>
        </div>
      )}
      {connection.status === 'connected' && (
        <button type="button" onClick={onDelete}
          className="mt-2 text-[11px] font-semibold text-[var(--app-muted)] underline underline-offset-2 hover:text-red-600">
          Eliminar contacto
        </button>
      )}
    </article>
  );
}

// ─── PostComposer ─────────────────────────────────────────────────────────────

function PostComposer({ communities, postForm, onFormChange, onSubmit, canCreate, currentUserName, currentUserAvatarUrl }: {
  communities: CommunityRecord[];
  postForm: { groupId: string; title: string; body: string; resourceUrl: string };
  onFormChange: (updates: Partial<typeof postForm>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  canCreate: boolean;
  currentUserName: string;
  currentUserAvatarUrl?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  // Sort: general first, then rest
  const sorted = [...communities].sort((a, b) => (b.isGeneral ? 1 : 0) - (a.isGeneral ? 1 : 0));

  return (
    <section className="app-panel p-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
          <button type="button" onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-[var(--app-border)] px-4 py-2.5 text-left text-sm text-[var(--app-muted)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]">
            Comparte algo con tu comunidad...
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex items-center gap-3">
            <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
            <select className="app-select flex-1 py-2 text-sm" value={postForm.groupId}
              onChange={(e) => onFormChange({ groupId: e.target.value })}>
              <option value="">Selecciona una comunidad…</option>
              {sorted.map((c) => (
                <option key={c.groupId} value={c.groupId}>
                  {c.isGeneral ? '🌐 General (toda la comunidad)' : c.name}
                </option>
              ))}
            </select>
          </div>
          <input className="app-input text-sm" placeholder="Título del aporte" value={postForm.title}
            onChange={(e) => onFormChange({ title: e.target.value })} required />
          <textarea className="app-textarea min-h-28 text-sm" placeholder="Comparte una idea, aprendizaje o recurso con tu comunidad…"
            value={postForm.body} onChange={(e) => onFormChange({ body: e.target.value })} required autoFocus />
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-3">
            <input className="app-input flex-1 py-1.5 text-xs" placeholder="Pega una URL (imagen, video, enlace)…" value={postForm.resourceUrl}
              onChange={(e) => onFormChange({ resourceUrl: e.target.value })} />
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--app-border)] px-4 py-1.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-ink)]">
                Cancelar
              </button>
              <button type="submit" disabled={!canCreate}
                className="rounded-full bg-[#4f2360] px-5 py-1.5 text-xs font-bold text-white transition hover:bg-[#3b1649] disabled:opacity-40">
                Publicar
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NetworkingPage() {
  const router = useRouter();
  const { can, currentRole, currentUser, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [people, setPeople] = React.useState<NetworkPersonRecord[]>([]);
  const [communities, setCommunities] = React.useState<CommunityRecord[]>([]);
  const [communityPosts, setCommunityPosts] = React.useState<CommunityPostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [postForm, setPostForm] = React.useState({ groupId: '', title: '', body: '', resourceUrl: '' });
  const [communityForm, setCommunityForm] = React.useState({ name: '', description: '', category: '', visibility: 'open' as CommunityVisibility });

  const [activeTab, setActiveTab] = React.useState<MainTab>('inicio');
  const [networkSubTab, setNetworkSubTab] = React.useState<NetworkSubTab>('contactos');

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const canManageCommunities = can('networking', 'manage');
  const canCreate = can('networking', 'create');

  const programOffers = filterCommercialProducts(viewerAccess?.catalog, { codes: ['program_4shine'] });

  const showError = React.useCallback(async (fallbackMessage: string, cause: unknown) => {
    await alert({ title: 'Error', message: cause instanceof Error ? cause.message : fallbackMessage, tone: 'error' });
  }, [alert]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [connectionData, peopleData, communityData, postData] = await Promise.all([
        listConnections(), listNetworkPeople(), listCommunities(), listCommunityPosts(),
      ]);
      setConnections(connectionData);
      setPeople(peopleData);
      setCommunities(communityData);
      setCommunityPosts(postData);
      // Default to general community if available
      const general = communityData.find((c) => c.isGeneral);
      setPostForm((prev) => ({ ...prev, groupId: prev.groupId || general?.groupId || communityData[0]?.groupId || '' }));
    } catch (loadError) {
      await showError('No se pudo cargar networking', loadError);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isCommunityLocked) { setLoading(false); return; }
    void load();
  }, [isCommunityLocked, load]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const onToggleFollow = async (person: NetworkPersonRecord) => {
    try {
      if (person.isFollowing) await unfollowUser(person.userId);
      else await followUser(person.userId);
      await load();
    } catch (error) { await showError('No se pudo actualizar el seguimiento', error); }
  };

  const onContact = async (person: NetworkPersonRecord) => {
    try {
      await createConnection({ addresseeUserId: person.userId });
      await Promise.all([load(), refreshBootstrap()]);
      await alert({ title: 'Solicitud enviada', message: `Solicitud enviada a ${person.displayName}.`, tone: 'success' });
    } catch (error) { await showError('No se pudo enviar la solicitud', error); }
  };

  const onMessage = async (person: NetworkPersonRecord) => {
    try {
      await createDirectThread({ participantUserId: person.userId, title: `Chat con ${person.displayName}` });
      router.push('/dashboard/mensajes');
    } catch (error) { await showError('No se pudo abrir el chat', error); }
  };

  const onViewConnectedProfile = (userId: string) => router.push(`/dashboard/networking/perfiles/${userId}`);

  const onUpdateStatus = async (connection: ConnectionRecord, status: ConnectionStatus) => {
    try { await updateConnection(connection.connectionId, { status }); await load(); }
    catch (error) { await showError('No se pudo actualizar la conexión', error); }
  };

  const onDeleteConnection = async (connection: ConnectionRecord) => {
    const ok = await confirm({ title: 'Eliminar contacto', message: `¿Eliminar relación con ${connection.counterpartName}?`, tone: 'warning', confirmText: 'Eliminar', cancelText: 'Cancelar' });
    if (!ok) return;
    try { await deleteConnection(connection.connectionId); await load(); }
    catch (error) { await showError('No se pudo eliminar la conexión', error); }
  };

  const onCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postForm.groupId) {
      await alert({ title: 'Comunidad requerida', message: 'Selecciona una comunidad.', tone: 'warning' });
      return;
    }
    try {
      await createCommunityPost(postForm.groupId, { title: postForm.title, body: postForm.body, resourceUrl: postForm.resourceUrl || null });
      setPostForm((prev) => ({ ...prev, title: '', body: '', resourceUrl: '' }));
      await load();
    } catch (error) { await showError('No se pudo compartir el recurso', error); }
  };

  const onToggleReaction = (postId: string) => {
    // Optimistic update
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, hasReacted: !p.hasReacted, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1 }
          : p,
      ),
    );
    void toggleReaction(postId).catch(async () => {
      // Revert on failure
      setCommunityPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? { ...p, hasReacted: !p.hasReacted, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1 }
            : p,
        ),
      );
      await showError('No se pudo registrar la recomendación', new Error('Error'));
    });
  };

  const onCreateCommunity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { await createCommunity(communityForm); setCommunityForm({ name: '', description: '', category: '', visibility: 'open' }); await load(); }
    catch (error) { await showError('No se pudo crear la comunidad', error); }
  };

  const onToggleCommunityStatus = async (community: CommunityRecord) => {
    try { await updateCommunity(community.groupId, { isActive: !community.isActive }); await load(); }
    catch (error) { await showError('No se pudo actualizar la comunidad', error); }
  };

  const onDeleteCommunity = async (community: CommunityRecord) => {
    const ok = await confirm({ title: 'Eliminar comunidad', message: `¿Eliminar la comunidad ${community.name}?`, tone: 'warning', confirmText: 'Eliminar', cancelText: 'Cancelar' });
    if (!ok) return;
    try { await deleteCommunity(community.groupId); await load(); }
    catch (error) { await showError('No se pudo eliminar la comunidad', error); }
  };

  const onToggleMembership = async (community: CommunityRecord) => {
    try {
      if (community.isMember) await leaveCommunity(community.groupId);
      else await joinCommunity(community.groupId);
      await load();
    } catch (error) { await showError('No se pudo actualizar la membresía', error); }
  };

  const onSaveCommunity = async (groupId: string, updates: UpdateCommunityInput) => {
    try { await updateCommunity(groupId, updates); await load(); }
    catch (error) { await showError('No se pudo actualizar la comunidad', error); }
  };

  const filteredPeople = people.filter((person) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return `${person.displayName} ${person.profession ?? ''} ${person.industry ?? ''} ${person.location ?? ''}`.toLowerCase().includes(term);
  });

  const myCurrentUserId = currentUser?.id ?? '';
  const pendingInbound = connections.filter((c) => c.status === 'pending' && c.requesterUserId !== myCurrentUserId);
  const pendingOutbound = connections.filter((c) => c.status === 'pending' && c.requesterUserId === myCurrentUserId);
  const connectedContacts = connections.filter((c) => c.status === 'connected');
  const myConnected = connectedContacts.length;
  const myPending = pendingInbound.length;

  // ── Locked ──────────────────────────────────────────────────────────────────
  if (isCommunityLocked) {
    const NETWORK_FEATURES = [
      { label: 'Perfiles de líderes', desc: 'Explora quiénes integran la comunidad 4Shine.' },
      { label: 'Conexiones directas', desc: 'Solicita y acepta conexiones en tu red ejecutiva.' },
      { label: 'Comunidades temáticas', desc: 'Grupos por industria, función o interés.' },
      { label: 'Convocatorias', desc: 'Oportunidades, eventos y proyectos del programa.' },
    ];
    return (
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-7 py-10 text-center sm:py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem]" style={{ background: 'linear-gradient(135deg, #e8f0ff 0%, #e4eeff 100%)' }}>
            <Users size={22} style={{ color: '#3f5fa8' }} />
          </div>
          <h1 className="mt-5 text-[1.6rem] font-black leading-tight text-[var(--app-ink)] sm:text-[1.9rem]">Tu comunidad de líderes<br />está aquí adentro.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">Networking es el espacio de conexión, colaboración y expansión del programa 4Shine. Se activa junto con tu suscripción.</p>
          <a href="https://www.4shine.co/planes-precios" target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">
            Activar programa · $3,000 USD
          </a>
        </section>
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Qué incluye Networking</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">Conecta, colabora y expande tu influencia.</h2>
          <div className="mt-4 space-y-2 opacity-60">
            {NETWORK_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3.5 rounded-[1rem] bg-[var(--app-surface-muted)] px-4 py-3">
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
        <AccessOfferPanel badge="Acceso bloqueado" title="Desbloquea Networking con el programa 4Shine."
          description="Networking forma parte de la experiencia completa del programa."
          products={programOffers} primaryAction={{ href: '/dashboard', label: 'Ver plan 4Shine' }}
          note="Mientras tu cuenta siga en modo free, este módulo no estará disponible." />
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="app-panel h-14 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          <div className="space-y-3"><div className="app-panel h-52 animate-pulse" /></div>
          <div className="space-y-3"><div className="app-panel h-24 animate-pulse" /><div className="app-panel h-64 animate-pulse" /></div>
          <div className="app-panel h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Mensajes redirect ────────────────────────────────────────────────────────
  if (activeTab === 'mensajes') {
    return (
      <div className="space-y-4">
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={myPending} />
        <div className="app-panel flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #4f2360, #7c3aed)' }}>
            <MessageSquare size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--app-ink)]">Módulo de Mensajes</h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">Tus conversaciones directas con líderes de tu red están en Mensajes.</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard/mensajes')}
            className="flex items-center gap-2 rounded-full bg-[#4f2360] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3b1649]">
            Ir a Mensajes<ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Left sidebar ─────────────────────────────────────────────────────────────
  const leftSidebar = (
    <aside className="space-y-4">
      <section className="app-panel overflow-hidden p-0">
        <div className="h-16 bg-gradient-to-r from-[#2c136e] via-[#45208f] to-[#25124f]" />
        <div className="-mt-7 px-4 pb-4">
          <div className="h-14 w-14 rounded-2xl border-4 border-white overflow-hidden">
            {currentUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatarUrl} alt={currentUser.name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-black text-white"
                style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}>
                {(currentUser?.name?.[0] ?? 'U').toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="mt-2 text-base font-bold text-[var(--app-ink)] leading-tight">{currentUser?.name ?? 'Usuario'}</h3>
          <p className="text-xs text-[var(--app-muted)]">{currentUser?.profession ?? 'Perfil profesional'}</p>
          {currentUser?.location && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--app-muted)]"><MapPin size={10} />{currentUser.location}</p>
          )}
        </div>
        <div className="grid grid-cols-2 border-t border-[var(--app-border)]">
          <button type="button" onClick={() => { setActiveTab('mi-red'); setNetworkSubTab('contactos'); }}
            className="px-4 py-3 text-left transition hover:bg-[var(--app-surface-muted)]">
            <p className="text-[11px] text-[var(--app-muted)]">Contactos</p>
            <p className="text-lg font-black text-[var(--app-ink)]">{myConnected}</p>
          </button>
          <button type="button" onClick={() => { setActiveTab('mi-red'); setNetworkSubTab('contactos'); }}
            className="border-l border-[var(--app-border)] px-4 py-3 text-left transition hover:bg-[var(--app-surface-muted)]">
            <p className="text-[11px] text-[var(--app-muted)]">Pendientes</p>
            <p className={`text-lg font-black ${myPending > 0 ? 'text-[#4f2360]' : 'text-[var(--app-ink)]'}`}>{myPending}</p>
          </button>
        </div>
      </section>

      <section className="app-panel p-4">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">Accesos rápidos</p>
        <nav className="space-y-1">
          {([
            { label: 'Inicio', tab: 'inicio' as MainTab, sub: undefined },
            { label: 'Mis contactos', tab: 'mi-red' as MainTab, sub: 'contactos' as NetworkSubTab },
            { label: 'Comunidades', tab: 'mi-red' as MainTab, sub: 'comunidades' as NetworkSubTab },
            { label: 'Descubre personas', tab: 'mi-red' as MainTab, sub: 'descubre' as NetworkSubTab },
            { label: 'Mensajes', tab: 'mensajes' as MainTab, sub: undefined },
          ]).map(({ label, tab, sub }) => (
            <button key={label} type="button" onClick={() => { setActiveTab(tab); if (sub) setNetworkSubTab(sub); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab && (!sub || networkSubTab === sub)
                  ? 'bg-[var(--app-surface-muted)] text-[#4f2360]'
                  : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]'
              }`}>
              {label}<ChevronRight size={14} className="opacity-40" />
            </button>
          ))}
        </nav>
      </section>
    </aside>
  );

  // ── INICIO tab ───────────────────────────────────────────────────────────────
  if (activeTab === 'inicio') {
    return (
      <div className="space-y-4">
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={myPending} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          {leftSidebar}

          <main className="space-y-4">
            <PostComposer communities={communities} postForm={postForm}
              onFormChange={(updates) => setPostForm((prev) => ({ ...prev, ...updates }))}
              onSubmit={onCreatePost} canCreate={canCreate}
              currentUserName={currentUser?.name ?? 'U'}
              currentUserAvatarUrl={currentUser?.avatarUrl} />

            <section className="space-y-3">
              {communityPosts.length === 0 ? (
                <EmptyState message="Aún no hay publicaciones. Sé el primero en compartir algo con tu comunidad." />
              ) : (
                communityPosts.map((post) => (
                  <PostCard key={post.postId} post={post}
                    currentUserId={myCurrentUserId}
                    currentUserName={currentUser?.name ?? 'U'}
                    currentUserAvatarUrl={currentUser?.avatarUrl}
                    onToggleReaction={onToggleReaction} />
                ))
              )}
            </section>
          </main>

          <aside className="space-y-4">
            <section className="app-panel p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--app-ink)]">Personas que quizás conozcas</h3>
              {people.filter((p) => p.connectionStatus === 'none' && !p.isFollowing).length === 0 ? (
                <p className="text-xs text-[var(--app-muted)]">No hay sugerencias en este momento.</p>
              ) : (
                <div className="space-y-2">
                  {people.filter((p) => p.connectionStatus === 'none' && !p.isFollowing).slice(0, 5).map((person) => (
                    <PersonCard key={person.userId} person={person} compact
                      onFollow={() => void onToggleFollow(person)}
                      onContact={() => void onContact(person)}
                      onMessage={() => void onMessage(person)}
                      onViewProfile={() => onViewConnectedProfile(person.userId)} />
                  ))}
                </div>
              )}
              <button type="button" onClick={() => { setActiveTab('mi-red'); setNetworkSubTab('descubre'); }}
                className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-bold text-[#4f2360] transition hover:underline">
                Ver más sugerencias<ChevronRight size={13} />
              </button>
            </section>

            {communities.filter((c) => !c.isGeneral).length > 0 && (
              <section className="app-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--app-ink)]">Comunidades</h3>
                  <button type="button" onClick={() => { setActiveTab('mi-red'); setNetworkSubTab('comunidades'); }}
                    className="text-xs font-bold text-[#4f2360] hover:underline">
                    Ver todas
                  </button>
                </div>
                <div className="space-y-2">
                  {communities.filter((c) => !c.isGeneral).slice(0, 4).map((community) => (
                    <div key={community.groupId} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #4f2360, #7c3aed)' }}>
                        {(community.name[0] ?? 'C').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--app-ink)]">{community.name}</p>
                        <p className="text-[11px] text-[var(--app-muted)]">{community.memberCount} miembros</p>
                      </div>
                      {!community.isMember && !community.isGeneral && (
                        <button type="button" onClick={() => void onToggleMembership(community)}
                          className="shrink-0 rounded-full border border-[#4f2360] px-2.5 py-0.5 text-[11px] font-bold text-[#4f2360] hover:bg-[#4f2360] hover:text-white">
                          +
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ── MI RED tab ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={myPending} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {leftSidebar}

        <main className="space-y-4">
          <NetworkSubNav activeSubTab={networkSubTab} onSubTabChange={setNetworkSubTab} pendingCount={myPending} />

          {/* Contactos */}
          {networkSubTab === 'contactos' && (
            <div className="space-y-4">
              {pendingInbound.length > 0 && (
                <section className="app-panel p-4">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#4f2360]">Invitaciones recibidas · {pendingInbound.length}</p>
                  <div className="space-y-3">
                    {pendingInbound.map((c) => (
                      <ConnectionCard key={c.connectionId} connection={c} isInbound
                        onAccept={() => void onUpdateStatus(c, 'connected')}
                        onReject={() => void onUpdateStatus(c, 'rejected')}
                        onDelete={() => void onDeleteConnection(c)}
                        onViewProfile={() => onViewConnectedProfile(c.counterpartUserId)} />
                    ))}
                  </div>
                </section>
              )}
              {pendingOutbound.length > 0 && (
                <section className="app-panel p-4">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">Invitaciones enviadas · {pendingOutbound.length}</p>
                  <div className="space-y-3">
                    {pendingOutbound.map((c) => (
                      <ConnectionCard key={c.connectionId} connection={c} isInbound={false}
                        onAccept={() => void onUpdateStatus(c, 'connected')}
                        onReject={() => void onUpdateStatus(c, 'rejected')}
                        onDelete={() => void onDeleteConnection(c)}
                        onViewProfile={() => onViewConnectedProfile(c.counterpartUserId)} />
                    ))}
                  </div>
                </section>
              )}
              <section className="app-panel p-4">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">Mis contactos · {myConnected}</p>
                {connectedContacts.length === 0 ? (
                  <EmptyState message="Aún no tienes contactos conectados. Explora la sección Descubre." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {connectedContacts.map((c) => (
                      <ConnectionCard key={c.connectionId} connection={c} isInbound={false}
                        onAccept={() => void onUpdateStatus(c, 'connected')}
                        onReject={() => void onUpdateStatus(c, 'rejected')}
                        onDelete={() => void onDeleteConnection(c)}
                        onViewProfile={() => onViewConnectedProfile(c.counterpartUserId)} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Comunidades */}
          {networkSubTab === 'comunidades' && (
            <div className="space-y-4">
              {communities.length === 0 ? (
                <EmptyState message="No hay comunidades disponibles todavía." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {communities.map((community) => (
                    <CommunityCard key={community.groupId} community={community}
                      onToggleMembership={() => void onToggleMembership(community)}
                      canManage={canManageCommunities}
                      onToggleStatus={() => void onToggleCommunityStatus(community)}
                      onDelete={() => void onDeleteCommunity(community)}
                      onSave={onSaveCommunity} />
                  ))}
                </div>
              )}

              {canManageCommunities && (
                <section className="app-panel p-5">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">Nueva comunidad</p>
                  <form className="space-y-3" onSubmit={onCreateCommunity}>
                    <input className="app-input" placeholder="Nombre de la comunidad" value={communityForm.name}
                      onChange={(e) => setCommunityForm((p) => ({ ...p, name: e.target.value }))} required />
                    <input className="app-input" placeholder="Categoría (ej. Liderazgo, Innovación…)" value={communityForm.category}
                      onChange={(e) => setCommunityForm((p) => ({ ...p, category: e.target.value }))} />
                    <select className="app-select" value={communityForm.visibility}
                      onChange={(e) => setCommunityForm((p) => ({ ...p, visibility: e.target.value as CommunityVisibility }))}>
                      <option value="open">Abierta</option>
                      <option value="closed">Cerrada</option>
                    </select>
                    <textarea className="app-textarea min-h-20" placeholder="Descripción de la comunidad…" value={communityForm.description}
                      onChange={(e) => setCommunityForm((p) => ({ ...p, description: e.target.value }))} />
                    <button type="submit" className="w-full rounded-full bg-[#4f2360] py-2.5 text-sm font-bold text-white transition hover:bg-[#3b1649]">
                      Crear comunidad
                    </button>
                  </form>
                </section>
              )}
            </div>
          )}

          {/* Descubre */}
          {networkSubTab === 'descubre' && (
            <div className="space-y-4">
              <div className="app-panel p-3">
                <input className="app-input" placeholder="Busca por nombre, industria o ciudad..."
                  value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {filteredPeople.length === 0 ? (
                <EmptyState message="No se encontraron personas con ese criterio." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPeople.map((person) => (
                    <PersonCard key={person.userId} person={person}
                      onFollow={() => void onToggleFollow(person)}
                      onContact={() => void onContact(person)}
                      onMessage={() => void onMessage(person)}
                      onViewProfile={() => onViewConnectedProfile(person.userId)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
