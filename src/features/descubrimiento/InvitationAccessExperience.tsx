"use client";

import React from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Loader2, Lock, Mail } from "lucide-react";
import { ResultsView } from "./ResultsView";
import { DB, SCALES } from "./DiagnosticsData";
import { DISCOVERY_ITEMS_PER_PAGE } from "./reporting";
import { getInvitationPublicInfo, verifyInvitationAccess } from "./client";
import { DISCOVERY_JOB_ROLE_OPTIONS, type DiscoveryUserState } from "./types";

interface InvitationAccessExperienceProps {
  inviteToken: string;
}

function buildEmptyExternalState(): DiscoveryUserState {
  return {
    name: "Invitado",
    answers: {},
    currentIdx: 0,
    status: "intro",
    profile: {
      firstName: "",
      lastName: "",
      country: "",
      jobRole: "",
      age: null,
      yearsExperience: null,
    },
    profileCompleted: false,
  };
}

function isProfileComplete(state: DiscoveryUserState): boolean {
  return Boolean(
    state.profile.firstName &&
      state.profile.lastName &&
      state.profile.country &&
      state.profile.jobRole &&
      Number.isFinite(state.profile.age) &&
      Number.isFinite(state.profile.yearsExperience),
  );
}

export function InvitationAccessExperience({
  inviteToken,
}: InvitationAccessExperienceProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [accessCode, setAccessCode] = React.useState("");
  const [maskedEmail, setMaskedEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Awaited<
    ReturnType<typeof verifyInvitationAccess>
  >["session"] | null>(null);
  const [accessMode, setAccessMode] = React.useState<"results" | "diagnostic" | null>(null);
  const [externalState, setExternalState] = React.useState<DiscoveryUserState>(
    buildEmptyExternalState(),
  );

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const info = await getInvitationPublicInfo(inviteToken);
        if (!active) return;
        setMaskedEmail(info.invitedEmailMasked);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la invitacion.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [inviteToken]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessCode.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await verifyInvitationAccess({
        inviteToken,
        accessCode: accessCode.trim().toUpperCase(),
      });
      setSession(response.session);
      setAccessMode(response.accessMode);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Codigo invalido. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accessMode === "results" && session) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-8 md:px-6">
        <ResultsView
          state={{
            name: `${session.firstName} ${session.lastName}`.trim(),
            answers: session.answers,
            currentIdx: session.currentIdx,
            status: "results",
            profile: {
              firstName: session.firstName,
              lastName: session.lastName,
              country: session.country,
              jobRole: session.jobRole,
              age: session.age,
              yearsExperience: session.yearsExperience,
            },
            profileCompleted: session.profileCompleted,
          }}
          publicId={session.publicId}
          isPublic={true}
          embedded={false}
        />
      </main>
    );
  }

  if (accessMode === "diagnostic") {
    if (externalState.status === "results") {
      return (
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-8 md:px-6">
          <ResultsView state={externalState} isPublic={true} embedded={false} />
        </main>
      );
    }

    if (externalState.status === "intro") {
      return (
        <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-16 pt-8 md:px-6">
          <section className="app-panel p-6 md:p-8">
            <p className="app-section-kicker">Diagnostico 4Shine</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--app-ink)]">
              Completa tu perfil para iniciar
            </h1>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <input
                value={externalState.profile.firstName}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: { ...current.profile, firstName: event.target.value },
                  }))
                }
                placeholder="Nombres"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <input
                value={externalState.profile.lastName}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: { ...current.profile, lastName: event.target.value },
                  }))
                }
                placeholder="Apellidos"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <input
                value={externalState.profile.country}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: { ...current.profile, country: event.target.value },
                  }))
                }
                placeholder="Pais"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <select
                value={externalState.profile.jobRole}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      jobRole: event.target.value as DiscoveryUserState["profile"]["jobRole"],
                    },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Selecciona cargo</option>
                {DISCOVERY_JOB_ROLE_OPTIONS.map((jobRole) => (
                  <option key={jobRole} value={jobRole}>
                    {jobRole}
                  </option>
                ))}
              </select>
              <input
                value={externalState.profile.age ?? ""}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      age: event.target.value ? Number(event.target.value) : null,
                    },
                  }))
                }
                type="number"
                min={16}
                max={100}
                placeholder="Edad"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <input
                value={externalState.profile.yearsExperience ?? ""}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      yearsExperience: event.target.value ? Number(event.target.value) : null,
                    },
                  }))
                }
                type="number"
                step="0.5"
                min={0}
                max={80}
                placeholder="Anos de experiencia"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isProfileComplete(externalState)) return;
                setExternalState((current) => ({
                  ...current,
                  name: `${current.profile.firstName} ${current.profile.lastName}`.trim(),
                  profileCompleted: true,
                  status: "instructions",
                }));
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              Empezar diagnostico
              <ChevronRight size={16} />
            </button>
          </section>
        </main>
      );
    }

    if (externalState.status === "instructions") {
      return (
        <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-16 pt-8 md:px-6">
          <section className="app-panel p-6 md:p-8">
            <h2 className="text-2xl font-black text-[var(--app-ink)]">Instrucciones</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--app-muted)]">
              <li>Responde con base en tu realidad actual.</li>
              <li>Completa todas las preguntas de cada bloque.</li>
              <li>Al final recibiras una lectura ejecutiva de tus resultados.</li>
            </ul>
            <button
              type="button"
              onClick={() => setExternalState((current) => ({ ...current, status: "quiz" }))}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              Ir al cuestionario
              <ChevronRight size={16} />
            </button>
          </section>
        </main>
      );
    }

    const start = externalState.currentIdx;
    const end = Math.min(start + DISCOVERY_ITEMS_PER_PAGE, DB.length);
    const pageItems = DB.slice(start, end);

    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-8 md:px-6">
        <section className="space-y-4">
          {pageItems.map((question, index) => {
            const answer = externalState.answers[String(question.id)];
            const questionNumber = start + index + 1;

            return (
              <article key={String(question.id)} className="app-panel p-5 sm:p-6">
                <h4 className="text-xl font-black leading-snug text-[var(--app-ink)] md:text-2xl">
                  <span className="mr-2 text-[var(--brand-primary)]">{questionNumber}.</span>
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
                          onClick={() =>
                            setExternalState((current) => ({
                              ...current,
                              answers: {
                                ...current.answers,
                                [String(question.id)]: value,
                              },
                            }))
                          }
                          className={clsx(
                            "min-h-24 rounded-[14px] border px-2 py-3 text-center text-[11px]",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                              : "border-[var(--app-border)] bg-white text-[var(--app-ink)]",
                          )}
                        >
                          <span className="block text-lg font-black">{value}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 space-y-2">
                    {question.options?.map((option) => {
                      const selected = answer === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setExternalState((current) => ({
                              ...current,
                              answers: {
                                ...current.answers,
                                [String(question.id)]: option.id,
                              },
                            }))
                          }
                          className={clsx(
                            "w-full rounded-[14px] border px-4 py-3 text-left text-sm",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--app-surface-muted)] text-[var(--app-ink)]"
                              : "border-[var(--app-border)] bg-white text-[var(--app-muted)]",
                          )}
                        >
                          {option.text}
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setExternalState((current) => ({
                  ...current,
                  currentIdx: Math.max(0, current.currentIdx - DISCOVERY_ITEMS_PER_PAGE),
                }))
              }
              disabled={start === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <button
              type="button"
              onClick={() => {
                if (end >= DB.length) {
                  setExternalState((current) => ({ ...current, status: "results" }));
                  return;
                }
                setExternalState((current) => ({ ...current, currentIdx: end }));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              {end >= DB.length ? "Ver resultados" : "Continuar"}
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-6">
      <section className="w-full rounded-[24px] border border-[var(--app-border)] bg-white p-6 shadow-[0_20px_40px_rgba(20,17,33,0.08)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-muted)]">
          Diagnostico 4Shine
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--app-ink)]">
          Acceso con codigo unico
        </h1>
        <p className="mt-3 text-sm text-[var(--app-muted)]">
          Ingresa el codigo recibido por correo para acceder a tu modulo de Descubrimiento.
        </p>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" />
            Cargando invitacion...
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--app-muted)]">Invitacion para</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                <Mail size={14} />
                {maskedEmail || "Correo protegido"}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--app-ink)]">
                Codigo de acceso
              </span>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
                />
                <input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="Ejemplo: 7KF2M9QP"
                  className="h-11 w-full rounded-[12px] border border-[var(--app-border)] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(79,35,96,0.12)]"
                />
              </div>
            </label>

            {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !accessCode.trim()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-6 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Validando..." : "Ingresar al diagnostico"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
