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
      classes:
        "bg-[linear-gradient(135deg,#43204f_0%,#6f4390_52%,#efb3d0_100%)] text-white",
      label: "Curso",
      Icon: Layers3,
    };
  }
  if (contentType === "video") {
    return {
      classes:
        "bg-[linear-gradient(135deg,#281836_0%,#5e3c80_54%,#d3d8ff_100%)] text-white",
      label: "Video",
      Icon: MonitorPlay,
    };
  }
  if (contentType === "podcast") {
    return {
      classes:
        "bg-[linear-gradient(135deg,#352043_0%,#7d4f85_54%,#f0c7d6_100%)] text-white",
      label: "Pódcast",
      Icon: Headphones,
    };
  }
  if (contentType === "pdf") {
    return {
      classes:
        "bg-[linear-gradient(135deg,#f7f1ff_0%,#efe4fb_100%)] text-[var(--app-ink)]",
      label: "Documento",
      Icon: FileText,
    };
  }
  if (contentType === "ppt") {
    return {
      classes:
        "bg-[linear-gradient(135deg,#fff7ef_0%,#fde8dc_100%)] text-[var(--app-ink)]",
      label: "Presentación",
      Icon: Presentation,
    };
  }
  if (contentType === "article") {
    return {
      classes:
        "bg-[linear-gradient(135deg,#eef8ff_0%,#ddeffc_100%)] text-[var(--app-ink)]",
      label: "Artículo",
      Icon: Newspaper,
    };
  }
  return {
    classes:
      "bg-[linear-gradient(135deg,#f5f1ff_0%,#e7ddfb_100%)] text-[var(--app-ink)]",
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
        "relative overflow-hidden rounded-[22px] border border-white/15 shadow-[0_16px_36px_rgba(55,32,80,0.10)]",
        hasThumbnail
          ? "bg-[linear-gradient(135deg,#342045_0%,#8a5da5_62%,#e7b0cf_100%)] text-white"
          : theme.classes,
        isHero ? "min-h-[220px] p-5 sm:min-h-[260px] sm:p-7" : "min-h-[184px] p-4",
      ].join(" ")}
    >
      {hasThumbnail ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${thumbnailUrl}")` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,24,50,0.18)_0%,rgba(37,24,50,0.38)_40%,rgba(37,24,50,0.82)_100%)]" />
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
