import React from "react";
import { BarChart3, Layers3, MonitorPlay, FileText } from "lucide-react";
import type { LearningResourceRecord } from "@/features/aprendizaje/client";

interface LearningAnalyticsPanelProps {
  resources: LearningResourceRecord[];
  totalAvailable: number;
}

export function LearningAnalyticsPanel({ resources, totalAvailable }: LearningAnalyticsPanelProps) {
  const scormCount = resources.filter((r) => r.contentType === "scorm").length;
  const videoCount = resources.filter((r) => r.contentType === "video").length;
  const pdfCount = resources.filter((r) => r.contentType === "pdf").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <div className="flex flex-col justify-between rounded-[22px] border border-[var(--app-border)] bg-[linear-gradient(135deg,#fdfcff_0%,#f5effa_100%)] p-5 shadow-[0_16px_36px_rgba(55,32,80,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <BarChart3 size={18} className="text-[#593475]" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--app-muted)]">Volumen</p>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-extrabold text-[var(--app-ink)]">{totalAvailable}</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">Resultados en total</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[22px] border border-[var(--app-border)] bg-white/80 p-5 shadow-[0_16px_36px_rgba(55,32,80,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eef8ff_0%,#ddeffc_100%)] shadow-sm">
            <Layers3 size={18} className="text-indigo-600" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--app-muted)]">Cursos Listados</p>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-extrabold text-[var(--app-ink)]">{scormCount}</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">Paquetes SCORM interactivos</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[22px] border border-[var(--app-border)] bg-white/80 p-5 shadow-[0_16px_36px_rgba(55,32,80,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fff7ef_0%,#fde8dc_100%)] shadow-sm">
            <MonitorPlay size={18} className="text-amber-600" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--app-muted)]">Videos Encontrados</p>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-extrabold text-[var(--app-ink)]">{videoCount}</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">Cápsulas de aprendizaje</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-[22px] border border-[var(--app-border)] bg-white/80 p-5 shadow-[0_16px_36px_rgba(55,32,80,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ebfdf4_0%,#d1fae5_100%)] shadow-sm">
            <FileText size={18} className="text-emerald-600" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--app-muted)]">Lecturas Base</p>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-extrabold text-[var(--app-ink)]">{pdfCount}</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">Guías y documentos</p>
        </div>
      </div>
    </div>
  );
}
