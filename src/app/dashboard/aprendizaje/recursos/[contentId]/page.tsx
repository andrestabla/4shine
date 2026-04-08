"use client";

import Link from "next/link";
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { useUser } from "@/context/UserContext";
import {
  createLearningComment,
  getLearningResourceDetail,
  toggleLearningCommentReaction,
  toggleLearningLike,
  type LearningResourceRecord,
} from "@/features/aprendizaje/client";
import type { LearningCommentReactionType } from "@/features/aprendizaje/comment-reactions";
import { getObservableBehaviors } from "@/features/aprendizaje/competency-map";
import { buildYouTubeEmbedUrl, isDirectAudioUrl } from "@/features/aprendizaje/media";
import {
  formatLearningDate,
  formatLearningDateTime,
  learningContentTypeLabel,
  learningPillarLabel,
  learningRoleLabel,
  learningStatusClasses,
  learningStatusLabel,
} from "@/features/aprendizaje/presentation";
import { deleteContent } from "@/features/content/client";

function courseModuleResourceTypeLabel(type: string): string {
  if (type === "pdf") return "PDF";
  if (type === "ppt") return "PPT";
  if (type === "html") return "HTML";
  if (type === "podcast") return "Pódcast";
  if (type === "article") return "Artículo";
  if (type === "video") return "Video";
  return "Enlace";
}

export default function LearningResourceDetailPage() {
  const params = useParams<{ contentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentRole } = useUser();
  const { alert, confirm } = useAppDialog();

  const contentId =
    typeof params?.contentId === "string" ? params.contentId : "";
  const canManage = currentRole === "gestor" || currentRole === "admin";
  const requestedTab = searchParams.get("tab");

  const [resource, setResource] = React.useState<LearningResourceRecord | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [togglingLike, setTogglingLike] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [togglingCommentReaction, setTogglingCommentReaction] =
    React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [showSocial, setShowSocial] = React.useState(false);

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: "Error",
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: "error",
      });
    },
    [alert],
  );

  const loadResource = React.useCallback(async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const data = await getLearningResourceDetail(contentId);
      setResource(data);
    } catch (error) {
      await showError("No se pudo cargar el recurso", error);
      setResource(null);
    } finally {
      setLoading(false);
    }
  }, [contentId, showError]);

  React.useEffect(() => {
    void loadResource();
  }, [loadResource]);

  const observableBehaviors = React.useMemo(
    () =>
      getObservableBehaviors(
        resource?.competencyMetadata.pillar ?? null,
        resource?.competencyMetadata.component ?? null,
        resource?.competencyMetadata.competency ?? null,
      ),
    [resource],
  );

  const youtubeEmbedUrl = React.useMemo(
    () => buildYouTubeEmbedUrl(resource?.url),
    [resource?.url],
  );

  const onToggleLike = React.useCallback(async () => {
    if (!resource || togglingLike) return;

    setTogglingLike(true);
    try {
      const result = await toggleLearningLike(resource.contentId);
      setResource((current) =>
        current
          ? { ...current, liked: result.liked, likes: result.likes }
          : current,
      );
    } catch (error) {
      await showError("No se pudo actualizar el me gusta", error);
    } finally {
      setTogglingLike(false);
    }
  }, [resource, showError, togglingLike]);

  const onSubmitComment = React.useCallback(async () => {
    if (!resource || submittingComment) return;

    const commentText = commentDraft.trim();
    if (!commentText) return;

    setSubmittingComment(true);
    try {
      const created = await createLearningComment({
        contentId: resource.contentId,
        commentText,
      });
      setResource((current) =>
        current
          ? {
              ...current,
              comments: [created, ...current.comments],
              commentCount: current.commentCount + 1,
            }
          : current,
      );
      setCommentDraft("");
    } catch (error) {
      await showError("No se pudo guardar el comentario", error);
    } finally {
      setSubmittingComment(false);
    }
  }, [commentDraft, resource, showError, submittingComment]);

  const onToggleCommentReaction = React.useCallback(
    async (commentId: string, reactionType: LearningCommentReactionType) => {
      if (!resource || togglingCommentReaction) return;

      const reactionKey = `${commentId}:${reactionType}`;
      setTogglingCommentReaction(reactionKey);
      try {
        const result = await toggleLearningCommentReaction(commentId, reactionType);
        setResource((current) =>
          current
            ? {
                ...current,
                comments: current.comments.map((comment) =>
                  comment.commentId === result.commentId
                    ? { ...comment, reactions: result.reactions }
                    : comment,
                ),
              }
            : current,
        );
      } catch (error) {
        await showError("No se pudo actualizar la reacción", error);
      } finally {
        setTogglingCommentReaction(null);
      }
    },
    [resource, showError, togglingCommentReaction],
  );

  const onDeleteResource = React.useCallback(async () => {
    if (!resource || !canManage || deleting) return;

    const accepted = await confirm({
      title: "Eliminar recurso",
      message: `¿Deseas eliminar "${resource.title}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "warning",
    });

    if (!accepted) return;

    setDeleting(true);
    try {
      await deleteContent(resource.contentId);
      const fallbackTab = resource.contentType === "scorm" ? "cursos" : "recursos";
      const nextTab =
        requestedTab === "cursos" || requestedTab === "recursos"
          ? requestedTab
          : fallbackTab;
      router.push(
        nextTab === "recursos"
          ? "/dashboard/aprendizaje"
          : `/dashboard/aprendizaje?tab=${nextTab}`,
      );
    } catch (error) {
      await showError("No se pudo eliminar el recurso", error);
      setDeleting(false);
    }
  }, [canManage, confirm, deleting, requestedTab, resource, router, showError]);

  if (loading) {
    return (
      <div className="app-panel flex items-center gap-3 p-6 text-sm text-[var(--app-muted)]">
        <Loader2 size={18} className="animate-spin" />
        Cargando recurso...
      </div>
    );
  }

  if (!resource) {
    return (
      <EmptyState message="No encontramos este recurso o no tienes acceso a visualizarlo." />
    );
  }

  const fallbackTab = resource.contentType === "scorm" ? "cursos" : "recursos";
  const backTab =
    requestedTab === "cursos" || requestedTab === "recursos"
      ? requestedTab
      : fallbackTab;
  const backHref =
    backTab === "recursos"
      ? "/dashboard/aprendizaje"
      : `/dashboard/aprendizaje?tab=${backTab}`;
  const editHref =
    backTab === "recursos"
      ? `/dashboard/aprendizaje?edit=${resource.contentId}`
      : `/dashboard/aprendizaje?tab=${backTab}&edit=${resource.contentId}`;

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#f8f4ff] md:flex-row">
      {/* SIDEBAR: Temario y Metadatos */}
      <aside className="flex h-full w-full shrink-0 flex-col border-r border-[var(--app-border)] bg-white md:w-80 lg:w-96">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-border)] p-4">
          <Link href={backHref} className="app-button-secondary !min-h-9 !px-3 !py-1 text-xs">
            <ArrowLeft size={14} />
            Salir
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)] line-clamp-1">
            {resource.contentType === "scorm" ? "Curso" : "Recurso"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6">
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-ink)]">
              {learningContentTypeLabel(resource.contentType)}
            </span>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-[var(--app-ink)]" data-display-font="true">
              {resource.title}
            </h1>
            <div className="mt-4 hidden lg:block">
              <p className="text-sm leading-relaxed text-[var(--app-muted)]">
                {resource.description ?? "Sin descripción disponible."}
              </p>
            </div>
            {resource.progressPercent > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--app-muted)]">
                  <span>Tu progreso</span>
                  <span className="text-emerald-600">{resource.progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, resource.progressPercent))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {resource.contentType === "scorm" && (resource.structurePayload.modules?.length ?? 0) > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Contenido del Curso
              </h3>
              <div className="space-y-3">
                {resource.structurePayload.modules?.map((module, moduleIndex) => (
                  <div key={module.id} className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--app-muted)]">
                      Módulo {moduleIndex + 1}
                    </p>
                    <h4 className="mt-1 text-sm font-bold text-[var(--app-ink)]">{module.title}</h4>
                    <div className="mt-3 space-y-2">
                      {module.resources.map((mRes, rIdx) => (
                        <div key={mRes.id} className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs shadow-sm">
                          <div className="flex items-center gap-2">
                            {resource.progressPercent > ((moduleIndex + rIdx * 0.5) * 30) ? (
                               <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                               </div>
                            ) : (
                               <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                 <span className="text-[10px] font-bold">{rIdx + 1}</span>
                               </div>
                            )}
                            <span className="font-medium text-[var(--app-ink)] line-clamp-1">{mRes.title}</span>
                          </div>
                          {mRes.durationLabel && (
                            <span className="shrink-0 text-[10px] text-[var(--app-muted)]">{mRes.durationLabel}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-[var(--app-border)] pt-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--app-muted)]">Información</h3>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-ink)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN PLAYER */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#f8f4ff_0%,#f0e9f9_100%)]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--app-border)] bg-white/60 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button type="button" className="app-button-secondary !min-h-9 !px-3 !py-1 text-xs" onClick={() => router.push(editHref)}>
                  <Pencil size={14} /> Editar
                </button>
                <button type="button" disabled={deleting} onClick={() => void onDeleteResource()} className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                  <Trash2 size={14} /> {deleting ? "..." : "Eliminar"}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button
                type="button"
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                  resource.liked
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                }`}
                onClick={() => void onToggleLike()}
                disabled={togglingLike}
              >
                <Heart size={16} className={resource.liked ? "fill-current" : undefined} />
                {resource.likes}
              </button>
             <button
               title="Ver Discusión"
               onClick={() => setShowSocial((prev) => !prev)}
               className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                 showSocial 
                   ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white" 
                   : "border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
               }`}
             >
               <MessageCircle size={16} />
               <span>Discusión ({resource.commentCount})</span>
             </button>
          </div>
        </header>

        <section className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
          <div className="w-full max-w-5xl md:h-full">
            {youtubeEmbedUrl ? (
              <div className="h-full w-full overflow-hidden rounded-[24px] bg-black shadow-[0_24px_54px_rgba(35,20,50,0.15)] ring-1 ring-white/10 md:aspect-video">
                <iframe
                  title={resource.title}
                  src={youtubeEmbedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : resource.contentType === "pdf" && resource.url ? (
              <div className="h-full w-full overflow-hidden rounded-[24px] bg-white shadow-[0_24px_54px_rgba(35,20,50,0.15)] ring-1 ring-[var(--app-border)]">
                <iframe
                  title={resource.title}
                  src={resource.url}
                  className="h-full w-full min-h-[60vh] md:min-h-full"
                />
              </div>
            ) : resource.contentType === "podcast" && isDirectAudioUrl(resource.url) ? (
              <div className="rounded-[32px] border border-[var(--app-border)] bg-white p-8 shadow-[0_24px_54px_rgba(35,20,50,0.08)]">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eef8ff_0%,#ddeffc_100%)]">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </div>
                <h2 className="mb-6 text-2xl font-bold text-[var(--app-ink)]">{resource.title}</h2>
                <audio controls className="w-full" src={resource.url ?? undefined}>
                  Tu navegador no soporta reproducción de audio.
                </audio>
              </div>
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center flex-col rounded-[32px] border border-[var(--app-border)] bg-white p-8 text-center shadow-[0_24px_54px_rgba(35,20,50,0.08)]">
                <div className="max-w-sm">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5f1ff_0%,#e7ddfb_100%)]">
                    <ExternalLink size={32} className="text-[#593475]" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[var(--app-ink)]">Recurso Externo</h3>
                  <p className="mb-6 text-sm leading-relaxed text-[var(--app-muted)]">
                    Este recurso se visualiza desde su enlace original. Ábrelo en una nueva pestaña para ver el contenido completo.
                  </p>
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noreferrer" className="app-button-primary w-full shadow-lg">
                      Abrir recurso ahora
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* SOCIAL DRAWER */}
      {showSocial && (
        <aside className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-[var(--app-border)] bg-white shadow-2xl sm:w-96 md:static animate-in slide-in-from-right duration-300">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--app-border)] p-4">
            <h3 className="font-bold text-[var(--app-ink)]">Discusión</h3>
            <button onClick={() => setShowSocial(false)} className="rounded-full bg-[var(--app-surface-muted)] p-2 text-[var(--app-ink)] hover:bg-[var(--app-border)]">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
                {resource.comments.length === 0 ? (
                  <p className="rounded-[18px] bg-[var(--app-surface-muted)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
                    Todavía no hay comentarios.<br/> ¡Sé el primero en compartir algo!
                  </p>
                ) : (
                  resource.comments.map((comment) => (
                    <article key={comment.commentId} className="rounded-[20px] bg-[var(--app-surface-muted)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[var(--app-ink)] shadow-sm">
                          {comment.authorAvatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[var(--app-ink)]">{comment.authorName}</p>
                          <p className="text-[10px] font-medium text-[var(--app-muted)]">
                            {formatLearningDateTime(comment.createdAt)}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--app-ink)]">{comment.commentText}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {comment.reactions.map((reaction) => {
                              const isBusy = togglingCommentReaction === `${comment.commentId}:${reaction.value}`;
                              return (
                                <button
                                  key={reaction.value}
                                  onClick={() => void onToggleCommentReaction(comment.commentId, reaction.value)}
                                  disabled={Boolean(togglingCommentReaction)}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                    reaction.reacted
                                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                                      : "border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  {reaction.count > 0 && <span>{isBusy ? "..." : reaction.count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
            </div>
          </div>
          <div className="shrink-0 border-t border-[var(--app-border)] bg-white p-4">
              <textarea
                className="h-20 w-full resize-none rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--brand-primary)] focus:bg-white"
                placeholder="Escribe un comentario..."
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
              <button
                type="button"
                className="app-button-primary mt-2 w-full !py-2"
                onClick={() => void onSubmitComment()}
                disabled={submittingComment || !commentDraft.trim()}
              >
                <Send size={14} />
                {submittingComment ? "Guardando..." : "Comentar"}
              </button>
          </div>
        </aside>
      )}
    </div>
  );
}
