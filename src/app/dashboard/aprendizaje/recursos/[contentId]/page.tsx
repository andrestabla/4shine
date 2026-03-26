"use client";

import Link from "next/link";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import { LearningResourceVisual } from "@/components/aprendizaje/LearningResourceVisual";
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
  const { currentRole } = useUser();
  const { alert, confirm } = useAppDialog();

  const contentId =
    typeof params?.contentId === "string" ? params.contentId : "";
  const canManage = currentRole === "gestor" || currentRole === "admin";

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
      router.push("/dashboard/aprendizaje");
    } catch (error) {
      await showError("No se pudo eliminar el recurso", error);
      setDeleting(false);
    }
  }, [canManage, confirm, deleting, resource, router, showError]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dashboard/aprendizaje" className="app-button-secondary">
          <ArrowLeft size={16} />
          Volver a Aprendizaje
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${learningStatusClasses(resource.status)}`}
          >
            {learningStatusLabel(resource.status)}
          </span>
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="app-button-secondary"
            >
              <ExternalLink size={16} />
              Abrir recurso
            </a>
          ) : null}
          {canManage ? (
            <>
              <button
                type="button"
                className="app-button-secondary"
                onClick={() =>
                  router.push(`/dashboard/aprendizaje?edit=${resource.contentId}`)
                }
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                onClick={() => void onDeleteResource()}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6">
          <LearningResourceVisual
            resource={resource}
            size="hero"
            showTitle={false}
          />

          <div className="app-panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="app-section-kicker">
                  {resource.category || "Recurso 4Shine"}
                </p>
                <h1
                  className="app-display-title mt-2 text-3xl font-semibold"
                  data-display-font="true"
                >
                  {resource.title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[var(--app-muted)]">
                  {resource.description ?? "Sin descripción disponible."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--app-muted)]">
                  <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1">
                    {learningContentTypeLabel(resource.contentType)}
                  </span>
                  {resource.durationLabel ? (
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                      {resource.durationLabel}
                    </span>
                  ) : null}
                  {resource.competencyMetadata.stage ? (
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                      {resource.competencyMetadata.stage}
                    </span>
                  ) : null}
                  {resource.competencyMetadata.pillar ? (
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                      {learningPillarLabel(resource.competencyMetadata.pillar)}
                    </span>
                  ) : null}
                  {resource.contentType === "scorm" ? (
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1">
                      {resource.structurePayload.modules?.length ?? 0} módulos
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm text-[var(--app-muted)]">
                  Por <span className="font-medium text-[var(--app-ink)]">{resource.authorName ?? "4Shine"}</span>
                  {" · "}
                  {formatLearningDate(resource.publishedAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:min-w-[240px]">
                <button
                  type="button"
                  className={
                    resource.liked
                      ? "flex min-h-[82px] flex-col items-start justify-between rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-700"
                      : "flex min-h-[82px] flex-col items-start justify-between rounded-[20px] border border-[var(--app-border)] bg-white px-4 py-3 text-left text-sm font-semibold text-[var(--app-ink)]"
                  }
                  onClick={() => void onToggleLike()}
                  disabled={togglingLike}
                >
                  <Heart
                    size={18}
                    className={resource.liked ? "fill-current" : undefined}
                  />
                  <span className="text-xl font-semibold leading-none">
                    {resource.likes}
                  </span>
                  <span className="text-sm font-medium">
                    {togglingLike ? "Actualizando..." : "Me gusta"}
                  </span>
                </button>
                <div className="flex min-h-[82px] flex-col items-start justify-between rounded-[20px] border border-[var(--app-border)] bg-white px-4 py-3 text-left">
                  <MessageCircle size={18} className="text-[var(--app-muted)]" />
                  <span className="text-xl font-semibold leading-none text-[var(--app-ink)]">
                    {resource.commentCount}
                  </span>
                  <span className="text-sm font-medium text-[var(--app-muted)]">
                    Comentarios
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="app-panel overflow-hidden p-0">
            {youtubeEmbedUrl ? (
              <iframe
                title={resource.title}
                src={youtubeEmbedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : resource.contentType === "pdf" && resource.url ? (
              <iframe
                title={resource.title}
                src={resource.url}
                className="min-h-[720px] w-full"
              />
            ) : resource.contentType === "podcast" &&
              isDirectAudioUrl(resource.url) ? (
              <div className="p-6">
                <audio controls className="w-full" src={resource.url ?? undefined}>
                  Tu navegador no soporta reproducción de audio.
                </audio>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm leading-relaxed text-[var(--app-muted)]">
                  Este recurso se visualiza desde su enlace original. Ábrelo
                  para ver el contenido completo.
                </p>
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="app-button-primary mt-4 w-fit"
                  >
                    <ExternalLink size={16} />
                    Abrir recurso
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {resource.contentType === "scorm" && (
            <div className="app-panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-section-kicker">Estructura interna</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--app-ink)]">
                    Módulos del curso
                  </h3>
                </div>
                <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
                  {resource.structurePayload.modules?.length ?? 0} módulos
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {(resource.structurePayload.modules ?? []).length === 0 ? (
                  <p className="rounded-[18px] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                    Este curso aún no tiene módulos cargados.
                  </p>
                ) : (
                  (resource.structurePayload.modules ?? []).map(
                    (module, moduleIndex) => (
                      <section
                        key={module.id}
                        className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                              Módulo {moduleIndex + 1}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-[var(--app-ink)]">
                              {module.title}
                            </h4>
                            {module.description ? (
                              <p className="mt-1 text-sm text-[var(--app-muted)]">
                                {module.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                            {module.resources.length} recursos
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {module.resources.map((moduleResource) => (
                            <div
                              key={moduleResource.id}
                              className="rounded-[18px] border border-[var(--app-border)] bg-white px-4 py-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1 text-xs text-[var(--app-muted)]">
                                  {courseModuleResourceTypeLabel(
                                    moduleResource.contentType,
                                  )}
                                </span>
                                {moduleResource.durationLabel ? (
                                  <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1 text-xs text-[var(--app-muted)]">
                                    {moduleResource.durationLabel}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 text-sm font-semibold text-[var(--app-ink)]">
                                {moduleResource.title}
                              </p>
                              {moduleResource.description ? (
                                <p className="mt-1 text-sm text-[var(--app-muted)]">
                                  {moduleResource.description}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </section>
                    ),
                  )
                )}
              </div>
            </div>
          )}

          <div className="app-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-section-kicker">Comentarios</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--app-ink)]">
                  Conversación sobre el recurso
                </h3>
              </div>
              <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs font-medium text-[var(--app-muted)]">
                {resource.commentCount}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {resource.comments.length === 0 ? (
                <p className="rounded-[18px] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                  Todavía no hay comentarios en este recurso.
                </p>
              ) : (
                resource.comments.map((comment) => (
                  <article
                    key={comment.commentId}
                    className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--app-ink)] shadow-[0_8px_16px_rgba(45,26,68,0.08)]">
                          {comment.authorAvatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--app-ink)]">
                            {comment.authorName}
                          </p>
                          <p className="text-xs text-[var(--app-muted)]">
                            {learningRoleLabel(comment.authorRole)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--app-muted)]">
                        {formatLearningDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--app-ink)]">
                      {comment.commentText}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {comment.reactions.map((reaction) => {
                        const isBusy =
                          togglingCommentReaction ===
                          `${comment.commentId}:${reaction.value}`;
                        const hasCount = reaction.count > 0;

                        return (
                          <button
                            key={reaction.value}
                            type="button"
                            className={
                              reaction.reacted
                                ? "inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary,#3f2371)] bg-[var(--brand-primary-soft,#f3ebff)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary,#3f2371)]"
                                : "inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]"
                            }
                            onClick={() =>
                              void onToggleCommentReaction(
                                comment.commentId,
                                reaction.value,
                              )
                            }
                            disabled={Boolean(togglingCommentReaction)}
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.label}</span>
                            {hasCount ? (
                              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[11px]">
                                {isBusy ? "..." : reaction.count}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-5 space-y-3">
              <textarea
                className="min-h-28 w-full rounded-[18px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--app-border-strong)]"
                placeholder="Escribe un comentario sobre este recurso"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
              <button
                type="button"
                className="app-button-primary"
                onClick={() => void onSubmitComment()}
                disabled={submittingComment}
              >
                <Send size={16} />
                {submittingComment ? "Guardando comentario..." : "Comentar"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Detalle</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Autor
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {resource.authorName ?? "4Shine"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Publicado
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {formatLearningDate(resource.publishedAt)}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Componente
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {resource.competencyMetadata.component ?? "Sin definir"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Competencia
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {resource.competencyMetadata.competency ?? "Sin definir"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Etapa
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {resource.competencyMetadata.stage ?? "Sin definir"}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Audiencia
                </p>
                <p className="mt-2 font-semibold text-[var(--app-ink)]">
                  {resource.competencyMetadata.audience ?? "Toda la plataforma"}
                </p>
              </div>
            </div>
          </div>

          <div className="app-panel p-5 sm:p-6">
            <p className="app-section-kicker">Metadatos</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            {observableBehaviors.length > 0 ? (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Conductas observables
                </p>
                {observableBehaviors.map((behavior) => (
                  <div
                    key={behavior}
                    className="rounded-[16px] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-ink)]"
                  >
                    {behavior}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
