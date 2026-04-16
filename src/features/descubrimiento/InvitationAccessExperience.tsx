"use client";

import React from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Loader2, Lock, Mail } from "lucide-react";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { ResultsView } from "./ResultsView";
import { DB, SCALES } from "./DiagnosticsData";
import { DISCOVERY_ITEMS_PER_PAGE, calculateDiscoveryCompletionPercent } from "./reporting";
import {
  getDiscoverySession,
  getInvitationPublicInfo,
  saveInvitationProgress,
  updateDiscoverySessionRequest,
  verifyInvitationAccess,
} from "./client";
import {
  DISCOVERY_COUNTRY_OPTIONS,
  DISCOVERY_JOB_ROLE_OPTIONS,
  type DiscoverySessionRecord,
  type DiscoveryUserState,
} from "./types";

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
      gender: "",
      yearsExperience: null,
    },
    profileCompleted: false,
  };
}

const DATA_PROTECTION_POLICY = `La información suministrada en esta prueba diagnóstica será tratada de manera confidencial y utilizada exclusivamente con fines de evaluación, retroalimentación, acompañamiento y desarrollo dentro del programa 4Shine. Las respuestas recolectadas permitirán construir una línea base sobre fortalezas, brechas y prioridades de evolución del liderazgo, a partir de la cual se generarán reportes y orientaciones de trabajo personal y de mentoría.
Los datos personales y los resultados obtenidos serán administrados bajo criterios de reserva, acceso restringido y uso responsable. Su tratamiento estará orientado únicamente a la operación metodológica del programa, al análisis del diagnóstico y al seguimiento del proceso formativo. La información no será divulgada a terceros ajenos al programa sin autorización previa del participante, salvo en los casos exigidos por la ley.
Al continuar con esta prueba, el participante declara conocer y aceptar el tratamiento de sus datos para los fines aquí descritos, así como el uso de sus respuestas para la elaboración de reportes individuales, análisis agregados y decisiones de acompañamiento dentro del sistema 4Shine. El diagnóstico está diseñado con propósito de desarrollo y confidencialidad para favorecer respuestas honestas y una lectura rigurosa del perfil de liderazgo.`;

function isProfileComplete(state: DiscoveryUserState): boolean {
  return Boolean(
    state.profile.firstName &&
      state.profile.lastName &&
      state.profile.country &&
      state.profile.jobRole &&
      state.profile.gender &&
      Number.isFinite(state.profile.yearsExperience),
  );
}

function parseIntegerInput(rawValue: string, min: number, max: number): number | null {
  const normalized = rawValue.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  const clamped = Math.max(min, Math.min(max, Math.floor(parsed)));
  return clamped;
}

const YEARS_EXPERIENCE_OPTIONS = [
  { key: "1-5", label: "Entre 1 y 5 años", storedValue: 3, min: 1, max: 5 },
  { key: "6-10", label: "Entre 6 y 10 años", storedValue: 8, min: 6, max: 10 },
  { key: "11-15", label: "Entre 11 y 15 años", storedValue: 13, min: 11, max: 15 },
  { key: "16-20", label: "Entre 16 y 20 años", storedValue: 18, min: 16, max: 20 },
  { key: "20+", label: "Más de 20 años", storedValue: 21, min: 21, max: Number.POSITIVE_INFINITY },
] as const;

function toUserState(session: DiscoverySessionRecord): DiscoveryUserState {
  return {
    name: session.nameSnapshot,
    answers: session.answers,
    currentIdx: session.currentIdx,
    status: session.status,
    profile: {
      firstName: session.firstName ?? "",
      lastName: session.lastName ?? "",
      country: session.country ?? "",
      gender: session.gender ?? "",
      yearsExperience: session.yearsExperience,
    },
    profileCompleted: session.profileCompleted,
    experienceSurvey: session.experienceSurvey,
  };
}

function sanitizeInvitationIntroState(state: DiscoveryUserState): DiscoveryUserState {
  if (state.status !== "intro") return state;
  if (Object.keys(state.answers).length > 0) return state;
  return {
    ...state,
    name: "Invitado",
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

function getYearsExperienceBucket(value: number | null): string {
  if (!Number.isFinite(value)) return "";
  const normalized = Number(value);
  return (
    YEARS_EXPERIENCE_OPTIONS.find((option) => normalized >= option.min && normalized <= option.max)?.key ?? ""
  );
}

function getYearsExperienceStoredValue(bucket: string): number | null {
  return YEARS_EXPERIENCE_OPTIONS.find((option) => option.key === bucket)?.storedValue ?? null;
}

function buildPersistPayload(state: DiscoveryUserState) {
  return {
    status: state.status,
    answers: state.answers,
    currentIdx: state.currentIdx,
    completionPercent: calculateDiscoveryCompletionPercent(state.answers),
    profile: state.profile,
    experienceSurvey: state.experienceSurvey,
  };
}

export function InvitationAccessExperience({
  inviteToken,
}: InvitationAccessExperienceProps) {
  const { alert, confirm } = useAppDialog();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [accessCode, setAccessCode] = React.useState("");
  const [maskedEmail, setMaskedEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isFinished, setIsFinished] = React.useState(false);
  const [session, setSession] = React.useState<Awaited<
    ReturnType<typeof verifyInvitationAccess>
  >["session"] | null>(null);
  const [verifiedAccessCode, setVerifiedAccessCode] = React.useState<string | null>(null);
  const [accessMode, setAccessMode] = React.useState<"results" | "diagnostic" | null>(null);
  const [externalState, setExternalState] = React.useState<DiscoveryUserState>(
    buildEmptyExternalState(),
  );
  const [showCompletedNotice, setShowCompletedNotice] = React.useState(false);
  const [isPersisting, setIsPersisting] = React.useState(false);
  const [policyAccepted, setPolicyAccepted] = React.useState(false);
  const [showPolicy, setShowPolicy] = React.useState(false);
  const [publicBranding, setPublicBranding] = React.useState<{
    platformName: string;
    logoUrl: string | null;
  }>({
    platformName: "4Shine Platform",
    logoUrl: "/workbooks-v2/diamond.svg",
  });
  const hydratedRef = React.useRef(false);
  const lastSnapshotRef = React.useRef("");
  const persistRequestCounterRef = React.useRef(0);

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
            : "No se pudo cargar la invitación.",
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

  React.useEffect(() => {
    let active = true;
    const loadBranding = async () => {
      try {
        const response = await fetch("/api/v1/public/branding", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { settings?: { platformName?: string; logoUrl?: string | null } };
        };
        if (!active || !payload?.ok) return;
        setPublicBranding({
          platformName: payload.data?.settings?.platformName?.trim() || "4Shine Platform",
          logoUrl: payload.data?.settings?.logoUrl?.trim() || "/workbooks-v2/diamond.svg",
        });
      } catch {
        // fallback branding
      }
    };
    void loadBranding();
    return () => {
      active = false;
    };
  }, []);

  const renderPublicHeader = () => (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--app-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
        {publicBranding.logoUrl ? (
          <img src={publicBranding.logoUrl} alt={publicBranding.platformName} className="h-8 w-8 object-contain" />
        ) : null}
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--app-ink)]">
          {publicBranding.platformName}
        </p>
      </div>
    </header>
  );

  const handleFinish = async () => {
    const ok = await confirm({
      title: "Finalizar diagnóstico",
      message: "¿Estás seguro que deseas finalizar tu visita? Se cerrará tu sesión actual.",
      confirmText: "Finalizar y salir",
      cancelText: "Volver",
      tone: "warning"
    });
    if (!ok) return;

    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignorar fallback errors
    }
    setIsFinished(true);
  };

  const handleExternalSurveySubmit = async (
    survey: NonNullable<DiscoveryUserState["experienceSurvey"]>,
  ) => {
    if (verifiedAccessCode) {
      const response = await saveInvitationProgress({
        inviteToken,
        accessCode: verifiedAccessCode,
        state: externalState,
        survey,
      });
      setSession(response.session);
      if (response.externalProgress) {
        setExternalState({
          ...response.externalProgress,
          experienceSurvey: response.externalSurvey,
        });
      }
      hydratedRef.current = true;
      return;
    }

    const nextSession = await updateDiscoverySessionRequest({
      experienceSurvey: survey,
    });
    const nextState = toUserState(nextSession);
    setSession(nextSession);
    setExternalState(nextState);
    lastSnapshotRef.current = JSON.stringify(buildPersistPayload(nextState));
    hydratedRef.current = true;
  };

  React.useEffect(() => {
    if (accessMode !== "diagnostic") return;
    if (!hydratedRef.current) return;
    const payload = buildPersistPayload(externalState);
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSnapshotRef.current) return;

    const timer = window.setTimeout(async () => {
      const requestId = persistRequestCounterRef.current + 1;
      persistRequestCounterRef.current = requestId;
      try {
        setIsPersisting(true);
        if (verifiedAccessCode) {
          const response = await saveInvitationProgress({
            inviteToken,
            accessCode: verifiedAccessCode,
            state: externalState,
            survey: externalState.experienceSurvey,
          });
          if (requestId !== persistRequestCounterRef.current) return;
          setSession(response.session);
        } else {
          const nextSession = await updateDiscoverySessionRequest(payload);
          if (requestId !== persistRequestCounterRef.current) return;
          setSession(nextSession);
        }
        lastSnapshotRef.current = snapshot;
      } catch {
        // Silencioso: no bloqueamos la experiencia.
      } finally {
        if (requestId === persistRequestCounterRef.current) {
          setIsPersisting(false);
        }
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [accessMode, externalState]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessCode.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const normalizedCode = accessCode.trim().toUpperCase();
      const response = await verifyInvitationAccess({
        inviteToken,
        accessCode: normalizedCode,
      });
      setVerifiedAccessCode(normalizedCode);
      try {
        const accountSession = await getDiscoverySession();
        const nextState = sanitizeInvitationIntroState(toUserState(accountSession));
        setSession(accountSession);
        setExternalState(nextState);
        setAccessMode("diagnostic");
        setShowCompletedNotice(
          nextState.status === "results" || calculateDiscoveryCompletionPercent(nextState.answers) >= 100,
        );
        hydratedRef.current = true;
        lastSnapshotRef.current = JSON.stringify(buildPersistPayload(nextState));
      } catch {
        setSession(response.session);
        setAccessMode(response.accessMode);
        if (response.accessMode === "diagnostic" && response.externalProgress) {
          const nextState = sanitizeInvitationIntroState({
            ...response.externalProgress,
            experienceSurvey: response.externalSurvey,
          });
          setExternalState(nextState);
          setShowCompletedNotice(response.alreadyCompleted);
          lastSnapshotRef.current = JSON.stringify(buildPersistPayload(nextState));
        }
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Código inválido. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        {renderPublicHeader()}
        <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 pb-16 pt-32 md:px-6 md:pt-40 text-center">
          <section className="app-panel w-full p-8 md:p-12 border border-[var(--brand-primary)]/20 shadow-[0_20px_42px_rgba(55,32,80,0.06)]">
            <h2 className="text-3xl font-black text-[var(--app-ink)]">
              ¡Has finalizado tu revisión!
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--app-ink)]/80 leading-relaxed">
              Esperamos que este reporte sea de utilidad y contribuya en tu proceso de transformación como líder.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-[var(--app-muted)]">
              Si quieres ver nuevamente los resultados, ingresa desde el correo de invitación con el código único de acceso asignado. ¡Nos vemos pronto!
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (accessMode === "results" && session) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        {renderPublicHeader()}
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
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
                gender: session.gender,
                yearsExperience: session.yearsExperience,
              },
              profileCompleted: session.profileCompleted,
            }}
            publicId={session.publicId}
            isPublic={true}
            embedded={true}
            initialSurvey={session.experienceSurvey}
            initialAiReports={session.aiReports ?? null}
            enablePublicAnalysis
            invitationCredentials={
              verifiedAccessCode
                ? {
                    inviteToken,
                    accessCode: verifiedAccessCode,
                  }
                : null
            }
            onFinish={handleFinish}
          />
        </main>
      </div>
    );
  }

  if (accessMode === "diagnostic") {
    const answeredCount = Object.keys(externalState.answers).length;
    const completionPercent = calculateDiscoveryCompletionPercent(externalState.answers);

    if (showCompletedNotice) {
      return (
        <div className="min-h-screen bg-[var(--app-bg)]">
          {renderPublicHeader()}
          <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
            <section className="app-panel p-6 md:p-8">
            <p className="app-section-kicker">Diagnóstico 4Shine</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
              Tú ya realizaste este diagnóstico
            </h2>
            <p className="mt-3 text-sm text-[var(--app-muted)]">
              Puedes ingresar directamente a tus resultados con este mismo enlace y código.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCompletedNotice(false);
                  setExternalState((current) => ({ ...current, status: "results" }));
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
              >
                Ver resultados
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setShowCompletedNotice(false)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)]"
              >
                Continuar navegando
              </button>
            </div>
            </section>
          </main>
        </div>
      );
    }

    if (externalState.status === "results") {
      return (
        <div className="min-h-screen bg-[var(--app-bg)]">
          {renderPublicHeader()}
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
            <ResultsView
              state={externalState}
              isPublic={true}
              embedded={true}
              initialSurvey={externalState.experienceSurvey ?? null}
              initialAiReports={session?.aiReports ?? null}
              onSurveySubmit={handleExternalSurveySubmit}
              enablePublicAnalysis
              invitationCredentials={
                verifiedAccessCode
                  ? {
                      inviteToken,
                      accessCode: verifiedAccessCode,
                    }
                  : null
              }
              onFinish={handleFinish}
            />
          </main>
        </div>
      );
    }

    if (externalState.status === "intro") {
      return (
        <div className="min-h-screen bg-[var(--app-bg)]">
          {renderPublicHeader()}
          <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
            <section className="app-panel p-6 md:p-8">
            <p className="app-section-kicker">Diagnóstico 4Shine</p>
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
              <select
                value={externalState.profile.country}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: { ...current.profile, country: event.target.value },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Selecciona país</option>
                {DISCOVERY_COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
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
              <select
                value={externalState.profile.gender}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: { ...current.profile, gender: event.target.value as any },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Selecciona género</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
              <select
                value={getYearsExperienceBucket(externalState.profile.yearsExperience)}
                onChange={(event) =>
                  setExternalState((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      yearsExperience: getYearsExperienceStoredValue(event.target.value),
                    },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Años de experiencia laboral</option>
                {YEARS_EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <input
                id="policy-check"
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--app-border)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <label htmlFor="policy-check" className="text-xs leading-relaxed text-[var(--app-muted)]">
                Conozco y acepto la{" "}
                <button
                  type="button"
                  onClick={() => setShowPolicy(true)}
                  className="font-bold text-[var(--brand-primary)] underline"
                >
                  Política de protección de datos
                </button>{" "}
                del diagnóstico 4Shine.
              </label>
            </div>

            <button
              type="button"
              disabled={!isProfileComplete(externalState) || !policyAccepted}
              onClick={() => {
                setExternalState((current) => ({
                  ...current,
                  name: `${current.profile.firstName} ${current.profile.lastName}`.trim(),
                  profileCompleted: true,
                  status: "instructions",
                }));
                window.scrollTo(0, 0);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white transition disabled:opacity-40"
            >
              Empezar diagnóstico
              <ChevronRight size={16} />
            </button>
            </section>
          </main>

          {showPolicy && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl md:p-8">
                <h3 className="text-xl font-black text-[var(--app-ink)]">Política de Tratamiento de Datos</h3>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {DATA_PROTECTION_POLICY.split('\n').map((para, i) => (
                    <p key={i} className="mb-3">{para}</p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicy(false)}
                  className="mt-6 w-full rounded-full bg-[var(--app-ink)] py-3 text-sm font-bold text-white transition hover:bg-black"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (externalState.status === "instructions") {
      const instructionCards = [
        {
          number: "1",
          title: "Sinceridad",
          description:
            'No hay respuestas "correctas". Responde como eres hoy, no como aspiras ser.',
        },
        {
          number: "2",
          title: "Sin juicios",
          description:
            "Este es un mapa de navegación, no un examen. El objetivo es identificar palancas de crecimiento.",
        },
        {
          number: "3",
          title: "Escala Likert",
          description: "96 ítems para evaluar tu autopercepción conductual.",
        },
        {
          number: "4",
          title: "Juicio situacional",
          description: "29 escenarios reales con opciones de respuesta ponderadas.",
        },
        {
          number: "5",
          title: "Análisis 4 pilares",
          description: "Within, Out, Up y Beyond para una visión 360°.",
        },
      ];

      return (
        <div className="min-h-screen bg-[var(--app-bg)]">
          {renderPublicHeader()}
          <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
            <section className="app-panel p-6 md:p-8">
            <h2 className="text-3xl font-black text-[var(--app-ink)]">Instrucciones</h2>
            <p className="mt-3 text-sm text-[var(--app-muted)]">
              Tiempo estimado: <strong>20-25 minutos</strong>. El objetivo de este diagnóstico es
              identificar tus brechas de liderazgo actuales y proporcionarte una hoja de ruta
              personalizada basada en el modelo 4Shine.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {instructionCards.map((item) => (
                <article
                  key={item.number}
                  className="rounded-[18px] border border-[var(--app-border)] bg-white px-4 py-4"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--app-muted)]">
                    {item.number}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-[var(--app-ink)]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">{item.description}</p>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setExternalState((current) => ({ ...current, status: "quiz" }))}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              Ir al cuestionario
              <ChevronRight size={16} />
            </button>
            </section>
          </main>
        </div>
      );
    }

    const start = externalState.currentIdx;
    const end = Math.min(start + DISCOVERY_ITEMS_PER_PAGE, DB.length);
    const pageItems = DB.slice(start, end);
    const handleExternalNextPage = async () => {
      const missingIndex = pageItems.findIndex(
        (item) => externalState.answers[String(item.id)] === undefined,
      );

      if (missingIndex >= 0) {
        const questionNumber = start + missingIndex + 1;
        await alert({
          title: "Faltan respuestas",
          message: `La pregunta ${questionNumber} no ha sido respondida. Completa la respuesta antes de continuar.`,
          tone: "warning",
        });
        return;
      }

      if (end >= DB.length) {
        const nextState: DiscoveryUserState = { ...externalState, status: "results" };
        setExternalState(nextState);
        try {
          setIsPersisting(true);
          const nextSession = await updateDiscoverySessionRequest({
            ...buildPersistPayload(nextState),
            markCompleted: true,
          });
          const syncedState = toUserState(nextSession);
          setSession(nextSession);
          setExternalState(syncedState);
          lastSnapshotRef.current = JSON.stringify(buildPersistPayload(syncedState));
          hydratedRef.current = true;
        } catch {
          // Silencioso: no bloqueamos la experiencia.
        } finally {
          setIsPersisting(false);
        }
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      setExternalState((current) => ({ ...current, currentIdx: end }));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        {renderPublicHeader()}
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 md:px-6 md:pt-32">
          <section className="space-y-4">
          <div className="rounded-[18px] border border-[var(--app-border)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--app-ink)]">
                Progreso: {answeredCount} / {DB.length} respuestas ({completionPercent}%)
              </p>
              {isPersisting && (
                <p className="text-xs font-semibold text-[var(--app-muted)]">Guardando...</p>
              )}
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--app-surface-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--brand-primary)] transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

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
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                            "min-h-20 rounded-[14px] border px-2 py-3 text-center text-[11px] sm:min-h-24",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                              : "border-[var(--app-border)] bg-white text-[var(--app-ink)]",
                          )}
                        >
                          <span className="block text-sm font-extrabold sm:text-base">{label}</span>
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
              onClick={() => void handleExternalNextPage()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              {end >= DB.length ? "Ver resultados" : "Continuar"}
              <ChevronRight size={16} />
            </button>
          </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {renderPublicHeader()}
      <main className="mx-auto flex w-full max-w-3xl items-center px-4 pb-10 pt-28 md:px-6 md:pt-32">
        <section className="w-full rounded-[24px] border border-[var(--app-border)] bg-white p-6 shadow-[0_20px_40px_rgba(20,17,33,0.08)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-muted)]">
          Diagnóstico 4Shine
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--app-ink)]">
          Acceso con código único
        </h1>
        <p className="mt-3 text-sm text-[var(--app-muted)]">
          Ingresa el código recibido por correo para acceder a tu módulo de Descubrimiento.
        </p>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" />
            Cargando invitación...
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--app-muted)]">Invitación para</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                <Mail size={14} />
                {maskedEmail || "Correo protegido"}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--app-ink)]">
                Código de acceso
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
              {isSubmitting ? "Validando..." : "Ingresar al diagnóstico"}
            </button>
          </form>
        )}
        </section>
      </main>
    </div>
  );
}
