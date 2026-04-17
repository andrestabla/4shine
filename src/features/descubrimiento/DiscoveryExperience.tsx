"use client";

import React from "react";
import clsx from "clsx";
import { read, utils } from "xlsx";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  RotateCcw,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccessOfferPanel } from "@/components/access/AccessOfferPanel";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { useUser } from "@/context/UserContext";
import { uploadToR2 } from "@/lib/r2-upload-client";
import { filterCommercialProducts } from "@/features/access/catalog";
import { downloadDiscoveryRowResultsWorkbook } from "./admin-results-export";
import { DB, SCALES } from "./DiagnosticsData";
import { downloadDiscoveryPdfReport } from "./pdf-export";
import {
  DISCOVERY_ITEMS_PER_PAGE,
  calculateDiscoveryCompletionPercent,
} from "./reporting";
import {
  createDiscoveryInvitations,
  getDiscoveryFeedbackSettings,
  getDiscoveryOverview,
  getDiscoveryOverviewDetail,
  getDiscoverySession,
  listDiscoveryInvitations,
  resetDiscoveryOverviewAttempt,
  resetDiscoverySessionRequest,
  updateDiscoveryFeedbackSettings,
  updateDiscoverySessionRequest,
} from "./client";
import { ResultsView } from "./ResultsView";
import {
  DISCOVERY_JOB_ROLE_OPTIONS,
  type DiscoveryFeedbackSettingsRecord,
  type DiscoveryInvitationRecord,
  type DiscoveryOverviewDetailPayload,
  type DiscoveryOverviewFilters,
  type DiscoveryOverviewPayload,
  type DiscoveryOverviewRow,
  type DiscoveryParticipantProfile,
  type DiscoverySessionRecord,
  type DiscoveryUserState,
} from "./types";

type SaveIndicator = "idle" | "saving" | "saved" | "error";
type ManagerTab = "preview" | "mailing" | "rag" | "results";

interface MailingBuilderState {
  headerLogoUrl: string;
  headerTitle: string;
  preheader: string;
  introText: string;
  bodyBlocks: string[];
  buttonLabel: string;
  footerText: string;
  colors: {
    pageBg: string;
    cardBg: string;
    headerBg: string;
    headerText: string;
    bodyText: string;
    buttonBg: string;
    buttonText: string;
    footerBg: string;
    footerText: string;
  };
}

function defaultProfile(session: DiscoverySessionRecord): DiscoveryParticipantProfile {
  return {
    firstName: session.firstName ?? "",
    lastName: session.lastName ?? "",
    country: session.country ?? "",
    jobRole: session.jobRole ?? "",
    gender: (session.gender as any) ?? "",
    yearsExperience: session.yearsExperience,
  };
}

function toUserState(session: DiscoverySessionRecord): DiscoveryUserState {
  const profile = defaultProfile(session);
  return {
    name: session.nameSnapshot,
    answers: session.answers,
    currentIdx: session.currentIdx,
    status: session.status,
    profile,
    profileCompleted: session.profileCompleted,
  };
}

function isProfileComplete(profile: DiscoveryParticipantProfile): boolean {
  return Boolean(
    profile.firstName &&
      profile.lastName &&
      profile.country &&
      profile.jobRole &&
      profile.gender &&
      Number.isFinite(profile.yearsExperience),
  );
}

function buildPersistPayload(state: DiscoveryUserState) {
  return {
    status: state.status,
    answers: state.answers,
    currentIdx: state.currentIdx,
    completionPercent: calculateDiscoveryCompletionPercent(state.answers),
    profile: state.profile,
  };
}

function parseEmailsFromText(input: string): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of input.split(/[\n,;\s]+/g)) {
    const email = raw.trim().toLowerCase();
    if (!email) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    output.push(email);
  }

  return output;
}

async function parseEmailsFromSpreadsheet(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const rows = utils.sheet_to_json<Array<string | number | null>>(
    workbook.Sheets[firstSheetName],
    { header: 1, defval: "" },
  );

  const flat = rows.flatMap((row) => row.map((cell) => String(cell ?? "")));
  return parseEmailsFromText(flat.join("\n"));
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildManagerTabs() {
  return [
    { key: "preview" as const, label: "Vista previa del diagnóstico" },
    { key: "mailing" as const, label: "Configuración de mailing y envío" },
    { key: "rag" as const, label: "Configuración RAG" },
    { key: "results" as const, label: "Resultados generales" },
  ];
}

function buildSimulatedDiscoveryState(name: string): DiscoveryUserState {
  const answers: Record<string, string | number> = {};
  for (const item of DB) {
    if (item.type === "likert") {
      const skewed = Math.random();
      const value =
        skewed < 0.15 ? 1 : skewed < 0.35 ? 2 : skewed < 0.7 ? 3 : skewed < 0.9 ? 4 : 5;
      answers[String(item.id)] = value;
    } else {
      const options = item.options ?? [];
      if (options.length === 0) continue;
      const idx = Math.floor(Math.random() * options.length);
      answers[String(item.id)] = options[idx]?.id ?? options[0].id;
    }
  }

  const safeName = name.trim() || "Usuario Simulado";
  const [firstName, ...rest] = safeName.split(" ");
  return {
    name: safeName,
    answers,
    currentIdx: 0,
    status: "results",
    profile: {
      firstName: firstName || "Usuario",
      lastName: rest.join(" ") || "Simulado",
      country: "Colombia",
      jobRole: "Gerente/Mando medio",
      gender: "Hombre",
      yearsExperience: 10,
    },
    profileCompleted: true,
  };
}

export function DiscoveryExperience() {
  const { currentRole, currentUser, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();
  const isManager = currentRole === "admin" || currentRole === "gestor";

  const [session, setSession] = React.useState<DiscoverySessionRecord | null>(null);
  const [state, setState] = React.useState<DiscoveryUserState>({
    name: currentUser?.name ?? "Usuario 4Shine",
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
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [saveIndicator, setSaveIndicator] = React.useState<SaveIndicator>("idle");
  const hydratedRef = React.useRef(false);
  const lastSnapshotRef = React.useRef("");

  const [managerTab, setManagerTab] = React.useState<ManagerTab>("preview");
  const [managerPreviewIdx, setManagerPreviewIdx] = React.useState(0);
  const [overview, setOverview] = React.useState<DiscoveryOverviewPayload | null>(null);
  const [settings, setSettings] = React.useState<DiscoveryFeedbackSettingsRecord | null>(null);
  const [managerEmails, setManagerEmails] = React.useState("");
  const [invitations, setInvitations] = React.useState<DiscoveryInvitationRecord[]>([]);
  const [isSendingInvites, setIsSendingInvites] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [isUploadingRagDocs, setIsUploadingRagDocs] = React.useState(false);
  const [mailingBuilder, setMailingBuilder] = React.useState<MailingBuilderState>({
    headerLogoUrl: "{{platform_logo_url}}",
    headerTitle: "Diagnóstico 4Shine",
    preheader: "Acceso personalizado a tu lectura ejecutiva",
    introText:
      "Ya puedes ingresar al módulo de Descubrimiento. Usa tu código único y el botón de acceso.",
    bodyBlocks: [
      "Este acceso está vinculado exclusivamente a tu correo de invitación.",
      "Cuando ingreses, podrás completar el diagnóstico de liderazgo.",
    ],
    buttonLabel: "Abrir diagnóstico",
    footerText: "4Shine Platform",
    colors: {
      pageBg: "#f8fafc",
      cardBg: "#ffffff",
      headerBg: "#311f44",
      headerText: "#ffffff",
      bodyText: "#0f172a",
      buttonBg: "#311f44",
      buttonText: "#ffffff",
      footerBg: "#f1f5f9",
      footerText: "#475569",
    },
  });

  const [resultsFilters, setResultsFilters] = React.useState<{
    userId: string;
    country: string;
    jobRole: string;
    gender: string;
    yearsExperienceMin: string;
    yearsExperienceMax: string;
  }>({
    userId: "",
    country: "",
    jobRole: "",
    gender: "",
    yearsExperienceMin: "",
    yearsExperienceMax: "",
  });
  const [selectedOverviewRowId, setSelectedOverviewRowId] = React.useState("");
  const [simulatedState, setSimulatedState] = React.useState<DiscoveryUserState | null>(null);
  const [simulationSeed, setSimulationSeed] = React.useState(0);
  const overviewDetailCacheRef = React.useRef<Map<string, DiscoveryOverviewDetailPayload>>(new Map());
  const [rowActionLoadingKey, setRowActionLoadingKey] = React.useState<string | null>(null);
  const [lastOverviewRefreshAt, setLastOverviewRefreshAt] = React.useState<Date | null>(null);
  const [isRefreshingOverview, setIsRefreshingOverview] = React.useState(false);
  const firstQuestionCardRef = React.useRef<HTMLElement | null>(null);

  const managerPreviewStart = managerPreviewIdx;
  const managerPreviewEnd = Math.min(
    managerPreviewStart + DISCOVERY_ITEMS_PER_PAGE,
    DB.length,
  );
  const managerPreviewItems = DB.slice(managerPreviewStart, managerPreviewEnd);

  const applySession = React.useCallback((next: DiscoverySessionRecord) => {
    setSession(next);
    const nextState = toUserState(next);
    setState(nextState);
    lastSnapshotRef.current = JSON.stringify(buildPersistPayload(nextState));
    hydratedRef.current = true;
  }, []);

  const managerUsers = React.useMemo(() => {
    return (overview?.availableFilters.users ?? []).filter(
      (user) => user.userId !== currentUser?.id,
    );
  }, [currentUser?.id, overview?.availableFilters.users]);

  const selectedOverviewRow = React.useMemo(
    () => overview?.rows.find((row) => row.sessionId === selectedOverviewRowId) ?? null,
    [overview?.rows, selectedOverviewRowId],
  );

  const activeAnalytics = selectedOverviewRow?.analytics ?? overview?.analytics ?? {
    completion: {
      eligible: 0,
      completed: 0,
      rate: 0,
    },
    generalAverage: 0,
    general: [],
    pillars: [],
    components: [],
    componentsTop: [],
    componentsWeak: [],
    satisfaction: {
      responses: 0,
      average: 0,
      questions: [],
    },
  };

  const loadManagerOverview = React.useCallback(
    async (inputFilters?: DiscoveryOverviewFilters, isSilent = false) => {
      if (!isSilent) setIsRefreshingOverview(true);
      try {
        const payload = await getDiscoveryOverview(inputFilters);
        setOverview(payload);
        setLastOverviewRefreshAt(new Date());
        return payload;
      } finally {
        if (!isSilent) setIsRefreshingOverview(false);
      }
    },
    [],
  );

  const loadManagerData = React.useCallback(async () => {
    const [overviewPayload, settingsPayload, invitationRows] = await Promise.all([
      loadManagerOverview(),
      getDiscoveryFeedbackSettings(),
      listDiscoveryInvitations(),
    ]);

    setSettings(settingsPayload);
    setInvitations(invitationRows);
    void overviewPayload;
  }, [loadManagerOverview]);

  const buildCurrentOverviewFilters = React.useCallback(
    (): DiscoveryOverviewFilters => ({
      userId: resultsFilters.userId || undefined,
      country: resultsFilters.country || undefined,
      jobRole: resultsFilters.jobRole || undefined,
      gender: resultsFilters.gender || undefined,
      yearsExperienceMin: parseNumber(resultsFilters.yearsExperienceMin),
      yearsExperienceMax: parseNumber(resultsFilters.yearsExperienceMax),
    }),
    [resultsFilters],
  );

  const ensureOverviewDetail = React.useCallback(
    async (sessionId: string): Promise<DiscoveryOverviewDetailPayload> => {
      const cached = overviewDetailCacheRef.current.get(sessionId);
      if (cached) return cached;
      const detail = await getDiscoveryOverviewDetail(sessionId);
      overviewDetailCacheRef.current.set(sessionId, detail);
      return detail;
    },
    [],
  );

  const handleResetOverviewRow = React.useCallback(
    async (row: DiscoveryOverviewRow) => {
      const approved = await confirm({
        title: "Reiniciar intento",
        message: `Se reiniciará el diagnóstico de ${row.participantName}. Esta acción borra respuestas, satisfacción e informes generados para este intento.`,
        tone: "warning",
        confirmText: "Reiniciar",
        cancelText: "Cancelar",
      });
      if (!approved) return;

      const loadingKey = `${row.sessionId}:reset`;
      setRowActionLoadingKey(loadingKey);
      try {
        await resetDiscoveryOverviewAttempt(row.sessionId);
        overviewDetailCacheRef.current.delete(row.sessionId);
        if (selectedOverviewRowId === row.sessionId) {
          setSelectedOverviewRowId("");
        }
        await loadManagerOverview(buildCurrentOverviewFilters());
        await alert({
          title: "Intento reiniciado",
          message: `${row.participantName} puede volver a iniciar el diagnóstico desde cero.`,
          tone: "success",
        });
      } catch (error) {
        await alert({
          title: "No se pudo reiniciar",
          message: error instanceof Error ? error.message : "Error inesperado.",
          tone: "error",
        });
      } finally {
        setRowActionLoadingKey((current) => (current === loadingKey ? null : current));
      }
    },
    [alert, buildCurrentOverviewFilters, confirm, loadManagerOverview, selectedOverviewRowId],
  );

  const handleDownloadOverviewReport = React.useCallback(
    async (row: DiscoveryOverviewRow) => {
      if (row.globalIndex === null) {
        await alert({
          title: "Informe no disponible",
          message: "El informe PDF solo está disponible para diagnósticos completados.",
          tone: "warning",
        });
        return;
      }

      const loadingKey = `${row.sessionId}:pdf`;
      setRowActionLoadingKey(loadingKey);
      try {
        const detail = await ensureOverviewDetail(row.sessionId);
        await downloadDiscoveryPdfReport({
          participantName: row.participantName,
          state: detail.state,
          scoring: detail.scoring,
          reports: detail.aiReports,
        });
      } catch (error) {
        await alert({
          title: "No se pudo descargar el informe",
          message: error instanceof Error ? error.message : "Error inesperado.",
          tone: "error",
        });
      } finally {
        setRowActionLoadingKey((current) => (current === loadingKey ? null : current));
      }
    },
    [alert, ensureOverviewDetail],
  );

  const handleDownloadOverviewResults = React.useCallback(
    async (row: DiscoveryOverviewRow) => {
      const loadingKey = `${row.sessionId}:xls`;
      setRowActionLoadingKey(loadingKey);
      try {
        const detail = await ensureOverviewDetail(row.sessionId);
        downloadDiscoveryRowResultsWorkbook(row, detail);
      } catch (error) {
        await alert({
          title: "No se pudo descargar el archivo Excel",
          message: error instanceof Error ? error.message : "Error inesperado.",
          tone: "error",
        });
      } finally {
        setRowActionLoadingKey((current) => (current === loadingKey ? null : current));
      }
    },
    [alert, ensureOverviewDetail],
  );

  React.useEffect(() => {
    if (
      currentRole === "lider" &&
      viewerAccess &&
      !viewerAccess.canAccessDescubrimiento
    ) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        if (isManager) {
          await loadManagerData();
          return;
        }

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
              : "Intentalo nuevamente en unos segundos.",
          tone: "error",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [alert, applySession, currentRole, isManager, loadManagerData, viewerAccess]);

  React.useEffect(() => {
    if (!isManager || managerTab !== "results") return;

    const interval = setInterval(() => {
      void loadManagerOverview(buildCurrentOverviewFilters(), true);
    }, 15000);

    return () => clearInterval(interval);
  }, [isManager, managerTab, loadManagerOverview, buildCurrentOverviewFilters]);

  React.useEffect(() => {
    if (isManager) return;
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
    }, 550);

    return () => window.clearTimeout(timeoutId);
  }, [isManager, state]);

  React.useEffect(() => {
    if (state.status !== "quiz") return;
    firstQuestionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.currentIdx, state.status]);

  const isLockedForViewer =
    currentRole === "lider" &&
    viewerAccess !== null &&
    !viewerAccess.canAccessDescubrimiento;

  const discoveryOffers = filterCommercialProducts(viewerAccess?.catalog, {
    groups: ["program", "discovery"],
  });

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

  const handleIntroStart = async () => {
    if (!isProfileComplete(state.profile)) {
      await alert({
        title: "Completa tu perfil",
        message:
          "Antes de iniciar el diagnóstico debes completar nombres, apellidos, país, cargo, género y años de experiencia.",
        tone: "warning",
      });
      return;
    }

    setState((current) => ({
      ...current,
      profileCompleted: true,
      status:
        current.status === "results"
          ? "results"
          : canResume
            ? "quiz"
            : "instructions",
    }));
  };

  const handleStartQuiz = async () => {
    if (!isProfileComplete(state.profile)) {
      await alert({
        title: "Completa tu perfil",
        message:
          "Antes de iniciar el diagnóstico debes completar nombres, apellidos, país, cargo, género y años de experiencia.",
        tone: "warning",
      });
      return;
    }

    setState((current) => ({
      ...current,
      profileCompleted: true,
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
    const missingIndex = pageItems.findIndex(
      (item) => state.answers[String(item.id)] === undefined,
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
              : "Intentalo nuevamente en unos segundos.",
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
            : "Intentalo nuevamente en unos segundos.",
        tone: "error",
      });
    }
  };

  const handleSurveySubmit = async (
    survey: NonNullable<DiscoverySessionRecord["experienceSurvey"]>,
  ) => {
    const nextSession = await updateDiscoverySessionRequest({
      experienceSurvey: survey,
    });
    applySession(nextSession);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const emails = await parseEmailsFromSpreadsheet(file);
      if (emails.length === 0) {
        await alert({
          title: "Archivo sin correos",
          message: "No encontramos direcciones de correo validas en el archivo.",
          tone: "warning",
        });
        return;
      }

      setManagerEmails((current) => {
        const merged = new Set([...parseEmailsFromText(current), ...emails]);
        return Array.from(merged).join("\n");
      });
    } catch (error) {
      await alert({
        title: "No se pudo leer el archivo",
        message: error instanceof Error ? error.message : "Error desconocido.",
        tone: "error",
      });
    }
  };

  const saveSettings = async (next: DiscoveryFeedbackSettingsRecord, successMessage: string) => {
    setIsSavingSettings(true);
    try {
      const updated = await updateDiscoveryFeedbackSettings({
        aiFeedbackInstructions: next.aiFeedbackInstructions,
        contextDocuments: next.contextDocuments,
        inviteEmailSubject: next.inviteEmailSubject,
        inviteEmailHtml: next.inviteEmailHtml,
        inviteEmailText: next.inviteEmailText,
      });
      setSettings(updated);
      await alert({
        title: "Configuración guardada",
        message: successMessage,
        tone: "success",
      });
    } catch (error) {
      await alert({
        title: "No se pudo guardar",
        message: error instanceof Error ? error.message : "Error desconocido.",
        tone: "error",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const buildMailingFromBuilder = React.useCallback(() => {
    const builder = mailingBuilder;
    const blocksHtml = builder.bodyBlocks
      .filter((block) => block.trim().length > 0)
      .map(
        (block) =>
          `<p style="margin:0 0 12px 0;color:${builder.colors.bodyText};line-height:1.6;">${block}</p>`,
      )
      .join("");

    const html = [
      `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:${builder.colors.pageBg};padding:28px;color:${builder.colors.bodyText};">`,
      `<div style="max-width:620px;margin:0 auto;background:${builder.colors.cardBg};border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">`,
      `<div style="background:${builder.colors.headerBg};padding:20px 24px;color:${builder.colors.headerText};">`,
      `<p style="margin:0 0 10px 0;"><img src="${builder.headerLogoUrl}" alt="Logo 4Shine" style="display:block;height:36px;max-width:180px;object-fit:contain;" /></p>`,
      `<h1 style="margin:0;font-size:22px;line-height:1.2;">${builder.headerTitle}</h1>`,
      `<p style="margin:8px 0 0 0;opacity:.9;">${builder.preheader}</p>`,
      `</div>`,
      `<div style="padding:24px;">`,
      `<p style="margin:0 0 14px 0;color:${builder.colors.bodyText};line-height:1.6;">${builder.introText}</p>`,
      blocksHtml,
      `<div style="margin:20px 0;padding:16px;border:1px dashed ${builder.colors.buttonBg};border-radius:12px;background:#fff7ed;">`,
      `<p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Codigo unico</p>`,
      `<p style="margin:0;font-size:30px;font-weight:800;letter-spacing:.18em;color:${builder.colors.bodyText};">{{access_code}}</p>`,
      `</div>`,
      `<p style="margin:0 0 12px 0;color:${builder.colors.bodyText};">`,
      `<a href="{{invite_url}}" style="display:inline-block;background:${builder.colors.buttonBg};color:${builder.colors.buttonText};text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">${builder.buttonLabel}</a>`,
      `</p>`,
      `<p style="margin:0;color:#64748b;font-size:13px;">Correo: {{recipient_email}}</p>`,
      `<p style="margin:4px 0 0 0;color:#64748b;font-size:13px;">ID Diagnostico: {{diagnostic_id}}</p>`,
      `</div>`,
      `<div style="background:${builder.colors.footerBg};padding:14px 24px;color:${builder.colors.footerText};font-size:12px;">${builder.footerText}</div>`,
      `</div>`,
      `</div>`,
    ].join("");

    const textBlocks = builder.bodyBlocks
      .filter((block) => block.trim().length > 0)
      .map((block) => `- ${block}`)
      .join("\\n");

    const text = [
      builder.headerTitle,
      builder.preheader,
      "",
      builder.introText,
      textBlocks,
      "",
      "Codigo unico:",
      "{{access_code}}",
      "",
      `${builder.buttonLabel}:`,
      "{{invite_url}}",
      "",
      "Correo:",
      "{{recipient_email}}",
      "",
      "ID Diagnostico:",
      "{{diagnostic_id}}",
      "",
      builder.footerText,
    ].join("\\n");

    return { html, text };
  }, [mailingBuilder]);

  const applyBuilderToMailing = React.useCallback(() => {
    const generated = buildMailingFromBuilder();
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            inviteEmailHtml: generated.html,
            inviteEmailText: generated.text,
          }
        : prev,
    );
  }, [buildMailingFromBuilder]);

  const handleInviteFromText = async () => {
    if (!settings) return;

    const emails = parseEmailsFromText(managerEmails);
    if (emails.length === 0) {
      await alert({
        title: "Sin correos validos",
        message: "Ingresa correos manuales o carga un archivo CSV/XLS con correos.",
        tone: "warning",
      });
      return;
    }

    setIsSendingInvites(true);
    try {
      const result = await createDiscoveryInvitations({
        emails,
        emailSubject: settings.inviteEmailSubject,
        emailHtml: settings.inviteEmailHtml,
        emailText: settings.inviteEmailText,
      });

      setManagerEmails("");
      const invitationRows = await listDiscoveryInvitations();
      setInvitations(invitationRows);

      await alert({
        title: "Invitaciones enviadas",
        message: `Se enviaron ${result.sentCount} invitaciones con código único de acceso.`,
        tone: "success",
      });
    } catch (error) {
      await alert({
        title: "No se pudieron enviar invitaciones",
        message: error instanceof Error ? error.message : "Error desconocido.",
        tone: "error",
      });
    } finally {
      setIsSendingInvites(false);
    }
  };

  const handleRagFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0 || !settings) return;

    setIsUploadingRagDocs(true);
    try {
      const uploadedDocs: DiscoveryFeedbackSettingsRecord["contextDocuments"] = [];
      const failedUploads: Array<{ fileName: string; reason: string }> = [];

      for (const file of files) {
        try {
          const uploaded = await uploadToR2({
            file,
            moduleCode: "descubrimiento",
            action: "update",
            pathPrefix: "descubrimiento/context",
            entityTable: "app_assessment.discovery_feedback_settings",
            fieldName: "context_documents",
          });

          uploadedDocs.push({
            id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${file.name}`),
            name: uploaded.fileName,
            url: uploaded.url,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          const detail =
            error instanceof Error
              ? error.message
              : "No se pudo cargar este archivo.";
          failedUploads.push({
            fileName: file.name,
            reason: detail.includes("(413)")
              ? "Supera el tamaño permitido por el servidor. Intenta con un archivo mas liviano."
              : detail,
          });
        }
      }

      if (uploadedDocs.length > 0) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                contextDocuments: [...uploadedDocs, ...prev.contextDocuments],
              }
            : prev,
        );
      }

      if (uploadedDocs.length > 0 && failedUploads.length === 0) {
        await alert({
          title: "Archivos cargados",
          message: `Se cargaron ${uploadedDocs.length} archivo(s) de contexto.`,
          tone: "success",
        });
      } else if (uploadedDocs.length > 0 && failedUploads.length > 0) {
        await alert({
          title: "Carga parcial completada",
          message: `Se cargaron ${uploadedDocs.length} archivo(s). Fallaron ${failedUploads.length}: ${failedUploads
            .slice(0, 2)
            .map((item) => `${item.fileName}: ${item.reason}`)
            .join(" | ")}`,
          tone: "warning",
        });
      } else {
        await alert({
          title: "No se pudieron cargar archivos",
          message: failedUploads
            .map((item) => `${item.fileName}: ${item.reason}`)
            .join(" | "),
          tone: "error",
        });
      }
    } catch (error) {
      await alert({
        title: "No se pudieron cargar archivos",
        message: error instanceof Error ? error.message : "Error desconocido.",
        tone: "error",
      });
    } finally {
      setIsUploadingRagDocs(false);
    }
  };

  const handleResultsFilter = async (field: keyof typeof resultsFilters, value: string) => {
    const next = { ...resultsFilters, [field]: value };
    setResultsFilters(next);

    const apiFilters: DiscoveryOverviewFilters = {
      userId: next.userId || undefined,
      country: next.country || undefined,
      jobRole: next.jobRole || undefined,
      gender: next.gender || undefined,
      yearsExperienceMin: parseNumber(next.yearsExperienceMin),
      yearsExperienceMax: parseNumber(next.yearsExperienceMax),
    };

    setIsLoading(true);
    try {
      await loadManagerOverview(apiFilters);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isManager) return;
    if (managerTab !== "results") return;

    const intervalId = window.setInterval(() => {
      void loadManagerOverview(buildCurrentOverviewFilters());
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [buildCurrentOverviewFilters, isManager, loadManagerOverview, managerTab]);

  React.useEffect(() => {
    if (!selectedOverviewRowId) return;
    const exists = overview?.rows.some((row) => row.sessionId === selectedOverviewRowId);
    if (!exists) {
      setSelectedOverviewRowId("");
    }
  }, [overview?.rows, selectedOverviewRowId]);

  if (isLockedForViewer) {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Activa el diagnóstico individual o el programa completo para abrir esta lectura ejecutiva."
        />
        <StatGrid stats={stats} />
        <AccessOfferPanel
          badge="Compra requerida"
          title="Desbloquea tu diagnóstico 4Shine."
          description="Esta experiencia se vincula a tu usuario y guarda un diagnóstico único por cuenta. Puedes activar solo Descubrimiento o entrar al programa completo 4Shine."
          products={discoveryOffers}
          primaryAction={{ href: "/dashboard", label: "Ver opciones disponibles" }}
          note="Con Descubrimiento obtienes la prueba diagnóstica y su lectura ejecutiva."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-[var(--brand-primary)]" />
          <p className="mt-3 text-sm text-[var(--app-muted)]">
            Preparando experiencia de descubrimiento...
          </p>
        </div>
      </div>
    );
  }

  if (isManager) {
    const tabs = buildManagerTabs();
    const currentSettings = settings;

    return (
      <div className="space-y-6">
        <PageTitle
          title="Descubrimiento · Gestión"
          subtitle="Gestión ejecutiva del módulo por pestañas: vista previa, mailing, RAG y resultados generales."
        />

        <div className="app-panel p-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setManagerTab(tab.key)}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em]",
                  managerTab === tab.key
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {managerTab === "mailing" && (
          <div className="app-panel p-5">
            <p className="app-section-kicker">Acceso externo al módulo</p>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Las invitaciones son para correos externos, aunque no sean usuarios de la plataforma.
              La llave de acceso es el enlace de invitación + código único.
            </p>
          </div>
        )}

        {managerTab === "preview" && (
          <div className="space-y-4">
            <div className="app-panel p-5">
              <p className="app-section-kicker">Vista estructural</p>
              <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)]">
                Navegación completa del cuestionario
              </h3>
              <p className="mt-2 text-sm text-[var(--app-muted)]">
                Esta vista no está asociada a ningún usuario. Solo permite
                revisar todas las preguntas que componen la prueba.
              </p>

              <div className="mt-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-ink)]">
                <p>
                  Bloque {Math.floor(managerPreviewStart / DISCOVERY_ITEMS_PER_PAGE) + 1} de{" "}
                  {Math.ceil(DB.length / DISCOVERY_ITEMS_PER_PAGE)}
                </p>
                <p>
                  Preguntas {managerPreviewStart + 1} a {managerPreviewEnd} de {DB.length}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedState(buildSimulatedDiscoveryState(currentUser?.name ?? "Admin Demo"));
                    setSimulationSeed((current) => current + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
                >
                  Simular resultados
                </button>
                {simulatedState && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedState(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)]"
                  >
                    Limpiar simulación
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {managerPreviewItems.map((question, index) => {
                const questionNumber = managerPreviewStart + index + 1;

                return (
                  <article key={String(question.id)} className="app-panel p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--app-chip)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                        {question.pillar}
                      </span>
                      <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                        {question.type === "sjt" ? "Situacional" : "Autoinforme"}
                      </span>
                    </div>

                    <h4 className="mt-4 text-xl font-black leading-snug text-[var(--app-ink)] md:text-2xl">
                      <span className="mr-2 text-[var(--brand-primary)]">
                        {questionNumber}.
                      </span>
                      {question.text}
                    </h4>

                    {question.type === "likert" ? (
                      <div className="mt-5 grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const label = SCALES[question.scale ?? "freq"][value - 1];
                          return (
                            <div
                              key={value}
                              className="min-h-24 rounded-[14px] border border-[var(--app-border)] bg-white/70 px-2 py-3 text-center text-[11px] font-semibold text-[var(--app-ink)]"
                            >
                              <span className="mt-2 block text-sm font-extrabold">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-5 space-y-2">
                        {question.options?.map((option) => (
                          <div
                            key={option.id}
                            className="rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-[var(--app-ink)]"
                          >
                            {option.id}. {option.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setManagerPreviewIdx((current) =>
                    Math.max(0, current - DISCOVERY_ITEMS_PER_PAGE),
                  )
                }
                disabled={managerPreviewStart === 0}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)] disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                onClick={() =>
                  setManagerPreviewIdx((current) =>
                    Math.min(
                      Math.max(0, DB.length - DISCOVERY_ITEMS_PER_PAGE),
                      current + DISCOVERY_ITEMS_PER_PAGE,
                    ),
                  )
                }
                disabled={managerPreviewEnd >= DB.length}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>

            {simulatedState && (
              <section className="app-panel p-5 sm:p-6">
                <p className="app-section-kicker">Simulación de análisis IA</p>
                <h3 className="mt-2 text-xl font-black text-[var(--app-ink)]">
                  Validación de profundidad de informe y productos generados
                </h3>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  Esta simulación no persiste datos en base de datos. Se usa para pruebas de comportamiento del análisis.
                </p>

                <div className="mt-5">
                  <ResultsView
                    key={`sim-${simulationSeed}`}
                    state={simulatedState}
                    embedded={true}
                  />
                </div>
              </section>
            )}
          </div>
        )}

        {managerTab === "mailing" && currentSettings && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="app-panel p-5 space-y-3">
              <h3 className="text-lg font-black text-[var(--app-ink)]">Configuración de mailing</h3>

              <div className="rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Constructor visual (componentes, estilos y colores)
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    value={mailingBuilder.headerLogoUrl}
                    onChange={(event) =>
                      setMailingBuilder((prev) => ({ ...prev, headerLogoUrl: event.target.value }))
                    }
                    placeholder="URL logo del cabezote"
                    className="h-10 rounded-[10px] border border-[var(--app-border)] bg-white px-3 text-sm md:col-span-2"
                  />
                  <input
                    value={mailingBuilder.headerTitle}
                    onChange={(event) =>
                      setMailingBuilder((prev) => ({ ...prev, headerTitle: event.target.value }))
                    }
                    placeholder="Titulo del cabezote"
                    className="h-10 rounded-[10px] border border-[var(--app-border)] bg-white px-3 text-sm"
                  />
                  <input
                    value={mailingBuilder.preheader}
                    onChange={(event) =>
                      setMailingBuilder((prev) => ({ ...prev, preheader: event.target.value }))
                    }
                    placeholder="Subtitulo del cabezote"
                    className="h-10 rounded-[10px] border border-[var(--app-border)] bg-white px-3 text-sm"
                  />
                  <input
                    value={mailingBuilder.buttonLabel}
                    onChange={(event) =>
                      setMailingBuilder((prev) => ({ ...prev, buttonLabel: event.target.value }))
                    }
                    placeholder="Texto del boton"
                    className="h-10 rounded-[10px] border border-[var(--app-border)] bg-white px-3 text-sm"
                  />
                  <input
                    value={mailingBuilder.footerText}
                    onChange={(event) =>
                      setMailingBuilder((prev) => ({ ...prev, footerText: event.target.value }))
                    }
                    placeholder="Texto del footer"
                    className="h-10 rounded-[10px] border border-[var(--app-border)] bg-white px-3 text-sm"
                  />
                </div>

                <textarea
                  value={mailingBuilder.introText}
                  onChange={(event) =>
                    setMailingBuilder((prev) => ({ ...prev, introText: event.target.value }))
                  }
                  placeholder="Texto introductorio"
                  className="mt-3 min-h-20 w-full rounded-[10px] border border-[var(--app-border)] bg-white p-3 text-sm"
                />

                <div className="mt-3 space-y-2">
                  {mailingBuilder.bodyBlocks.map((block, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <textarea
                        value={block}
                        onChange={(event) =>
                          setMailingBuilder((prev) => {
                            const nextBlocks = [...prev.bodyBlocks];
                            nextBlocks[index] = event.target.value;
                            return { ...prev, bodyBlocks: nextBlocks };
                          })
                        }
                        placeholder={`Bloque de contenido ${index + 1}`}
                        className="min-h-16 w-full rounded-[10px] border border-[var(--app-border)] bg-white p-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMailingBuilder((prev) => ({
                            ...prev,
                            bodyBlocks: prev.bodyBlocks.filter((_, i) => i !== index),
                          }))
                        }
                        className="rounded-full border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMailingBuilder((prev) => ({
                        ...prev,
                        bodyBlocks: [...prev.bodyBlocks, ""],
                      }))
                    }
                    className="rounded-full border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--app-ink)]"
                  >
                    Agregar bloque
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                  {[
                    ["headerBg", "Header"],
                    ["buttonBg", "Boton"],
                    ["pageBg", "Fondo"],
                    ["cardBg", "Tarjeta"],
                    ["footerBg", "Footer"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-[10px] border border-[var(--app-border)] bg-white px-2 py-2 text-xs">
                      <input
                        type="color"
                        value={
                          mailingBuilder.colors[key as keyof MailingBuilderState["colors"]]
                        }
                        onChange={(event) =>
                          setMailingBuilder((prev) => ({
                            ...prev,
                            colors: {
                              ...prev.colors,
                              [key]: event.target.value,
                            },
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={applyBuilderToMailing}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--app-ink)]"
                >
                  Aplicar constructor a HTML/TXT
                </button>
              </div>

              <label className="block text-sm font-semibold text-[var(--app-ink)]">
                Asunto
                <input
                  value={currentSettings.inviteEmailSubject}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev ? { ...prev, inviteEmailSubject: event.target.value } : prev,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--app-ink)]">
                HTML (altamente editable)
                <textarea
                  value={currentSettings.inviteEmailHtml}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev ? { ...prev, inviteEmailHtml: event.target.value } : prev,
                    )
                  }
                  className="mt-2 min-h-56 w-full rounded-[12px] border border-[var(--app-border)] bg-white p-3 font-mono text-xs"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--app-ink)]">
                Texto plano
                <textarea
                  value={currentSettings.inviteEmailText}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev ? { ...prev, inviteEmailText: event.target.value } : prev,
                    )
                  }
                  className="mt-2 min-h-32 w-full rounded-[12px] border border-[var(--app-border)] bg-white p-3 text-sm"
                />
              </label>

              <p className="text-xs text-[var(--app-muted)]">
                Placeholders disponibles: <code>{"{{access_code}}"}</code>, <code>{"{{invite_url}}"}</code>, <code>{"{{recipient_email}}"}</code>, <code>{"{{diagnostic_id}}"}</code>, <code>{"{{participant_name}}"}</code>, <code>{"{{platform_logo_url}}"}</code>
              </p>

              <button
                type="button"
                disabled={isSavingSettings}
                onClick={() =>
                  void saveSettings(
                    currentSettings,
                    "Plantilla de mailing actualizada correctamente.",
                  )
                }
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white disabled:opacity-60"
              >
                {isSavingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Guardar mailing
              </button>
            </section>

            <section className="app-panel p-5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[var(--brand-primary)]" />
                <h3 className="text-lg font-black text-[var(--app-ink)]">Envio masivo</h3>
              </div>

              <textarea
                value={managerEmails}
                onChange={(event) => setManagerEmails(event.target.value)}
                placeholder="correo1@empresa.com\ncorreo2@empresa.com"
                className="mt-3 min-h-32 w-full rounded-[12px] border border-[var(--app-border)] bg-white p-3 text-sm"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-ink)]">
                  <Upload size={13} />
                  CSV/XLS
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={(event) => void handleImportFile(event)}
                  />
                </label>

                <button
                  type="button"
                  disabled={isSendingInvites}
                  onClick={() => void handleInviteFromText()}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white disabled:opacity-60"
                >
                  {isSendingInvites ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Enviar invitaciones
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Historial ({invitations.length})
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {invitations.slice(0, 10).map((invitation) => (
                    <li key={invitation.invitationId} className="rounded-[10px] border border-[var(--app-border)] p-2">
                      <p className="font-semibold text-[var(--app-ink)]">{invitation.invitedEmail}</p>
                      <p className="text-xs text-[var(--app-muted)]">
                        Código terminado en {invitation.accessCodeLast4} · enviado {new Date(invitation.accessCodeSentAt).toLocaleString("es-CO")} · {invitation.sessionId ? "Lectura de resultados" : "Acceso al módulo"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}

        {managerTab === "rag" && currentSettings && (
          <div className="app-panel p-5 space-y-4">
            <h3 className="text-lg font-black text-[var(--app-ink)]">Configuración RAG</h3>

            <label className="block text-sm font-semibold text-[var(--app-ink)]">
              Instrucciones para el análisis (precargadas)
              <textarea
                value={currentSettings.aiFeedbackInstructions}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev ? { ...prev, aiFeedbackInstructions: event.target.value } : prev,
                  )
                }
                className="mt-2 min-h-40 w-full rounded-[12px] border border-[var(--app-border)] bg-white p-3 text-sm"
              />
            </label>

            <div className="rounded-[12px] border border-[var(--app-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  Archivos de contexto ({currentSettings.contextDocuments.length})
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-ink)]">
                  {isUploadingRagDocs ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Adjuntar archivos
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx"
                    onChange={(event) => void handleRagFilesUpload(event)}
                  />
                </label>
              </div>

              <ul className="mt-3 space-y-2 text-sm">
                {currentSettings.contextDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-[var(--app-border)] p-2">
                    <a href={doc.url} target="_blank" rel="noreferrer" className="truncate text-[var(--brand-primary)] underline">
                      {doc.name}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                contextDocuments: prev.contextDocuments.filter((item) => item.id !== doc.id),
                              }
                            : prev,
                        )
                      }
                      className="text-xs font-semibold text-rose-700"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={isSavingSettings}
              onClick={() =>
                void saveSettings(
                  currentSettings,
                  "Configuración RAG e instrucciones de análisis actualizadas.",
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {isSavingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Guardar RAG
            </button>
          </div>
        )}

        {managerTab === "results" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black text-[var(--app-ink)]">Resultados Generales</h4>
                {lastOverviewRefreshAt && (
                   <span className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider opacity-60">
                     Ultima actualizacion: {lastOverviewRefreshAt.toLocaleTimeString()}
                   </span>
                )}
              </div>
              <button
                onClick={() => void loadManagerOverview(buildCurrentOverviewFilters())}
                disabled={isRefreshingOverview}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-4 text-xs font-extrabold uppercase tracking-widest text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:opacity-50"
              >
                {isRefreshingOverview ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                Actualizar
              </button>
            </div>

            <div className="app-panel p-4">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                <select
                  value={resultsFilters.userId}
                  onChange={(event) => void handleResultsFilter("userId", event.target.value)}
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                >
                  <option value="">Usuario</option>
                  {managerUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>{user.name || user.userId}</option>
                  ))}
                </select>

                <select
                  value={resultsFilters.country}
                  onChange={(event) => void handleResultsFilter("country", event.target.value)}
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                >
                  <option value="">País</option>
                  {overview?.availableFilters.countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                <select
                  value={resultsFilters.jobRole}
                  onChange={(event) => void handleResultsFilter("jobRole", event.target.value)}
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                >
                  <option value="">Cargo</option>
                  {overview?.availableFilters.jobRoles.map((jobRole) => (
                    <option key={jobRole} value={jobRole}>{jobRole}</option>
                  ))}
                </select>

                <select
                  value={resultsFilters.gender}
                  onChange={(event) => void handleResultsFilter("gender", event.target.value)}
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                >
                  <option value="">Género</option>
                  {overview?.availableFilters.genders.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>

                <input
                  value={resultsFilters.yearsExperienceMin}
                  onChange={(event) => void handleResultsFilter("yearsExperienceMin", event.target.value)}
                  placeholder="Exp min"
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                />

                <input
                  value={resultsFilters.yearsExperienceMax}
                  onChange={(event) => void handleResultsFilter("yearsExperienceMax", event.target.value)}
                  placeholder="Exp max"
                  className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
                />
              </div>
            </div>

            <StatGrid
              stats={[
                { label: "Diagnosticos", value: overview?.stats.totalDiagnostics ?? 0, hint: "Filtrados" },
                { label: "Completados", value: overview?.stats.completedDiagnostics ?? 0, hint: "Con indice" },
                { label: "Indice promedio", value: `${overview?.stats.averageGlobalIndex ?? 0}%`, hint: "Global" },
                { label: "Registros", value: overview?.rows.length ?? 0, hint: "Tabla" },
              ]}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="app-panel p-4">
                <p className="app-section-kicker">Tasa de finalizacion</p>
                <div className="mt-3 h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completado", value: activeAnalytics.completion.rate },
                          { name: "Restante", value: Math.max(0, 100 - activeAnalytics.completion.rate) },
                        ]}
                        dataKey="value"
                        innerRadius={68}
                        outerRadius={96}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        <Cell fill="var(--brand-primary)" />
                        <Cell fill="rgba(108,88,134,0.14)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-[var(--app-muted)]">
                  {activeAnalytics.completion.completed} de {activeAnalytics.completion.eligible} completados ({activeAnalytics.completion.rate}%)
                </p>
              </div>

              <div className="app-panel p-4">
                <p className="app-section-kicker">Resultados generales</p>
                <div className="mt-3 h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={activeAnalytics.pillars.map((pillar) => ({
                        subject: pillar.label,
                        value: pillar.average,
                        fullMark: 100,
                      }))}
                    >
                      <PolarGrid stroke="rgba(108,88,134,0.22)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Radar
                        dataKey="value"
                        stroke="#7c3aed"
                        fill="#7c3aed"
                        fillOpacity={0.34}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-[var(--app-muted)]">
                  Promedio de los 4 pilares: {activeAnalytics.generalAverage}%
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {activeAnalytics.pillars.map((pillar) => (
                <div key={pillar.pillar} className="app-panel p-4">
                  <p className="app-section-kicker">{pillar.label}</p>
                  <div className="mt-3 h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={(activeAnalytics.components ?? [])
                          .filter((component) => component.pillar === pillar.pillar)
                          .map((component) => ({
                            subject: component.component,
                            value: component.average,
                            fullMark: 100,
                          }))}
                      >
                        <PolarGrid stroke="rgba(108,88,134,0.22)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip />
                        <Radar
                          dataKey="value"
                          stroke="var(--brand-primary)"
                          fill="var(--brand-primary)"
                          fillOpacity={0.28}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-[var(--app-muted)]">Promedio: {pillar.average}%</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="app-panel p-4">
                <p className="app-section-kicker">5 componentes top</p>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeAnalytics.componentsTop ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,88,134,0.2)" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="component" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="average" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="app-panel p-4">
                <p className="app-section-kicker">5 componentes mas debiles</p>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeAnalytics.componentsWeak ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,88,134,0.2)" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="component" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="average" fill="#f97316" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="app-panel p-4 xl:col-span-2">
                <p className="app-section-kicker">Satisfacción de experiencia</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Respuestas: {activeAnalytics.satisfaction.responses ?? 0} · Promedio: {activeAnalytics.satisfaction.average ?? 0}/5
                </p>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeAnalytics.satisfaction.questions ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,88,134,0.2)" />
                      <XAxis dataKey="question" hide />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="average" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-[var(--app-muted)]">
                  {(activeAnalytics.satisfaction.questions ?? []).map((item) => (
                    <li key={item.question}>
                      {item.question}: <strong>{item.average}/5</strong> ({item.count} resp.)
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedOverviewRow && (
              <div className="app-panel p-3 text-sm text-[var(--app-muted)]">
                Filtro por fila activo: <strong>{selectedOverviewRow.participantName}</strong>.
                <button
                  type="button"
                  onClick={() => setSelectedOverviewRowId("")}
                  className="ml-2 font-semibold text-[var(--brand-primary)] underline"
                >
                  Limpiar
                </button>
              </div>
            )}

            <div className="app-panel overflow-auto p-4">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)]">
                    <th className="px-2 py-2">ID</th>
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Usuario</th>
                    <th className="px-2 py-2">Correo</th>
                    <th className="px-2 py-2">País</th>
                    <th className="px-2 py-2">Cargo</th>
                    <th className="px-2 py-2">Género</th>
                    <th className="px-2 py-2">Exp.</th>
                    <th className="px-2 py-2">Avance</th>
                    <th className="px-2 py-2">Indice</th>
                    <th className="px-2 py-2">Satisfacción</th>
                    <th className="px-2 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.rows.map((row) => (
                    <tr
                      key={row.sessionId}
                      onClick={() => setSelectedOverviewRowId(row.sessionId)}
                      className={clsx(
                        "cursor-pointer border-b border-[var(--app-border)] transition-colors hover:bg-[var(--app-chip)]",
                        selectedOverviewRowId === row.sessionId && "bg-[var(--app-chip)]",
                      )}
                    >
                      <td className="px-2 py-2 font-semibold">{row.diagnosticIdentifier}</td>
                      <td className="px-2 py-2">{row.sourceType === "invited" ? "Invitado" : "Plataforma"}</td>
                      <td className="px-2 py-2">{row.participantName}</td>
                      <td className="px-2 py-2">{row.invitedEmail || "-"}</td>
                      <td className="px-2 py-2">{row.country || "-"}</td>
                      <td className="px-2 py-2">{row.jobRole || "-"}</td>
                      <td className="px-2 py-2">{row.gender || "-"}</td>
                      <td className="px-2 py-2">{row.yearsExperience ?? "-"}</td>
                      <td className="px-2 py-2">{row.completionPercent}%</td>
                      <td className="px-2 py-2">{row.globalIndex ?? "-"}</td>
                      <td className="px-2 py-2">
                        {row.analytics.satisfaction.responses > 0 ? (
                          <div className="leading-tight">
                            <div className="font-semibold">
                              {row.analytics.satisfaction.average}/5
                            </div>
                            <div className="text-xs text-[var(--app-muted)]">
                              {row.analytics.satisfaction.responses} resp.
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleResetOverviewRow(row);
                            }}
                            disabled={rowActionLoadingKey === `${row.sessionId}:reset`}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowActionLoadingKey === `${row.sessionId}:reset` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RotateCcw size={12} />
                            )}
                            Reiniciar
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDownloadOverviewReport(row);
                            }}
                            disabled={
                              row.globalIndex === null ||
                              rowActionLoadingKey === `${row.sessionId}:pdf`
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowActionLoadingKey === `${row.sessionId}:pdf` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            Informe
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDownloadOverviewResults(row);
                            }}
                            disabled={rowActionLoadingKey === `${row.sessionId}:xls`}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {rowActionLoadingKey === `${row.sessionId}:xls` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <FileSpreadsheet size={12} />
                            )}
                            Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.status === "results") {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Tu lectura ejecutiva 4Shine integra autopercepción y criterio situacional en un mapa accionable."
        />
        <ResultsView
          state={state}
          publicId={session?.publicId}
          onReset={isManager ? handleReset : undefined}
          initialSurvey={session?.experienceSurvey ?? null}
          onSurveySubmit={handleSurveySubmit}
          initialAiReports={session?.aiReports ?? null}
        />
      </div>
    );
  }

  if (state.status === "intro") {
    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Antes de iniciar, completa tu ficha personal."
        />
        <StatGrid stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)]">
          <section className="app-panel p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="app-section-kicker">Perfil obligatorio</p>
                <h3 className="mt-2 text-2xl font-black text-[var(--app-ink)]">Datos previos al diagnóstico</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <input
                value={state.profile.firstName}
                onChange={(event) =>
                  setState((current) => ({ ...current, profile: { ...current.profile, firstName: event.target.value } }))
                }
                placeholder="Nombres"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <input
                value={state.profile.lastName}
                onChange={(event) =>
                  setState((current) => ({ ...current, profile: { ...current.profile, lastName: event.target.value } }))
                }
                placeholder="Apellidos"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <input
                value={state.profile.country}
                onChange={(event) =>
                  setState((current) => ({ ...current, profile: { ...current.profile, country: event.target.value } }))
                }
                placeholder="País"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
              <select
                value={state.profile.jobRole}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    profile: { ...current.profile, jobRole: event.target.value as DiscoveryParticipantProfile["jobRole"] },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Selecciona cargo</option>
                {DISCOVERY_JOB_ROLE_OPTIONS.map((jobRole) => (
                  <option key={jobRole} value={jobRole}>{jobRole}</option>
                ))}
              </select>
              <select
                value={state.profile.gender}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    profile: { ...current.profile, gender: event.target.value as DiscoveryParticipantProfile["gender"] },
                  }))
                }
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Género</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
              <input
                value={state.profile.yearsExperience ?? ""}
                onChange={(event) =>
                  setState((current) => ({
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
                placeholder="Años de experiencia"
                className="h-11 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleIntroStart()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
            >
              {canResume ? "Continuar diagnóstico" : "Empezar diagnóstico"}
              <ChevronRight size={16} />
            </button>
          </section>

          <aside className="app-panel p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                <Compass size={18} />
              </div>
              <div>
                <p className="app-section-kicker">Perfil vinculado</p>
                <h4 className="mt-2 text-2xl font-black text-[var(--app-ink)]">{currentUser?.name ?? state.name}</h4>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-[var(--app-border)] bg-white/72 px-4 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">ID diagnóstico</p>
                <p className="mt-2 text-sm font-semibold text-[var(--app-ink)]">{session?.diagnosticIdentifier || "Pendiente"}</p>
              </div>
              <div className="rounded-[18px] border border-[var(--app-border)] bg-white/72 px-4 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Avance</p>
                <p className="mt-2 text-sm font-semibold text-[var(--app-ink)]">{completionPercent}%</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (state.status === "instructions") {
    const instructions = [
      {
        id: "1",
        title: "Sinceridad",
        description:
          'No hay respuestas \"correctas\". Responde como eres hoy, no como aspiras ser.',
      },
      {
        id: "2",
        title: "Sin juicios",
        description:
          "Este es un mapa de navegación, no un examen. El objetivo es identificar palancas de crecimiento.",
      },
      {
        id: "3",
        title: "Escala Likert",
        description:
          "96 ítems para evaluar tu autopercepción conductual.",
      },
      {
        id: "4",
        title: "Juicio situacional",
        description: "29 escenarios reales con opciones de respuesta ponderadas.",
      },
      {
        id: "5",
        title: "Análisis 4 pilares",
        description: "Within, Out, Up y Beyond para una visión 360 grados.",
      },
    ];

    return (
      <div className="space-y-8">
        <PageTitle
          title="Descubrimiento"
          subtitle="Tiempo estimado: 20-25 minutos. Sigue estas instrucciones antes de iniciar."
        />

        <section className="app-panel p-6 md:p-8">
          <p className="text-sm text-[var(--app-muted)]">
            El objetivo de este diagnóstico es identificar tus brechas de liderazgo actuales y proporcionarte una hoja de ruta personalizada basada en el modelo 4Shine.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {instructions.map((item) => (
              <article key={item.title} className="rounded-[20px] border border-[var(--app-border)] bg-white/78 px-5 py-5">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--app-muted)]">{item.id}</p>
                <h4 className="text-lg font-black text-[var(--app-ink)]">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setState((current) => ({ ...current, status: "intro" }))}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)]"
            >
              <ChevronLeft size={16} />
              Volver
            </button>
            <button
              type="button"
              onClick={() => void handleStartQuiz()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
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
        subtitle="Avanza por bloques cortos. El sistema guarda tus respuestas automáticamente."
      />

      <div className="sticky top-[5rem] z-10 rounded-[22px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.88)] px-4 py-4 shadow-[0_20px_42px_rgba(55,32,80,0.08)] backdrop-blur-xl md:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-black text-[var(--app-ink)] md:text-3xl">Preguntas {start + 1} a {end}</h3>
            <p className="mt-2 text-sm text-[var(--app-muted)]">{answeredCount} respuestas registradas de {DB.length}.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--app-chip)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
              Avance {completionPercent}%
            </span>
            <span
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]",
                saveIndicator === "saving" && "bg-[rgba(59,130,246,0.14)] text-sky-700",
                saveIndicator === "saved" && "bg-[rgba(16,185,129,0.14)] text-emerald-700",
                saveIndicator === "error" && "bg-[rgba(244,63,94,0.14)] text-rose-700",
                saveIndicator === "idle" && "bg-[var(--app-surface-muted)] text-[var(--app-muted)]",
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
        <div className="mt-3 h-2 rounded-full bg-[var(--app-surface-muted)]">
          <div
            className="h-2 rounded-full bg-[var(--brand-primary)] transition-all"
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
              ref={index === 0 ? firstQuestionCardRef : null}
              className="app-panel scroll-mt-28 p-5 sm:p-6"
            >
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
                        onClick={() => handleAnswer(question.id, value)}
                        className={clsx(
                          "min-h-28 rounded-[18px] border px-3 py-4 text-center text-[11px] font-extrabold leading-tight transition md:text-sm",
                          selected
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                            : "border-[var(--app-border)] bg-white/80 text-[var(--app-ink)]",
                        )}
                      >
                        <span className="mt-1 block text-sm md:text-base">{label}</span>
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
                            ? "border-[var(--brand-primary)] bg-[var(--app-surface-muted)] text-[var(--app-ink)]"
                            : "border-[var(--app-border)] bg-white/82 text-[var(--app-muted)]",
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
          className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--app-ink)] disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        <button
          type="button"
          onClick={() => void handleNextPage()}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-extrabold text-white"
        >
          {end >= DB.length ? "Ver resultados" : "Continuar"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
