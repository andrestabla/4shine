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