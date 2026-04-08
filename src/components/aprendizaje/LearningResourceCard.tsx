"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Heart, MessageCircle } from "lucide-react";
import type { LearningResourceRecord } from "@/features/aprendizaje/client";
import {
  learningContentTypeLabel,
  learningPillarLabel,
  learningStatusClasses,
  learningStatusLabel,
} from "@/features/aprendizaje/presentation";
import { LearningResourceVisual } from "./LearningResourceVisual";

interface LearningResourceCardProps {
  resource: LearningResourceRecord;
  href?: string;
  canManage?: boolean;
  onEdit?: (contentId: string) => void;
  onDelete?: (contentId: string) => void;
}

export function LearningResourceCard({
  resource,
  href,
  canManage,
  onEdit,
  onDelete,
}: LearningResourceCardProps) {
  const courseModuleCount = resource.structurePayload.modules?.length ?? 0;
  const pillarLabel = learningPillarLabel(resource.competencyMetadata.pillar);
  const metaLine = [
    learningContentTypeLabel(resource.contentType),
    resource.durationLabel ?? null,
    resource.competencyMetadata.stage ?? pillarLabel ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-white/92 shadow-[0_18px_38px_rgba(55,32,80,0.05)] transition hover:-translate-y-0.5 hover:border-[var(--app-border-strong)] hover:shadow-[0_24px_48px_rgba(55,32,80,0.08)]">
      {canManage ? (
        <div className="absolute right-4 top-4 z-10 flex translate-y-[-10px] items-center gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(resource.contentId)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--app-ink)] shadow backdrop-blur transition hover:bg-white"
              title="Editar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(resource.contentId)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow backdrop-blur transition hover:bg-rose-50"
              title="Eliminar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}
        </div>
      ) : null}
      
      <Link href={href ?? `/dashboard/aprendizaje/recursos/${resource.contentId}`} className="flex h-full flex-col outline-none">
        <div className="p-3 pb-0">
          <LearningResourceVisual resource={resource} showTitle={false} />
        </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${learningStatusClasses(resource.status)}`}
          >
            {learningStatusLabel(resource.status)}
          </span>
          {resource.isRecommended ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              Recomendado
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-[var(--app-ink)]">
            {resource.title}
          </h3>
          {metaLine ? (
            <p className="mt-2 text-sm font-medium text-[var(--app-muted)]">
              {metaLine}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--app-muted)]">
            {resource.description ?? "Sin descripción disponible."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--app-muted)]">
          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1">
            {resource.category}
          </span>
          {pillarLabel ? (
            <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1">
              {pillarLabel}
            </span>
          ) : null}
          {resource.contentType === "scorm" ? (
            <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1">
              {courseModuleCount} módulos
            </span>
          ) : null}
        </div>

        {resource.progressPercent > 0 && !canManage && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--app-muted)]">
              <span>{resource.progressPercent}% completado</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, resource.progressPercent))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--app-border)] pt-4 text-sm text-[var(--app-muted)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={15} className={resource.liked ? "fill-rose-500 text-rose-500" : ""} />
              {resource.likes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={15} />
              {resource.commentCount}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 font-semibold text-[var(--app-ink)]">
            {resource.progressPercent > 0 ? "Continuar" : "Ver detalle"}
            <ArrowRight
              size={15}
              className="transition group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
      </Link>
    </div>
  );
}
