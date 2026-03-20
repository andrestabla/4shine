"use client";

import Link from "next/link";
import React from "react";
import {
  BookOpen,
  CalendarClock,
  Eye,
  Layers3,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { useUser } from "@/context/UserContext";
import {
  createLearningComment,
  listLearningResources,
  listLearningWorkbooks,
  type LearningResourceRecord,
  type WorkbookRecord,
} from "@/features/aprendizaje/client";
import {
  createContent,
  deleteContent,
  updateContent,
  type ContentStatus,
  type ContentType,
} from "@/features/content/client";
import {
  COMPETENCY_PILLAR_OPTIONS,
  getCompetencyOptions,
  getComponentOptionsByPillarCode,
  getObservableBehaviors,
  getPillarLabelFromCode,
} from "@/features/aprendizaje/competency-map";
import { WORKBOOKS_V2_CATALOG } from "@/lib/workbooks-v2-catalog";

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

interface ResourceFormState {
  title: string;
  category: string;
  contentType: ContentType;
  url: string;
  description: string;
  durationLabel: string;
  status: ContentStatus;
  tagsInput: string;
  pillar: string;
  component: string;
  competency: string;
  stage: string;
  audience: string;
  isRecommended: boolean;
}

const EMPTY_RESOURCE_FORM: ResourceFormState = {
  title: "",
  category: "",
  contentType: "video",
  url: "",
  description: "",
  durationLabel: "",
  status: "draft",
  tagsInput: "",
  pillar: "",
  component: "",
  competency: "",
  stage: "",
  audience: "lider",
  isRecommended: false,
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return "Usuario";
  if (role === "mentor") return "Ishiner";
  if (role === "lider") return "Líder";
  if (role === "gestor") return "Gestor";
  if (role === "admin") return "Admin";
  return role;
}

function contentTypeLabel(type: ContentType): string {
  if (type === "pdf") return "PDF";
  if (type === "ppt") return "PPT";
  if (type === "scorm") return "SCORM";
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

function resourceBadgeClasses(status: ContentStatus): string {
  if (status === "published")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status === "pending_review")
    return "bg-amber-50 text-amber-700 border border-amber-200";
  if (status === "archived")
    return "border border-[var(--app-border)] bg-white/70 text-[var(--app-muted)]";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border border-rose-200";
  return "bg-sky-50 text-sky-700 border border-sky-200";
}

function pillarLabel(value: string | null | undefined): string {
  return getPillarLabelFromCode(value);
}

function buildWorkbookDigitalHref(workbook: WorkbookRecord): string {
  const params = new URLSearchParams({
    workbookId: workbook.workbookId,
    ownerName: workbook.ownerName,
  });

  return `/dashboard/aprendizaje/workbooks/${workbook.templateCode.toLowerCase()}?${params.toString()}`;
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function workbookProgressClasses(progress: number): string {
  if (progress >= 100) return "bg-gradient-to-r from-emerald-500 to-teal-500";
  if (progress >= 60) return "bg-gradient-to-r from-blue-600 to-sky-500";
  if (progress >= 30) return "bg-gradient-to-r from-amber-500 to-orange-500";
  return "bg-gradient-to-r from-[#a291bb] to-[#c9bcdb]";
}

function workbookVisualClasses(sequenceNo: number): string {
  const themes = [
    "bg-[linear-gradient(135deg,#4f2360_0%,#6d3c80_56%,#f0b1cd_100%)] text-white",
    "bg-[linear-gradient(135deg,#5d2d63_0%,#8f72dd_48%,#d9d0ff_100%)] text-white",
    "bg-[linear-gradient(135deg,#4a2a55_0%,#c0709b_54%,#f6d5e8_100%)] text-white",
    "bg-[linear-gradient(135deg,#40204d_0%,#7257b8_48%,#b8ecff_100%)] text-white",
  ];

  return themes[(sequenceNo - 1) % themes.length];
}

function resourceSurfaceClasses(contentType: ContentType): string {
  if (contentType === "scorm")
    return "bg-[linear-gradient(135deg,rgba(91,51,109,0.96),rgba(120,74,146,0.9))] text-white border-transparent";
  if (contentType === "video")
    return "bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,237,255,0.92))] text-[var(--app-ink)]";
  if (contentType === "podcast")
    return "bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(249,232,241,0.9))] text-[var(--app-ink)]";
  return "bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,233,255,0.86))] text-[var(--app-ink)]";
}

export default function AprendizajePage() {
  const { currentRole, refreshBootstrap } = useUser();
  const { alert, confirm } = useAppDialog();

  const [resources, setResources] = React.useState<LearningResourceRecord[]>(
    [],
  );
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingResource, setSubmittingResource] = React.useState(false);
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
  const [selectedResourceId, setSelectedResourceId] = React.useState<
    string | null
  >(null);
  const [editingResourceId, setEditingResourceId] = React.useState<
    string | null
  >(null);
  const [resourceForm, setResourceForm] =
    React.useState<ResourceFormState>(EMPTY_RESOURCE_FORM);
  const [commentDrafts, setCommentDrafts] = React.useState<
    Record<string, string>
  >({});
  const [workbookOwnerFilter, setWorkbookOwnerFilter] = React.useState<
    "all" | string
  >("all");
  const [workbookSearch, setWorkbookSearch] = React.useState("");

  const isResourceManager = currentRole === "gestor" || currentRole === "admin";

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

  const loadModule = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resourceData, workbookData] = await Promise.all([
        listLearningResources(),
        listLearningWorkbooks(),
      ]);
      setResources(resourceData);
      setWorkbooks(workbookData);
    } catch (error) {
      await showError("No se pudo cargar el módulo de aprendizaje", error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void loadModule();
  }, [loadModule]);

  const componentOptions = React.useMemo(
    () => getComponentOptionsByPillarCode(resourceForm.pillar),
    [resourceForm.pillar],
  );

  const competencyOptions = React.useMemo(
    () => getCompetencyOptions(resourceForm.pillar, resourceForm.component),
    [resourceForm.component, resourceForm.pillar],
  );

  React.useEffect(() => {
    if (!resourceForm.pillar) {
      if (resourceForm.component || resourceForm.competency) {
        setResourceForm((prev) => ({ ...prev, component: "", competency: "" }));
      }
      return;
    }

    if (
      resourceForm.component &&
      !componentOptions.some(
        (option) => option.value === resourceForm.component,
      )
    ) {
      setResourceForm((prev) => ({ ...prev, component: "", competency: "" }));
      return;
    }

    if (
      resourceForm.competency &&
      !competencyOptions.some(
        (option) => option.value === resourceForm.competency,
      )
    ) {
      setResourceForm((prev) => ({ ...prev, competency: "" }));
    }
  }, [
    componentOptions,
    competencyOptions,
    resourceForm.component,
    resourceForm.competency,
    resourceForm.pillar,
  ]);

  const filteredResources = resources.filter((resource) => {
    const normalizedQuery = resourceSearch.trim().toLowerCase();
    const searchable = [
      resource.title,
      resource.description ?? "",
      resource.category,
      resource.authorName ?? "",
      resource.tags.join(" "),
      resource.competencyMetadata.component ?? "",
      resource.competencyMetadata.competency ?? "",
      resource.competencyMetadata.stage ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
    const matchesType =
      resourceTypeFilter === "all" ||
      resource.contentType === resourceTypeFilter;
    const matchesStatus =
      resourceStatusFilter === "all" ||
      resource.status === resourceStatusFilter;
    const matchesPillar =
      resourcePillarFilter === "all" ||
      (resource.competencyMetadata.pillar ?? "") === resourcePillarFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPillar;
  });

  React.useEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId(null);
      return;
    }

    const exists = filteredResources.some(
      (resource) => resource.contentId === selectedResourceId,
    );
    if (!exists) {
      setSelectedResourceId(filteredResources[0].contentId);
    }
  }, [filteredResources, selectedResourceId]);

  const selectedResource =
    filteredResources.find(
      (resource) => resource.contentId === selectedResourceId,
    ) ?? null;
  const scormResources = filteredResources.filter(
    (resource) => resource.contentType === "scorm",
  );
  const selectedResourceBehaviors = React.useMemo(
    () =>
      getObservableBehaviors(
        selectedResource?.competencyMetadata.pillar ?? null,
        selectedResource?.competencyMetadata.component ?? null,
        selectedResource?.competencyMetadata.competency ?? null,
      ),
    [selectedResource],
  );

  const workbookOwners = Array.from(
    new Map(
      workbooks.map((workbook) => [
        workbook.ownerUserId,
        { userId: workbook.ownerUserId, ownerName: workbook.ownerName },
      ]),
    ).values(),
  );

  const filteredWorkbooks = workbooks.filter((workbook) => {
    const matchesOwner =
      workbookOwnerFilter === "all" ||
      workbook.ownerUserId === workbookOwnerFilter;
    const normalizedQuery = workbookSearch.trim().toLowerCase();
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

  const resetResourceForm = () => {
    setEditingResourceId(null);
    setResourceForm(EMPTY_RESOURCE_FORM);
  };

  const populateResourceForm = (resource: LearningResourceRecord) => {
    setEditingResourceId(resource.contentId);
    setResourceForm({
      title: resource.title,
      category: resource.category,
      contentType: resource.contentType,
      url: resource.url ?? "",
      description: resource.description ?? "",
      durationLabel: resource.durationLabel ?? "",
      status: resource.status,
      tagsInput: resource.tags.join(", "),
      pillar: resource.competencyMetadata.pillar ?? "",
      component:
        resource.competencyMetadata.component ??
        resource.competencyMetadata.skill ??
        "",
      competency: resource.competencyMetadata.competency ?? "",
      stage: resource.competencyMetadata.stage ?? "",
      audience: resource.competencyMetadata.audience ?? "lider",
      isRecommended: resource.isRecommended,
    });
  };

  const buildResourcePayload = () => ({
    scope: "aprendizaje" as const,
    title: resourceForm.title.trim(),
    category: resourceForm.category.trim(),
    contentType: resourceForm.contentType,
    url: resourceForm.url.trim() || null,
    description: resourceForm.description.trim() || null,
    durationLabel: resourceForm.durationLabel.trim() || null,
    status: resourceForm.status,
    isRecommended: resourceForm.isRecommended,
    tags: resourceForm.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    competencyMetadata: {
      pillar: resourceForm.pillar.trim() || null,
      component: resourceForm.component.trim() || null,
      competency: resourceForm.competency.trim() || null,
      stage: resourceForm.stage.trim() || null,
      audience: resourceForm.audience.trim() || null,
    },
  });

  const onSubmitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isResourceManager) return;
    if (!resourceForm.title.trim() || !resourceForm.category.trim()) return;

    setSubmittingResource(true);
    try {
      if (editingResourceId) {
        await updateContent(editingResourceId, buildResourcePayload());
      } else {
        await createContent(buildResourcePayload());
      }

      resetResourceForm();
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError("No se pudo guardar el recurso", error);
    } finally {
      setSubmittingResource(false);
    }
  };

  const onChangeResourceStatus = async (
    resource: LearningResourceRecord,
    status: ContentStatus,
  ) => {
    if (!isResourceManager) return;

    try {
      await updateContent(resource.contentId, { status });
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError("No se pudo actualizar el estado del recurso", error);
    }
  };

  const onDeleteResource = async (resource: LearningResourceRecord) => {
    if (!isResourceManager) return;

    const accepted = await confirm({
      title: "Eliminar recurso",
      message: `¿Deseas eliminar "${resource.title}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      tone: "warning",
    });

    if (!accepted) return;

    try {
      await deleteContent(resource.contentId);
      if (selectedResourceId === resource.contentId) {
        setSelectedResourceId(null);
      }
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError("No se pudo eliminar el recurso", error);
    }
  };

  const onSubmitComment = async (resource: LearningResourceRecord) => {
    const commentText = commentDrafts[resource.contentId]?.trim();
    if (!commentText) return;

    try {
      await createLearningComment({
        contentId: resource.contentId,
        commentText,
      });
      setCommentDrafts((prev) => ({ ...prev, [resource.contentId]: "" }));
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError("No se pudo guardar el comentario", error);
    }
  };

  const fieldClass =
    "h-12 rounded-[16px] border border-[var(--app-border)] bg-white/86 px-4 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--app-border-strong)] focus:bg-white";
  const textareaClass =
    "min-h-28 rounded-[18px] border border-[var(--app-border)] bg-white/86 px-4 py-3 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--app-border-strong)] focus:bg-white";
  const panelClass = "app-panel p-5 sm:p-6";

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
        <div className="relative overflow-hidden rounded-[26px] border border-[var(--app-border)] bg-[linear-gradient(90deg,#51285f_0%,#5f3371_64%,#f2b6d0_100%)] px-6 py-7 text-white shadow-[0_24px_48px_rgba(55,32,80,0.16)] sm:px-8 sm:py-8">
          <div className="absolute inset-y-0 right-[20%] hidden w-16 bg-white/30 blur-2xl md:block" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/72">
              Biblioteca viva
            </p>
            <h2
              className="app-display-title mt-3 text-4xl font-semibold leading-[0.92] text-white md:text-[3.5rem]"
              data-display-font="true"
            >
              Recursos, experiencias SCORM y workbooks en una sola ruta.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/82 md:text-base">
              Explora contenido conectado al mapa de competencias, retoma tus
              workbooks y sigue tu progreso sin salir de la experiencia.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90">
                {resources.length} recursos del módulo
              </span>
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90">
                {
                  resources.filter(
                    (resource) => resource.contentType === "scorm",
                  ).length
                }{" "}
                paquetes SCORM
              </span>
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90">
                {workbooks.length} workbooks activos en catálogo
              </span>
            </div>
          </div>
        </div>

        <aside className="app-panel p-5 sm:p-6">
          <p className="app-section-kicker">Atajos de aprendizaje</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[18px] border border-[var(--app-border)] bg-white/78 p-4">
              <div className="w-fit rounded-[14px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <BookOpen size={18} />
              </div>
              <p className="mt-4 font-extrabold text-[var(--app-ink)]">
                Biblioteca curada
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                Busca por formato, estado, pilar o competencia.
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--app-border)] bg-white/78 p-4">
              <div className="w-fit rounded-[14px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <Layers3 size={18} />
              </div>
              <p className="mt-4 font-extrabold text-[var(--app-ink)]">
                Experiencias SCORM
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                Acceso directo a paquetes listos para navegar.
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--app-border)] bg-white/78 p-4">
              <div className="w-fit rounded-[14px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <CalendarClock size={18} />
              </div>
              <p className="mt-4 font-extrabold text-[var(--app-ink)]">
                Progreso sincronizado
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                Cada workbook refleja el avance real del usuario.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <StatGrid
        stats={[
          {
            label: "Recursos",
            value: resources.length,
            hint: "Biblioteca total del módulo",
          },
          {
            label: "SCORM",
            value: resources.filter(
              (resource) => resource.contentType === "scorm",
            ).length,
            hint: "Paquetes agrupados disponibles",
          },
          {
            label: "Workbooks",
            value: workbooks.length,
            hint: "Instancias únicas por líder",
          },
          {
            label: "Habilitados",
            value: workbooks.filter(
              (workbook) => workbook.accessState === "active",
            ).length,
            hint: "Editables hoy según cronograma",
          },
        ]}
      />

      {loading ? (
        <div className="app-panel p-6 text-sm text-[var(--app-muted)]">
          Cargando módulo...
        </div>
      ) : (
        <>
          {isResourceManager && (
            <section className={panelClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="app-section-kicker">Administración</p>
                  <h3
                    className="app-display-title mt-2 text-3xl font-semibold"
                    data-display-font="true"
                  >
                    {editingResourceId
                      ? "Editar recurso de aprendizaje"
                      : "Crear recurso de aprendizaje"}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)]">
                    Los recursos quedan etiquetados con metadatos de
                    competencias y también pueden publicarse como paquetes
                    SCORM.
                  </p>
                </div>

                {editingResourceId && (
                  <button
                    className="rounded-[16px] border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
                    onClick={resetResourceForm}
                    type="button"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <form
                className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                onSubmit={onSubmitResource}
              >
                <input
                  className={fieldClass}
                  placeholder="Título del recurso"
                  value={resourceForm.title}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className={fieldClass}
                  placeholder="Categoría"
                  value={resourceForm.category}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  required
                />
                <select
                  className={fieldClass}
                  value={resourceForm.contentType}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      contentType: event.target.value as ContentType,
                    }))
                  }
                >
                  {RESOURCE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {contentTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClass}
                  value={resourceForm.status}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      status: event.target.value as ContentStatus,
                    }))
                  }
                >
                  {RESOURCE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
                <input
                  className={`${fieldClass} md:col-span-2`}
                  placeholder="URL del recurso o paquete"
                  value={resourceForm.url}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      url: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass}
                  placeholder="Duración"
                  value={resourceForm.durationLabel}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      durationLabel: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass}
                  placeholder="Tags separados por coma"
                  value={resourceForm.tagsInput}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      tagsInput: event.target.value,
                    }))
                  }
                />
                <select
                  className={fieldClass}
                  value={resourceForm.pillar}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      pillar: event.target.value,
                    }))
                  }
                >
                  <option value="">Pilar 4Shine</option>
                  {COMPETENCY_PILLAR_OPTIONS.map((pillar) => (
                    <option key={pillar.value} value={pillar.value}>
                      {pillar.label}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClass}
                  value={resourceForm.component}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      component: event.target.value,
                    }))
                  }
                  disabled={componentOptions.length === 0}
                >
                  <option value="">Componente</option>
                  {componentOptions.map((component) => (
                    <option key={component.value} value={component.value}>
                      {component.label}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClass}
                  value={resourceForm.competency}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      competency: event.target.value,
                    }))
                  }
                  disabled={competencyOptions.length === 0}
                >
                  <option value="">Competencia</option>
                  {competencyOptions.map((competency) => (
                    <option key={competency.value} value={competency.value}>
                      {competency.label}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClass}
                  placeholder="Etapa del programa"
                  value={resourceForm.stage}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      stage: event.target.value,
                    }))
                  }
                />
                <input
                  className={fieldClass}
                  placeholder="Audiencia"
                  value={resourceForm.audience}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      audience: event.target.value,
                    }))
                  }
                />
                <textarea
                  className={`${textareaClass} md:col-span-2 xl:col-span-3`}
                  placeholder="Descripción y contexto de uso"
                  value={resourceForm.description}
                  onChange={(event) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                <label className="flex items-center gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-ink)]">
                  <input
                    checked={resourceForm.isRecommended}
                    onChange={(event) =>
                      setResourceForm((prev) => ({
                        ...prev,
                        isRecommended: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Marcar como recomendado
                </label>
                <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)] md:col-span-2 xl:col-span-2">
                  {resourceForm.competency ? (
                    <>
                      <p className="font-semibold text-[var(--app-ink)]">
                        Conductas observables vinculadas
                      </p>
                      <p className="mt-1">
                        {
                          getObservableBehaviors(
                            resourceForm.pillar,
                            resourceForm.component,
                            resourceForm.competency,
                          ).length
                        }{" "}
                        conductas cargadas desde el mapa 4Shine.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[var(--app-ink)]">
                        Mapa de competencias 4Shine
                      </p>
                      <p className="mt-1">
                        Selecciona pilar, componente y competencia para
                        etiquetar el recurso con el mapa oficial.
                      </p>
                    </>
                  )}
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#4f2360] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(55,32,80,0.18)] transition hover:bg-[#401b4d] disabled:opacity-60"
                  disabled={submittingResource}
                  type="submit"
                >
                  {editingResourceId ? <Save size={16} /> : <Plus size={16} />}
                  {editingResourceId ? "Guardar cambios" : "Crear recurso"}
                </button>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-section-kicker">Recursos</p>
                <h3
                  className="app-display-title mt-2 text-3xl font-semibold"
                  data-display-font="true"
                >
                  Biblioteca individual + paquetes SCORM
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  Los líderes e ishiners pueden buscar, filtrar, visualizar y
                  comentar. Los gestores y admins administran el catálogo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
              <div className="rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 shadow-[0_16px_36px_rgba(55,32,80,0.05)] xl:col-span-2">
                <label className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                  <Search size={16} />
                  <input
                    className="w-full bg-transparent py-1 text-sm text-[var(--app-ink)] outline-none"
                    placeholder="Buscar por título, categoría, tags o competencia"
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                  />
                </label>
              </div>
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
                {RESOURCE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {contentTypeLabel(type)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
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
            </div>

            {scormResources.length > 0 && (
              <div className="overflow-hidden rounded-[24px] border border-[rgba(193,148,39,0.24)] bg-[linear-gradient(135deg,rgba(255,248,228,0.94),rgba(255,255,255,0.82))] p-5 shadow-[0_20px_40px_rgba(55,32,80,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-[14px] bg-amber-500/10 p-3 text-amber-700">
                    <Layers3 size={20} />
                  </div>
                  <div>
                    <h4
                      className="app-display-title text-2xl font-semibold"
                      data-display-font="true"
                    >
                      Paquetes SCORM destacados
                    </h4>
                    <p className="text-sm text-[var(--app-muted)]">
                      Disponibles como agrupadores de contenido dentro del
                      programa.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {scormResources.slice(0, 3).map((resource) => (
                    <button
                      key={resource.contentId}
                      className="rounded-[20px] border border-[rgba(193,148,39,0.24)] bg-white/92 p-4 text-left shadow-[0_14px_28px_rgba(55,32,80,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_32px_rgba(55,32,80,0.08)]"
                      onClick={() => setSelectedResourceId(resource.contentId)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                            SCORM
                          </p>
                          <h5 className="mt-2 font-semibold text-[var(--app-ink)]">
                            {resource.title}
                          </h5>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${resourceBadgeClasses(resource.status)}`}
                        >
                          {statusLabel(resource.status)}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-[var(--app-muted)]">
                        {resource.description ?? "Sin descripción disponible."}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-[var(--app-muted)]">
                        <span>
                          {resource.durationLabel ?? "Duración flexible"}
                        </span>
                        <span>{resource.comments.length} comentarios</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredResources.length === 0 ? (
              <EmptyState message="No encontramos recursos con los filtros seleccionados." />
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  {filteredResources.map((resource) => (
                    <article
                      key={resource.contentId}
                      className={`rounded-[24px] border p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)] transition ${
                        selectedResource?.contentId === resource.contentId
                          ? "border-transparent bg-[linear-gradient(135deg,rgba(79,35,96,0.96),rgba(106,60,129,0.92))] text-white"
                          : `${resourceSurfaceClasses(resource.contentType)} border-[var(--app-border)] hover:border-[var(--app-border-strong)]`
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          className="text-left"
                          onClick={() =>
                            setSelectedResourceId(resource.contentId)
                          }
                          type="button"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                selectedResource?.contentId ===
                                resource.contentId
                                  ? "border border-white/15 bg-white/10 text-white"
                                  : resourceBadgeClasses(resource.status)
                              }`}
                            >
                              {statusLabel(resource.status)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                selectedResource?.contentId ===
                                resource.contentId
                                  ? "border border-white/15 bg-white/10 text-white"
                                  : "border border-[var(--app-border)] bg-white/70 text-[var(--app-muted)]"
                              }`}
                            >
                              {contentTypeLabel(resource.contentType)}
                            </span>
                            {resource.isRecommended && (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  selectedResource?.contentId ===
                                  resource.contentId
                                    ? "border border-amber-300/40 bg-amber-400/10 text-amber-100"
                                    : "border border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                Recomendado
                              </span>
                            )}
                          </div>
                          <h4 className="mt-3 text-lg font-semibold">
                            {resource.title}
                          </h4>
                          <p
                            className={`mt-2 text-sm ${
                              selectedResource?.contentId === resource.contentId
                                ? "text-white/80"
                                : "text-[var(--app-muted)]"
                            }`}
                          >
                            {resource.description ??
                              "Sin descripción disponible."}
                          </p>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          {isResourceManager && (
                            <>
                              <button
                                className={`inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-medium ${
                                  selectedResource?.contentId ===
                                  resource.contentId
                                    ? "border border-white/15 bg-white/10 text-white"
                                    : "border border-[var(--app-border)] bg-white/70 text-[var(--app-ink)]"
                                }`}
                                onClick={() => populateResourceForm(resource)}
                                type="button"
                              >
                                <Pencil size={15} />
                                Editar
                              </button>
                              <button
                                className={`inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-medium ${
                                  selectedResource?.contentId ===
                                  resource.contentId
                                    ? "border border-rose-300/20 bg-rose-500/10 text-rose-100"
                                    : "border border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                                onClick={() => void onDeleteResource(resource)}
                                type="button"
                              >
                                <Trash2 size={15} />
                                Eliminar
                              </button>
                            </>
                          )}
                          {resource.url && (
                            <a
                              className={`inline-flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-medium ${
                                selectedResource?.contentId ===
                                resource.contentId
                                  ? "border border-white/15 bg-white/10 text-white"
                                  : "border border-[var(--app-border)] bg-white/70 text-[var(--app-ink)]"
                              }`}
                              href={resource.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <Eye size={15} />
                              Ver
                            </a>
                          )}
                        </div>
                      </div>

                      <div
                        className={`mt-4 flex flex-wrap items-center gap-4 text-xs ${
                          selectedResource?.contentId === resource.contentId
                            ? "text-white/72"
                            : "text-[var(--app-muted)]"
                        }`}
                      >
                        <span>{resource.category}</span>
                        <span>{resource.durationLabel ?? "Sin duración"}</span>
                        <span>
                          {pillarLabel(resource.competencyMetadata.pillar)}
                        </span>
                        <span>{resource.comments.length} comentarios</span>
                        <span>{resource.progressPercent}% avance</span>
                      </div>

                      {isResourceManager && (
                        <div className="mt-4">
                          <select
                            className={`rounded-[14px] px-3 py-2 text-sm outline-none ${
                              selectedResource?.contentId === resource.contentId
                                ? "border border-white/15 bg-white/10 text-white"
                                : "border border-[var(--app-border)] bg-white/70 text-[var(--app-ink)]"
                            }`}
                            value={resource.status}
                            onChange={(event) =>
                              void onChangeResourceStatus(
                                resource,
                                event.target.value as ContentStatus,
                              )
                            }
                          >
                            {RESOURCE_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <aside className={panelClass}>
                  {selectedResource ? (
                    <div className="space-y-5">
                      <div>
                        <p className="app-section-kicker">Detalle</p>
                        <h4
                          className="app-display-title mt-2 text-3xl font-semibold"
                          data-display-font="true"
                        >
                          {selectedResource.title}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                          {selectedResource.description ??
                            "Sin descripción disponible."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                            Autor
                          </p>
                          <p className="mt-2 text-sm font-medium text-[var(--app-ink)]">
                            {selectedResource.authorName ?? "4Shine"}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                            Publicado
                          </p>
                          <p className="mt-2 text-sm font-medium text-[var(--app-ink)]">
                            {formatDate(selectedResource.publishedAt)}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                            Componente
                          </p>
                          <p className="mt-2 text-sm font-medium text-[var(--app-ink)]">
                            {selectedResource.competencyMetadata.component ??
                              "Sin definir"}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                            Competencia
                          </p>
                          <p className="mt-2 text-sm font-medium text-[var(--app-ink)]">
                            {selectedResource.competencyMetadata.competency ??
                              "Sin definir"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-[var(--app-border)] bg-white/74 p-4">
                        <p className="app-section-kicker">Metadatos</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs text-[var(--app-ink)]">
                            {pillarLabel(
                              selectedResource.competencyMetadata.pillar,
                            )}
                          </span>
                          {(selectedResource.tags.length
                            ? selectedResource.tags
                            : ["Sin tags"]
                          ).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] bg-[var(--app-surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                              Etapa
                            </p>
                            <p className="mt-2 text-sm text-[var(--app-ink)]">
                              {selectedResource.competencyMetadata.stage ??
                                "Sin definir"}
                            </p>
                          </div>
                          <div className="rounded-[16px] bg-[var(--app-surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                              Audiencia
                            </p>
                            <p className="mt-2 text-sm text-[var(--app-ink)]">
                              {selectedResource.competencyMetadata.audience ??
                                "Liderazgo"}
                            </p>
                          </div>
                        </div>
                        {selectedResourceBehaviors.length > 0 && (
                          <div className="mt-4 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                            <p className="app-section-kicker">
                              Conductas observables
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--app-ink)]">
                              {selectedResourceBehaviors.map((behavior) => (
                                <li
                                  key={behavior}
                                  className="rounded-[18px] bg-white px-3 py-2"
                                >
                                  {behavior}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[20px] border border-[var(--app-border)] bg-white/74 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="app-section-kicker">Comentarios</p>
                            <p className="mt-1 text-sm text-[var(--app-muted)]">
                              Conversación sobre el recurso entre líderes,
                              ishiners y equipo gestor.
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs text-[var(--app-muted)]">
                            <MessageCircle size={14} />
                            {selectedResource.comments.length}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {selectedResource.comments.length === 0 ? (
                            <p className="rounded-[16px] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]">
                              Todavía no hay comentarios en este recurso.
                            </p>
                          ) : (
                            selectedResource.comments.map((comment) => (
                              <article
                                key={comment.commentId}
                                className="rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--app-ink)]">
                                      {comment.authorName}
                                    </p>
                                    <p className="text-xs text-[var(--app-muted)]">
                                      {roleLabel(comment.authorRole)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-[var(--app-muted)]">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm text-[var(--app-ink)]">
                                  {comment.commentText}
                                </p>
                              </article>
                            ))
                          )}
                        </div>

                        <div className="mt-4 space-y-3">
                          <textarea
                            className="min-h-24 w-full rounded-[18px] border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-[var(--app-ink)] outline-none transition focus:border-[var(--app-border-strong)]"
                            placeholder="Escribe un comentario sobre este recurso"
                            value={
                              commentDrafts[selectedResource.contentId] ?? ""
                            }
                            onChange={(event) =>
                              setCommentDrafts((prev) => ({
                                ...prev,
                                [selectedResource.contentId]:
                                  event.target.value,
                              }))
                            }
                          />
                          <button
                            className="inline-flex items-center gap-2 rounded-[16px] bg-[#4f2360] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#401b4d]"
                            onClick={() =>
                              void onSubmitComment(selectedResource)
                            }
                            type="button"
                          >
                            <MessageCircle size={15} />
                            Comentar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="Selecciona un recurso para ver su detalle." />
                  )}
                </aside>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-section-kicker">Workbooks</p>
                <h3
                  className="app-display-title mt-2 text-3xl font-semibold"
                  data-display-font="true"
                >
                  10 workbooks digitales del programa
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  Entra directo a cada workbook, continúa donde ibas y revisa tu
                  avance real sincronizado por usuario.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.7fr)]">
                <div className="rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 shadow-[0_16px_36px_rgba(55,32,80,0.05)] md:col-span-2">
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
                  <div className="flex items-center rounded-[18px] border border-[var(--app-border)] bg-white/82 px-4 py-3 text-sm text-[var(--app-muted)] shadow-[0_16px_36px_rgba(55,32,80,0.05)]">
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
                  <select
                    className={fieldClass}
                    value={workbookOwnerFilter}
                    onChange={(event) =>
                      setWorkbookOwnerFilter(event.target.value)
                    }
                  >
                    <option value="all">Todos los líderes</option>
                    {workbookOwners.map((owner) => (
                      <option key={owner.userId} value={owner.userId}>
                        {owner.ownerName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {filteredWorkbooks.length === 0 ? (
                <EmptyState message="No hay workbooks disponibles con este filtro." />
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {filteredWorkbooks.map((workbook) => {
                    const digitalWorkbook =
                      workbookCatalogBySlug.get(
                        workbook.templateCode.toLowerCase(),
                      ) ?? null;
                    const progress = clampPercent(workbook.completionPercent);

                    return (
                      <Link
                        key={workbook.workbookId}
                        href={buildWorkbookDigitalHref(workbook)}
                        className="group overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-white/82 text-left text-[var(--app-ink)] shadow-[0_18px_38px_rgba(55,32,80,0.06)] transition hover:-translate-y-1 hover:border-[var(--app-border-strong)] hover:shadow-[0_24px_44px_rgba(55,32,80,0.1)]"
                      >
                        <div
                          className={`relative min-h-[220px] p-5 ${workbookVisualClasses(workbook.sequenceNo)}`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.3))]" />
                          <div className="relative flex h-full flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
                                Workbook{" "}
                                {String(workbook.sequenceNo).padStart(2, "0")}
                              </p>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${workbookStateClasses(workbook.accessState)}`}
                              >
                                {workbookStateLabel(workbook.accessState)}
                              </span>
                            </div>

                            <div className="mt-auto">
                              <h4 className="text-[1.65rem] font-extrabold leading-tight text-white">
                                {workbook.title}
                              </h4>
                              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
                                {digitalWorkbook?.summary ??
                                  workbook.description ??
                                  "Sin descripción disponible."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5">
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

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {currentRole !== "lider" && (
                              <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                                {workbook.ownerName}
                              </span>
                            )}
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
                              {progress > 0
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
          </section>

          <section className={panelClass}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-[14px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--app-ink)]">
                      Recursos individuales
                    </h4>
                    <p className="text-sm text-[var(--app-muted)]">
                      Videos, pódcast y documentos listos para búsqueda y
                      comentario.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-[14px] bg-amber-500/10 p-3 text-amber-700">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--app-ink)]">
                      Paquetes SCORM
                    </h4>
                    <p className="text-sm text-[var(--app-muted)]">
                      Agrupados como experiencias completas de aprendizaje.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-[14px] bg-emerald-500/10 p-3 text-emerald-700">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--app-ink)]">
                      Cronograma de workbooks
                    </h4>
                    <p className="text-sm text-[var(--app-muted)]">
                      Cada líder recibe 10 workbooks únicos con habilitación
                      gradual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
