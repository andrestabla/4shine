"use client";

import React from "react";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { useUser } from "@/context/UserContext";
import { DB, SCALES } from "./DiagnosticsData";
import {
  DISCOVERY_ITEMS_PER_PAGE,
  calculateDiscoveryCompletionPercent,
} from "./reporting";
import {
  getDiscoverySession,
  resetDiscoverySessionRequest,
  shareDiscoverySessionRequest,
  updateDiscoverySessionRequest,
} from "./client";
import { ResultsView } from "./ResultsView";
import {
  type DiscoverySessionRecord,
  type DiscoveryUserState,
} from "./types";

type SaveIndicator = "idle" | "saving" | "saved" | "error";

function toUserState(session: DiscoverySessionRecord): DiscoveryUserState {
  return {
    name: session.nameSnapshot,
    answers: session.answers,
    currentIdx: session.currentIdx,
    status: session.status,
  };
}

function buildPersistPayload(state: DiscoveryUserState) {
  return {
    status: state.status,
    answers: state.answers,
    currentIdx: state.currentIdx,
    completionPercent: calculateDiscoveryCompletionPercent(state.answers),
  };
}

export function DiscoveryExperience() {
  const { currentUser } = useUser();
  const { alert, confirm } = useAppDialog();
  const [session, setSession] = React.useState<DiscoverySessionRecord | null>(null);
  const [state, setState] = React.useState<DiscoveryUserState>({
    name: currentUser?.name ?? "Usuario 4Shine",
    answers: {},
    currentIdx: 0,
    status: "intro",
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [saveIndicator, setSaveIndicator] = React.useState<SaveIndicator>("idle");
  const hydratedRef = React.useRef(false);
  const lastSnapshotRef = React.useRef("");

  const applySession = React.useCallback((next: DiscoverySessionRecord) => {
    setSession(next);
    const nextState = toUserState(next);
    setState(nextState);
    lastSnapshotRef.current = JSON.stringify(buildPersistPayload(nextState));
    hydratedRef.current = true;
  }, []);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextSession = await getDiscoverySession();
        if (!active) return;
        applySession(nextSession);
      } catch (error) {
        if (!active) return;
        await alert({
          title: "No se pudo cargar Descubrimiento",
          message:
            error instanceof Error
              ? error.message
              : "Inténtalo nuevamente en unos segundos.",
          tone: "error",
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [alert, applySession]);

  React.useEffect(() => {
    if (!hydratedRef.current) return;
    const snapshot = JSON.stringify(buildPersistPayload(state));
    if (snapshot === lastSnapshotRef.current) return;

    const timeoutId = window.setTimeout(async () => {
      setSaveIndicator("saving");
      try {
        const nextSession = await updateDiscoverySessionRequest(
          buildPersistPayload(state),
        );
        setSession(nextSession);
        lastSnapshotRef.current = snapshot;
        setSaveIndicator("saved");
        window.setTimeout(() => {
          setSaveIndicator((current) => (current === "saved" ? "idle" : current));
        }, 1200);
      } catch {
        setSaveIndicator("error");
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  React.useEffect(() => {
    if (state.status !== "quiz") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.currentIdx, state.status]);

  if (!currentUser && !isLoading) {
    return null;
  }

  const answeredCount = Object.keys(state.answers).length;
  const completionPercent = calculateDiscoveryCompletionPercent(state.answers);
  const stats = [
    { label: "Preguntas", value: DB.length, hint: "Diagnóstico integral" },
    { label: "Pilares", value: 4, hint: "Within, Out, Up y Beyond" },
    { label: "Situacionales", value: 29, hint: "Criterio aplicado" },
    { label: "Duración", value: "20-25m", hint: "Promedio estimado" },
  ];
  const canResume = answeredCount > 0;

  const persistImmediately = async (next: DiscoveryUserState, markCompleted = false) => {
    const nextPayload = {
      ...buildPersistPayload(next),
      markCompleted,
    };
    const nextSession = await updateDiscoverySessionRequest(nextPayload);
    applySession(nextSession);
    setSaveIndicator("saved");
  };

  const handleIntroStart = () => {
    setState((current) => ({
      ...current,
      name: currentUser?.name ?? current.name,
      status:
        current.status === "results"
          ? "results"
          : canResume
            ? "quiz"
            : "instructions",
    }));
  };

  const handleStartQuiz = () => {
    setState((current) => ({
      ...current,
      name: currentUser?.name ?? current.name,
      status: "quiz",
    }));
  };

  const handleAnswer = (questionId: string | number, value: string | number) => {
    setState((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [String(questionId)]: value,
      },
    }));
  };

  const handlePrevPage = () => {
    setState((current) => ({
      ...current,
      currentIdx: Math.max(0, current.currentIdx - DISCOVERY_ITEMS_PER_PAGE),
    }));
  };

  const handleNextPage = async () => {
    const start = state.currentIdx;
    const end = Math.min(start + DISCOVERY_ITEMS_PER_PAGE, DB.length);
    const pageItems = DB.slice(start, end);
    const missing = pageItems.find(
      (item) => state.answers[String(item.id)] === undefined,
    );

    if (missing) {
      await alert({
        title: "Faltan respuestas",
        message: "Responde todas las preguntas visibles antes de continuar.",
        tone: "warning",
      });
      return;
    }

    if (end >= DB.length) {
      const nextState: DiscoveryUserState = {
        ...state,
        status: "results",
      };
      setState(nextState);
      try {
        await persistImmediately(nextState, true);
      } catch (error) {
        await alert({
          title: "No pudimos cerrar tu diagnóstico",
          message:
            error instanceof Error
              ? error.message
              : "Inténtalo nuevamente en unos segundos.",
          tone: "error",
        });
      }
      return;
    }

    setState((current) => ({
      ...current,
      currentIdx: end,
    }));
  };

  const handleReset = async () => {
    const approved = await confirm({
      title: "Reiniciar diagnóstico",
      message:
        "Se limpiarán tus respuestas y volverás al inicio del diagnóstico.",
      tone: "warning",
      confirmText: "Reiniciar",
      cancelText: "Cancelar",
    });

    if (!approved) return;

    try {
      const nextSession = await resetDiscoverySessionRequest();
      applySession(nextSession);
      setSaveIndicator("idle");
    } catch (error) {
      await alert({
        title: "No se pudo reiniciar",
        message:
          error instanceof Error
            ? error.message
            : "Inténtalo nuevamente en unos segundos.",
        tone: "error",
      });
    }
  };

  const handleShare = async () => {
    const nextSession = await shareDiscoverySessionRequest({
      ...buildPersistPayload({
        ...state,
        status: "results",
      }),
      markCompleted: true,
    });
    applySession(nextSession);
    return nextSession;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-[var(--brand-primary)]" />
          <p className="mt-3 text-sm text-[var(--app-muted)]">
            Preparando tu experiencia de descubrimiento...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "results") {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Tu lectura ejecutiva 4Shine reúne autopercepción, juicio situacional y prioridades concretas para el siguiente ciclo."
        />
        <ResultsView
          state={state}
          publicId={session?.publicId}
          onShare={handleShare}
          onReset={handleReset}
        />
      </div>
    );
  }

  if (state.status === "intro") {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Aquí vive el diagnóstico 4Shine que traduce tu momento actual en una lectura ejecutiva accionable."
        />
        <StatGrid stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)]">
          <section className="relative overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-[linear-gradient(120deg,rgba(49,31,68,0.98),rgba(74,43,93,0.94)_58%,rgba(245,183,209,0.78)_100%)] px-6 py-7 text-white shadow-[0_24px_48px_rgba(55,32,80,0.14)] md:px-8 md:py-8">
            <div className="absolute inset-y-0 right-[22%] hidden w-16 bg-white/28 blur-2xl md:block" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                Diagnóstico 4Shine
              </p>
              <h3 className="mt-3 text-4xl font-black leading-[0.92] text-white md:text-[3.3rem]">
                Lee tu liderazgo antes de intentar corregirlo.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/82 md:text-base">
                Este módulo integra autopercepción, escenarios situacionales y una
                lectura ejecutiva por pilares para ayudarte a identificar la
                prioridad real de desarrollo.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Shine Within",
                  "Shine Out",
                  "Shine Up",
                  "Shine Beyond",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold text-white/92 backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleIntroStart}
                className="mt-7 inline-flex items-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-extrabold text-[var(--brand-primary)] transition hover:translate-x-0.5"
              >
                {canResume ? "Continuar diagnóstico" : "Empezar diagnóstico"}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>

          <aside className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                <Compass size={18} />
              </div>
              <div>
                <p className="app-section-kicker">Perfil vinculado</p>
                <h4 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                  {currentUser?.name ?? state.name}
                </h4>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  Este diagnóstico ya está conectado a tu cuenta 4Shine y a tu
                  ID único de usuario.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-[var(--app-border)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    ID diagnóstico
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--app-ink)]">
                    {session?.sessionId
                      ? session.sessionId.slice(0, 8).toUpperCase()
                      : "Pendiente"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--app-border)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    Último guardado
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--app-ink)]">
                    {session?.updatedAt
                      ? new Date(session.updatedAt).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Sin sesión previa"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[var(--app-border)] bg-white/72 px-4 py-4 md:col-span-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    Avance
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                    {completionPercent}%
                  </p>
                </div>
              </div>

              {canResume && (
                <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--app-ink)]">
                    Ya tienes respuestas guardadas.
                  </p>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Puedes retomar desde la pregunta {state.currentIdx + 1} con{" "}
                    {answeredCount} respuestas registradas.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (state.status === "instructions") {
    const instructions = [
      {
        title: "Responde desde tu realidad actual",
        description:
          "No busques la versión ideal. El valor del diagnóstico aparece cuando contestas desde lo que hoy haces de verdad.",
      },
      {
        title: "Combina intención y criterio",
        description:
          "La autopercepción muestra cómo te ves; los escenarios situacionales revelan cómo decides bajo presión.",
      },
      {
        title: "Usa el resultado como lectura",
        description:
          "No es un examen. Es una radiografía para decidir dónde concentrar tu energía de desarrollo.",
      },
      {
        title: "Duración estimada",
        description:
          "Reserva entre 20 y 25 minutos. El cuestionario está paginado y guarda tu avance automáticamente.",
      },
    ];

    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Antes de empezar, vale la pena alinear el propósito del diagnóstico y la forma correcta de leerlo."
        />

        <section className="app-panel p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="app-section-kicker">Instrucciones</p>
              <h3 className="mt-2 text-3xl font-black text-[var(--app-ink)]">
                Cómo aprovechar esta lectura
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {instructions.map((item) => (
              <article
                key={item.title}
                className="rounded-[20px] border border-[var(--app-border)] bg-white/78 px-5 py-5"
              >
                <h4 className="text-lg font-black text-[var(--app-ink)]">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  status: "intro",
                }))
              }
              className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
            >
              <ChevronLeft size={16} />
              Volver
            </button>
            <button
              type="button"
              onClick={handleStartQuiz}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-92"
            >
              Empezar cuestionario
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  const start = state.currentIdx;
  const end = Math.min(start + DISCOVERY_ITEMS_PER_PAGE, DB.length);
  const pageItems = DB.slice(start, end);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Descubrimiento"
        subtitle="Avanza por bloques cortos. El sistema guarda tus respuestas automáticamente mientras completas el diagnóstico."
      />

      <div className="sticky top-[5rem] z-10 rounded-[22px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.88)] px-4 py-4 shadow-[0_20px_42px_rgba(55,32,80,0.08)] backdrop-blur-xl md:top-[5.5rem] md:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-section-kicker">Cuestionario</p>
            <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)] md:text-3xl">
              Preguntas {start + 1} a {end}
            </h3>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              {answeredCount} respuestas registradas de {DB.length}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--app-chip)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
              Avance {completionPercent}%
            </span>
            <span
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]",
                saveIndicator === "saving" &&
                  "bg-[rgba(59,130,246,0.14)] text-sky-700",
                saveIndicator === "saved" &&
                  "bg-[rgba(16,185,129,0.14)] text-emerald-700",
                saveIndicator === "error" &&
                  "bg-[rgba(244,63,94,0.14)] text-rose-700",
                saveIndicator === "idle" &&
                  "bg-[var(--app-surface-muted)] text-[var(--app-muted)]",
              )}
            >
              {saveIndicator === "saving"
                ? "Guardando"
                : saveIndicator === "saved"
                  ? "Guardado"
                  : saveIndicator === "error"
                    ? "Pendiente"
                    : "Autoguardado"}
            </span>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {pageItems.map((question, index) => {
          const answer = state.answers[String(question.id)];
          const questionNumber = start + index + 1;

          return (
            <article
              key={String(question.id)}
              className="app-panel p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--app-chip)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                  {question.pillar}
                </span>
                <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  {question.type === "sjt" ? "Situacional" : "Autoinforme"}
                </span>
              </div>

              <h4 className="mt-5 text-xl font-black leading-snug text-[var(--app-ink)] md:text-2xl">
                <span className="mr-2 text-[var(--brand-primary)]">
                  {questionNumber}.
                </span>
                {question.text}
              </h4>

              {question.type === "likert" ? (
                <div className="mt-6 grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const label = SCALES[question.scale ?? "freq"][value - 1];
                    const selected = answer === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleAnswer(question.id, value)}
                        className={clsx(
                          "min-h-28 rounded-[18px] border px-3 py-4 text-center text-[11px] font-extrabold leading-tight transition md:text-sm",
                          selected
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[0_16px_32px_rgba(55,32,80,0.16)]"
                            : "border-[var(--app-border)] bg-white/80 text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]",
                        )}
                      >
                        <span className="block text-lg md:text-xl">{value}</span>
                        <span className="mt-2 block">{label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {question.options?.map((option) => {
                    const selected = answer === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleAnswer(question.id, option.id)}
                        className={clsx(
                          "flex w-full items-start gap-4 rounded-[20px] border px-5 py-5 text-left text-sm font-semibold leading-relaxed transition md:text-base",
                          selected
                            ? "border-[var(--brand-primary)] bg-[var(--app-surface-muted)] text-[var(--app-ink)] shadow-[0_16px_32px_rgba(55,32,80,0.08)]"
                            : "border-[var(--app-border)] bg-white/82 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]",
                        )}
                      >
                        <span
                          className={clsx(
                            "mt-1 inline-flex h-5 w-5 shrink-0 rounded-full border-2",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                              : "border-[var(--app-border-strong)] bg-white",
                          )}
                        />
                        <span>{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 pb-6">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={start === 0}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <button
          type="button"
          onClick={() => void handleNextPage()}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white transition hover:opacity-92"
        >
          {end >= DB.length ? "Ver resultados" : "Continuar"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
