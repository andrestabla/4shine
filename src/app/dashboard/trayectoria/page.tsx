"use client";

import clsx from "clsx";
import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Compass,
  Download,
  Flag,
  Loader2,
  Lock,
  MessageSquareMore,
  Radar as RadarIcon,
  Sparkles,
  Users,
} from "lucide-react";
import { AccessOfferPanel } from "@/components/access/AccessOfferPanel";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { useUser } from "@/context/UserContext";
import { filterCommercialProducts } from "@/features/access/catalog";
import {
  listEarnedCertificates,
  listLearningWorkbooks,
  type CourseCertificateData,
  type WorkbookRecord,
} from "@/features/aprendizaje/client";
import { downloadCourseCertificate } from "@/lib/certificate-generator";
import {
  getDiscoverySession,
  type DiscoverySessionRecord,
} from "@/features/descubrimiento/client";
import {
  LEADER_JOURNEY_PHASES,
  LEADER_JOURNEY_STEPS,
  type JourneyMilestoneCode,
  type JourneyPhaseDefinition,
  type JourneyWeekStep,
} from "@/features/trayectoria/journey-leader";

type LeaderPhaseStatus = "completed" | "current" | "locked";

interface LeaderPhaseModel extends JourneyPhaseDefinition {
  steps: JourneyWeekStep[];
  progressPercent: number;
  status: LeaderPhaseStatus;
  completedUnits: number;
  totalUnits: number;
  mentorshipMoments: string[];
  learningHighlights: string[];
  networkingHighlights: string[];
  opportunityHighlights: string[];
  workshopHighlights: string[];
  primaryHref: string;
  primaryLabel: string;
}

interface ActionCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const IMPACT_TARGET = 85;

function clampPercent(value: number | undefined | null): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function uniqueLines(values: string[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const value of values) {
    for (const line of value.split(/\n+/)) {
      const normalized = line.replace(/\s+/g, " ").trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(normalized);
    }
  }

  return lines;
}

function summarize(value: string, maxLength = 130): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function roleViewLabel(role: string | null): string {
  if (role === "mentor") return "Vista Adviser";
  if (role === "gestor") return "Vista gestor";
  if (role === "admin") return "Vista admin";
  return "Vista líder";
}

function findWorkbookHref(workbook: WorkbookRecord | undefined): string {
  if (!workbook) return "/dashboard/aprendizaje";
  return `/dashboard/aprendizaje/workbooks/${workbook.templateCode}?workbookId=${workbook.workbookId}`;
}

function buildMilestoneProgressMap(
  workbooks: WorkbookRecord[],
  discoverySession: DiscoverySessionRecord | null,
): Map<JourneyMilestoneCode, number> {
  const milestoneProgress = new Map<JourneyMilestoneCode, number>();

  milestoneProgress.set(
    "discovery",
    clampPercent(discoverySession?.completionPercent ?? 0),
  );

  for (const workbook of workbooks) {
    milestoneProgress.set(
      workbook.templateCode as JourneyMilestoneCode,
      clampPercent(workbook.completionPercent),
    );
  }

  return milestoneProgress;
}

function calculateCurrentJourneyWeek(
  milestoneProgress: Map<JourneyMilestoneCode, number>,
): number {
  let completedStepUnits = 0;

  for (const step of LEADER_JOURNEY_STEPS) {
    const progress = milestoneProgress.get(step.milestoneCode) ?? 0;
    completedStepUnits += progress / 100;
  }

  const normalized = Math.max(
    1,
    Math.min(24, Math.round(completedStepUnits)),
  );

  return normalized;
}

function buildLeaderPhaseModels(
  workbooks: WorkbookRecord[],
  discoverySession: DiscoverySessionRecord | null,
): LeaderPhaseModel[] {
  const workbookMap = new Map(workbooks.map((workbook) => [workbook.templateCode, workbook]));
  const milestoneProgress = buildMilestoneProgressMap(workbooks, discoverySession);

  let foundCurrent = false;

  return LEADER_JOURNEY_PHASES.map((phase) => {
    const steps = LEADER_JOURNEY_STEPS.filter(
      (step) =>
        step.transformationMoment === phase.transformationMoment &&
        phase.milestoneCodes.includes(step.milestoneCode),
    );
    const progressValues = phase.milestoneCodes.map(
      (code) => milestoneProgress.get(code) ?? 0,
    );
    const completedUnits = progressValues.filter((value) => value >= 100).length;
    const progressPercent = average(progressValues);
    const isCompleted = completedUnits === phase.milestoneCodes.length;

    let status: LeaderPhaseStatus = "locked";
    if (isCompleted) {
      status = "completed";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    }

    const workbooksInPhase = phase.milestoneCodes
      .filter((code) => code !== "discovery")
      .map((code) => workbookMap.get(code))
      .filter(Boolean) as WorkbookRecord[];
    const nextWorkbook =
      workbooksInPhase.find((item) => clampPercent(item.completionPercent) < 100) ??
      workbooksInPhase[0];

    return {
      ...phase,
      steps,
      progressPercent,
      status,
      completedUnits,
      totalUnits: phase.milestoneCodes.length,
      mentorshipMoments: uniqueLines(steps.map((step) => step.mentorship)).filter((line) =>
        line.toLowerCase().includes("mentoría"),
      ),
      learningHighlights: uniqueLines(steps.map((step) => step.learning)),
      networkingHighlights: uniqueLines(steps.map((step) => step.networking)),
      opportunityHighlights: uniqueLines(steps.map((step) => step.opportunities)),
      workshopHighlights: uniqueLines(steps.map((step) => step.workshops)),
      primaryHref:
        phase.id === "discovery"
          ? "/dashboard/descubrimiento"
          : findWorkbookHref(nextWorkbook),
      primaryLabel:
        phase.id === "discovery"
          ? status === "completed"
            ? "Ver diagnóstico"
            : "Completar diagnóstico"
          : status === "completed"
            ? "Revisar etapa"
            : nextWorkbook
              ? `Abrir ${nextWorkbook.templateCode.toUpperCase()}`
              : "Abrir aprendizaje",
    };
  });
}

function buildFallbackPhaseModels(): LeaderPhaseModel[] {
  return LEADER_JOURNEY_PHASES.map((phase) => {
    const steps = LEADER_JOURNEY_STEPS.filter(
      (step) =>
        step.transformationMoment === phase.transformationMoment &&
        phase.milestoneCodes.includes(step.milestoneCode),
    );

    return {
      ...phase,
      steps,
      progressPercent: 0,
      status: "locked",
      completedUnits: 0,
      totalUnits: phase.milestoneCodes.length,
      mentorshipMoments: uniqueLines(steps.map((step) => step.mentorship)).filter((line) =>
        line.toLowerCase().includes("mentoría"),
      ),
      learningHighlights: uniqueLines(steps.map((step) => step.learning)),
      networkingHighlights: uniqueLines(steps.map((step) => step.networking)),
      opportunityHighlights: uniqueLines(steps.map((step) => step.opportunities)),
      workshopHighlights: uniqueLines(steps.map((step) => step.workshops)),
      primaryHref: phase.routePath,
      primaryLabel: "Ver etapa",
    };
  });
}

function phaseStatusLabel(status: LeaderPhaseStatus): string {
  if (status === "completed") return "Completado";
  if (status === "current") return "Presente";
  return "Bloqueado";
}

function recognitionIcon(id: JourneyPhaseDefinition["id"]) {
  if (id === "discovery") return Compass;
  if (id === "shine_within") return Sparkles;
  if (id === "shine_out") return RadarIcon;
  if (id === "shine_up") return Users;
  return Award;
}

function challengeIcon(index: number) {
  if (index === 0) return Flag;
  if (index === 1) return CalendarDays;
  return Users;
}

export default function TrayectoriaPage() {
  const { currentUser, currentRole, bootstrapData, viewerAccess } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [discoverySession, setDiscoverySession] =
    React.useState<DiscoverySessionRecord | null>(null);
  const [earnedCertificates, setEarnedCertificates] = React.useState<CourseCertificateData[]>([]);
  const [downloadingCertId, setDownloadingCertId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!currentRole || currentRole !== "lider") {
      return;
    }

    if (viewerAccess && !viewerAccess.canAccessTrayectoria) {
      setIsLoading(false);
      setWorkbooks([]);
      setDiscoverySession(null);
      setLoadError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadError(null);

    Promise.allSettled([listLearningWorkbooks(), getDiscoverySession(), listEarnedCertificates()])
      .then(([workbooksResult, discoveryResult, certsResult]) => {
        if (!active) return;

        const nextErrors: string[] = [];

        if (workbooksResult.status === "fulfilled") {
          setWorkbooks(workbooksResult.value);
        } else {
          setWorkbooks([]);
          nextErrors.push("No pudimos leer los workbooks de esta cuenta.");
        }

        if (discoveryResult.status === "fulfilled") {
          setDiscoverySession(discoveryResult.value);
        } else {
          setDiscoverySession(null);
        }

        if (certsResult.status === "fulfilled") {
          setEarnedCertificates(certsResult.value);
        } else {
          setEarnedCertificates([]);
        }

        if (nextErrors.length > 0) {
          setLoadError(nextErrors.join(" "));
        }
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar la trayectoria en este momento.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentRole, viewerAccess]);

  if (!currentUser || !currentRole || !bootstrapData) {
    return null;
  }

  const isLockedForViewer =
    currentRole === "lider" &&
    viewerAccess !== null &&
    !viewerAccess.canAccessTrayectoria;
  const trajectoryOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ["program_4shine"],
  });

  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const leaderPhaseModels =
    currentRole === "lider"
      ? buildLeaderPhaseModels(workbooks, discoverySession)
      : buildFallbackPhaseModels();
  const currentJourneyWeek =
    currentRole === "lider"
      ? calculateCurrentJourneyWeek(
          buildMilestoneProgressMap(workbooks, discoverySession),
        )
      : 1;
  const activePhase =
    leaderPhaseModels.find((phase) => phase.status === "current") ??
    leaderPhaseModels[leaderPhaseModels.length - 1];
  const completedPhases = leaderPhaseModels.filter(
    (phase) => phase.status === "completed",
  ).length;
  const completedWorkbooks = workbooks.filter(
    (workbook) => clampPercent(workbook.completionPercent) >= 100,
  ).length;

  const impactScores = currentUser.testResults ?? {
    shineWithin: 0,
    shineOut: 0,
    shineUp: 0,
    shineBeyond: 0,
  };
  const impactData = [
    { subject: "Shine Within", value: clampPercent(impactScores.shineWithin), target: IMPACT_TARGET },
    { subject: "Shine Out", value: clampPercent(impactScores.shineOut), target: IMPACT_TARGET },
    { subject: "Shine Up", value: clampPercent(impactScores.shineUp), target: IMPACT_TARGET },
    { subject: "Shine Beyond", value: clampPercent(impactScores.shineBeyond), target: IMPACT_TARGET },
  ];
  const impactAverage = average(impactData.map((item) => item.value));
  const impactReady = impactData.some((item) => item.value > 0);

  const leaderStats = [
    {
      label: "Hitos",
      value: `${completedPhases}/5`,
      hint: "Tramos estratégicos completados",
    },
    {
      label: "Semanas",
      value: `${currentJourneyWeek}/24`,
      hint: "Punto actual del journey oficial",
    },
    {
      label: "Workbooks",
      value: `${completedWorkbooks}/10`,
      hint: "Instancias cerradas con avance real",
    },
    {
      label: "Impacto",
      value: `${impactAverage}%`,
      hint: "Lectura consolidada por pilares",
    },
  ];

  const programStats = [
    {
      label: "Semanas",
      value: 24,
      hint: "Ruta líder oficial",
    },
    {
      label: "Hitos",
      value: 5,
      hint: "Momentos de transformación",
    },
    {
      label: "Líderes",
      value: bootstrapData.mentees.length,
      hint: "En seguimiento",
    },
    {
      label: "Progreso medio",
      value: `${average(bootstrapData.mentees.map((mentee) => mentee.progress))}%`,
      hint: "Referencia cohortes activas",
    },
  ];

  const phaseActionCards: ActionCard[] = [
    {
      title: "Aprendizaje",
      description:
        summarize(activePhase.learningHighlights[0] ?? activePhase.goal),
      href: "/dashboard/aprendizaje",
      icon: BookOpen,
    },
    {
      title: "Mentorías",
      description: summarize(
        activePhase.mentorshipMoments[0] ??
          "Revisa tus próximas sesiones y mantén continuidad en la conversación.",
      ),
      href: "/dashboard/mentorias",
      icon: CalendarDays,
    },
    {
      title: "Networking",
      description: summarize(
        activePhase.networkingHighlights.join(" · ") || "Activa relaciones clave durante esta etapa.",
      ),
      href: "/dashboard/networking",
      icon: Users,
    },
    {
      title: "Convocatorias y workshops",
      description: summarize(
        [...activePhase.opportunityHighlights, ...activePhase.workshopHighlights].join(
          " · ",
        ) || "Explora oportunidades aplicables a tu etapa actual.",
      ),
      href: "/dashboard/workshops",
      icon: BriefcaseBusiness,
    },
  ];

  const challengeCards = (currentUser.nextChallenges?.length
    ? currentUser.nextChallenges.slice(0, 3).map((challenge) => ({
        title: challenge.title,
        description: challenge.description,
      }))
    : [
        {
          title: activePhase.primaryLabel,
          description: activePhase.goal,
        },
        {
          title: "Preparar la siguiente mentoría",
          description:
            activePhase.mentorshipMoments[0] ??
            "Alinea preguntas y aprendizajes antes de tu próxima sesión.",
        },
        {
          title: "Activar relaciones y visibilidad",
          description:
            activePhase.networkingHighlights.join(" · ") ||
            "Usa networking, convocatorias y workshops para ampliar tu ecosistema.",
        },
      ]) as Array<{ title: string; description: string }>;

  if (currentRole !== "lider") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="app-chip uppercase">{roleViewLabel(currentRole)}</span>
            <p className="mt-5 text-xl font-medium text-[var(--app-muted)] md:text-2xl">
              Trayectoria del programa
            </p>
            <h1
              className="app-display-title mt-2 text-[2.8rem] font-semibold leading-[0.94] text-[var(--app-ink)] md:text-[4rem]"
              data-display-font="true"
            >
              Blueprint del Journey líder
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
              La ruta oficial está organizada en 24 semanas y 5 hitos
              estratégicos: descubrimiento, esencia, presencia, ecosistema y
              legado.
            </p>
          </div>
        </div>

        <StatGrid stats={programStats} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Timeline oficial</p>
            </div>
            <div className="mt-6 grid gap-4">
              {LEADER_JOURNEY_PHASES.map((phase) => (
                <article
                  key={phase.id}
                  className={clsx(
                    "rounded-[22px] border p-5",
                    phase.accent.border,
                    phase.accent.soft,
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={clsx("text-[11px] font-extrabold uppercase tracking-[0.22em]", phase.accent.text)}>
                        {phase.weekRangeLabel}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                        {phase.title}
                      </h3>
                    </div>
                    <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-bold text-[var(--app-muted)]">
                      {phase.milestoneCodes.length === 1 ? "1 hito" : `${phase.milestoneCodes.length} workbooks`}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)]">
                    {phase.goal}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="app-panel p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--brand-primary)]" />
                <p className="app-section-kicker">Resumen de líderes</p>
              </div>
              <div className="mt-5 space-y-3">
                {bootstrapData.mentees.slice(0, 6).map((mentee) => (
                  <div
                    key={mentee.id}
                    className="rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-[var(--app-ink)]">{mentee.name}</p>
                        <p className="text-xs text-[var(--app-muted)]">
                          {mentee.company} · {mentee.industry}
                        </p>
                      </div>
                      <span className="text-sm font-black text-[var(--app-ink)]">
                        {mentee.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--brand-primary)]"
                        style={{ width: `${clampPercent(mentee.progress)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-[var(--brand-primary)]" />
          <p className="mt-3 text-sm text-[var(--app-muted)]">
            Preparando tu trayectoria 4Shine...
          </p>
        </div>
      </div>
    );
  }

  if (isLockedForViewer) {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Trayectoria"
          subtitle="La timeline del journey líder se activa con el programa 4Shine."
        />
        <AccessOfferPanel
          badge="Ruta bloqueada"
          title="Activa el programa para desbloquear tu trayectoria."
          description={
            viewerAccess?.hasAnyPurchase
              ? "Tu cuenta ya tiene actividad comercial, pero la timeline completa, los hitos y el seguimiento del journey requieren el programa 4Shine."
              : "Todavía no hay una compra asociada a esta cuenta. Al activar el programa 4Shine se desbloquean los 5 hitos, la timeline de 24 semanas, los workbooks y el progreso integral."
          }
          products={trajectoryOffers}
          primaryAction={{
            href: "/dashboard",
            label: "Ver plan 4Shine",
          }}
          note="Trayectoria conecta diagnóstico, workbooks, mentorías incluidas y señales del programa en una sola línea de tiempo por usuario."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <span className="app-chip uppercase">{roleViewLabel(currentRole)}</span>
          <p className="mt-5 text-xl font-medium text-[var(--app-muted)] md:text-2xl">
            Hola, <span className="font-black text-[var(--app-ink)]">{firstName}</span>
          </p>
          <h1
            className="app-display-title mt-2 text-[2.8rem] font-semibold leading-[0.94] text-[var(--app-ink)] md:text-[4rem]"
            data-display-font="true"
          >
            Mi Trayectoria
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
            Visualiza tu evolución y gestiona tus 5 hitos clave del journey
            líder 4Shine, conectando diagnóstico, workbooks, mentorías y
            oportunidades del programa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/mensajes"
            className="app-button-secondary"
          >
            <MessageSquareMore size={16} />
            Mensajes
          </Link>
          <Link
            href={activePhase.primaryHref}
            className="app-button-primary"
          >
            {activePhase.primaryLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <StatGrid stats={leaderStats} />

      {loadError && (
        <section className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-5 py-5 text-sm text-rose-700">
          No pudimos sincronizar la trayectoria con tus módulos actuales.{" "}
          {loadError}
        </section>
      )}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
        <section className="app-panel p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[var(--brand-primary)]" />
            <p className="app-section-kicker">Línea de tiempo</p>
          </div>

          <div className="mt-6 space-y-5">
            {leaderPhaseModels.map((phase, index) => {
              const Icon = recognitionIcon(phase.id);

              return (
                <div
                  key={phase.id}
                  className="grid grid-cols-[28px_minmax(0,1fr)] gap-4"
                >
                  <div className="relative flex justify-center">
                    {index < leaderPhaseModels.length - 1 && (
                      <span className="absolute top-6 h-[calc(100%+1.5rem)] w-px bg-[var(--app-border)]" />
                    )}
                    <span
                      className={clsx(
                        "relative z-10 mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-4 border-white shadow-[0_10px_18px_rgba(15,23,42,0.12)]",
                        phase.status === "completed" && "bg-emerald-500",
                        phase.status === "current" && "bg-amber-500",
                        phase.status === "locked" && "bg-slate-300",
                      )}
                    >
                      {phase.status === "completed" ? (
                        <CheckCircle2 size={12} className="text-white" />
                      ) : phase.status === "locked" ? (
                        <Lock size={11} className="text-white" />
                      ) : (
                        <Icon size={12} className="text-white" />
                      )}
                    </span>
                  </div>

                  <article
                    className={clsx(
                      "rounded-[1.2rem] border px-5 py-5 transition",
                      phase.status === "completed" &&
                        "border-emerald-200 bg-white shadow-[0_18px_34px_rgba(16,185,129,0.08)]",
                      phase.status === "current" &&
                        clsx(
                          phase.accent.border,
                          phase.accent.soft,
                          phase.accent.glow,
                        ),
                      phase.status === "locked" &&
                        "border-[var(--app-border)] bg-[rgba(248,250,252,0.92)] opacity-80",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                          {phase.weekRangeLabel}
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                          {phase.title}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--app-muted)]">
                          {phase.subtitle}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em]",
                            phase.status === "completed" &&
                              "bg-emerald-100 text-emerald-700",
                            phase.status === "current" &&
                              "bg-amber-100 text-amber-700",
                            phase.status === "locked" &&
                              "bg-slate-100 text-slate-500",
                          )}
                        >
                          {phaseStatusLabel(phase.status)}
                        </span>
                        <p className="mt-3 text-2xl font-black text-[var(--app-ink)]">
                          {phase.progressPercent}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/70">
                      <div
                        className={clsx(
                          "h-full rounded-full",
                          phase.status === "completed" && "bg-emerald-500",
                          phase.status === "current" && phase.accent.solid,
                          phase.status === "locked" && "bg-slate-300",
                        )}
                        style={{ width: `${phase.progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="app-chip-soft">
                        {phase.totalUnits === 1
                          ? "1 hito principal"
                          : `${phase.completedUnits}/${phase.totalUnits} workbooks cerrados`}
                      </span>
                      {phase.mentorshipMoments[0] && (
                        <span className="app-chip-soft">
                          {summarize(phase.mentorshipMoments[0], 58)}
                        </span>
                      )}
                    </div>

                    {phase.status === "current" && (
                      <Link
                        href={phase.primaryHref}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-primary)] transition hover:translate-x-0.5"
                      >
                        {phase.primaryLabel}
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="app-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <RadarIcon size={16} className="text-[var(--brand-primary)]" />
                  <p className="app-section-kicker">Resultados de impacto</p>
                </div>
                <h3 className="mt-3 text-2xl font-black text-[var(--app-ink)]">
                  Tu mapa de avance por pilares
                </h3>
              </div>
              <Link
                href="/dashboard/descubrimiento"
                className="app-button-secondary min-h-0 px-4 py-2"
              >
                {impactReady ? "Ver informe completo" : "Completar diagnóstico"}
              </Link>
            </div>

            <div className="mt-6 h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={impactData}>
                  <PolarGrid stroke="rgba(124, 138, 163, 0.22)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar
                    name="Objetivo"
                    dataKey="target"
                    stroke="rgba(148,163,184,0.78)"
                    fill="transparent"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                  <Radar
                    name="Resultado"
                    dataKey="value"
                    stroke="var(--brand-accent, #f6b74c)"
                    fill="rgba(246,183,76,0.18)"
                    strokeWidth={2.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-5 text-sm text-[var(--app-muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-[var(--brand-accent,#f6b74c)] bg-[rgba(246,183,76,0.18)]" />
                Tu resultado
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-dashed border-slate-400" />
                Nivel objetivo
              </span>
            </div>

            {!impactReady && (
              <p className="app-panel-soft mt-4 px-4 py-4 text-sm text-[var(--app-muted)]">
                Completa Descubrimiento para activar una lectura comparativa de
                tus pilares en esta vista.
              </p>
            )}
          </section>

          <section className="app-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Flag size={16} className="text-[var(--brand-primary)]" />
                  <p className="app-section-kicker">Ruta activa</p>
                </div>
                <h3 className="mt-3 text-2xl font-black text-[var(--app-ink)]">
                  {activePhase.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {activePhase.goal}
                </p>
              </div>
              <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                {activePhase.weekRangeLabel}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {activePhase.steps.map((step) => (
                <span
                  key={step.weekLabel}
                  className="app-chip-soft"
                >
                  {step.weekLabel}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {phaseActionCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="app-list-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                      <card.icon size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--app-ink)]">{card.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Próximos desafíos</p>
            </div>

            <div className="mt-5 grid gap-3">
              {challengeCards.map((challenge, index) => {
                const Icon = challengeIcon(index);
                return (
                  <article
                    key={`${challenge.title}-${index}`}
                    className="app-list-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--app-ink)]">{challenge.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">
                          {summarize(challenge.description, 170)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-[var(--brand-primary)]" />
              <p className="app-section-kicker">Reconocimientos</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
              {leaderPhaseModels.map((phase) => {
                const Icon = recognitionIcon(phase.id);
                const isCompleted = phase.status === "completed";
                const isCurrent = phase.status === "current";

                return (
                  <article
                    key={phase.id}
                    className={clsx(
                      "rounded-[1.15rem] border px-4 py-5 text-center",
                      isCompleted && "border-emerald-200 bg-emerald-50",
                      isCurrent && "border-amber-200 bg-amber-50",
                      !isCompleted && !isCurrent && "border-[var(--app-border)] bg-[rgba(248,250,252,0.82)]",
                    )}
                  >
                    <div
                      className={clsx(
                        "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
                        isCompleted && "bg-white text-emerald-600",
                        isCurrent && "bg-white text-amber-600",
                        !isCompleted && !isCurrent && "bg-white text-slate-400",
                      )}
                    >
                      <Icon size={22} />
                    </div>
                    <p className="mt-4 font-black text-[var(--app-ink)]">
                      {phase.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      {phase.shortTitle}
                    </p>
                    <span
                      className={clsx(
                        "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em]",
                        isCompleted && "bg-emerald-100 text-emerald-700",
                        isCurrent && "bg-amber-100 text-amber-700",
                        !isCompleted && !isCurrent && "bg-slate-100 text-slate-500",
                      )}
                    >
                      {phaseStatusLabel(phase.status)}
                    </span>
                  </article>
                );
              })}

              {/* Earned course certificates */}
              {earnedCertificates.map((cert) => (
                <article
                  key={cert.contentId}
                  className="rounded-[1.15rem] border border-violet-200 bg-violet-50 px-4 py-5 text-center"
                >
                  <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white"
                    style={{ color: cert.template.accentColor }}
                  >
                    <Award size={22} />
                  </div>
                  <p className="mt-4 font-black text-[var(--app-ink)] leading-snug line-clamp-2">
                    {cert.courseTitle}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {cert.template.organizationName}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">
                    Certificado
                  </span>
                  <button
                    type="button"
                    disabled={downloadingCertId === cert.contentId}
                    onClick={async () => {
                      setDownloadingCertId(cert.contentId);
                      try {
                        await downloadCourseCertificate({
                          template: cert.template,
                          recipientName: cert.recipientName,
                          courseName: cert.courseTitle,
                          completedAt: cert.completedAt,
                        });
                      } finally {
                        setDownloadingCertId(null);
                      }
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
                  >
                    {downloadingCertId === cert.contentId ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    {downloadingCertId === cert.contentId ? "Generando…" : "Descargar"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
