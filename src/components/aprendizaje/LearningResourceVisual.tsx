"use client";

import React from "react";
import {
  BookOpen,
  FileText,
  Headphones,
  Layers3,
  MonitorPlay,
  Newspaper,
  Presentation,
} from "lucide-react";
import type { LearningResourceRecord } from "@/features/aprendizaje/client";
import { buildLearningThumbnailUrl } from "@/features/aprendizaje/media";
import { learningContentTypeLabel, learningPillarLabel } from "@/features/aprendizaje/presentation";

interface LearningResourceVisualProps {
  resource: Pick<
    LearningResourceRecord,
    | "contentType"
    | "title"
    | "category"
    | "durationLabel"
    | "competencyMetadata"
    | "url"
    | "thumbnailUrl"
  >;
  size?: "card" | "hero";
  showTitle?: boolean;
}

function visualTheme(contentType: LearningResourceRecord["contentType"]) {
  if (contentType === "scorm") {
    return {
      classes: "text-white",
      style: {
        background:
          "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-primary) 52%, var(--brand-accent) 100%)",
      } as React.CSSProperties,
      label: "Curso",
      Icon: Layers3,
    };
  }
  if (contentType === "video") {
    return {
      classes: "text-white",
      style: {
        background:
          "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-secondary) 54%, var(--brand-primary) 100%)",
      } as React.CSSProperties,
      label: "Video",
      Icon: MonitorPlay,
    };
  }
  if (contentType === "podcast") {
    return {
      classes: "text-white",
      style: {
        background:
          "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-primary) 54%, var(--brand-accent-soft) 100%)",
      } as React.CSSProperties,
      label: "Pódcast",
      Icon: Headphones,
    };
  }
  if (contentType === "pdf") {
    return {
      classes: "text-[var(--app-ink)]",
      style: { background: "var(--brand-surface-strong)" } as React.CSSProperties,
      label: "Documento",
      Icon: FileText,
    };
  }
  if (contentType === "ppt") {
    return {
      classes: "text-[var(--app-ink)]",
      style: { background: "var(--brand-accent-soft)" } as React.CSSProperties,
      label: "Presentación",
      Icon: Presentation,
    };
  }
  if (contentType === "article") {
    return {
      classes: "text-[var(--app-ink)]",
      style: { background: "var(--brand-surface)" } as React.CSSProperties,
      label: "Artículo",
      Icon: Newspaper,
    };
  }
  return {
    classes: "text-[var(--app-ink)]",
    style: { background: "var(--brand-surface-strong)" } as React.CSSProperties,
    label: "Recurso",
    Icon: BookOpen,
  };
}

export function LearningResourceVisual({
  resource,
  size = "card",
  showTitle = true,
}: LearningResourceVisualProps) {
  const theme = visualTheme(resource.contentType);
  const pillarLabel = learningPillarLabel(resource.competencyMetadata?.pillar);
  const isHero = size === "hero";
  const thumbnailUrl = resource.thumbnailUrl || buildLearningThumbnailUrl(resource.url);
  const hasThumbnail = Boolean(thumbnailUrl);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[22px] border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.10)]",
        hasThumbnail ? "text-white" : theme.classes,
        isHero ? "min-h-[220px] p-5 sm:min-h-[260px] sm:p-7" : "min-h-[184px] p-4",
      ].join(" ")}
      style={
        hasThumbnail
          ? {
              background:
                "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-primary) 62%, var(--brand-accent) 100%)",
            }
          : theme.style
      }
    >
      {hasThumbnail ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${thumbnailUrl}")` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.40)_40%,rgba(0,0,0,0.78)_100%)]" />
        </>
      ) : (
        <>
          <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
        </>
      )}

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <theme.Icon size={isHero ? 16 : 14} />
            {theme.label}
          </div>
          {resource.durationLabel ? (
            <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-medium">
              {resource.durationLabel}
            </span>
          ) : null}
        </div>

        <div className={isHero ? "mt-10" : "mt-6"}>
          {showTitle ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">
                {resource.category || pillarLabel}
              </p>
              <h2
                className={[
                  "mt-2 font-semibold leading-tight",
                  isHero ? "text-3xl sm:text-4xl" : "line-clamp-3 text-xl",
                ].join(" ")}
              >
                {resource.title}
              </h2>
            </>
          ) : null}
          <div
            className={[
              "flex flex-wrap gap-2 text-xs opacity-80",
              showTitle ? "mt-4" : "mt-auto pt-10",
            ].join(" ")}
          >
            <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1">
              {learningContentTypeLabel(resource.contentType)}
            </span>
            {resource.category ? (
              <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1">
                {resource.category}
              </span>
            ) : null}
            {pillarLabel ? (
              <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1">
                {pillarLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
