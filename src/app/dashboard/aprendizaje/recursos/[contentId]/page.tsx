"use client";

import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { LearningResourceCard } from "@/components/aprendizaje/LearningResourceCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { useUser } from "@/context/UserContext";
import {
  createLearningComment,
  getLearningResourceDetail,
  listLearningResources,
  toggleLearningCommentReaction,
  toggleLearningLike,
  type LearningResourceRecord,
} from "@/features/aprendizaje/client";
import type { LearningCommentReactionType } from "@/features/aprendizaje/comment-reactions";
import { getObservableBehaviors } from "@/features/aprendizaje/competency-map";
import { buildYouTubeEmbedUrl, isDirectAudioUrl, isDirectVideoUrl } from "@/features/aprendizaje/media";
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
  const { currentUser, currentRole } = useUser();
  const { alert, confirm } = useAppDialog();

  const contentId = typeof params?.contentId === "string" ? params.contentId : "";
  const canManage = currentRole === "gestor" || currentRole === "admin";
  const requestedTab = searchParams.get("tab");

  const [resource, setResource] = React.useState<LearningResourceRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [togglingLike, setTogglingLike] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [togglingCommentReaction, setTogglingCommentReaction] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  
  const [activeTab, setActiveTab] = React.useState<"temario" | "discusion">("temario");
  const [activeResourceIndex, setActiveResourceIndex] = React.useState(-1);
  const [suggestedResources, setSuggestedResources] = React.useState<LearningResourceRecord[]>([]);

  const flatItems = React.useMemo(() => {
    if (resource?.contentType !== "scorm") return [];
    return resource.structurePayload?.modules?.flatMap((m, mIdx) => 
      (m.resources || []).map((r, rIdx) => ({
        ...r,
        moduleTitle: m.title,
        moduleIndex: mIdx,
      }))
    ) ?? [];
  }, [resource]);

  const totalItems = Math.max(1, flatItems.length);
  const currentItem = flatItems[activeResourceIndex];

  const handleNext = () => {
    if (activeResourceIndex < totalItems - 1) {
      setActiveResourceIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeResourceIndex > 0) {
      setActiveResourceIndex(prev => prev - 1);
    }
  };

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
      
      if (data.contentType !== "scorm") {
        try {
          const suggResult = await listLearningResources({ family: "resource" });
          setSuggestedResources(suggResult.items.filter(r => r.contentId !== contentId).slice(0, 4));
        } catch (e) {
          console.error(e);
        }
      }
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
              comments: [created, ...(current.comments || [])],
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
                comments: (current.comments || []).map((comment) =>
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
      const nextTab = requestedTab === "cursos" || requestedTab === "recursos" ? requestedTab : fallbackTab;
      router.push(nextTab === "recursos" ? "/dashboard/aprendizaje" : `/dashboard/aprendizaje?tab=${nextTab}`);
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
    return <EmptyState message="No encontramos este recurso o no tienes acceso a visualizarlo." />;
  }

  const fallbackTab = resource.contentType === "scorm" ? "cursos" : "recursos";
  const backTab = requestedTab === "cursos" || requestedTab === "recursos" ? requestedTab : fallbackTab;
  const backHref = backTab === "recursos" ? "/dashboard/aprendizaje" : `/dashboard/aprendizaje?tab=${backTab}`;
  const editHref = backTab === "recursos"
      ? `/dashboard/aprendizaje?edit=${resource.contentId}`
      : `/dashboard/aprendizaje?tab=${backTab}&edit=${resource.contentId}`;

  if (typeof document === "undefined") return null;

  // 1. IMMERSIVE PLAYER LAYOUT (SCORM)
  if (resource.contentType === "scorm") {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-black md:flex-row">
        {/* SIDEBAR: Temario y Discusión */}
        <aside className="flex h-full w-full shrink-0 flex-col bg-white md:w-80 lg:w-96">
          <div className="flex shrink-0 flex-col px-6 pt-8 pb-4">
            <h1 className="text-[17px] font-bold leading-tight text-[var(--app-ink)]" data-display-font="true">
              {resource.title}
            </h1>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-slate-300 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, resource.progressPercent))}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[var(--app-ink)]">{resource.progressPercent}%</span>
              </div>
              <button 
                onClick={() => void onToggleLike()}
                disabled={togglingLike}
                className={`ml-4 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition ${
                  resource.liked ? "text-rose-600 bg-rose-50" : "text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                }`}
              >
                <Heart size={14} className={resource.liked ? "fill-current" : undefined} />
                {resource.likes}
              </button>
            </div>
          </div>

          <div className="flex shrink-0 border-b border-[var(--app-border)] px-4">
            <button
              onClick={() => setActiveTab("temario")}
              className={`flex-1 border-b-2 px-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "temario" ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              }`}
            >
              Temario
            </button>
            <button
              onClick={() => setActiveTab("discusion")}
              className={`flex-1 border-b-2 px-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "discusion" ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              }`}
            >
              Discusión
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "temario" ? (
              <div className="p-4 space-y-2">
                {/* 0. Course Overview Entry */}
                <button
                  onClick={() => setActiveResourceIndex(-1)}
                  className={`w-full flex items-center gap-3 rounded-[12px] p-3 text-left transition ${
                    activeResourceIndex === -1 ? "border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]" : "border border-transparent hover:bg-[var(--app-surface-muted)]"
                  }`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    activeResourceIndex === -1 ? "bg-[var(--brand-primary)] text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    0
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-sm font-bold ${activeResourceIndex === -1 ? "text-[#e85d24]" : "text-[var(--app-ink)]"}`}>
                      Información del Curso
                    </p>
                  </div>
                </button>

                {flatItems.map((item, idx) => {
                  const isActive = idx === activeResourceIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveResourceIndex(idx)}
                      className={`w-full flex items-center gap-3 rounded-[12px] p-3 text-left transition ${
                        isActive ? "border border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]" : "border border-transparent hover:bg-[var(--app-surface-muted)]"
                      }`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isActive ? "bg-[var(--brand-primary)] text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-sm font-bold ${isActive ? "text-[#e85d24]" : "text-[var(--app-ink)]"}`}>
                          {item.title}
                        </p>
                        {item.durationLabel && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                            <Loader2 size={10} />
                            {item.durationLabel}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                  {(!resource.comments || resource.comments.length === 0) ? (
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
                              {(comment.reactions || []).map((reaction) => {
                                const isBusy = togglingCommentReaction === `${comment.commentId}:${reaction.value}`;
                                return (
                                  <button
                                    key={reaction.value}
                                    onClick={() => void onToggleCommentReaction(comment.commentId, reaction.value)}
                                    disabled={Boolean(togglingCommentReaction)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                      reaction.reacted ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" : "border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
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
              </div>
            )}
          </div>

          <div className="p-4 shrink-0 bg-white">
            <Link href={backHref} className="flex h-11 w-full items-center justify-center rounded-[12px] border border-[var(--app-border)] text-sm font-bold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]">
              Salir del Curso
            </Link>
          </div>
        </aside>

        <main className="relative flex flex-1 flex-col overflow-hidden bg-black">
          <section className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 pb-24">
            <div className="w-full max-w-5xl">
              {activeResourceIndex === -1 ? (
                // COURSE OVERVIEW PANEL
                <div className="w-full overflow-hidden rounded-[24px] border border-slate-800 bg-[#0f172a] shadow-2xl flex flex-col md:flex-row min-h-[400px]">
                  <div className="relative w-full md:w-2/5 p-8 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-indigo-950 overflow-hidden">
                    {resource.thumbnailUrl && (
                      <>
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-40" 
                          style={{ backgroundImage: `url("${resource.thumbnailUrl}")` }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-indigo-950/90" />
                      </>
                    )}
                    <div className="relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500 mb-6 font-bold">
                         <Layers3 size={24} />
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">{resource.title}</h2>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {resource.tags?.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider">{t}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => setActiveResourceIndex(0)}
                        className="group flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-orange-500 hover:text-white"
                      >
                        Comenzar curso <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Sobre este curso</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                      {resource.description ? (
                        <p className="whitespace-pre-wrap">{resource.description}</p>
                      ) : (
                        <p className="italic opacity-50">Sin descripción disponible.</p>
                      )}
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                       <div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Autor</p>
                         <p className="text-sm font-semibold text-white mt-1">{resource.authorName || "Equipo 4Shine"}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Duración</p>
                         <p className="text-sm font-semibold text-white mt-1">{resource.durationLabel || "Pendiente"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              ) : currentItem?.contentType === "video" && isDirectVideoUrl(currentItem.url) ? (
                // DIRECT VIDEO PLAYER
                <div className="w-full overflow-hidden rounded-[16px] bg-black ring-1 ring-white/10 md:aspect-video relative group">
                  <video
                    src={currentItem.url!}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    poster={resource.url ? undefined : undefined} // Could use generic poster
                  />
                </div>
              ) : currentItem?.contentType === "pdf" && currentItem.url ? (
                // PDF VIEWER
                <div className="w-full overflow-hidden rounded-[16px] bg-slate-800 ring-1 ring-white/10 h-[70vh] md:h-[80vh] relative">
                  <iframe
                    title={currentItem.title}
                    src={currentItem.url}
                    className="absolute inset-0 h-full w-full border-none"
                  />
                </div>
              ) : buildYouTubeEmbedUrl(currentItem?.url) ? (
                // YOUTUBE PLAYER
                <div className="w-full overflow-hidden rounded-[16px] bg-[#0f172a] ring-1 ring-white/10 md:aspect-video flex flex-col items-center justify-center relative">
                  <iframe
                    title={currentItem?.title}
                    src={buildYouTubeEmbedUrl(currentItem?.url)!}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // FALLBACK PLACEHOLDER
                <div className="w-full overflow-hidden rounded-[16px] border border-slate-800 bg-[#0f172a] shadow-2xl md:aspect-video flex flex-col justify-between">
                  <div className="flex flex-1 items-center justify-center">
                      <div className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 hover:scale-105">
                         {currentItem?.url ? (
                            <a href={currentItem.url} target="_blank" rel="noopener noreferrer">
                               <ExternalLink size={32} />
                            </a>
                         ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                         )}
                      </div>
                  </div>
                  <div className="p-8 pb-10 bg-gradient-to-t from-black/60 to-transparent">
                      <h2 className="text-2xl font-bold text-white mb-2">{currentItem?.title || "Sin título"}</h2>
                      <p className="text-slate-300 text-sm">
                        {currentItem?.description || "Este recurso no tiene descripción adicional."}
                      </p>
                      {currentItem?.url && (
                        <a href={currentItem.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-orange-400 font-bold hover:underline">
                           Abrir en nueva pestaña <ExternalLink size={14} />
                        </a>
                      )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="absolute bottom-0 left-0 right-0 z-20 flex h-20 items-center justify-between border-t border-slate-800 bg-[#1e293b] px-6 text-white md:px-12">
             <button
               onClick={handlePrev}
               disabled={activeResourceIndex <= -1}
               className="flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
             >
               <ArrowLeft size={16} /> Anterior
             </button>
             <div className="text-sm font-semibold text-slate-400">
               {activeResourceIndex === -1 
                  ? "Introducción" 
                  : `Recurso ${activeResourceIndex + 1} de ${totalItems}`}
             </div>
             <button
               onClick={handleNext}
               disabled={activeResourceIndex >= totalItems - 1}
               className="flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#f97316] px-5 text-sm font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-50"
             >
               Siguiente <ArrowRight size={16} />
             </button>
          </div>
        </main>
      </div>,
      document.body
    );
  }

  // 2. STANDALONE RESOURCE LAYOUT (Video, PDF, Link, Podcast)
  return (
    <div className="flex w-full flex-col animate-fade-in gap-8">
      <div className="flex items-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-bold text-[var(--app-ink)] transition hover:bg-white hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft size={16} />
          Volver a {backTab === "cursos" ? "Cursos" : "Recursos"}
        </Link>
        <div className="flex-1" />
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(editHref)}
              className="app-button-secondary !h-9 !px-3"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={() => void onDeleteResource()}
              disabled={deleting}
              className="app-button-secondary !h-9 !px-3 !bg-rose-50 !text-rose-600 !border-rose-200 hover:!bg-rose-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-[24px] bg-[#0f172a] shadow-xl md:aspect-[21/9] lg:aspect-video relative flex flex-col items-center justify-center">
        {youtubeEmbedUrl ? (
          <iframe
            title={resource.title}
            src={youtubeEmbedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : resource.contentType === "pdf" && resource.url ? (
          <iframe
            title={resource.title}
            src={resource.url}
            className="absolute inset-0 h-full w-full min-h-[60vh] md:min-h-full"
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 to-indigo-950 w-full h-full">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/20">
               {isDirectAudioUrl(resource.url) ? (
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
               ) : (
                 <ExternalLink size={32} />
               )}
             </div>
             <h3 className="mt-6 font-bold text-white text-xl md:text-2xl">{resource.title}</h3>
             {resource.url && (
               <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                 Abrir Recurso Externo <ArrowRight size={16} />
               </a>
             )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
           {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resource.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    {tag}
                  </span>
                ))}
              </div>
           )}

           <h1 className="text-3xl font-extrabold text-[var(--app-ink)] md:text-4xl" data-display-font="true">
             {resource.title}
           </h1>
           
           <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--app-border)] py-4 text-sm font-medium text-[var(--app-muted)]">
             {resource.authorName && (
               <div className="flex items-center gap-2">
                 <div className="h-6 w-6 rounded-full bg-[var(--app-surface-muted)] flex items-center justify-center text-[10px] font-bold">
                   {resource.authorName.charAt(0)}
                 </div>
                 <span className="text-[var(--app-ink)]">{resource.authorName}</span>
               </div>
             )}
             <div className="flex items-center gap-1.5">
               <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line><path d="m9 16 2 2 4-4"></path></svg>
               {formatLearningDate(resource.createdAt)}
             </div>
             {resource.durationLabel && (
               <div className="flex items-center gap-1.5">
                 <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 {resource.durationLabel}
               </div>
             )}
             <div className="flex items-center gap-1.5">
               <span className={learningStatusClasses(resource.status)}>
                 {learningStatusLabel(resource.status)}
               </span>
             </div>
           </div>

           {resource.description && (
             <div className="prose prose-sm max-w-none text-[var(--app-ink)] prose-p:leading-relaxed md:prose-base">
               <p>{resource.description}</p>
             </div>
           )}
        </div>

        <div className="shrink-0 pt-2 flex items-center gap-3 md:flex-col md:gap-4 md:items-end">
           <button 
              onClick={() => void onToggleLike()}
              disabled={togglingLike}
              className={`flex h-14 min-w-[3.5rem] items-center justify-center gap-2 rounded-[16px] px-6 text-sm font-bold shadow-sm transition hover:-translate-y-1 ${
                resource.liked ? "bg-[#fdebf3] text-rose-600 ring-1 ring-rose-200" : "bg-white text-[var(--app-ink)] ring-1 ring-[var(--app-border)] hover:box-shadow-md"
              }`}
            >
              <Heart size={20} className={resource.liked ? "fill-current" : undefined} />
              <span className="md:hidden">Me gusta</span>
              <span className="hidden md:inline">{resource.likes} Me gusta</span>
            </button>
        </div>
      </div>

      <section className="mt-8 rounded-[24px] bg-white p-6 md:p-10 shadow-sm border border-[var(--app-border)]">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--app-ink)]">
             <MessageCircle className="text-[var(--brand-primary)]" />
             Conversación ({resource.commentCount})
           </h3>
        </div>

        <div className="mb-10 flex gap-4">
           <div className="h-12 w-12 shrink-0 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold shadow-md">
             {currentUser?.name?.charAt(0) ?? "U"}
           </div>
           <div className="flex-1">
             <textarea
                className="w-full resize-none rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--brand-primary)] focus:bg-white min-h-[5rem]"
                placeholder="Añade a la discusión..."
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="app-button-primary"
                  onClick={() => void onSubmitComment()}
                  disabled={submittingComment || !commentDraft.trim()}
                >
                  <Send size={16} />
                  {submittingComment ? "Publicando..." : "Publicar comentario"}
                </button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           {(!resource.comments || resource.comments.length === 0) ? (
              <p className="text-center text-[var(--app-muted)] py-10 font-medium">
                Nadie ha comentado aún. ¡Sé la primera voz!
              </p>
           ) : (
              resource.comments.map((comment) => (
                <article key={comment.commentId} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-muted)] font-bold text-[var(--app-ink)]">
                    {comment.authorAvatar}
                  </div>
                  <div className="flex-1 border-b border-[var(--app-border)] pb-6">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-[var(--app-ink)]">{comment.authorName}</p>
                      <p className="text-xs text-[var(--app-muted)] font-medium">
                        {formatLearningDateTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--app-ink)]">{comment.commentText}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                            {(comment.reactions || []).map((reaction) => {
                              const isBusy = togglingCommentReaction === `${comment.commentId}:${reaction.value}`;
                              return (
                                <button
                                  key={reaction.value}
                                  onClick={() => void onToggleCommentReaction(comment.commentId, reaction.value)}
                                  disabled={Boolean(togglingCommentReaction)}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-px ${
                                    reaction.reacted ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] shadow-sm" : "border-[var(--app-border)] bg-transparent text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  {reaction.count > 0 && <span className="ml-1">{isBusy ? "..." : reaction.count}</span>}
                                </button>
                              );
                            })}
                    </div>
                  </div>
                </article>
              ))
           )}
        </div>
      </section>

      {suggestedResources.length > 0 && (
         <section className="mt-6 mb-12">
            <h3 className="text-xl font-extrabold text-[var(--app-ink)] mb-6" data-display-font="true">
              También podría interesarte
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
               {suggestedResources.map((sug) => (
                 <LearningResourceCard key={sug.contentId} resource={sug} />
               ))}
            </div>
         </section>
      )}
    </div>
  );
}