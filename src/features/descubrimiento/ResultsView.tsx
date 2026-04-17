"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import {
  Copy,
  Download,
  ExternalLink,
  Frown,
  Gauge,
  Laugh,
  Loader2,
  Mail,
  Meh,
  LogOut,
  Maximize2,
  Radar as RadarIcon,
  RefreshCw,
  Share2,
  Smile,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { PILLAR_INFO, COMP_DEFINITIONS } from "./DiagnosticsData";
import { analyzeDiscoveryReport } from "./client";
import { analyzeInvitationDiscoveryReport } from "./client";
import { downloadDiscoveryPdfReport } from "./pdf-export";
import { buildDiscoveryReports, getDiscoveryStatus, scoreDiscoveryAnswers } from "./reporting";
import type {
  DiscoveryAiReports,
  DiscoveryExperienceSurvey,
  DiscoveryPillarKey,
  DiscoveryReportFilter,
  DiscoverySessionRecord,
  DiscoveryUserState,
} from "./types";

interface ResultsViewProps {
  state: DiscoveryUserState;
  publicId?: string | null;
  isPublic?: boolean;
  embedded?: boolean;
  enablePublicAnalysis?: boolean;
  onShare?: () => Promise<DiscoverySessionRecord>;
  onReset?: () => Promise<void> | void;
  initialSurvey?: DiscoveryExperienceSurvey | null;
  onSurveySubmit?: (survey: DiscoveryExperienceSurvey) => Promise<void> | void;
  initialAiReports?: DiscoveryAiReports | null;
  invitationCredentials?: { inviteToken: string; accessCode: string } | null;
  onFinish?: () => void;
}

const SURVEY_QUESTIONS = [
  "¿Te resultó fácil responder el diagnóstico?",
  "¿Entendiste bien las preguntas del diagnóstico?",
  "¿Sentiste que el diagnóstico reflejó tu realidad?",
  "¿Te gustó la experiencia de hacer el diagnóstico?",
  "¿El diagnóstico te ayudó a conocerte mejor como líder?",
] as const;

const EMPTY_REPORTS: Record<DiscoveryReportFilter, string> = {
  all: "",
  within: "",
  out: "",
  up: "",
  beyond: "",
};
const ANALYSIS_MAX_RETRIES = 5;
const ALL_REPORT_FILTERS: DiscoveryReportFilter[] = ["all", "within", "out", "up", "beyond"];
const PILLAR_REPORT_FILTERS: DiscoveryReportFilter[] = ["within", "out", "up", "beyond"];
const ANALYSIS_CONCURRENCY = 4;

const FACE_SCALE = [
  { value: 1, icon: Frown, label: "Muy difícil" },
  { value: 2, icon: Meh, label: "Difícil" },
  { value: 3, icon: Smile, label: "Neutral" },
  { value: 4, icon: Smile, label: "Buena" },
  { value: 5, icon: Laugh, label: "Excelente" },
] as const;

const TOUR_STEPS = [
  {
    targetId: "results-header",
    title: "¡Bienvenido a tus resultados!",
    text: "Has completado tu diagnóstico 4Shine. Vamos a orientarte para que aproveches al máximo esta lectura estratégica.",
  },
  {
    targetId: "action-buttons",
    title: "Documentación y compartido",
    text: "En la parte superior puedes compartir tu informe o descargarlo en PDF. Ambos documentos incluyen el desglose detallado de tu liderazgo.",
  },
  {
    targetId: "pillar-tabs",
    title: "Navegación por pilares",
    text: "Tu liderazgo se analiza en 4 pilares: Within, Out, Up y Beyond. Cámbialos para profundizar en las brechas y fortalezas de cada área.",
  },
  {
    targetId: "radar-container",
    title: "Mapa de radar",
    text: "Esta gráfica es tu huella dactilar de liderazgo. Los picos hacia afuera indican tus mayores talentos y los valles señalan tus oportunidades de mejora.",
  },
  {
    targetId: "competencies-breakdown",
    title: "Desglose de competencias",
    text: "Para cada pilar, listamos las competencias específicas, su resultado porcentual y una descripción conceptual para tu reflexión.",
  },
  {
    targetId: "executive-summary",
    title: "Informe narrativo",
    text: "Lee el análisis personalizado generado por IA. Encontrarás tu perfil de liderazgo, lo que hoy te impulsa y un plan de acción sugerido.",
  },
];

function buildShareUrl(publicId: string): string {
  if (typeof window === "undefined") {
    return `/descubrimiento/share/${publicId}`;
  }

  return `${window.location.origin}/descubrimiento/share/${publicId}`;
}

function parseEmailList(raw: string): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  const candidates = raw
    .split(/[\n,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  for (const email of candidates) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    output.push(email);
  }

  return output;
}

export function ResultsView({
  state,
  publicId,
  isPublic = false,
  embedded = true,
  enablePublicAnalysis = false,
  onShare,
  onReset,
  initialSurvey = null,
  onSurveySubmit,
  initialAiReports = null,
  invitationCredentials = null,
  onFinish,
}: ResultsViewProps) {
  const { alert } = useAppDialog();
  const scoring = React.useMemo(
    () => scoreDiscoveryAnswers(state.answers),
    [state.answers],
  );
  const fallbackReports = React.useMemo(
    () => buildDiscoveryReports(state, scoring),
    [state, scoring],
  );
  const isInvitationExperience =
    isPublic && (Boolean(invitationCredentials) || enablePublicAnalysis);
  const initialReports = React.useMemo(
    () => ({
      ...EMPTY_REPORTS,
      ...(initialAiReports ?? {}),
    }),
    [initialAiReports],
  );
  const initiallyCachedFilters = React.useMemo(
    () =>
      (Object.entries(initialAiReports ?? {}) as Array<[DiscoveryReportFilter, string]>)
        .filter(([, report]) => report.trim().length > 0)
        .map(([filterName]) => filterName),
    [initialAiReports],
  );
  const [reports, setReports] = React.useState(initialReports);
  const [filter, setFilter] = React.useState<DiscoveryReportFilter>("all");
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [sharedPublicId, setSharedPublicId] = React.useState(publicId ?? null);
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStepIdx, setTourStepIdx] = React.useState(0);
  const [maximizedChart, setMaximizedChart] = React.useState<"global" | "pillar" | null>(null);
  const [isSurveyOpen, setIsSurveyOpen] = React.useState(false);
  const [pendingSurveyAction, setPendingSurveyAction] = React.useState<
    "download" | "shareLink" | null
  >(null);
  const [surveyAnswers, setSurveyAnswers] = React.useState<Record<string, number>>(initialSurvey?.answers ?? {});
  const shouldUseStickyHeader = !isPublic;
  const stickyClass = shouldUseStickyHeader
    ? embedded
      ? "top-[4.5rem] sm:top-[5rem] md:top-[5.5rem]"
      : "top-0"
    : "";
  const analysisCacheRef = React.useRef<Set<DiscoveryReportFilter>>(new Set());
  const analysisInFlightRef = React.useRef<Set<DiscoveryReportFilter>>(new Set());
  const analysisBatchStartedRef = React.useRef(false);
  const [analysisCompletedCount, setAnalysisCompletedCount] = React.useState(0);
  const [analysisBatchPending, setAnalysisBatchPending] = React.useState(false);
  const [analysisActiveCount, setAnalysisActiveCount] = React.useState(0);
  const surveyPromptTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setReports(initialReports);
    analysisCacheRef.current.clear();
    for (const filterName of initiallyCachedFilters) {
      analysisCacheRef.current.add(filterName);
    }
    setAnalysisCompletedCount(initiallyCachedFilters.length);
    setAnalysisActiveCount(0);
    setAnalysisBatchPending(false);
    analysisBatchStartedRef.current = false;
  }, [initialReports, initiallyCachedFilters, isInvitationExperience]);

  React.useEffect(() => {
    return () => {
      if (surveyPromptTimerRef.current) {
        window.clearTimeout(surveyPromptTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    setSharedPublicId(publicId ?? null);
  }, [publicId]);

  React.useEffect(() => {
    setSurveyAnswers(initialSurvey?.answers ?? {});
  }, [initialSurvey]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seenTour = window.localStorage.getItem("discovery-results-tour-seen") === "1";
    if (!seenTour) {
      setIsTourOpen(true);
    }
  }, []);

  const handleNextTourStep = () => {
    if (tourStepIdx < TOUR_STEPS.length - 1) {
      setTourStepIdx((prev) => prev + 1);
    } else {
      setIsTourOpen(false);
      window.localStorage.setItem("discovery-results-tour-seen", "1");
    }
  };

  const clearSurveyPromptTimer = React.useCallback(() => {
    if (surveyPromptTimerRef.current) {
      window.clearTimeout(surveyPromptTimerRef.current);
      surveyPromptTimerRef.current = null;
    }
  }, []);

  const hasSurveyResponses = React.useCallback(() => {
    if (initialSurvey) return true;
    return Object.keys(surveyAnswers).length >= SURVEY_QUESTIONS.length;
  }, [initialSurvey, surveyAnswers]);

  const scheduleSurveyPrompt = React.useCallback(
    (delayMs: number) => {
      if (typeof window === "undefined") return;
      if (hasSurveyResponses()) return;
      clearSurveyPromptTimer();
      surveyPromptTimerRef.current = window.setTimeout(() => {
        setPendingSurveyAction(null);
        setIsSurveyOpen(true);
      }, delayMs);
    },
    [clearSurveyPromptTimer, hasSurveyResponses],
  );

  React.useEffect(() => {
    if (hasSurveyResponses()) {
      clearSurveyPromptTimer();
      return;
    }

    scheduleSurveyPrompt(60000);
    return clearSurveyPromptTimer;
  }, [clearSurveyPromptTimer, hasSurveyResponses, scheduleSurveyPrompt]);

  const syncReports = React.useCallback((nextReports: Partial<Record<DiscoveryReportFilter, string>>) => {
    const trimmedEntries = (Object.entries(nextReports) as Array<[DiscoveryReportFilter, string | undefined]>)
      .map(([target, report]) => [target, report?.trim() ?? ""] as const)
      .filter(([, report]) => report.length > 0);

    if (trimmedEntries.length === 0) return;

    setReports((current) => {
      const merged = { ...current };
      for (const [target, report] of trimmedEntries) {
        merged[target] = report;
      }
      return merged;
    });

    const known = new Set(analysisCacheRef.current);
    for (const [target] of trimmedEntries) {
      known.add(target);
    }
    analysisCacheRef.current = known;
    setAnalysisCompletedCount(known.size);
  }, []);

  const generateAnalysisForFilter = React.useCallback(
    async (target: DiscoveryReportFilter) => {
      if (isPublic && !invitationCredentials && !enablePublicAnalysis) return;
      if (analysisCacheRef.current.has(target)) return;
      if (analysisInFlightRef.current.has(target)) return;

      analysisInFlightRef.current.add(target);
      setAnalysisActiveCount((current) => current + 1);
      try {
        for (let attempt = 1; attempt <= ANALYSIS_MAX_RETRIES; attempt += 1) {
          try {
            const response = invitationCredentials
              ? await analyzeInvitationDiscoveryReport({
                  inviteToken: invitationCredentials.inviteToken,
                  accessCode: invitationCredentials.accessCode,
                  username: state.name,
                  role: state.profile.jobRole || "Invitado",
                  scores: scoring,
                  pillar: target,
                  fallbackReport: fallbackReports[target],
                })
              : await analyzeDiscoveryReport({
                  username: state.name,
                  role: state.profile.jobRole || "Lider",
                  scores: scoring,
                  pillar: target,
                  fallbackReport: fallbackReports[target],
                });

            if (response.report?.trim()) {
              syncReports({ [target]: response.report.trim() });
              return;
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message.toLowerCase() : "";
            const isRetryable =
              message.includes("ai_final_analysis_pending") ||
              message.includes("openai request failed") ||
              message.includes("failed to analyze diagnostics");
            if (!isRetryable || attempt >= ANALYSIS_MAX_RETRIES) {
              return;
            }
          }

          if (attempt < ANALYSIS_MAX_RETRIES) {
            await new Promise((resolve) =>
              window.setTimeout(resolve, Math.min(1200 * attempt, 3200)),
            );
          }
        }
        return;
      } finally {
        analysisInFlightRef.current.delete(target);
        setAnalysisActiveCount((current) => Math.max(0, current - 1));
      }
    },
    [
      enablePublicAnalysis,
      fallbackReports,
      invitationCredentials,
      isPublic,
      scoring,
      state.name,
      state.profile.jobRole,
      syncReports,
    ],
  );

  React.useEffect(() => {
    if (analysisBatchStartedRef.current) return;
    if (isPublic && !invitationCredentials && !enablePublicAnalysis) return;
    if (ALL_REPORT_FILTERS.every((target) => analysisCacheRef.current.has(target))) return;
    analysisBatchStartedRef.current = true;
    let cancelled = false;
    setAnalysisBatchPending(true);
    void (async () => {
      try {
        if (!analysisCacheRef.current.has("all")) {
          await generateAnalysisForFilter("all");
        }

        if (cancelled) return;

        const pendingPillars = PILLAR_REPORT_FILTERS.filter(
          (target) => !analysisCacheRef.current.has(target),
        );
        if (pendingPillars.length === 0) return;

        for (let index = 0; index < pendingPillars.length; index += ANALYSIS_CONCURRENCY) {
          if (cancelled) return;
          const chunk = pendingPillars.slice(index, index + ANALYSIS_CONCURRENCY);
          await Promise.allSettled(chunk.map((target) => generateAnalysisForFilter(target)));
        }
      } finally {
        if (!cancelled) {
          setAnalysisBatchPending(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enablePublicAnalysis,
    generateAnalysisForFilter,
    invitationCredentials,
    isPublic,
  ]);

  const radarData = React.useMemo(
    () => [
      {
        subject: "Within",
        value: scoring.pillarMetrics.within.total,
        fullMark: 100,
      },
      {
        subject: "Out",
        value: scoring.pillarMetrics.out.total,
        fullMark: 100,
      },
      {
        subject: "Up",
        value: scoring.pillarMetrics.up.total,
        fullMark: 100,
      },
      {
        subject: "Beyond",
        value: scoring.pillarMetrics.beyond.total,
        fullMark: 100,
      },
    ],
    [scoring],
  );

  const pillarRadarData = React.useMemo(() => {
    if (filter === "all") return [];
    return scoring.compList
      .filter((item) => item.pillar === filter)
      .map((item) => ({
        subject:
          item.name.length > 16 ? `${item.name.slice(0, 16)}…` : item.name,
        fullName: item.name,
        value: Math.round(((item.score - 1) / 4) * 100),
        fullMark: 100,
      }));
  }, [filter, scoring.compList]);

  const currentMetric =
    filter === "all" ? null : scoring.pillarMetrics[filter as DiscoveryPillarKey];
  const currentScore =
    filter === "all" ? scoring.globalIndex : currentMetric?.total ?? 0;
  const currentStatus = getDiscoveryStatus(currentScore);
  const invitationProgressPercent = Math.round(
    (analysisCompletedCount / ALL_REPORT_FILTERS.length) * 100,
  );
  const displayedProgressPercent =
    analysisCompletedCount >= ALL_REPORT_FILTERS.length
      ? 100
      : Math.min(
          96,
          invitationProgressPercent + (analysisBatchPending && analysisActiveCount > 0 ? 8 : 0),
        );
  const shareUrl = sharedPublicId ? buildShareUrl(sharedPublicId) : "";

  const ensureSurveyBeforeAction = React.useCallback(
    (action: "download" | "shareLink") => {
      if (hasSurveyResponses()) return true;
      clearSurveyPromptTimer();
      setPendingSurveyAction(action);
      setIsSurveyOpen(true);
      return false;
    },
    [clearSurveyPromptTimer, hasSurveyResponses],
  );

  const areAllReportsReady = React.useMemo(
    () => ALL_REPORT_FILTERS.every((target) => reports[target]?.trim().length > 0),
    [reports],
  );

  const ensureFinalAnalysisReady = React.useCallback(
    async (actionLabel: string) => {
      if (areAllReportsReady) return true;
      await alert({
        title: "Tu lectura final aún se está cerrando",
        message: `Estamos terminando el análisis definitivo. Cuando termine podrás ${actionLabel}.`,
        tone: "warning",
      });
      return false;
    },
    [alert, areAllReportsReady],
  );

  const handleShare = async () => {
    if (!onShare || isPublic) return;
    if (!ensureSurveyBeforeAction("shareLink")) return;
    if (!(await ensureFinalAnalysisReady("compartirla"))) return;
    setIsSharing(true);
    try {
      const nextSession = await onShare();
      setSharedPublicId(nextSession.publicId);
      await alert({
        title: "Enlace listo",
        message: "Ya puedes compartir esta lectura ejecutiva con quien lo necesites.",
        tone: "success",
      });
    } catch (error) {
      await alert({
        title: "No pudimos compartir el diagnóstico",
        message:
          error instanceof Error
            ? error.message
            : "Inténtalo nuevamente en unos segundos.",
        tone: "error",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const ensureSharableUrl = async (): Promise<string> => {
    if (shareUrl) return shareUrl;
    if (!isPublic && onShare) {
      const nextSession = await onShare();
      if (nextSession.publicId) {
        setSharedPublicId(nextSession.publicId);
        return buildShareUrl(nextSession.publicId);
      }
    }
    if (typeof window !== "undefined") return window.location.href;
    return "";
  };



  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      await alert({
        title: "Enlace copiado",
        message: "El enlace público quedó copiado en tu portapapeles.",
        tone: "success",
      });
    } catch {
      await alert({
        title: "No se pudo copiar",
        message: "Tu navegador no permitió copiar el enlace automáticamente.",
        tone: "warning",
      });
    }
  };

  const runDownloadPdf = async () => {
    if (!(await ensureFinalAnalysisReady("descargar el informe"))) return;

    setIsExporting(true);
    try {
      await downloadDiscoveryPdfReport({
        participantName: state.name,
        state,
        scoring,
        reports,
      });
    } catch (error) {
      await alert({
        title: "No se pudo generar el PDF",
        message:
          error instanceof Error
            ? error.message
            : "Inténtalo nuevamente en unos segundos.",
        tone: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!ensureSurveyBeforeAction("download")) return;
    await runDownloadPdf();
  };

  const submitSurvey = async () => {
    if (Object.keys(surveyAnswers).length < SURVEY_QUESTIONS.length) {
      await alert({
        title: "Encuesta incompleta",
        message: "Responde las 5 preguntas para registrar tu experiencia.",
        tone: "warning",
      });
      return;
    }

    const surveyPayload: DiscoveryExperienceSurvey = {
      answers: surveyAnswers,
      submittedAt: new Date().toISOString(),
      average: Number(
        (
          Object.values(surveyAnswers).reduce((acc, value) => acc + value, 0) /
          SURVEY_QUESTIONS.length
        ).toFixed(2),
      ),
    };

    if (onSurveySubmit) {
      try {
        await onSurveySubmit(surveyPayload);
      } catch (error) {
        await alert({
          title: "No se pudo guardar la encuesta",
          message: error instanceof Error ? error.message : "Intenta nuevamente.",
          tone: "error",
        });
        return;
      }
    }

    clearSurveyPromptTimer();
    setIsSurveyOpen(false);
    const pendingAction = pendingSurveyAction;
    setPendingSurveyAction(null);

    if (pendingAction === "download") {
      await runDownloadPdf();
      return;
    }
    if (pendingAction === "shareLink") {
      await handleShare();
      return;
    }

  };

  const currentReport = reports[filter]?.trim() ?? "";
  const shouldMaskAnalysis = currentReport.length === 0;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
          <div className="mb-4 flex items-center justify-between rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/workbooks-v2/diamond.svg" alt="4Shine Platform" className="h-7 w-7 object-contain" />
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--app-ink)]">
                4Shine Platform
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-white"
            >
              Volver a 4Shine
            </Link>
          </div>
        </div>
      )}

      <div
        className={clsx(
          shouldUseStickyHeader ? "sticky" : "relative",
          "z-30 rounded-[22px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.93)] px-4 py-4 shadow-[0_20px_42px_rgba(55,32,80,0.08)] backdrop-blur-xl md:px-5",
          stickyClass,
        )}
      >
        <div id="results-header" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-section-kicker">LECTURA EJECUTIVA</p>
            <h1 className="mt-2 text-2xl font-black text-[var(--app-ink)] md:text-3xl">
              Resultados del diagnóstico
            </h1>
            <p className="mt-2 text-sm text-[var(--app-muted)]">{state.name}</p>
          </div>

          <div id="action-buttons" className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{
                color: currentStatus.color,
                backgroundColor: currentStatus.softColor,
              }}
            >
              Avance {currentScore}%
            </span>

            {!isPublic && onShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing}
                className="inline-flex h-11 items-center gap-2.5 rounded-full border border-[var(--app-border)] bg-white px-5 text-sm font-black text-[var(--app-ink)] transition hover:border-[var(--brand-primary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--brand-primary)] disabled:opacity-40"
              >
                {isSharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                {sharedPublicId ? "Copiar enlace" : "Compartir link"}
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isExporting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Descargar PDF
            </button>

            {!isPublic && onReset && (
              <button
                type="button"
                onClick={() => void onReset()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] sm:w-auto"
              >
                <RefreshCw size={14} />
                Reiniciar
              </button>
            )}

            {isInvitationExperience && onFinish && (
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#dc2626] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition hover:opacity-92 sm:w-auto"
              >
                <LogOut size={14} />
                Finalizar
              </button>
            )}
          </div>
        </div>

        {isInvitationExperience && analysisCompletedCount < 5 && (
          <div className="mt-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--app-muted)]">
              <span>Generando análisis</span>
              <span>{analysisCompletedCount}/5</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
                style={{ width: `${displayedProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {sharedPublicId && (
          <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                Enlace público
              </p>
              <p className="mt-1 truncate text-sm text-[var(--app-ink)]">{shareUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copyToClipboard()}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--app-ink)] transition hover:bg-[var(--app-surface-strong)]"
              >
                <Copy size={14} />
                Copiar
              </button>
              <Link
                href={shareUrl}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--app-ink)] transition hover:bg-[var(--app-surface-strong)]"
              >
                <ExternalLink size={14} />
                Abrir
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.85fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-section-kicker">Mapa de liderazgo</p>
              <h4 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                {filter === "all" ? "Vista integral" : PILLAR_INFO[filter].title}
              </h4>
            </div>
            <div
              className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{
                color: currentStatus.color,
                backgroundColor: currentStatus.softColor,
              }}
            >
              {currentStatus.label}
            </div>
          </div>

          <div id="pillar-tabs" className="mt-5 flex flex-wrap gap-2">
            {(["all", "within", "out", "up", "beyond"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] transition",
                  filter === item
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]",
                )}
              >
                {item === "all" ? "Global" : PILLAR_INFO[item].title}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div id="radar-container" className="relative rounded-[22px] border border-[var(--app-border)] bg-white/80 px-5 py-5">
              <button
                type="button"
                onClick={() => setMaximizedChart(filter === "all" ? "global" : "pillar")}
                className="absolute right-4 top-4 z-10 rounded-full border border-[var(--app-border)] bg-white/90 p-2 text-[var(--app-muted)] transition hover:bg-white hover:text-[var(--brand-primary)]"
                title="Maximizar gráfica"
              >
                <Maximize2 size={16} />
              </button>
              <div className="h-[260px] w-full sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    data={filter === "all" ? radarData : pillarRadarData}
                  >
                    <PolarGrid stroke="rgba(88,54,108,0.16)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#6e5a83", fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${String(value ?? 0)}%`, "Score"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullName ?? String(label)
                      }
                    />
                    <Radar
                      dataKey="value"
                      stroke="var(--brand-primary)"
                      fill="var(--brand-primary)"
                      fillOpacity={0.16}
                      strokeWidth={2.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-[var(--app-border)] bg-white/82 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                    <Gauge size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                      Score actual
                    </p>
                    <p className="mt-1 text-3xl font-black text-[var(--app-ink)]">{currentScore}%</p>
                  </div>
                </div>
              </div>

              {currentMetric && (
                <div className="rounded-[22px] border border-[var(--app-border)] bg-white/82 px-5 py-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    Equilibrio del pilar
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--app-muted)]">Autopercepción</p>
                      <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{currentMetric.likert}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--app-muted)]">Juicio situacional</p>
                      <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{currentMetric.sjt}%</p>
                    </div>
                  </div>
                </div>
              )}

              {filter !== "all" && (
                <div id="competencies-breakdown" className="rounded-[22px] border border-[var(--app-border)] bg-white/82 px-5 py-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    Competencias y puntajes
                  </p>
                  <div className="mt-4 space-y-4 divide-y divide-[var(--app-border)]">
                    {scoring.compList
                      .filter((c) => c.pillar === filter)
                      .map((c) => {
                        const percent = Math.round(((c.score - 1) / 4) * 100);
                        return (
                          <div key={c.name} className="pt-4 first:pt-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-[var(--app-ink)]">{c.name}</p>
                              <p className="text-sm font-black text-[var(--brand-primary)]">{percent}%</p>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--app-muted)]">
                              {COMP_DEFINITIONS[c.name] ?? "Capacidad estratégica vinculada al pilar."}
                            </p>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                                <div 
                                    className="h-full bg-[var(--brand-primary)] transition-all duration-700" 
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside id="executive-summary" className="app-panel p-5 sm:p-6">
          <p className="app-section-kicker">Informe ejecutivo</p>
          <h4 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
            {filter === "all" ? "Visión general" : PILLAR_INFO[filter].title}
          </h4>
          <div className="relative mt-6">
            {shouldMaskAnalysis && (
              <div className="pointer-events-none absolute inset-0 z-20 rounded-[16px] border border-[var(--app-border)] bg-white/82 backdrop-blur-[1px]">
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)]">
                      <Loader2 size={14} className="animate-spin text-[var(--brand-primary)]" />
                      Generando análisis
                    </div>
                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                      <span>Progreso</span>
                      <span>{displayedProgressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
                        style={{ width: `${Math.max(displayedProgressPercent, 8)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-[var(--app-muted)]">
                    {analysisCompletedCount} de {ALL_REPORT_FILTERS.length} vistas cerradas
                  </div>
                </div>
              </div>
            )}
            <div className="prose prose-slate max-w-none text-[15px] leading-relaxed md:text-sm md:leading-7">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="mb-4 mt-8 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-base font-black text-[var(--app-ink)] first:mt-0">
                      {children}
                    </h2>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-[var(--app-muted)] last:mb-0">
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="mb-2 text-[var(--app-muted)]">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-extrabold text-[var(--app-ink)]">
                      {children}
                    </strong>
                  ),
                }}
              >
                {currentReport}
              </ReactMarkdown>
            </div>

          </div>
        </aside>
      </div>

      {isTourOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(15,23,42,0.48)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[22px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="app-section-kicker">Tour 4Shine</p>
              <p className="text-xs font-bold text-[var(--app-muted)]">Paso {tourStepIdx + 1} de {TOUR_STEPS.length}</p>
            </div>
            
            <h3 className="mt-3 text-2xl font-black text-[var(--app-ink)]">{TOUR_STEPS[tourStepIdx].title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">{TOUR_STEPS[tourStepIdx].text}</p>
            
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsTourOpen(false);
                  window.localStorage.setItem("discovery-results-tour-seen", "1");
                }}
                className="text-xs font-semibold text-[var(--app-muted)] underline underline-offset-4"
              >
                Saltar tour
              </button>
              <button
                type="button"
                onClick={handleNextTourStep}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white"
              >
                {tourStepIdx === TOUR_STEPS.length - 1 ? "Finalizar" : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {maximizedChart && (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-white px-4 py-8 md:p-12">
           <button
            type="button"
            onClick={() => setMaximizedChart(null)}
            className="absolute right-6 top-6 rounded-full border border-[var(--app-border)] bg-white p-3 text-[var(--app-ink)] shadow-sm transition hover:bg-[var(--app-surface-muted)]"
          >
            <LogOut size={24} className="rotate-180" />
            <span className="sr-only">Cerrar</span>
          </button>

          <div className="w-full max-w-4xl text-center">
            <h3 className="text-3xl font-black text-[var(--app-ink)] md:text-4xl">
              {maximizedChart === "global" ? "Vista integral" : PILLAR_INFO[filter as DiscoveryPillarKey].title}
            </h3>
            <p className="mt-4 text-[var(--app-muted)]">Gráfica detallada de {maximizedChart === "global" ? "liderazgo global" : "competencias del pilar"}</p>
          </div>

          <div className="mt-8 h-full min-h-0 w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-6 md:p-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="85%"
                data={maximizedChart === "global" ? radarData : pillarRadarData}
              >
                <PolarGrid stroke="rgba(88,54,108,0.22)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#372050", fontSize: 13, fontWeight: 800 }}
                />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${String(value ?? 0)}%`, "Score"]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName ?? String(label)
                  }
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid var(--app-border)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                    padding: "10px 14px"
                  }}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--brand-primary)"
                  fill="var(--brand-primary)"
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 flex items-center gap-6">
             <div className="text-center">
               <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Score actual</p>
               <p className="mt-1 text-4xl font-black text-[var(--brand-primary)]">{currentScore}%</p>
             </div>
             <div className="h-10 w-px bg-[var(--app-border)]" />
             <div className="text-center">
               <p className="text-xs font-black uppercase tracking-widest text-[var(--app-muted)]">Nivel</p>
               <p className="mt-1 text-4xl font-black text-[var(--app-ink)]">{currentStatus.label}</p>
             </div>
          </div>
        </div>
      )}

      {isSurveyOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(15,23,42,0.48)] px-4 py-8 backdrop-blur-sm">
          <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--app-border)] p-6">
              <p className="app-section-kicker">Encuesta breve</p>
              <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)]">Califica tu experiencia</h3>
              <p className="mt-2 text-sm text-[var(--app-muted)]">
                Ayúdanos a mejorar el proceso de diagnóstico.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <div className="space-y-4">
                {SURVEY_QUESTIONS.map((question) => (
                  <div key={question} className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] p-4">
                    <p className="text-sm font-bold leading-snug text-[var(--app-ink)]">{question}</p>
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                      {FACE_SCALE.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSurveyAnswers((current) => ({
                              ...current,
                              [question]: value,
                            }))
                          }
                          className={clsx(
                            "group inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200",
                            surveyAnswers[question] === value
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[0_6px_14px_rgba(60,20,125,0.22)]"
                              : "border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:border-[var(--brand-primary)]/40 hover:bg-white hover:text-[var(--brand-primary)]",
                          )}
                          title={label}
                          aria-label={`${label} (${value})`}
                        >
                          <Icon
                            size={20}
                            className={clsx(
                              "transition",
                              surveyAnswers[question] === value ? "scale-110" : "opacity-85 group-hover:scale-110",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[var(--app-border)] p-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPendingSurveyAction(null);
                  setIsSurveyOpen(false);
                  scheduleSurveyPrompt(300000);
                }}
                className="order-2 rounded-full border border-[var(--app-border)] bg-white py-3 text-sm font-bold text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] sm:order-1"
              >
                Cerrar por ahora
              </button>
              <button
                type="button"
                onClick={() => void submitSurvey()}
                className="order-1 rounded-full bg-[var(--brand-primary)] py-3 text-sm font-black text-white shadow-[0_10px_20px_-5px_rgba(60,20,125,0.25)] transition hover:brightness-110 sm:order-2"
              >
                Enviar respuestas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
