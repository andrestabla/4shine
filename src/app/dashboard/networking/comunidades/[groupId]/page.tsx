'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Link2,
  ThumbsUp,
  MessageSquare,
  Send,
  Shield,
  Crown,
  User,
  ChevronRight,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  getCommunity,
  listCommunityPostsForGroup,
  listCommunityMembers,
  updateMemberRole,
  createCommunityPost,
  joinCommunity,
  leaveCommunity,
  toggleReaction,
  listComments,
  createComment,
  type CommunityRecord,
  type CommunityMemberRecord,
  type CommunityPostRecord,
  type CommentRecord,
} from '@/features/networking/client';
import { formatDayMonth } from '@/lib/format-date';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-11 w-11 text-base';
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`${sz} shrink-0 rounded-2xl object-cover`} />;
  }
  return (
    <div
      className={`${sz} shrink-0 rounded-2xl flex items-center justify-center font-black text-white`}
      style={{ background: 'linear-gradient(135deg, #4f2360 0%, #7c3aed 100%)' }}
    >
      {(name[0] ?? 'U').toUpperCase()}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return formatDayMonth(value);
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
  } catch {
    return null;
  }
  return null;
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
}

// ─── Role badge ────────────────────────────────────────────────────────────────

type MembershipRole = 'owner' | 'moderator' | 'member';

function RoleBadge({ role }: { role: MembershipRole }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <Crown size={10} />Propietario
      </span>
    );
  }
  if (role === 'moderator') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        <Shield size={10} />Gestor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--app-muted)]">
      <User size={10} />Miembro
    </span>
  );
}

// ─── URL Preview ──────────────────────────────────────────────────────────────

interface UrlPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
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

// ─── CommentBody ──────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

function CommentBody({ body }: { body: string }) {
  const parts: { type: 'text' | 'url'; value: string }[] = [];
  let last = 0;
  for (const m of body.matchAll(URL_REGEX)) {
    if ((m.index ?? 0) > last) parts.push({ type: 'text', value: body.slice(last, m.index) });
    parts.push({ type: 'url', value: m[0] });
    last = (m.index ?? 0) + m[0].length;
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

// ─── PostCard ─────────────────────────────────────────────────────────────────

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
              <span className="text-[11px] text-[var(--app-muted)]">{toRelativeTime(post.createdAt)}</span>
              {post.isPinned && (
                <span className="rounded-full bg-[#4f2360]/10 px-2 py-0.5 text-[10px] font-bold text-[#4f2360]">Fijado</span>
              )}
            </div>
          </div>
        </div>
        <h4 className="mt-3 text-base font-bold text-[var(--app-ink)] leading-snug">{post.title}</h4>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">{post.body}</p>
      </div>

      {post.resourceUrl && (
        <div className="border-t border-[var(--app-border)] px-4 pb-4 pt-3">
          {directVideo ? (
            <video className="w-full rounded-xl border border-[var(--app-border)]" controls preload="metadata">
              <source src={directVideo} />
            </video>
          ) : embeddedVideo ? (
            <div className="overflow-hidden rounded-xl border border-[var(--app-border)]">
              <iframe
                title={`video-${post.postId}`}
                src={embeddedVideo}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
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
        <button
          type="button"
          onClick={() => onToggleReaction(post.postId)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            post.hasReacted ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <ThumbsUp size={13} className={post.hasReacted ? 'fill-[#4f2360]' : ''} />
          Recomendar{post.reactionCount > 0 ? ` · ${post.reactionCount}` : ''}
        </button>
        <button
          type="button"
          onClick={() => void handleToggleComments()}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            showComments ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <MessageSquare size={13} />
          Comentar{post.commentCount > 0 ? ` · ${post.commentCount}` : ''}
        </button>
      </div>

      {/* Comments */}
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
          <form className="flex items-center gap-2" onSubmit={(e) => void handleSubmitComment(e)}>
            <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
            <input
              className="flex-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs text-[var(--app-ink)] placeholder:text-[var(--app-muted)] focus:outline-none focus:border-[var(--app-border-strong)]"
              placeholder="Agrega un comentario..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting || !commentInput.trim()}
              className="shrink-0 rounded-full bg-[#4f2360] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#3b1649] disabled:opacity-40"
            >
              <Send size={11} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

// ─── PostComposer (community-scoped) ─────────────────────────────────────────

function PostComposer({
  groupId,
  canCreate,
  currentUserName,
  currentUserAvatarUrl,
  onPostCreated,
}: {
  groupId: string;
  canCreate: boolean;
  currentUserName: string;
  currentUserAvatarUrl?: string | null;
  onPostCreated: (post: CommunityPostRecord) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', body: '', resourceUrl: '' });
  const [submitting, setSubmitting] = React.useState(false);
  const { alert } = useAppDialog();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const post = await createCommunityPost(groupId, {
        title: form.title.trim(),
        body: form.body.trim(),
        resourceUrl: form.resourceUrl.trim() || null,
      });
      setForm({ title: '', body: '', resourceUrl: '' });
      setOpen(false);
      onPostCreated(post);
    } catch (error) {
      await alert({ title: 'Error', message: error instanceof Error ? error.message : 'No se pudo publicar.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <section className="app-panel p-4">
      {!open ? (
        <div className="flex items-center gap-3">
          <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-[var(--app-border)] px-4 py-2.5 text-left text-sm text-[var(--app-muted)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
          >
            Comparte algo con esta comunidad...
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex items-center gap-3">
            <Avatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="sm" />
            <p className="text-sm font-bold text-[var(--app-ink)]">{currentUserName}</p>
          </div>
          <input
            className="app-input text-sm"
            placeholder="Título del aporte"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
            autoFocus
          />
          <textarea
            className="app-textarea min-h-28 text-sm"
            placeholder="Comparte una idea, aprendizaje o recurso con tu comunidad…"
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            required
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-3">
            <input
              className="app-input flex-1 py-1.5 text-xs"
              placeholder="Pega una URL (imagen, video, enlace)…"
              value={form.resourceUrl}
              onChange={(e) => setForm((p) => ({ ...p, resourceUrl: e.target.value }))}
            />
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--app-border)] px-4 py-1.5 text-xs font-bold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !form.title.trim() || !form.body.trim()}
                className="rounded-full bg-[#4f2360] px-5 py-1.5 text-xs font-bold text-white transition hover:bg-[#3b1649] disabled:opacity-40"
              >
                {submitting ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

// ─── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  canChangeRole,
  onRoleChange,
}: {
  member: CommunityMemberRecord;
  canChangeRole: boolean;
  onRoleChange: (userId: string, role: 'moderator' | 'member') => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3">
      <Avatar name={member.displayName} avatarUrl={member.avatarUrl} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--app-ink)]">{member.displayName}</p>
        <p className="truncate text-[11px] text-[var(--app-muted)]">
          {member.profession ?? member.primaryRole}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <RoleBadge role={member.membershipRole} />
        {canChangeRole && member.membershipRole !== 'owner' && (
          <select
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--app-ink)] focus:outline-none"
            value={member.membershipRole}
            onChange={(e) => onRoleChange(member.userId, e.target.value as 'moderator' | 'member')}
          >
            <option value="member">Miembro</option>
            <option value="moderator">Gestor</option>
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = typeof params.groupId === 'string' ? params.groupId : (params.groupId?.[0] ?? '');
  const { can, currentUser } = useUser();
  const { alert, confirm } = useAppDialog();

  const [community, setCommunity] = React.useState<CommunityRecord | null>(null);
  const [posts, setPosts] = React.useState<CommunityPostRecord[]>([]);
  const [members, setMembers] = React.useState<CommunityMemberRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'publicaciones' | 'miembros'>('publicaciones');
  const [membershipBusy, setMembershipBusy] = React.useState(false);

  const canManage = can('networking', 'manage');
  const canCreate = can('networking', 'create');
  const myUserId = currentUser?.id ?? '';
  const myName = currentUser?.name ?? 'U';
  const myAvatarUrl = currentUser?.avatarUrl ?? null;

  const isMember = community?.isMember ?? false;
  const myRole = community?.membershipRole ?? null;
  const isOwner = myRole === 'owner';
  const canSeeMembers = isMember || canManage;
  const canPost = Boolean((isMember || community?.isGeneral) && canCreate);
  const canChangeRoles = isOwner || canManage;

  const load = React.useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const comm = await getCommunity(groupId);
      setCommunity(comm);

      const postsPromise = listCommunityPostsForGroup(groupId);
      const membersPromise = (comm.isMember || canManage) ? listCommunityMembers(groupId) : Promise.resolve([]);

      const [postsData, membersData] = await Promise.all([postsPromise, membersPromise]);
      setPosts(postsData);
      setMembers(membersData);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.toLowerCase().includes('no encontrada') || msg.toLowerCase().includes('acceso')) {
        setNotFound(true);
      } else {
        await alert({ title: 'Error', message: msg || 'No se pudo cargar la comunidad.', tone: 'error' });
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, canManage, alert]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Reload members when tab changes to members (in case not loaded yet)
  React.useEffect(() => {
    if (activeTab === 'miembros' && members.length === 0 && canSeeMembers && !loading && community) {
      void listCommunityMembers(groupId).then(setMembers).catch(() => undefined);
    }
  }, [activeTab, members.length, canSeeMembers, loading, community, groupId]);

  const handleToggleMembership = async () => {
    if (!community) return;
    setMembershipBusy(true);
    try {
      if (community.isMember) {
        const ok = await confirm({
          title: 'Salir de la comunidad',
          message: `¿Quieres salir de "${community.name}"?`,
          tone: 'warning',
          confirmText: 'Salir',
          cancelText: 'Cancelar',
        });
        if (!ok) { setMembershipBusy(false); return; }
        await leaveCommunity(community.groupId);
      } else {
        await joinCommunity(community.groupId);
      }
      await load();
    } catch (error) {
      await alert({ title: 'Error', message: error instanceof Error ? error.message : 'No se pudo actualizar la membresía.', tone: 'error' });
    } finally {
      setMembershipBusy(false);
    }
  };

  const handleToggleReaction = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, hasReacted: !p.hasReacted, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1 }
          : p,
      ),
    );
    void toggleReaction(postId).catch(async () => {
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? { ...p, hasReacted: !p.hasReacted, reactionCount: p.hasReacted ? p.reactionCount - 1 : p.reactionCount + 1 }
            : p,
        ),
      );
      await alert({ title: 'Error', message: 'No se pudo registrar la recomendación.', tone: 'error' });
    });
  };

  const handleRoleChange = async (userId: string, role: 'moderator' | 'member') => {
    try {
      const updated = await updateMemberRole(groupId, userId, role);
      setMembers((prev) => prev.map((m) => (m.userId === updated.userId ? updated : m)));
    } catch (error) {
      await alert({ title: 'Error', message: error instanceof Error ? error.message : 'No se pudo cambiar el rol.', tone: 'error' });
    }
  };

  const handlePostCreated = (post: CommunityPostRecord) => {
    setPosts((prev) => [post, ...prev]);
  };

  const backUrl = '/dashboard/networking?tab=mi-red&sub=comunidades';

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="app-panel h-14 animate-pulse" />
        <div className="app-panel h-48 animate-pulse" />
        <div className="app-panel h-64 animate-pulse" />
      </div>
    );
  }

  // ── Not found / access denied ────────────────────────────────────────────────
  if (notFound || !community) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-2 text-sm font-bold text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
        >
          <ArrowLeft size={16} />Volver a Comunidades
        </button>
        <div className="app-panel flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-surface-muted)]">
            <Lock size={22} className="text-[var(--app-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--app-ink)]">Comunidad no disponible</h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">Esta comunidad no existe o no tienes acceso.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="flex items-center gap-2 rounded-full bg-[#4f2360] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3b1649]"
          >
            Ver comunidades<ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push(backUrl)}
        className="flex items-center gap-2 text-sm font-bold text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
      >
        <ArrowLeft size={16} />Comunidades
      </button>

      {/* Community header */}
      <div className="app-panel overflow-hidden p-0">
        {community.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={community.coverImageUrl} alt={community.name} className="h-40 w-full object-cover sm:h-52" />
        )}
        {!community.coverImageUrl && (
          <div className="h-28 bg-gradient-to-r from-[#2c136e] via-[#45208f] to-[#25124f]" />
        )}

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-[var(--app-ink)] leading-tight">{community.name}</h1>
                {community.isGeneral && (
                  <span className="rounded-full bg-[#4f2360]/10 px-2 py-0.5 text-[10px] font-bold text-[#4f2360]">General</span>
                )}
                {!community.isActive && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Cerrada</span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {community.category && (
                  <span className="inline-flex items-center rounded-full border border-[var(--app-chip-border)] bg-[var(--app-chip)] px-2.5 py-0.5 text-[11px] font-semibold text-[#4f2360]">
                    {community.category}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                  <Users size={11} />{community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                  {community.visibility === 'open' ? <Globe size={11} /> : <Lock size={11} />}
                  {community.visibility === 'open' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              {community.description && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{community.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {myRole && <RoleBadge role={myRole} />}
              {!community.isGeneral && myRole !== 'owner' && (
                <button
                  type="button"
                  onClick={() => void handleToggleMembership()}
                  disabled={membershipBusy}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                    isMember
                      ? 'border border-[var(--app-border)] text-[var(--app-muted)] hover:border-red-200 hover:text-red-600'
                      : 'bg-[#4f2360] text-white hover:bg-[#3b1649]'
                  }`}
                >
                  {membershipBusy ? '...' : isMember ? 'Salir' : '+ Unirme'}
                </button>
              )}
            </div>
          </div>

          {/* External links */}
          {community.links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {community.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[#4f2360] transition hover:bg-white"
                >
                  <ExternalLink size={11} />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-[var(--app-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('publicaciones')}
            className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'publicaciones' ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            <MessageSquare size={15} />
            Publicaciones
            {activeTab === 'publicaciones' && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#4f2360]" />
            )}
          </button>
          {canSeeMembers && (
            <button
              type="button"
              onClick={() => setActiveTab('miembros')}
              className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'miembros' ? 'text-[#4f2360]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
              }`}
            >
              <Users size={15} />
              Miembros{members.length > 0 ? ` · ${members.length}` : ''}
              {activeTab === 'miembros' && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-[#4f2360]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Publicaciones tab */}
      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          <PostComposer
            groupId={groupId}
            canCreate={canPost}
            currentUserName={myName}
            currentUserAvatarUrl={myAvatarUrl}
            onPostCreated={handlePostCreated}
          />
          {posts.length === 0 ? (
            <div className="app-panel flex flex-col items-center gap-3 py-14 text-center">
              <MessageSquare size={28} className="text-[var(--app-muted)]" />
              <div>
                <p className="text-sm font-bold text-[var(--app-ink)]">Aún no hay publicaciones</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {canPost ? 'Sé el primero en compartir algo con esta comunidad.' : 'Únete para ver y publicar en esta comunidad.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  currentUserId={myUserId}
                  currentUserName={myName}
                  currentUserAvatarUrl={myAvatarUrl}
                  onToggleReaction={handleToggleReaction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Miembros tab */}
      {activeTab === 'miembros' && canSeeMembers && (
        <div className="app-panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">
              Miembros · {members.length}
            </p>
            {canChangeRoles && (
              <span className="text-[10px] text-[var(--app-muted)]">
                Cambia el rol con el selector
              </span>
            )}
          </div>
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--app-muted)]">No hay miembros para mostrar.</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  canChangeRole={canChangeRoles}
                  onRoleChange={(uid, role) => void handleRoleChange(uid, role)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
