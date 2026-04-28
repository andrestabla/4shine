"use client";

import React from "react";
import { Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { downloadDiscoveryPdfReport } from "./pdf-export";
import { scoreDiscoveryAnswers } from "./reporting";
import type { DiscoverySessionRecord } from "./types";

interface PdfDownloadExperienceProps {
  session: DiscoverySessionRecord;
}

export function PdfDownloadExperience({ session }: PdfDownloadExperienceProps) {
  const [status, setStatus] = React.useState<"idle" | "generating" | "ready" | "error">("generating");

  const handleDownload = React.useCallback(async () => {
    setStatus("generating");
    try {
      const scoring = scoreDiscoveryAnswers(session.answers);
      const participantName = `${session.firstName} ${session.lastName}`.trim() || session.nameSnapshot;
      
      await downloadDiscoveryPdfReport({
        participantName,
        state: {
          name: participantName,
          answers: session.answers,
          currentIdx: session.currentIdx,
          status: "results",
          profile: {
            firstName: session.firstName,
            lastName: session.lastName,
            country: session.country,
            jobRole: session.jobRole,
            gender: session.gender as any,
            yearsExperience: session.yearsExperience,
          },
          profileCompleted: session.profileCompleted,
        },
        scoring,
        reports: session.aiReports,
      });
      setStatus("ready");
    } catch (error) {
      console.error("PDF download failed", error);
      setStatus("error");
    }
  }, [session]);

  React.useEffect(() => {
    // Auto-trigger on load
    const timer = setTimeout(() => {
      void handleDownload();
    }, 1500);
    return () => clearTimeout(timer);
  }, [handleDownload]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
        {status === "generating" ? (
          <Loader2 size={48} className="animate-spin" />
        ) : status === "ready" ? (
          <CheckCircle2 size={48} className="text-emerald-500" />
        ) : (
          <FileText size={48} />
        )}
      </div>

      <h1 className="mb-3 text-2xl font-bold text-slate-900">
        {status === "generating" ? "Generando tu informe ejecutivo..." : 
         status === "ready" ? "¡Informe generado con éxito!" : 
         "Descarga de informe diagnóstico"}
      </h1>
      
      <p className="mx-auto mb-8 max-w-md text-slate-600">
        {status === "generating" 
          ? "Estamos procesando tu lectura estratégica de liderazgo 4Shine. La descarga iniciará automáticamente en unos segundos."
          : status === "ready"
          ? "La descarga debería haber iniciado. Si no es así, puedes usar el botón de abajo para intentarlo nuevamente."
          : "Hubo un problema al generar el archivo. Por favor, intenta de nuevo."}
      </p>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => void handleDownload()}
          disabled={status === "generating"}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {status === "generating" ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
          {status === "ready" ? "Descargar de nuevo" : "Descargar PDF"}
        </button>
        
        {status === "ready" && (
          <button 
            onClick={() => window.location.href = `/descubrimiento/share/${session.publicId}`}
            className="text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            Ver versión interactiva online
          </button>
        )}
      </div>

      <div className="mt-16 text-xs text-slate-400">
        © {new Date().getFullYear()} 4Shine Platform. Documento oficial generado mediante IA diagnóstica.
      </div>
    </div>
  );
}
