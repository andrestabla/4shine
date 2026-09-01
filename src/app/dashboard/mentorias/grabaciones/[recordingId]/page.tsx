'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageCircle, Send } from 'lucide-react';
import {
  commentGroupSessionRecording,
  getGroupSessionRecording,
  reactToGroupSessionRecording,
  type GroupSessionReaction,
  type GroupSessionRecordingRecord,
} from '@/features/mentorias/client';

/** Las mismas reacciones de la tarjeta, para no cambiar el lenguaje visual. */
const REACTIONS: Array<{ key: GroupSessionReaction; emoji: string; label: string }> = [
  { key: 'like', emoji: '👍', label: 'Me gusta' },
  { key: 'celebrate', emoji: '🎉', label: 'Celebrar' },
  { key: 'insightful', emoji: '💡', label: 'Revelador' },
  { key: 'love', emoji: '❤️', label: 'Me encanta' },
];

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GrabacionPage() {
  const params = useParams<{ recordingId: string }>();
  const recordingId = params?.recordingId ?? '';

  const [recording, setRecording] = React.useState<GroupSessionRecordingRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!recordingId) return;
    void (async () => {
      try {
        const data = await getGroupSessionRecording(recordingId);
        if (active) setRecording(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la grabación.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [recordingId]);

  const handleReaction = async (reaction: GroupSessionReaction) => {
    if (!recording) return;
    try {
      setRecording(await reactToGroupSessionRecording(recording.recordingId, reaction));
    } catch {
      /* la reacción no es crítica: si falla, la vista sigue usable */
    }
  };

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recording || !comment.trim()) return;
    setSending(true);
    try {
      setRecording(await commentGroupSessionRecording(recording.recordingId, comment.trim()));
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el comentario.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-[var(--brand-primary)]" />
          <p className="mt-3 text-sm text-[var(--app-muted)]">Cargando grabación…</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm font-bold text-[var(--app-ink)]">No se pudo abrir la grabación</p>
        <p className="mt-1 text-[13px] text-[var(--app-muted)]">
          {error ?? 'La grabación no existe o ya no está disponible.'}
        </p>
        <Link
          href="/dashboard/mentorias"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-ink)]"
        >
          <ArrowLeft size={14} /> Volver a Mentorías
        </Link>
      </div>
    );
  }

  const reactionTotals = (recording.reactionTotals ?? {}) as Partial<Record<GroupSessionReaction, number>>;
  const totalReactions = Object.values(reactionTotals).reduce(
    (sum, value) => sum + Number(value ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* 80% reproductor · 20% interacción. En móvil se apilan. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-[18px] border border-[var(--app-border)] bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={recording.recordingUrl}
              poster={recording.thumbnailUrl ?? recording.bannerImageUrl ?? undefined}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(event) => event.preventDefault()}
              className="aspect-video w-full bg-black"
            />
          </div>

          <div className="app-panel p-4 sm:p-5">
            <h1 className="text-lg font-extrabold leading-snug text-[var(--app-ink)]">
              {recording.title}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--app-muted)]">
              {recording.eventTitle}
              {recording.hostName ? ` · ${recording.hostName}` : ''}
              {recording.recordedAt ? ` · ${formatDate(recording.recordedAt)}` : ''}
              {recording.durationMinutes > 0 ? ` · ${recording.durationMinutes} min` : ''}
            </p>
            {recording.description && (
              <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--app-ink)]">
                {recording.description}
              </p>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <div className="app-panel p-4">
            <p className="app-section-kicker">Reacciones</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {REACTIONS.map((item) => {
                const count = Number(reactionTotals[item.key] ?? 0);
                const mine = recording.myReaction === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    title={item.label}
                    onClick={() => handleReaction(item.key)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      mine
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                        : 'border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
                    }`}
                  >
                    <span>{item.emoji}</span> {count}
                  </button>
                );
              })}
            </div>
            {totalReactions === 0 && (
              <p className="mt-2 text-[11.5px] text-[var(--app-muted)]">Sé el primero en reaccionar.</p>
            )}
          </div>

          <div className="app-panel p-4">
            <p className="app-section-kicker flex items-center gap-1.5">
              <MessageCircle size={13} /> Comentarios ({recording.comments?.length ?? 0})
            </p>

            <form onSubmit={handleComment} className="mt-2.5 space-y-2">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Comparte lo que te llevas de esta sesión…"
                rows={3}
                maxLength={1000}
                className="w-full rounded-[0.8rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)] outline-none focus:border-[var(--brand-accent)]"
              />
              <button
                type="submit"
                disabled={sending || !comment.trim()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Send size={12} /> Comentar
              </button>
            </form>

            <div className="mt-3 space-y-2.5">
              {(recording.comments ?? []).length === 0 ? (
                <p className="text-[11.5px] text-[var(--app-muted)]">Aún no hay comentarios.</p>
              ) : (
                recording.comments.map((item) => (
                  <div
                    key={item.commentId}
                    className="rounded-[0.8rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-2.5"
                  >
                    <p className="text-[12px] font-bold text-[var(--app-ink)]">{item.authorName}</p>
                    <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--app-ink)]">
                      {item.commentText}
                    </p>
                    <p className="mt-1 text-[10.5px] text-[var(--app-muted)]">{formatDate(item.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
