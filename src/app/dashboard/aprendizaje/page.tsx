"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileUp,
  Layers3,
  Lightbulb,
  Link2,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  RotateCcw,
  RefreshCcw,
  X,
} from "lucide-react";
import { CertificateBuilder, CertificateBuilderPreview } from "@/components/aprendizaje/CertificateBuilder";
import { CertificatePreviewCard } from "@/components/aprendizaje/CertificatePreviewCard";
import {
  LearningCourseEditor,
  type ResourceEditorKind,
} from "@/components/aprendizaje/LearningCourseEditor";
import { LearningResourceCard } from "@/components/aprendizaje/LearningResourceCard";
import { LearningAnalyticsPanel } from "@/components/aprendizaje/LearningAnalyticsPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ModuleGuidanceBanner } from "@/components/dashboard/ModuleGuidanceBanner";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { R2UploadButton } from "@/components/ui/R2UploadButton";
import { useUser } from "@/context/UserContext";
import { filterCommercialProducts } from "@/features/access/catalog";
import {
  getLearningResourceDetail,
  listCertificateTemplates,
  listLearningResources,
  listLearningWorkbooks,
  updateCertificateTemplate,
  type CertificateTemplateRecord,
  type LearningResourceRecord,
  type WorkbookRecord,
} from "@/features/aprendizaje/client";
import {
  deleteContent,
  listContent,
  purgeContent,
  restoreContent,
  type ContentItemRecord,
  type ContentStatus,
  type ContentType,
} from "@/features/content/client";
import {
  COMPETENCY_PILLAR_OPTIONS,
  getPillarLabelFromCode,
} from "@/features/aprendizaje/competency-map";
import { WORKBOOKS_V2_CATALOG } from "@/lib/workbooks-v2-catalog";
import { formatDate as formatDateShared } from "@/lib/format-date";

const RESOURCE_TYPE_OPTIONS: ContentType[] = [
  "video",
  "podcast",
  "pdf",
  "article",
  "html",
  "ppt",
  "scorm",
];
const RESOURCE_STATUS_OPTIONS: ContentStatus[] = [
  "draft",
  "pending_review",
  "published",
  "archived",
  "rejected",
];
const RESOURCE_PAGE_SIZE = 18;

type LearningTabKey = "recursos" | "cursos" | "workbooks" | "certificados" | "papelera";

interface LearningTabItem {
  key: LearningTabKey;
  label: string;
  description: string;
  adminOnly?: boolean;
}

const LEARNING_TABS: LearningTabItem[] = [
  {
    key: "recursos",
    label: "Contenidos libres",
    description: "Videos, pódcasts, documentos y lecturas.",
  },
  {
    key: "cursos",
    label: "Cursos",
    description: "Cursos completos, con sus módulos y materiales.",
  },
  {
    key: "workbooks",
    label: "Workbooks",
    description: "Tus cuadernos de trabajo del programa.",
  },
  {
    key: "certificados",
    label: "Certificados",
    description: "Diseña los certificados que reciben quienes completan un curso.",
    adminOnly: true,
  },
  {
    key: "papelera",
    label: "Papelera",
    description: "Contenidos y cursos eliminados. Puedes restaurarlos o borrarlos definitivamente.",
    adminOnly: true,
  },
];

function isLearningTabKey(value: string | null): value is LearningTabKey {
  return (
    value === "recursos" ||
    value === "cursos" ||
    value === "workbooks" ||
    value === "certificados" ||
    value === "papelera"
  );
}

// Constantes, helpers y sub-componentes del editor de cursos/recursos viven
// en `src/components/aprendizaje/LearningCourseEditor.tsx`. Esta página solo
// monta el componente, le pasa el scope ("aprendizaje") y los callbacks de
// recarga. Lo que queda aquí abajo es exclusivo del listado/tabs/workbooks.

// (moved to LearningCourseEditor.tsx)

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  return formatDateShared(value);
}

function contentTypeLabel(type: ContentType): string {
  if (type === "pdf") return "PDF";
  if (type === "ppt") return "PPT";
  if (type === "scorm") return "Curso";
  if (type === "activity") return "Actividad";
  if (type === "assignment") return "Tarea";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function statusLabel(status: ContentStatus): string {
  if (status === "pending_review") return "En revisión";
  if (status === "published") return "Publicado";
  if (status === "archived") return "Archivado";
  if (status === "rejected") return "Rechazado";
  return "Borrador";
}

function workbookStateLabel(state: WorkbookRecord["accessState"]): string {
  if (state === "scheduled") return "Programado";
  if (state === "disabled") return "Deshabilitado";
  if (state === "hidden") return "Oculto";
  return "Activo";
}

function workbookStateClasses(state: WorkbookRecord["accessState"]): string {
  if (state === "scheduled")
    return "bg-amber-50 text-amber-700 border border-amber-200";
  if (state === "disabled")
    return "border border-[var(--app-border)] bg-white/70 text-[var(--app-muted)]";
  if (state === "hidden")
    return "bg-rose-50 text-rose-700 border border-rose-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function pillarLabel(value: string | null | undefined): string {
  return getPillarLabelFromCode(value);
}

function buildWorkbookDigitalHref(workbook: WorkbookRecord, isElevated: boolean): string {
  const slug = workbook.templateCode.toLowerCase();
  // Admin/gestor/advisor entran a la plantilla global del WB desde el index de
  // Aprendizaje. El acceso al WB de un líder concreto se hace exclusivamente
  // desde su perfil 360 (/dashboard/lideres/[userId]) para evitar editar por
  // error la instancia de un líder al confundirla con la plantilla base.
  if (isElevated) {
    return `/dashboard/aprendizaje/workbooks/${slug}`;
  }

  const params = new URLSearchParams({
    workbookId: workbook.workbookId,
    ownerName: workbook.ownerName,
  });

  return `/dashboard/aprendizaje/workbooks/${slug}?${params.toString()}`;
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function workbookProgressClasses(progress: number): string {
  if (progress >= 100) return "bg-gradient-to-r from-emerald-500 to-teal-500";
  if (progress >= 60) return "bg-gradient-to-r from-blue-600 to-sky-500";
  if (progress >= 30) return "bg-[var(--brand-accent)]";
  return "bg-[var(--brand-surface-strong)]";
}

function workbookVisualClasses(sequenceNo: number): string {
  const themes = [
    "bg-[linear-gradient(135deg,var(--brand-darker)_0%,var(--brand-primary)_56%,var(--brand-accent)_100%)] text-white",
    "bg-[linear-gradient(135deg,var(--brand-dark)_0%,var(--brand-primary)_48%,var(--brand-accent-soft)_100%)] text-white",
    "bg-[linear-gradient(135deg,var(--brand-darker)_0%,var(--brand-secondary)_54%,var(--brand-accent)_100%)] text-white",
    "bg-[linear-gradient(135deg,var(--brand-darker)_0%,var(--brand-primary)_48%,var(--brand-accent-strong)_100%)] text-white",
  ];

  return themes[(sequenceNo - 1) % themes.length];
}

export default function AprendizajePage() {
  const { currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [resources, setResources] = React.useState<LearningResourceRecord[]>(
    [],
  );
  const [resourceTotal, setResourceTotal] = React.useState(0);
  const [resourceTotalPages, setResourceTotalPages] = React.useState(1);
  const [resourcePage, setResourcePage] = React.useState(1);
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resourceSearch, setResourceSearch] = React.useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = React.useState<
    "all" | ContentType
  >("all");
  const [resourceStatusFilter, setResourceStatusFilter] = React.useState<
    "all" | ContentStatus
  >("all");
  const [resourcePillarFilter, setResourcePillarFilter] = React.useState<
    "all" | string
  >("all");
  // Estado del editor (CRUD modal). El form completo, los pasos del wizard,
  // los módulos del curso, etc. viven dentro de <LearningCourseEditor />.
  // Aquí solo controlamos cuándo abrirlo y qué recurso (si es edición) cargar.
  const [isResourceModalOpen, setIsResourceModalOpen] = React.useState(false);
  const [editingResource, setEditingResource] =
    React.useState<LearningResourceRecord | null>(null);
  const [editorInitialKind, setEditorInitialKind] =
    React.useState<ResourceEditorKind>("resource");
  const [workbookOwnerFilter, setWorkbookOwnerFilter] = React.useState<
    "all" | string
  >("all");
  const [workbookSearch, setWorkbookSearch] = React.useState("");
  const [certificateTemplates, setCertificateTemplates] = React.useState<CertificateTemplateRecord[]>([]);
  const [certificateEditing, setCertificateEditing] = React.useState<string | null>(null);
  const [certificateDraft, setCertificateDraft] = React.useState<Partial<CertificateTemplateRecord>>({});
  const [certificateSaving, setCertificateSaving] = React.useState(false);
  const [certPreviewId, setCertPreviewId] = React.useState<string | null>(null);
  const [certBuilderTemplateId, setCertBuilderTemplateId] = React.useState<string | null>(null);

  const isResourceManager = currentRole === "gestor" || currentRole === "admin";
  const isOpenLeader =
    currentRole === "lider" && viewerAccess?.viewerTier === "open_leader";
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ["program_4shine"],
  });
  const deferredResourceSearch = React.useDeferredValue(resourceSearch);
  const editResourceId = searchParams.get("edit");
  const activeLearningTab = React.useMemo<LearningTabKey>(() => {
    const requestedTab = searchParams.get("tab");
    return isLearningTabKey(requestedTab) ? requestedTab : "recursos";
  }, [searchParams]);
  const isResourcesTab = activeLearningTab === "recursos";
  const isCoursesTab = activeLearningTab === "cursos";
  const isWorkbooksTab = activeLearningTab === "workbooks";
  const isCertificadosTab = activeLearningTab === "certificados";
  const isPapeleraTab = activeLearningTab === "papelera";

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: "Error",
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: "error",
      });
    },
    [alert],
  );

  const buildLearningTabHref = React.useCallback(
    (tab: LearningTabKey) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("edit");
      if (tab === "recursos") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", tab);
      }
      const nextQuery = nextParams.toString();
      return nextQuery
        ? `/dashboard/aprendizaje?${nextQuery}`
        : "/dashboard/aprendizaje";
    },
    [searchParams],
  );

  const buildLearningResourceDetailHref = React.useCallback(
    (contentId: string) => {
      const tab = isCoursesTab ? "cursos" : "recursos";
      return `/dashboard/aprendizaje/recursos/${contentId}?tab=${tab}`;
    },
    [isCoursesTab],
  );

  const hasLoadedRef = React.useRef(false);

  const loadModule = React.useCallback(async () => {
    // Full-page skeleton only on the first load; later refetches (search,
    // filters, pagination) keep the UI mounted so inputs don't lose focus.
    if (!hasLoadedRef.current) setLoading(true);
    try {
      // El filtro ya no es por content_type sino por library_location, que
      // el admin decide en el editor del curso:
      // - "Contenidos libres" -> todos los items con location 'contenidos_libres'
      //   (recursos individuales y cursos que el admin ubicó ahí).
      // - "Cursos" -> solo items con location 'cursos' (que por construcción
      //   son cursos, ya que un recurso no-curso siempre va a 'contenidos_libres').
      const resourceFamily = null;
      const libraryLocation =
        activeLearningTab === "cursos"
          ? "cursos"
          : activeLearningTab === "recursos"
            ? "contenidos_libres"
            : null;
      const resourceRequest =
        activeLearningTab === "workbooks" || activeLearningTab === "certificados"
          ? Promise.resolve({
              items: [] as LearningResourceRecord[],
              total: 0,
              totalPages: 1,
              page: 1,
              pageSize: RESOURCE_PAGE_SIZE,
            })
          : listLearningResources({
              q: deferredResourceSearch,
              family: resourceFamily,
              libraryLocation,
              contentType:
                activeLearningTab === "recursos" &&
                resourceTypeFilter !== "all"
                  ? resourceTypeFilter
                  : null,
              status:
                resourceStatusFilter === "all" ? null : resourceStatusFilter,
              pillar:
                resourcePillarFilter === "all" ? null : resourcePillarFilter,
              page: resourcePage,
              pageSize: RESOURCE_PAGE_SIZE,
            });

      const [resourceData, workbookData, certificateData] = await Promise.all([
        resourceRequest,
        listLearningWorkbooks(),
        isResourceManager ? listCertificateTemplates() : Promise.resolve([] as CertificateTemplateRecord[]),
      ]);
      setResources(resourceData.items);
      setResourceTotal(resourceData.total);
      setResourceTotalPages(resourceData.totalPages);
      setWorkbooks(workbookData);
      setCertificateTemplates(certificateData);
    } catch (error) {
      await showError("No se pudo cargar el módulo de aprendizaje", error);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [
    activeLearningTab,
    deferredResourceSearch,
    isResourceManager,
    resourcePage,
    resourcePillarFilter,
    resourceStatusFilter,
    resourceTypeFilter,
    showError,
  ]);

  const onDeleteResource = React.useCallback(
    async (contentId: string) => {
      const accepted = await confirm({
        title: "Eliminar recurso",
        message: "¿Deseas eliminar este recurso? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        tone: "warning",
      });
      if (!accepted) return;

      try {
        await deleteContent(contentId);
        void loadModule();
      } catch (error) {
        await showError("No se pudo eliminar el recurso", error);
      }
    },
    [confirm, loadModule, showError],
  );

  // ─── Papelera ──────────────────────────────────────────────────────────────
  // Reutiliza el borrado lógico que ya existía en el backend (content_items
  // .deleted_at) y sus endpoints de restaurar y purgar.
  const [trashedItems, setTrashedItems] = React.useState<ContentItemRecord[]>([]);
  const [trashLoading, setTrashLoading] = React.useState(false);
  const [trashBusyId, setTrashBusyId] = React.useState<string | null>(null);

  const loadTrash = React.useCallback(async () => {
    setTrashLoading(true);
    try {
      setTrashedItems(await listContent("aprendizaje", { trashed: true }));
    } catch (error) {
      await showError("No se pudo cargar la papelera", error);
    } finally {
      setTrashLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isPapeleraTab) void loadTrash();
  }, [isPapeleraTab, loadTrash]);

  const onRestoreTrashed = React.useCallback(
    async (item: ContentItemRecord) => {
      setTrashBusyId(item.contentId);
      try {
        await restoreContent(item.contentId);
        await loadTrash();
        // El listado activo cambia al restaurar: refrescarlo evita que el
        // contenido reaparezca solo tras recargar la página a mano.
        void loadModule();
      } catch (error) {
        await showError("No se pudo restaurar", error);
      } finally {
        setTrashBusyId(null);
      }
    },
    [loadTrash, loadModule, showError],
  );

  const onPurgeTrashed = React.useCallback(
    async (item: ContentItemRecord) => {
      const accepted = await confirm({
        title: "Eliminar definitivamente",
        message: `Esto borra "${item.title}" de forma permanente e irreversible, junto con su progreso y comentarios. ¿Continuar?`,
        confirmText: "Eliminar para siempre",
        cancelText: "Cancelar",
        tone: "error",
      });
      if (!accepted) return;
      setTrashBusyId(item.contentId);
      try {
        await purgeContent(item.contentId);
        await loadTrash();
      } catch (error) {
        await showError("No se pudo eliminar definitivamente", error);
      } finally {
        setTrashBusyId(null);
      }
    },
    [confirm, loadTrash, showError],
  );

  React.useEffect(() => {
    void loadModule();
  }, [loadModule]);

  React.useEffect(() => {
    setResourcePage(1);
  }, [
    deferredResourceSearch,
    resourceTypeFilter,
    resourceStatusFilter,
    resourcePillarFilter,
    activeLearningTab,
  ]);

  React.useEffect(() => {
    if (activeLearningTab !== "recursos" && resourceTypeFilter !== "all") {
      setResourceTypeFilter("all");
      return;
    }

    if (activeLearningTab === "recursos" && resourceTypeFilter === "scorm") {
      setResourceTypeFilter("all");
    }
  }, [activeLearningTab, resourceTypeFilter]);


  const filteredResources = resources;

  const workbookOwners = Array.from(
    new Map(
      workbooks.map((workbook) => [
        workbook.ownerUserId,
        { userId: workbook.ownerUserId, ownerName: workbook.ownerName },
      ]),
    ).values(),
  );

  const isElevatedRole =
    currentRole === "admin" || currentRole === "gestor" || currentRole === "mentor";

  const filteredWorkbooks = React.useMemo(() => {
    const normalizedQuery = workbookSearch.trim().toLowerCase();

    // Admin/gestor/advisor: deduplicar por templateCode para mostrar UNA tarjeta
    // por plantilla (no una por cada usuario). Cada tarjeta abre el WB global.
    if (isElevatedRole) {
      const byTemplate = new Map<string, WorkbookRecord>();
      for (const workbook of workbooks) {
        const key = workbook.templateCode.toLowerCase();
        const existing = byTemplate.get(key);
        if (!existing || workbook.sequenceNo < existing.sequenceNo) {
          byTemplate.set(key, workbook);
        }
      }
      return Array.from(byTemplate.values())
        .sort((a, b) => a.sequenceNo - b.sequenceNo)
        .filter((workbook) => {
          if (normalizedQuery.length === 0) return true;
          const searchable = [workbook.title, workbook.description ?? "", pillarLabel(workbook.pillarCode)]
            .join(" ")
            .toLowerCase();
          return searchable.includes(normalizedQuery);
        });
    }

    return workbooks.filter((workbook) => {
      const matchesOwner =
        workbookOwnerFilter === "all" || workbook.ownerUserId === workbookOwnerFilter;
      const searchable = [
        workbook.title,
        workbook.description ?? "",
        workbook.ownerName,
        pillarLabel(workbook.pillarCode),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      return matchesOwner && matchesSearch;
    });
  }, [isElevatedRole, workbookOwnerFilter, workbookSearch, workbooks]);

  React.useEffect(() => {
    if (
      currentRole === "lider" &&
      workbooks[0] &&
      workbookOwnerFilter !== workbooks[0].ownerUserId
    ) {
      setWorkbookOwnerFilter(workbooks[0].ownerUserId);
    }
  }, [currentRole, workbookOwnerFilter, workbooks]);
  const workbookCatalogBySlug = React.useMemo(
    () =>
      new Map(
        WORKBOOKS_V2_CATALOG.map((item) => [item.slug.toLowerCase(), item]),
      ),
    [],
  );

  const activeTabMeta =
    LEARNING_TABS.find((tab) => tab.key === activeLearningTab) ?? LEARNING_TABS[0];
  const activeCollectionLabel = isCoursesTab ? "cursos" : "contenidos";
  const visibleResourceStart =
    resourceTotal === 0 ? 0 : (resourcePage - 1) * RESOURCE_PAGE_SIZE + 1;
  const visibleResourceEnd =
    resourceTotal === 0 ? 0 : visibleResourceStart + resources.length - 1;
  const resourcePaginationItems = React.useMemo(() => {
    const start = Math.max(1, resourcePage - 1);
    const end = Math.min(resourceTotalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [resourcePage, resourceTotalPages]);

  // ── Apertura del editor (CRUD modal) ──
  // El editor en sí (state del form, wizard, módulos, etc.) vive en
  // <LearningCourseEditor>. Aquí solo decidimos cuándo abrirlo y con qué
  // recurso (si es edición) o con qué kind inicial (si es creación).

  const openCreateResourceModal = React.useCallback(
    (kind: ResourceEditorKind = "resource") => {
      setEditingResource(null);
      setEditorInitialKind(kind);
      setIsResourceModalOpen(true);
    },
    [],
  );

  const openEditResourceModal = React.useCallback(
    (resource: LearningResourceRecord) => {
      setEditingResource(resource);
      setIsResourceModalOpen(true);
    },
    [],
  );

  const closeResourceModal = React.useCallback(() => {
    setIsResourceModalOpen(false);
    setEditingResource(null);
  }, []);

  const onResourceSaved = React.useCallback(() => {
    void Promise.all([loadModule(), refreshBootstrap()]).catch((error) => {
      console.error("Learning module background refresh failed", error);
    });
  }, [loadModule, refreshBootstrap]);

  // Si llegamos con `?edit=<contentId>` resolvemos el recurso (o lo pedimos
  // a la API si no está en la lista actual) y abrimos el editor en modo
  // edición. Después limpiamos el param de la URL.
  React.useEffect(() => {
    if (!editResourceId || !isResourceManager || isResourceModalOpen) return;

    let cancelled = false;
    const openRequestedResource = async () => {
      try {
        const resource =
          resources.find((item) => item.contentId === editResourceId) ??
          (await getLearningResourceDetail(editResourceId));
        if (cancelled) return;
        openEditResourceModal(resource);

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("edit");
        const nextQuery = nextParams.toString();
        router.replace(
          nextQuery
            ? `/dashboard/aprendizaje?${nextQuery}`
            : "/dashboard/aprendizaje",
          { scroll: false },
        );
      } catch (error) {
        if (!cancelled) {
          void showError("No se pudo abrir el recurso para edición", error);
        }
      }
    };

    void openRequestedResource();
    return () => {
      cancelled = true;
    };
  }, [
    editResourceId,
    isResourceManager,
    isResourceModalOpen,
    openEditResourceModal,
    resources,
    router,
    searchParams,
    showError,
  ]);

  const fieldClass =
    "h-12 rounded-[16px] border border-[var(--app-border)] bg-white/86 px-4 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--app-border-strong)] focus:bg-white";

  // Guía adaptativa: siguiente workbook pendiente del programa (vista líder).
  const nextWorkbook = [...workbooks]
    .filter((w) => w.accessState === "active" && (w.completionPercent ?? 0) < 100)
    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="app-section-kicker">Aprendizaje</p>
          <h2
            className="app-display-title mt-2 text-4xl font-semibold leading-[0.95]"
            data-display-font="true"
          >
            {activeTabMeta.label}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
            {isResourcesTab
              ? isOpenLeader
                ? "Explora el contenido libre de la plataforma: videos, pódcasts, documentos y cursos."
                : "Publica y organiza los contenidos de la biblioteca. Usa los filtros para encontrar lo que buscas."
              : isCoursesTab
                ? isOpenLeader
                  ? "Revisa las rutas de aprendizaje disponibles y activa el programa para desbloquear la experiencia completa."
                  : "Retoma un curso donde lo dejaste o empieza uno nuevo."
                : isCertificadosTab
                  ? "Edita las plantillas de certificado y asígnalas a los cursos para que se entreguen automáticamente al completar el 100%."
                  : isOpenLeader
                    ? "Los workbooks del programa se activan al comprar el plan 4Shine."
                    : "Tus cuadernos de trabajo del programa. Tu avance se guarda automáticamente."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isWorkbooksTab ? (
            <span className="app-chip-soft">
              <CalendarClock size={13} />
              {workbooks.length} workbooks en catálogo
            </span>
          ) : isCertificadosTab ? (
            <span className="app-chip-soft">
              <Award size={13} />
              {certificateTemplates.length} plantillas
            </span>
          ) : (
            <span className="app-chip-soft">
              {resourceTotal} {activeCollectionLabel} en esta vista
            </span>
          )}
          {isOpenLeader ? (
            <span className="app-chip-soft">Cuenta free</span>
          ) : null}
          {isResourceManager && !isWorkbooksTab && !isCertificadosTab && !isPapeleraTab ? (
            isResourcesTab ? (
              <>
                <button
                  type="button"
                  className="app-button-primary"
                  onClick={() => openCreateResourceModal("resource")}
                >
                  <Plus size={16} />
                  Nuevo contenido
                </button>
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={() => openCreateResourceModal("course")}
                >
                  <Plus size={16} />
                  Nuevo curso
                </button>
              </>
            ) : (
              <button
                type="button"
                className="app-button-primary"
                onClick={() => openCreateResourceModal("course")}
              >
                <Plus size={16} />
                Nuevo curso
              </button>
            )
          ) : null}
        </div>
      </section>

      {currentRole === "lider" &&
        (isOpenLeader ? (
          <ModuleGuidanceBanner
            tone="slate"
            kicker="Aprendizaje"
            title="Activa tu plan para desbloquear los workbooks"
            message="Con el programa 4Shine accedes a la ruta completa de workbooks y cursos."
            cta={{ label: "Ver planes y activar", href: "/dashboard/suscripcion?desde=aprendizaje" }}
          />
        ) : nextWorkbook ? (
          <ModuleGuidanceBanner
            tone="brand"
            kicker="Tu aprendizaje"
            title={`Tu siguiente workbook: ${nextWorkbook.templateCode.toUpperCase()} (${Math.round(nextWorkbook.completionPercent)}%)`}
            message={nextWorkbook.title || "Continúa donde quedaste."}
            cta={{ label: "Continuar workbook", href: buildWorkbookDigitalHref(nextWorkbook, isElevatedRole) }}
          />
        ) : workbooks.length > 0 ? (
          <ModuleGuidanceBanner
            tone="emerald"
            kicker="Tu aprendizaje"
            title="¡Completaste tus workbooks!"
            message="Sigue avanzando en tu ruta y consolida tu progreso."
            cta={{ label: "Ir a Trayectoria", href: "/dashboard/trayectoria" }}
          />
        ) : null)}

      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
        {LEARNING_TABS.filter((tab) => !tab.adminOnly || isResourceManager).map((tab) => {
          const isActive = tab.key === activeLearningTab;
          const Icon =
            tab.key === "recursos"
              ? BookOpen
              : tab.key === "cursos"
                ? Layers3
                : tab.key === "certificados"
                  ? Award
                  : CalendarClock;

          return (
            <Link
              key={tab.key}
              href={buildLearningTabHref(tab.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] text-[var(--brand-primary)]"
                  : "border-[var(--app-border)] bg-white/82 text-[var(--app-ink)]"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <nav className={`hidden grid-cols-1 gap-3 md:grid ${isResourceManager ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {LEARNING_TABS.filter((tab) => !tab.adminOnly || isResourceManager).map((tab) => {
          const isActive = tab.key === activeLearningTab;
          const Icon =
            tab.key === "recursos"
              ? BookOpen
              : tab.key === "cursos"
                ? Layers3
                : tab.key === "certificados"
                  ? Award
                  : CalendarClock;

          return (
            <Link
              key={tab.key}
              href={buildLearningTabHref(tab.key)}
              className={`rounded-[22px] border px-5 py-4 transition ${
                isActive
                  ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] shadow-[0_18px_38px_rgba(0,0,0,0.06)]"
                  : "border-[var(--app-border)] bg-white/82 hover:border-[var(--app-border-strong)] hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-[14px] p-3 ${
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]"
                      : "bg-[var(--app-chip)] text-[var(--brand-primary)]"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[var(--app-ink)]">
                    {tab.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">
                    {tab.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {loading ? (
        <div className="app-panel p-6 text-sm text-[var(--app-muted)]">
          Cargando módulo...
        </div>
      ) : (
        <>
          {(isResourcesTab || isCoursesTab) && (
            <section className="space-y-4">
              {isOpenLeader && isResourcesTab ? (
                <div
                  className="flex items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm text-[var(--app-muted)]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
                    background: 'var(--brand-surface)',
                  }}
                >
                  <span className="shrink-0 text-base">✦</span>
                  <span>
                    Estás viendo solo recursos <span className="font-semibold text-[var(--brand-primary)]">free</span>. Los cursos premium y la experiencia completa se activan con el programa 4Shine.
                  </span>
                </div>
              ) : null}

              {isOpenLeader && isCoursesTab ? (
                <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-6 py-8 text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-[0.9rem]"
                    style={{ background: "var(--brand-surface-strong)" }}
                  >
                    <BookOpen size={20} style={{ color: "var(--brand-primary)" }} />
                  </div>
                  <p className="mt-4 text-base font-extrabold text-[var(--app-ink)]">Cursos premium del programa</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--app-muted)]">
                    Rutas estructuradas con módulos, recursos y certificados. Se desbloquean al activar tu plan.
                  </p>
                  <Link
                    href="/dashboard/suscripcion?desde=aprendizaje"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Ver planes y activar
                  </Link>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="app-section-kicker">
                    {isCoursesTab ? "Cursos" : "Contenidos libres"}
                  </p>
                  <h3
                    className="app-display-title mt-2 text-3xl font-semibold"
                    data-display-font="true"
                  >
                    {isCoursesTab
                      ? "Catálogo de cursos"
                      : "Biblioteca de recursos"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                    {isCoursesTab
                      ? "Todos los cursos disponibles para ti."
                      : "Videos, pódcasts, documentos y lecturas sueltas."}
                  </p>
                </div>
              </div>

              {isCoursesTab && isResourceManager ? (
                <LearningAnalyticsPanel 
                  resources={filteredResources}
                  totalAvailable={resourceTotal}
                />
              ) : null}

              {!isOpenLeader || isResourcesTab ? (
                <>
                  <div
                    className={`grid grid-cols-1 gap-3 ${
                      isResourceManager
                        ? isResourcesTab
                          ? "xl:grid-cols-4"
                          : "xl:grid-cols-3"
                        : isResourcesTab
                          ? "xl:grid-cols-3"
                          : "xl:grid-cols-2"
                    }`}
                  >
                    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.05)] xl:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                        <Search size={16} />
                        <input
                          className="w-full bg-transparent py-1 text-sm text-[var(--app-ink)] outline-none"
                          placeholder={
                            isCoursesTab
                              ? "Buscar por título, categoría o competencia"
                              : "Buscar por título, categoría, tags o competencia"
                          }
                          value={resourceSearch}
                          onChange={(event) =>
                            setResourceSearch(event.target.value)
                          }
                        />
                      </label>
                    </div>
                    {isResourcesTab ? (
                      <select
                        className={fieldClass}
                        value={resourceTypeFilter}
                        onChange={(event) =>
                          setResourceTypeFilter(
                            event.target.value as "all" | ContentType,
                          )
                        }
                      >
                        <option value="all">Todos los formatos</option>
                        {RESOURCE_TYPE_OPTIONS.filter(
                          (type) => type !== "scorm",
                        ).map((type) => (
                          <option key={type} value={type}>
                            {contentTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {isResourceManager ? (
                      <select
                        className={fieldClass}
                        value={resourceStatusFilter}
                        onChange={(event) =>
                          setResourceStatusFilter(
                            event.target.value as "all" | ContentStatus,
                          )
                        }
                      >
                        <option value="all">Todos los estados</option>
                        {RESOURCE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <select
                      className={fieldClass}
                      value={resourcePillarFilter}
                      onChange={(event) =>
                        setResourcePillarFilter(event.target.value)
                      }
                    >
                      <option value="all">Todos los pilares</option>
                      {COMPETENCY_PILLAR_OPTIONS.map((pillar) => (
                        <option key={pillar.value} value={pillar.value}>
                          {pillar.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--app-border)] bg-white/78 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-ink)]">
                        {resourceTotal === 0
                          ? `Aún no hay ${activeCollectionLabel} con este filtro.`
                          : `Mostrando ${visibleResourceStart}-${visibleResourceEnd} de ${resourceTotal} ${activeCollectionLabel}`}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-sm text-[var(--app-muted)]">
                      Página {resourcePage} de {resourceTotalPages}
                    </span>
                  </div>

                  {filteredResources.length === 0 ? (
                    <EmptyState
                      message={
                        isCoursesTab
                          ? "No encontramos cursos con los filtros seleccionados."
                          : "No encontramos recursos con los filtros seleccionados."
                      }
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {filteredResources.map((resource) => (
                          <LearningResourceCard
                            key={resource.contentId}
                            resource={resource}
                            href={buildLearningResourceDetailHref(resource.contentId)}
                            canManage={isResourceManager}
                            onEdit={(id) => router.push(`/dashboard/aprendizaje?tab=${activeLearningTab}&edit=${id}`)}
                            onDelete={onDeleteResource}
                          />
                        ))}
                      </div>

                      {resourceTotalPages > 1 && (
                        <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--app-border)] bg-white/82 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-[var(--app-muted)]">
                            Página {resourcePage} de {resourceTotalPages}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="app-button-secondary"
                              onClick={() =>
                                setResourcePage((current) =>
                                  Math.max(1, current - 1),
                                )
                              }
                              disabled={resourcePage === 1}
                            >
                              <ArrowLeft size={16} />
                              Anterior
                            </button>
                            {resourcePaginationItems.map((pageNumber) => (
                              <button
                                key={pageNumber}
                                type="button"
                                className={
                                  pageNumber === resourcePage
                                    ? "inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white"
                                    : "inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white px-4 text-sm font-semibold text-[var(--app-ink)]"
                                }
                                onClick={() => setResourcePage(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="app-button-secondary"
                              onClick={() =>
                                setResourcePage((current) =>
                                  Math.min(resourceTotalPages, current + 1),
                                )
                              }
                              disabled={resourcePage === resourceTotalPages}
                            >
                              Siguiente
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </section>
          )}

          {isPapeleraTab && isResourceManager && (
            <section className="app-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="app-section-kicker">Papelera</p>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Contenidos y cursos eliminados. Siguen ocultos para los usuarios hasta que los
                    restaures; nada se borra de verdad hasta que lo elimines definitivamente.
                  </p>
                </div>
                <button type="button" className="app-button-secondary" onClick={() => void loadTrash()}>
                  <RefreshCcw size={15} /> Actualizar
                </button>
              </div>

              <div className="mt-5">
                {trashLoading ? (
                  <p className="py-8 text-center text-sm text-[var(--app-muted)]">Cargando papelera…</p>
                ) : trashedItems.length === 0 ? (
                  <EmptyState message="La papelera está vacía. Lo que elimines desde Contenidos libres o Cursos aparecerá aquí." />
                ) : (
                  <ul className="space-y-3">
                    {trashedItems.map((item) => (
                      <li
                        key={item.contentId}
                        className="flex flex-wrap items-center gap-4 rounded-[16px] border border-[var(--app-border)] bg-white p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[var(--app-ink)]">{item.title}</p>
                          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                            {item.contentType} · {item.category}
                            {item.deletedAt ? ` · eliminado el ${formatDate(item.deletedAt)}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="app-button-secondary"
                          disabled={trashBusyId === item.contentId}
                          onClick={() => void onRestoreTrashed(item)}
                        >
                          <RotateCcw size={15} /> Restaurar
                        </button>
                        <button
                          type="button"
                          className="app-button-secondary text-rose-700"
                          disabled={trashBusyId === item.contentId}
                          onClick={() => void onPurgeTrashed(item)}
                        >
                          <Trash2 size={15} /> Eliminar definitivamente
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {isWorkbooksTab && (
            <section className="space-y-4">
              <div>
                <p className="app-section-kicker">Workbooks</p>
                <h3
                  className="app-display-title mt-2 text-3xl font-semibold"
                  data-display-font="true"
                >
                  {isOpenLeader
                    ? "Workbooks del programa"
                    : "Workbooks digitales del programa"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {isOpenLeader
                    ? "Los workbooks viven en un espacio aparte y se activan cuando compras el programa 4Shine."
                    : "Aquí solo ves los workbooks, sin mezclar recursos ni cursos, para mantener una continuidad clara de trabajo."}
                </p>
              </div>

              {isOpenLeader ? (
                <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-6 py-8 text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-[0.9rem]"
                    style={{ background: "var(--brand-surface-strong)" }}
                  >
                    <span className="text-xl">📓</span>
                  </div>
                  <p className="mt-4 text-base font-extrabold text-[var(--app-ink)]">Workbooks personales del journey</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--app-muted)]">
                    Cada workbook es personal y se libera según tu etapa en la trayectoria. Se desbloquean al activar tu plan.
                  </p>
                  <Link
                    href="/dashboard/suscripcion?desde=aprendizaje"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Ver planes y activar
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.7fr)]">
                    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.05)] md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                        <Search size={16} />
                        <input
                          className="w-full bg-transparent py-1 text-sm text-[var(--app-ink)] outline-none"
                          placeholder="Buscar workbook por título, usuario o pilar"
                          value={workbookSearch}
                          onChange={(event) =>
                            setWorkbookSearch(event.target.value)
                          }
                        />
                      </label>
                    </div>
                    {currentRole === "lider" ? (
                      <div className="flex items-center rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 text-sm text-[var(--app-muted)] shadow-[0_16px_36px_rgba(0,0,0,0.05)]">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                          Tu ruta
                        </span>
                        <span className="ml-3 font-semibold text-[var(--app-ink)]">
                          {workbookOwners.find(
                            (owner) => owner.userId === workbookOwnerFilter,
                          )?.ownerName ?? "Tus workbooks"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 text-sm text-[var(--app-muted)] shadow-[0_16px_36px_rgba(0,0,0,0.05)]">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                          Vista
                        </span>
                        <span className="ml-3 font-semibold text-[var(--app-ink)]">
                          Plantilla global
                        </span>
                      </div>
                    )}
                  </div>

                  {isElevatedRole && (
                    <div className="mb-4 rounded-2xl border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-4 py-3 text-xs text-[var(--brand-primary)]">
                      Estás viendo la <strong>plantilla base</strong> de cada workbook. Para abrir el workbook de un líder específico, entra desde <code>/dashboard/lideres &rarr; Ver 360</code>.
                    </div>
                  )}
                  {filteredWorkbooks.length === 0 ? (
                    <EmptyState message="No hay workbooks disponibles con este filtro." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                      {filteredWorkbooks.map((workbook) => {
                        const digitalWorkbook =
                          workbookCatalogBySlug.get(
                            workbook.templateCode.toLowerCase(),
                          ) ?? null;
                        const progress = clampPercent(
                          workbook.completionPercent,
                        );
                        const coverCfg = workbook.coverConfig as
                          | {
                              overlayHex?: string;
                              overlayOpacity?: number;
                              kicker?: string | null;
                              title?: string | null;
                              summary?: string | null;
                            }
                          | null;
                        const overlayHex = coverCfg?.overlayHex ?? "#0D1B2A";
                        const overlayOpacity =
                          typeof coverCfg?.overlayOpacity === "number"
                            ? Math.max(0, Math.min(1, coverCfg.overlayOpacity))
                            : 0.55;
                        const kickerText =
                          coverCfg?.kicker ??
                          `Workbook ${String(workbook.sequenceNo).padStart(2, "0")}`;
                        const titleText = coverCfg?.title ?? workbook.title;
                        // Si el admin/gestor publicó un coverConfig, su decisión
                        // manda — incluso si dejó el resumen vacío. Sólo cuando
                        // no hay coverConfig (nunca se editó) caemos al catálogo.
                        const hasCoverCfg = coverCfg !== null && coverCfg !== undefined;
                        const summaryText = hasCoverCfg
                          ? (coverCfg.summary ?? "")
                          : (digitalWorkbook?.summary ??
                             workbook.description ??
                             "");

                        return (
                          <Link
                            key={workbook.workbookId}
                            href={buildWorkbookDigitalHref(workbook, isElevatedRole)}
                            className="group overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-white/82 text-left text-[var(--app-ink)] shadow-[0_18px_38px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[0_24px_44px_rgba(0,0,0,0.10)]"
                          >
                            <div
                              className={`relative min-h-[220px] p-5 ${workbookVisualClasses(workbook.sequenceNo)}`}
                              style={
                                workbook.coverImageUrl
                                  ? {
                                      backgroundImage: `url(${workbook.coverImageUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : undefined
                              }
                            >
                              {workbook.coverImageUrl && (
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundColor: overlayHex,
                                    opacity: overlayOpacity,
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.3))]" />
                              <div className="relative flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
                                    {kickerText}
                                  </p>
                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${workbookStateClasses(workbook.accessState)}`}
                                  >
                                    {workbookStateLabel(workbook.accessState)}
                                  </span>
                                </div>

                                <div className="mt-auto">
                                  <h4 className="text-[1.65rem] font-extrabold leading-tight text-white">
                                    {titleText}
                                  </h4>
                                  {summaryText && (
                                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
                                      {summaryText}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="p-4 sm:p-5">
                              {!isElevatedRole && (
                                <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--app-muted)]">
                                    <span>Progreso real</span>
                                    <span className="font-semibold text-[var(--app-ink)]">
                                      {progress}%
                                    </span>
                                  </div>
                                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
                                    <div
                                      className={`h-full rounded-full ${workbookProgressClasses(progress)}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {isElevatedRole ? (
                                  <span className="rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                                    Plantilla base
                                  </span>
                                ) : null}
                                <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                                  {pillarLabel(workbook.pillarCode)}
                                </span>
                                <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                                  {formatDate(workbook.availableFrom)}
                                </span>
                              </div>

                              <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-muted)]">
                                  <BookOpen size={16} />
                                  {isElevatedRole
                                    ? "Abrir plantilla"
                                    : progress > 0
                                      ? "Continuar workbook"
                                      : "Abrir workbook"}
                                </span>
                                <span className="text-sm font-black text-[var(--app-ink)]">
                                  {digitalWorkbook?.code ??
                                    `WB${String(workbook.sequenceNo)}`}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {isCertificadosTab && isResourceManager && (
            <section className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="app-section-kicker">Certificados</p>
                  <h3
                    className="app-display-title mt-2 text-3xl font-semibold"
                    data-display-font="true"
                  >
                    Plantillas de certificado
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                    Edita las 3 plantillas disponibles y asígnalas a cualquier curso desde el editor de cursos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {certificateTemplates.map((template) => {
                  const isEditing = certificateEditing === template.templateId;
                  const accentColor =
                    ((isEditing ? (certificateDraft.accentColor as string | undefined) : null) ??
                      template.accentColor) || "#5f3471";

                  return (
                    <div
                      key={template.templateId}
                      className="overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-white/90 shadow-[0_18px_38px_rgba(0,0,0,0.06)]"
                    >
                      <div
                        className="p-5"
                        style={{ background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}99)` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-[14px] bg-white/15 p-3">
                            <Award size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                              Plantilla {template.templateNumber}
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {template.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-[16px] border border-white/20 bg-white/10 p-4">
                          <p className="text-sm text-white/80">
                            {template.headlineText}{" "}
                            <span className="font-semibold text-white">[Nombre]</span>{" "}
                            {template.bodyText}
                          </p>
                          <p className="mt-2 text-xs text-white/60">{template.organizationName}</p>
                        </div>
                      </div>

                      <div className="p-5">
                        {isEditing ? (
                          <div className="space-y-3">
                            {(
                              [
                                { key: "name", label: "Nombre interno" },
                                { key: "headlineText", label: "Encabezado (antes del nombre)" },
                                { key: "bodyText", label: "Cuerpo (después del nombre)" },
                                { key: "organizationName", label: "Organización" },
                                { key: "signatoryName", label: "Firmante" },
                                { key: "signatoryTitle", label: "Cargo del firmante" },
                                { key: "footerText", label: "Pie del certificado" },
                              ] as Array<{ key: keyof CertificateTemplateRecord; label: string }>
                            ).map(({ key, label }) => (
                              <div key={key}>
                                <label className="app-field-label">{label}</label>
                                <input
                                  className="app-input"
                                  value={(certificateDraft[key] as string) ?? ""}
                                  onChange={(e) =>
                                    setCertificateDraft((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                />
                              </div>
                            ))}

                            {/* Color de acento */}
                            <div>
                              <label className="app-field-label">Color de acento</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  className="h-9 w-12 cursor-pointer rounded-[8px] border border-[var(--app-border)] p-0.5"
                                  value={(certificateDraft.accentColor as string | undefined) ?? template.accentColor}
                                  onChange={(e) =>
                                    setCertificateDraft((prev) => ({ ...prev, accentColor: e.target.value }))
                                  }
                                />
                                <span className="font-mono text-xs text-[var(--app-muted)]">
                                  {(certificateDraft.accentColor as string | undefined) ?? template.accentColor}
                                </span>
                              </div>
                            </div>

                            {/* Logo */}
                            <div>
                              <label className="app-field-label">Logo de la organización</label>
                              {(certificateDraft.logoUrl as string | null | undefined) && (
                                <div className="mb-2">
                                  <img
                                    src={certificateDraft.logoUrl as string}
                                    alt="Logo"
                                    className="h-10 max-w-[140px] rounded-[8px] border border-[var(--app-border)] object-contain p-1"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <R2UploadButton
                                  moduleCode="aprendizaje"
                                  action="update"
                                  pathPrefix={`certificates/${template.templateId}/logo`}
                                  entityTable="app_learning.certificate_templates"
                                  fieldName="logo_url"
                                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                  buttonLabel="Subir logo"
                                  disabled={certificateSaving}
                                  onUploaded={(url) =>
                                    setCertificateDraft((prev) => ({ ...prev, logoUrl: url }))
                                  }
                                />
                                {(certificateDraft.logoUrl as string | null | undefined) && (
                                  <button
                                    type="button"
                                    className="text-xs text-red-500 hover:underline"
                                    onClick={() =>
                                      setCertificateDraft((prev) => ({ ...prev, logoUrl: null }))
                                    }
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              <input
                                className="app-input mt-2"
                                placeholder="O pegar URL del logo"
                                value={(certificateDraft.logoUrl as string | null | undefined) ?? ""}
                                onChange={(e) =>
                                  setCertificateDraft((prev) => ({
                                    ...prev,
                                    logoUrl: e.target.value || null,
                                  }))
                                }
                              />
                            </div>

                            {/* Firma */}
                            <div>
                              <label className="app-field-label">Imagen de firma</label>
                              {(certificateDraft.signatureUrl as string | null | undefined) && (
                                <div className="mb-2">
                                  <img
                                    src={certificateDraft.signatureUrl as string}
                                    alt="Firma"
                                    className="h-8 max-w-[120px] rounded-[8px] border border-[var(--app-border)] object-contain p-1"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <R2UploadButton
                                  moduleCode="aprendizaje"
                                  action="update"
                                  pathPrefix={`certificates/${template.templateId}/signature`}
                                  entityTable="app_learning.certificate_templates"
                                  fieldName="signature_url"
                                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                  buttonLabel="Subir firma"
                                  disabled={certificateSaving}
                                  onUploaded={(url) =>
                                    setCertificateDraft((prev) => ({ ...prev, signatureUrl: url }))
                                  }
                                />
                                {(certificateDraft.signatureUrl as string | null | undefined) && (
                                  <button
                                    type="button"
                                    className="text-xs text-red-500 hover:underline"
                                    onClick={() =>
                                      setCertificateDraft((prev) => ({ ...prev, signatureUrl: null }))
                                    }
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              <input
                                className="app-input mt-2"
                                placeholder="O pegar URL de la firma"
                                value={(certificateDraft.signatureUrl as string | null | undefined) ?? ""}
                                onChange={(e) =>
                                  setCertificateDraft((prev) => ({
                                    ...prev,
                                    signatureUrl: e.target.value || null,
                                  }))
                                }
                              />
                            </div>

                            {/* Vista previa toggle */}
                            <button
                              type="button"
                              className="app-button-secondary w-full justify-center gap-2"
                              onClick={() =>
                                setCertPreviewId((p) =>
                                  p === template.templateId ? null : template.templateId,
                                )
                              }
                            >
                              <Eye size={14} />
                              {certPreviewId === template.templateId
                                ? "Ocultar vista previa"
                                : "Ver vista previa"}
                            </button>

                            {certPreviewId === template.templateId && (
                              <CertificatePreviewCard
                                template={{ ...template, ...certificateDraft }}
                              />
                            )}

                            {/* Save / Cancel */}
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                className="app-button-secondary flex-1 justify-center"
                                onClick={() => {
                                  setCertificateEditing(null);
                                  setCertificateDraft({});
                                  setCertPreviewId(null);
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className="app-button-primary flex-1 justify-center"
                                disabled={certificateSaving}
                                onClick={async () => {
                                  setCertificateSaving(true);
                                  try {
                                    const updated = await updateCertificateTemplate(
                                      template.templateId,
                                      {
                                        name: (certificateDraft.name as string) ?? template.name,
                                        headlineText:
                                          (certificateDraft.headlineText as string) ??
                                          template.headlineText,
                                        bodyText:
                                          (certificateDraft.bodyText as string) ?? template.bodyText,
                                        organizationName:
                                          (certificateDraft.organizationName as string) ??
                                          template.organizationName,
                                        signatoryName:
                                          (certificateDraft.signatoryName as string) ??
                                          template.signatoryName,
                                        signatoryTitle:
                                          (certificateDraft.signatoryTitle as string) ??
                                          template.signatoryTitle,
                                        logoUrl:
                                          (certificateDraft.logoUrl as string | null | undefined) ??
                                          template.logoUrl,
                                        signatureUrl:
                                          (certificateDraft.signatureUrl as
                                            | string
                                            | null
                                            | undefined) ?? template.signatureUrl,
                                        footerText:
                                          (certificateDraft.footerText as string) ??
                                          template.footerText,
                                        accentColor:
                                          (certificateDraft.accentColor as string | undefined) ??
                                          template.accentColor,
                                      },
                                    );
                                    setCertificateTemplates((prev) =>
                                      prev.map((t) =>
                                        t.templateId === updated.templateId ? updated : t,
                                      ),
                                    );
                                    setCertificateEditing(null);
                                    setCertificateDraft({});
                                    setCertPreviewId(null);
                                  } catch (error) {
                                    await showError("No se pudo guardar la plantilla", error);
                                  } finally {
                                    setCertificateSaving(false);
                                  }
                                }}
                              >
                                {certificateSaving ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                {certificateSaving ? "Guardando..." : "Guardar"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-2 text-sm text-[var(--app-muted)]">
                              {template.signatoryName && (
                                <p>
                                  <span className="font-semibold text-[var(--app-ink)]">Firmante: </span>
                                  {template.signatoryName}
                                  {template.signatoryTitle ? `, ${template.signatoryTitle}` : ""}
                                </p>
                              )}
                              <p>
                                <span className="font-semibold text-[var(--app-ink)]">Org: </span>
                                {template.organizationName}
                              </p>
                              <p className="text-xs italic">{template.footerText}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="app-button-secondary flex-1 justify-center gap-2"
                                onClick={() => setCertPreviewId(template.templateId)}
                              >
                                <Eye size={14} />
                                Vista previa
                              </button>
                              <button
                                type="button"
                                className="app-button-secondary flex-1 justify-center"
                                onClick={() => setCertBuilderTemplateId(template.templateId)}
                              >
                                Personalizar layout
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {certificateTemplates.length === 0 && (
                  <div className="col-span-3 rounded-[22px] border border-dashed border-[var(--app-border)] bg-white/60 p-8 text-center text-sm text-[var(--app-muted)]">
                    Cargando plantillas de certificado...
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {certPreviewId &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            const previewTemplate = certificateTemplates.find(
              (t) => t.templateId === certPreviewId,
            );
            if (!previewTemplate) return null;
            return (
              <div
                className="fixed inset-0 z-[225] flex flex-col items-center justify-center bg-black/75 p-4"
                onClick={() => setCertPreviewId(null)}
              >
                <div
                  className="relative overflow-hidden rounded-[8px] shadow-2xl"
                  style={{ width: 'min(92vw, calc(88vh * 1.415))' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
                    onClick={() => setCertPreviewId(null)}
                  >
                    ✕ Cerrar
                  </button>
                  <CertificateBuilderPreview template={previewTemplate} />
                </div>
              </div>
            );
          })(),
          document.body,
        )}

      {certBuilderTemplateId &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            const builderTemplate = certificateTemplates.find(
              (t) => t.templateId === certBuilderTemplateId,
            );
            if (!builderTemplate) return null;
            return (
              <div className="fixed inset-0 z-[230] flex flex-col bg-[var(--brand-surface-strong)]">
                <CertificateBuilder
                  template={builderTemplate}
                  onSave={async (elements) => {
                    const updated = await updateCertificateTemplate(builderTemplate.templateId, {
                      elements,
                    });
                    setCertificateTemplates((prev) =>
                      prev.map((t) => (t.templateId === updated.templateId ? updated : t)),
                    );
                    setCertBuilderTemplateId(null);
                  }}
                  onCancel={() => setCertBuilderTemplateId(null)}
                />
              </div>
            );
          })(),
          document.body,
        )}

      <LearningCourseEditor
        open={isResourceModalOpen}
        scope="aprendizaje"
        editingResource={editingResource}
        initialKind={editorInitialKind}
        resources={resources}
        certificateTemplates={certificateTemplates}
        isResourceManager={isResourceManager}
        backLabel="Volver a Aprendizaje"
        onClose={closeResourceModal}
        onSaved={onResourceSaved}
      />
    </div>
  );
}
