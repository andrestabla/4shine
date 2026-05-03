"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { R2UploadButton } from "@/components/ui/R2UploadButton";
import { useUser } from "@/context/UserContext";
import { useBranding } from "@/context/BrandingContext";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { extractProfileFromCv, getMyProfile, updateMyProfile } from "@/features/perfil/client";
import type { ModuleCode, PermissionAction } from "@/lib/permissions";
import { trackAuditEvent } from "@/lib/audit-client";
import { YEARS_EXPERIENCE_OPTIONS, keyToStoredValue, yearsToKey } from "@/lib/demographics";
import {
  USER_COUNTRY_OPTIONS,
  USER_GENDER_OPTIONS,
  USER_JOB_ROLE_OPTIONS,
  type UserJobRoleOption,
} from "@/lib/user-demographics";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";



interface RouteAccess {
  moduleCode: ModuleCode;
  action?: PermissionAction;
}

interface OnboardingProfileFormState {
  firstName: string;
  lastName: string;
  country: string;
  jobRole: UserJobRoleOption | "";
  gender: "Hombre" | "Mujer" | "Prefiero no decirlo" | "";
  yearsExperienceKey: string;
}

const ACCESS_BY_PATH: Record<string, RouteAccess> = {
  "/dashboard": { moduleCode: "dashboard" },
  "/dashboard/trayectoria": { moduleCode: "trayectoria" },
  "/dashboard/descubrimiento": { moduleCode: "descubrimiento" },
  "/dashboard/aprendizaje": { moduleCode: "aprendizaje" },
  "/dashboard/metodologia": { moduleCode: "metodologia" },
  "/dashboard/mentorias": { moduleCode: "mentorias" },
  "/dashboard/networking": { moduleCode: "networking" },
  "/dashboard/convocatorias": { moduleCode: "convocatorias" },
  "/dashboard/mensajes": { moduleCode: "mensajes" },
  "/dashboard/workshops": { moduleCode: "workshops" },
  "/dashboard/perfil": { moduleCode: "perfil" },
  "/dashboard/lideres": { moduleCode: "lideres" },
  "/dashboard/formacion-mentores": { moduleCode: "formacion_mentores" },
  "/dashboard/gestion-formacion-mentores": {
    moduleCode: "gestion_formacion_mentores",
  },
  "/dashboard/usuarios": { moduleCode: "usuarios", action: "view" },
  "/dashboard/administracion": { moduleCode: "usuarios", action: "manage" },
  "/dashboard/administracion/branding": {
    moduleCode: "usuarios",
    action: "manage",
  },
  "/dashboard/administracion/integraciones": {
    moduleCode: "usuarios",
    action: "manage",
  },
  "/dashboard/contenido": { moduleCode: "contenido" },
  "/dashboard/analitica": { moduleCode: "analitica" },
};

function resolveRouteAccess(pathname: string): RouteAccess | undefined {
  if (ACCESS_BY_PATH[pathname]) {
    return ACCESS_BY_PATH[pathname];
  }

  if (
    pathname.startsWith("/dashboard/aprendizaje/workbooks-v2") ||
    pathname.startsWith("/dashboard/aprendizaje/workbooks/")
  ) {
    return { moduleCode: "aprendizaje" };
  }

  if (pathname.startsWith("/dashboard/usuarios/")) {
    return { moduleCode: "usuarios", action: "view" };
  }

  return undefined;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isHydrating, isAuthenticated, can } = useUser();
  const { alert } = useAppDialog();
  const { tokens } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<"manual" | "cv">("manual");
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<OnboardingProfileFormState>({
    firstName: "",
    lastName: "",
    country: "",
    jobRole: "",
    gender: "",
    yearsExperienceKey: "",
  });
  const didTrackLoad = useRef(false);
  const routeAccess = resolveRouteAccess(pathname);
  const canViewRoute = routeAccess
    ? can(routeAccess.moduleCode, routeAccess.action ?? "view")
    : true;

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.push("/");
    }
  }, [isHydrating, isAuthenticated, router]);

  useEffect(() => {
    if (!isHydrating && isAuthenticated && !canViewRoute) {
      router.push(can("dashboard", "view") ? "/dashboard" : "/");
    }
  }, [can, canViewRoute, isAuthenticated, isHydrating, router]);

  useEffect(() => {
    if (isHydrating || !isAuthenticated || !canViewRoute) return;

    trackAuditEvent({
      action: "ui_page_view",
      moduleCode: routeAccess?.moduleCode ?? "dashboard",
      entityTable: "ui.navigation",
      metadata: {
        path: pathname,
      },
    });
  }, [
    canViewRoute,
    isAuthenticated,
    isHydrating,
    pathname,
    routeAccess?.moduleCode,
  ]);

  useEffect(() => {
    if (didTrackLoad.current) return;
    if (isHydrating || !isAuthenticated) return;

    didTrackLoad.current = true;
    trackAuditEvent({
      action: "ui_dashboard_load",
      moduleCode: "dashboard",
      entityTable: "ui.session",
      metadata: {
        path: pathname,
      },
    });
  }, [isAuthenticated, isHydrating, pathname]);

  useEffect(() => {
    let cancelled = false;
    const checkOnboarding = async () => {
      if (isHydrating || !isAuthenticated) return;
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        const isComplete = Boolean(
          profile.firstName?.trim() &&
            profile.lastName?.trim() &&
            profile.country?.trim() &&
            profile.jobRole &&
            profile.gender &&
            Number.isFinite(profile.yearsExperience),
        );
        setOnboardingForm({
          firstName: profile.firstName ?? "",
          lastName: profile.lastName ?? "",
          country: profile.country ?? "",
          jobRole: (profile.jobRole ?? "") as UserJobRoleOption | "",
          gender: (profile.gender as OnboardingProfileFormState["gender"]) ?? "",
          yearsExperienceKey: yearsToKey(profile.yearsExperience),
        });
        setShowOnboarding(!isComplete);
      } catch {
        setShowOnboarding(false);
      } finally {
        if (!cancelled) setIsCheckingOnboarding(false);
      }
    };
    void checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isHydrating]);

  const saveOnboardingProfile = async () => {
    const yearsExperience = keyToStoredValue(onboardingForm.yearsExperienceKey);
    if (
      !onboardingForm.firstName.trim() ||
      !onboardingForm.lastName.trim() ||
      !onboardingForm.country.trim() ||
      !onboardingForm.jobRole ||
      !onboardingForm.gender ||
      yearsExperience === null
    ) {
      await alert({
        title: "Datos obligatorios",
        message: "Completa todos los campos para continuar.",
        tone: "warning",
      });
      return;
    }
    setIsSavingOnboarding(true);
    try {
      const displayName = `${onboardingForm.firstName.trim()} ${onboardingForm.lastName.trim()}`.trim();
      await updateMyProfile({
        displayName,
        firstName: onboardingForm.firstName.trim(),
        lastName: onboardingForm.lastName.trim(),
        country: onboardingForm.country,
        jobRole: onboardingForm.jobRole,
        gender: onboardingForm.gender,
        yearsExperience,
      });
      setShowOnboarding(false);
    } catch (error) {
      await alert({
        title: "No se pudo completar tu perfil",
        message: error instanceof Error ? error.message : "Inténtalo nuevamente.",
        tone: "error",
      });
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  if (isHydrating || isCheckingOnboarding) {
    const loaderText = tokens.text.loaderText?.trim() ?? "";
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-6">
        <div className="text-center">
          {tokens.assets.loaderAssetUrl.trim().length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tokens.assets.loaderAssetUrl}
                alt={loaderText || "Cargando"}
                className="mx-auto h-14 w-auto"
              />
            </>
          ) : (
            <Loader2
              size={42}
              className="mx-auto animate-spin"
              style={{ color: tokens.colors.accent }}
            />
          )}

          {tokens.text.visibility.loaderText && loaderText.length > 0 && (
            <p className="mt-3 text-sm text-[var(--app-muted)]">{loaderText}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) return null;
  if (!canViewRoute) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)]">
      {/* Mobile Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-20 bg-[rgba(49,31,68,0.38)] md:hidden transition-opacity duration-300",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative flex w-full flex-1 flex-col overflow-y-auto bg-transparent">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div
          className="relative z-10 mx-auto min-h-full w-full animate-fade-in px-4 pb-20 pt-5 md:px-8 md:pt-8"
          style={{ maxWidth: tokens.layout.pageMaxWidth }}
        >
          {children}
        </div>
      </main>

      {showOnboarding && (
        <div className="fixed inset-0 z-[120] bg-[rgba(22,10,38,0.58)] backdrop-blur-sm">
          <div className="mx-auto mt-10 w-[min(92vw,860px)] rounded-[20px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
            <p className="app-section-kicker">Bienvenida</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--app-ink)]">Completa tu perfil para comenzar</h2>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Puedes completar tus datos manualmente o extraerlos desde tu CV cargándolo en R2.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOnboardingMode("manual")}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em]",
                  onboardingMode === "manual"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]",
                )}
              >
                Completar manual
              </button>
              <button
                type="button"
                onClick={() => setOnboardingMode("cv")}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em]",
                  onboardingMode === "cv"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]",
                )}
              >
                Extraer desde CV
              </button>
            </div>

            {onboardingMode === "cv" && (
              <div className="mt-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--app-ink)]">Carga tu CV</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Formatos recomendados: DOCX o TXT. Si no se detectan todos los campos, puedes ajustarlos manualmente.
                </p>
                <div className="mt-3">
                  <R2UploadButton
                    moduleCode="perfil"
                    action="update"
                    pathPrefix={`profiles/${currentUser.id}/cv`}
                    accept=".doc,.docx,.txt,.pdf"
                    buttonLabel="Cargar CV"
                    onUploaded={async (url) => {
                      try {
                        const extracted = await extractProfileFromCv(url);
                        setOnboardingForm((prev) => ({
                          ...prev,
                          firstName: extracted.firstName || prev.firstName,
                          lastName: extracted.lastName || prev.lastName,
                          country: extracted.country || prev.country,
                          jobRole: (extracted.jobRole || prev.jobRole) as UserJobRoleOption | "",
                          gender: extracted.gender || prev.gender,
                          yearsExperienceKey:
                            extracted.yearsExperience === null
                              ? prev.yearsExperienceKey
                              : yearsToKey(extracted.yearsExperience),
                        }));
                        await alert({
                          title: "Datos detectados",
                          message: "Revisa y confirma los campos antes de continuar.",
                          tone: "success",
                        });
                      } catch (error) {
                        await alert({
                          title: "No se pudo extraer el CV",
                          message: error instanceof Error ? error.message : "Completa los datos manualmente.",
                          tone: "warning",
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                className="app-input"
                placeholder="Nombres"
                value={onboardingForm.firstName}
                onChange={(event) => setOnboardingForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
              <input
                className="app-input"
                placeholder="Apellidos"
                value={onboardingForm.lastName}
                onChange={(event) => setOnboardingForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
              <select
                className="app-select"
                value={onboardingForm.country}
                onChange={(event) => setOnboardingForm((prev) => ({ ...prev, country: event.target.value }))}
              >
                <option value="">Selecciona país</option>
                {USER_COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                className="app-select"
                value={onboardingForm.jobRole}
                onChange={(event) =>
                  setOnboardingForm((prev) => ({ ...prev, jobRole: event.target.value as UserJobRoleOption | "" }))
                }
              >
                <option value="">Selecciona cargo</option>
                {USER_JOB_ROLE_OPTIONS.map((jobRole) => (
                  <option key={jobRole} value={jobRole}>
                    {jobRole}
                  </option>
                ))}
              </select>
              <select
                className="app-select"
                value={onboardingForm.gender}
                onChange={(event) =>
                  setOnboardingForm((prev) => ({
                    ...prev,
                    gender: event.target.value as OnboardingProfileFormState["gender"],
                  }))
                }
              >
                <option value="">Selecciona género</option>
                {USER_GENDER_OPTIONS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
              <select
                className="app-select"
                value={onboardingForm.yearsExperienceKey}
                onChange={(event) => setOnboardingForm((prev) => ({ ...prev, yearsExperienceKey: event.target.value }))}
              >
                <option value="">Años de experiencia</option>
                {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void saveOnboardingProfile()}
                disabled={isSavingOnboarding}
                className="app-button-primary disabled:opacity-60"
              >
                {isSavingOnboarding ? <Loader2 size={16} className="animate-spin" /> : null}
                Continuar a la plataforma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

