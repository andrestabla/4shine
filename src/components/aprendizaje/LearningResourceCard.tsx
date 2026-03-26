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
}

export function LearningResourceCard({ resource }: LearningResourceCardProps) {
  const courseModuleCount = resource.structurePayload.modules?.length ?? 0;
  const pillarLabel = learningPillarLabel(resource.competencyMetadata.pillar);

  return (
    <Link
      href={`/dashboard/aprendizaje/recursos/${resource.contentId}`}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-white/92 shadow-[0_18px_38px_rgba(55,32,80,0.05)] transition hover:-translate-y-0.5 hover:border-[var(--app-border-strong)] hover:shadow-[0_24px_48px_rgba(55,32,80,0.08)]"
    >
      <div className="p-3">
        <LearningResourceVisual resource={resource} />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-1">
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
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--app-muted)]">
            {resource.description ?? "Sin descripción disponible."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--app-muted)]">
          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1">
            {learningContentTypeLabel(resource.contentType)}
          </span>
          <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1">
            {resource.category}
          </span>
          {pillarLabel ? (
            <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1">
              {pillarLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm text-[var(--app-muted)]">
          <div className="rounded-[16px] bg-[var(--app-surface-muted)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em]">Duración</p>
            <p className="mt-1 font-medium text-[var(--app-ink)]">
              {resource.durationLabel ?? "Flexible"}
            </p>
          </div>
          <div className="rounded-[16px] bg-[var(--app-surface-muted)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em]">Etapa</p>
            <p className="mt-1 font-medium text-[var(--app-ink)]">
              {resource.competencyMetadata.stage ?? "Sin definir"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--app-border)] pt-4 text-sm text-[var(--app-muted)]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={15} />
              {resource.likes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={15} />
              {resource.commentCount}
            </span>
            {resource.contentType === "scorm" ? (
              <span>{courseModuleCount} módulos</span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-2 font-semibold text-[var(--app-ink)]">
            Ver detalle
            <ArrowRight
              size={15}
              className="transition group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
