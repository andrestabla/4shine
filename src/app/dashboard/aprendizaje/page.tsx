"use client";

import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileUp,
  Layers3,
  Lightbulb,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AccessOfferPanel } from "@/components/access/AccessOfferPanel";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { R2UploadButton } from "@/components/ui/R2UploadButton";
import { useUser } from "@/context/UserContext";
import { filterCommercialProducts } from "@/features/access/catalog";
import {
  createLearningComment,
  extractLearningMetadataWithAi,
  listLearningResources,
  listLearningWorkbooks,
  type LearningMetadataAssistantResult,
  type LearningResourceRecord,
  type WorkbookRecord,
} from "@/features/aprendizaje/client";
import {
  LEARNING_AUDIENCE_OPTIONS,
  LEARNING_PROGRAM_STAGE_OPTIONS,
} from "@/features/aprendizaje/metadata-assistant";
import {
  createContent,
  deleteContent,
  updateContent,
  type CourseModule,
  type CourseModuleResource,
  type CourseModuleResourceType,
  type ContentStatus,
  type ContentStructurePayload,
  type ContentType,
} from "@/features/content/client";
import {
  COMPETENCY_PILLAR_OPTIONS,
  getCompetencyOptions,
  getComponentOptionsByPillarCode,
  getObservableBehaviors,
  getPillarLabelFromCode,
} from "@/features/aprendizaje/competency-map";
import type { R2UploadResponse } from "@/lib/r2-upload-client";
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
  tags: string[];
  pillar: string;
  component: string;
  competency: string;
  stage: string;
  audience: string;
  isRecommended: boolean;
  courseModules: CourseModule[];
}

const EMPTY_RESOURCE_FORM: ResourceFormState = {
  title: "",
  category: "",
  contentType: "video",
  url: "",
  description: "",
  durationLabel: "",
  status: "draft",
  tags: [],
  pillar: "",
  component: "",
  competency: "",
  stage: "",
  audience: "lider",
  isRecommended: false,
  courseModules: [],
};

type ResourceEditorKind = "resource" | "course";

const COURSE_MODULE_RESOURCE_TYPE_OPTIONS: CourseModuleResourceType[] = [
  "video",
  "pdf",
  "article",
  "podcast",
  "html",
  "ppt",
  "link",
];

const PROGRAM_STAGE_OPTIONS = LEARNING_PROGRAM_STAGE_OPTIONS;
const AUDIENCE_OPTIONS = LEARNING_AUDIENCE_OPTIONS;

const CONTENT_TYPE_EXPERIENCE: Record<
  ContentType,
  {
    description: string;
    assetLabel: string;
    uploadLabel: string;
    uploadHelp: string;
    urlPlaceholder: string;
    accept: string;
    categoryPresets: string[];
    durationPresets: string[];
    tagPresets: string[];
  }
> = {
  video: {
    description: "Ideal para microlearning, masterclasses y sesiones grabadas.",
    assetLabel: "Video o enlace de streaming",
    uploadLabel: "Subir video a R2",
    uploadHelp: "Carga archivos MP4/MOV o vincula una URL externa del recurso.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept: "video/*",
    categoryPresets: [
      "Masterclass",
      "Cápsula",
      "Tutorial",
      "Caso práctico",
    ],
    durationPresets: ["3 min", "8 min", "15 min", "30 min", "45 min"],
    tagPresets: ["video", "microlearning", "on-demand"],
  },
  podcast: {
    description: "Útil para reflexiones, conversaciones y escucha guiada.",
    assetLabel: "Audio o episodio",
    uploadLabel: "Subir audio a R2",
    uploadHelp: "Admite MP3/M4A o un enlace a Spotify, Apple Podcast o similar.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept: "audio/*",
    categoryPresets: ["Conversación", "Reflexión", "Audio guía", "Entrevista"],
    durationPresets: ["5 min", "12 min", "20 min", "30 min", "45 min"],
    tagPresets: ["podcast", "audio", "reflexión"],
  },
  pdf: {
    description: "Perfecto para guías, playbooks, frameworks y descargables.",
    assetLabel: "Documento PDF",
    uploadLabel: "Subir PDF a R2",
    uploadHelp: "Carga el documento final para visualización o descarga dentro de la plataforma.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept: ".pdf,application/pdf",
    categoryPresets: ["Guía", "Toolkit", "Plantilla", "Lectura"],
    durationPresets: ["10 min", "20 min", "30 min", "45 min"],
    tagPresets: ["pdf", "guía", "descargable"],
  },
  article: {
    description: "Pensado para lecturas cortas, notas curatoriales y piezas editoriales.",
    assetLabel: "URL del artículo",
    uploadLabel: "Subir archivo base a R2",
    uploadHelp: "Puedes usar un enlace público o alojar el archivo fuente en R2.",
    urlPlaceholder: "https://articulo, notion, medium o URL generada en R2",
    accept: ".pdf,.doc,.docx,.txt,text/plain,text/html",
    categoryPresets: ["Artículo", "Lectura", "Caso", "Insight"],
    durationPresets: ["4 min", "8 min", "12 min", "20 min"],
    tagPresets: ["lectura", "artículo", "insight"],
  },
  html: {
    description: "Útil para experiencias interactivas, landing educativas o recursos embebidos.",
    assetLabel: "Experiencia HTML",
    uploadLabel: "Subir HTML a R2",
    uploadHelp: "Usa una URL pública o sube un archivo compatible para distribuir la experiencia.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept: ".html,.htm,text/html,.zip,application/zip",
    categoryPresets: ["Experiencia interactiva", "Landing", "Simulación"],
    durationPresets: ["5 min", "10 min", "20 min", "30 min"],
    tagPresets: ["interactivo", "html", "experiencia"],
  },
  ppt: {
    description: "Recomendado para decks, presentaciones facilitadas y recursos ejecutivos.",
    assetLabel: "Presentación",
    uploadLabel: "Subir PPT a R2",
    uploadHelp: "Carga el deck en PPT/PPTX o vincula la versión publicada.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept:
      ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    categoryPresets: ["Presentación", "Deck", "Clase guiada", "Pitch"],
    durationPresets: ["10 min", "20 min", "30 min", "45 min"],
    tagPresets: ["deck", "presentación", "ejecutivo"],
  },
  scorm: {
    description: "Pensado para cursos completos con módulos, recursos internos y experiencia secuencial.",
    assetLabel: "Paquete o URL de lanzamiento del curso",
    uploadLabel: "Subir curso a R2",
    uploadHelp: "Carga el ZIP final del curso o vincula la URL de lanzamiento. Además puedes estructurarlo por módulos y recursos internos.",
    urlPlaceholder: "https://... o URL generada en R2",
    accept: ".zip,application/zip,application/x-zip-compressed",
    categoryPresets: ["Curso", "Ruta", "Academia", "Programa"],
    durationPresets: ["15 min", "30 min", "45 min", "60 min", "90 min"],
    tagPresets: ["curso", "ruta", "premium"],
  },
};

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Map(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value]),
    ).values(),
  );
}

function normalizeTag(rawValue: string): string {
  return rawValue.trim().replace(/\s+/g, " ");
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

function buildEditorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function createEmptyCourseResource(): CourseModuleResource {
  return {
    id: buildEditorId(),
    title: "",
    description: "",
    contentType: "video",
    url: "",
    durationLabel: "",
    linkedContentId: null,
  };
}

function createEmptyCourseModule(): CourseModule {
  return {
    id: buildEditorId(),
    title: "",
    description: "",
    resources: [createEmptyCourseResource()],
  };
}

function editorKindFromContentType(type: ContentType): ResourceEditorKind {
  return type === "scorm" ? "course" : "resource";
}

function normalizeCourseModulesFromStructure(
  structurePayload: ContentStructurePayload | null | undefined,
): CourseModule[] {
  if (!structurePayload || !Array.isArray(structurePayload.modules)) {
    return [];
  }

  return structurePayload.modules.map((module) => ({
    id: module.id || buildEditorId(),
    title: module.title ?? "",
    description: module.description ?? "",
    resources: Array.isArray(module.resources)
      ? module.resources.map((resource) => ({
          id: resource.id || buildEditorId(),
          title: resource.title ?? "",
          description: resource.description ?? "",
          contentType: resource.contentType ?? "video",
          url: resource.url ?? "",
          durationLabel: resource.durationLabel ?? "",
          linkedContentId: resource.linkedContentId ?? null,
        }))
      : [createEmptyCourseResource()],
  }));
}

function normalizeCourseModulesForSave(modules: CourseModule[]): CourseModule[] {
  return modules
    .map((module) => ({
      id: module.id || buildEditorId(),
      title: module.title.trim(),
      description: module.description?.trim() || null,
      resources: (module.resources ?? [])
        .map((resource) => ({
          id: resource.id || buildEditorId(),
          title: resource.title.trim(),
          description: resource.description?.trim() || null,
          contentType: resource.contentType,
          url: resource.url?.trim() || null,
          durationLabel: resource.durationLabel?.trim() || null,
          linkedContentId: resource.linkedContentId?.trim() || null,
        }))
        .filter((resource) => resource.title.length > 0),
    }))
    .filter((module) => module.title.length > 0);
}

function countCourseResources(modules: CourseModule[]): number {
  return modules.reduce(
    (total, module) => total + (module.resources?.filter((resource) => resource.title.trim().length > 0).length ?? 0),
    0,
  );
}

function hasMeaningfulCourseStructure(modules: CourseModule[]): boolean {
  return modules.some(
    (module) =>
      module.title.trim().length > 0 ||
      (module.description?.trim().length ?? 0) > 0 ||
      module.resources.some(
        (resource) =>
          resource.title.trim().length > 0 ||
          (resource.description?.trim().length ?? 0) > 0 ||
          (resource.url?.trim().length ?? 0) > 0,
      ),
  );
}

function courseModuleResourceTypeLabel(type: CourseModuleResourceType): string {
  if (type === "link") return "Enlace";
  return contentTypeLabel(type);
}

function ResourceTagComposer({
  tags,
  draft,
  suggestions,
  onDraftChange,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  draft: string;
  suggestions: string[];
  onDraftChange: (value: string) => void;
  onAddTag: (value: string) => void;
  onRemoveTag: (value: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] bg-white/82 p-4">
      <label className="app-field-label">Tags y señales de descubrimiento</label>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="app-input"
            placeholder="Escribe un tag y presiona Enter"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onAddTag(draft);
            }}
          />
          <button
            type="button"
            className="app-button-secondary min-w-[10rem]"
            onClick={() => onAddTag(draft)}
          >
            <Tag size={16} />
            Agregar tag
          </button>
        </div>

        <div className="flex min-h-12 flex-wrap gap-2 rounded-[18px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(95,52,113,0.14)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--app-ink)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
                  aria-label={`Eliminar ${tag}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-[var(--app-muted)]">
              Agrega tags para mejorar búsqueda, filtrado y recomendaciones.
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Sugerencias inteligentes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="app-chip-soft transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]"
                  onClick={() => onAddTag(suggestion)}
                >
                  <Plus size={12} />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  if (role === "mentor") return "iShine";
  if (role === "lider") return "Líder";
  if (role === "gestor") return "Gestor";
  if (role === "admin") return "Admin";
  return role;
}

function contentTypeLabel(type: ContentType): string {
  if (type === "pdf") return "PDF";
  if (type === "ppt") return "PPT";
  if (type === "scorm") return "Curso";
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
  const { currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [resources, setResources] = React.useState<LearningResourceRecord[]>(
    [],
  );
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingResource, setSubmittingResource] = React.useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = React.useState(false);
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
  const [resourceTagDraft, setResourceTagDraft] = React.useState("");
  const [resourceCategoryMode, setResourceCategoryMode] = React.useState<
    "preset" | "custom"
  >("preset");
  const [customCategoryDraft, setCustomCategoryDraft] = React.useState("");
  const [uploadedResourceAsset, setUploadedResourceAsset] =
    React.useState<R2UploadResponse | null>(null);
  const [commentDrafts, setCommentDrafts] = React.useState<
    Record<string, string>
  >({});
  const [metadataAssistantResult, setMetadataAssistantResult] =
    React.useState<LearningMetadataAssistantResult | null>(null);
  const [metadataAssistantLoading, setMetadataAssistantLoading] =
    React.useState(false);
  const [workbookOwnerFilter, setWorkbookOwnerFilter] = React.useState<
    "all" | string
  >("all");
  const [workbookSearch, setWorkbookSearch] = React.useState("");

  const isResourceManager = currentRole === "gestor" || currentRole === "admin";
  const isOpenLeader =
    currentRole === "lider" && viewerAccess?.viewerTier === "open_leader";
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ["program_4shine"],
  });

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

  const resourceTypeProfile = React.useMemo(
    () => CONTENT_TYPE_EXPERIENCE[resourceForm.contentType],
    [resourceForm.contentType],
  );
  const editorKind = React.useMemo<ResourceEditorKind>(
    () => editorKindFromContentType(resourceForm.contentType),
    [resourceForm.contentType],
  );
  const isCourseEditor = editorKind === "course";

  const competencyOptions = React.useMemo(
    () => getCompetencyOptions(resourceForm.pillar, resourceForm.component),
    [resourceForm.component, resourceForm.pillar],
  );

  const resourceObservableBehaviors = React.useMemo(
    () =>
      getObservableBehaviors(
        resourceForm.pillar,
        resourceForm.component,
        resourceForm.competency,
      ),
    [resourceForm.component, resourceForm.competency, resourceForm.pillar],
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
      ...(resource.structurePayload.modules?.map((module) => module.title) ?? []),
      ...(resource.structurePayload.modules?.flatMap((module) =>
        module.resources.map((courseResource) => courseResource.title),
      ) ?? []),
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

  const categoryOptions = React.useMemo(
    () =>
      uniqueStrings([
        ...resourceTypeProfile.categoryPresets,
        ...resources.map((resource) => resource.category),
        resourceForm.category,
      ]),
    [resourceForm.category, resourceTypeProfile.categoryPresets, resources],
  );

  const stageOptions = React.useMemo(
    () =>
      uniqueStrings([
        ...PROGRAM_STAGE_OPTIONS,
        ...resources.map((resource) => resource.competencyMetadata.stage),
        resourceForm.stage,
      ]),
    [resourceForm.stage, resources],
  );

  const audienceOptions = React.useMemo(
    () =>
      uniqueStrings([
        ...AUDIENCE_OPTIONS.map((option) => option.value),
        ...resources.map((resource) => resource.competencyMetadata.audience),
        resourceForm.audience,
      ]).map((value) => ({
        value,
        label:
          AUDIENCE_OPTIONS.find((option) => option.value === value)?.label ??
          value,
      })),
    [resourceForm.audience, resources],
  );

  const smartTagSuggestions = React.useMemo(
    () =>
      uniqueStrings([
        ...resourceTypeProfile.tagPresets,
        resourceForm.category,
        resourceForm.stage,
        COMPETENCY_PILLAR_OPTIONS.find(
          (pillar) => pillar.value === resourceForm.pillar,
        )?.label,
        componentOptions.find(
          (component) => component.value === resourceForm.component,
        )?.label,
        competencyOptions.find(
          (competency) => competency.value === resourceForm.competency,
        )?.label,
        ...resources
          .flatMap((resource) => resource.tags)
          .slice(0, 20),
      ]).filter(
        (suggestion) =>
          !resourceForm.tags.some(
            (tag) => tag.toLowerCase() === suggestion.toLowerCase(),
          ),
      ),
    [
      competencyOptions,
      componentOptions,
      resourceForm.category,
      resourceForm.competency,
      resourceForm.component,
      resourceForm.pillar,
      resourceForm.stage,
      resourceForm.tags,
      resourceTypeProfile.tagPresets,
      resources,
    ],
  );

  const publishedResourceCount = resources.filter(
    (resource) => resource.status === "published",
  ).length;
  const draftResourceCount = resources.filter(
    (resource) => resource.status === "draft",
  ).length;
  const recommendedResourceCount = resources.filter(
    (resource) => resource.isRecommended,
  ).length;
  const activeCourseCount = resources.filter(
    (resource) => resource.contentType === "scorm",
  ).length;
  const currentCourseResourceCount = countCourseResources(
    resourceForm.courseModules,
  );

  const resetResourceForm = React.useCallback(() => {
    setEditingResourceId(null);
    setResourceForm(EMPTY_RESOURCE_FORM);
    setResourceTagDraft("");
    setResourceCategoryMode("preset");
    setCustomCategoryDraft("");
    setUploadedResourceAsset(null);
    setMetadataAssistantResult(null);
  }, []);

  const closeResourceModal = React.useCallback((force = false) => {
    if (submittingResource && !force) return;
    setIsResourceModalOpen(false);
    resetResourceForm();
  }, [resetResourceForm, submittingResource]);

  const openCreateResourceModal = React.useCallback(() => {
    resetResourceForm();
    setIsResourceModalOpen(true);
  }, [resetResourceForm]);

  const populateResourceForm = React.useCallback(
    (resource: LearningResourceRecord) => {
      const knownCategory = uniqueStrings([
        ...CONTENT_TYPE_EXPERIENCE[resource.contentType].categoryPresets,
        ...resources.map((item) => item.category),
      ]).some((category) => category === resource.category);

      setEditingResourceId(resource.contentId);
      setResourceForm({
        title: resource.title,
        category: resource.category,
        contentType: resource.contentType,
        url: resource.url ?? "",
        description: resource.description ?? "",
        durationLabel: resource.durationLabel ?? "",
        status: resource.status,
        tags: resource.tags,
        pillar: resource.competencyMetadata.pillar ?? "",
        component:
          resource.competencyMetadata.component ??
          resource.competencyMetadata.skill ??
          "",
        competency: resource.competencyMetadata.competency ?? "",
        stage: resource.competencyMetadata.stage ?? "",
        audience: resource.competencyMetadata.audience ?? "lider",
        isRecommended: resource.isRecommended,
        courseModules: normalizeCourseModulesFromStructure(
          resource.structurePayload,
        ),
      });
      setResourceTagDraft("");
      setCustomCategoryDraft(
        knownCategory ? "" : resource.category,
      );
      setResourceCategoryMode(knownCategory ? "preset" : "custom");
      setUploadedResourceAsset(null);
      setMetadataAssistantResult(null);
      setIsResourceModalOpen(true);
    },
    [resources],
  );

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
    tags: resourceForm.tags,
    competencyMetadata: {
      pillar: resourceForm.pillar.trim() || null,
      component: resourceForm.component.trim() || null,
      competency: resourceForm.competency.trim() || null,
      stage: resourceForm.stage.trim() || null,
      audience: resourceForm.audience.trim() || null,
    },
    structurePayload: {
      kind: editorKind,
      modules:
        editorKind === "course"
          ? normalizeCourseModulesForSave(resourceForm.courseModules)
          : [],
    },
  });

  const onSubmitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isResourceManager) return;
    if (!resourceForm.title.trim() || !resourceForm.category.trim()) {
      await alert({
        title: "Completa los datos base",
        message:
          "Agrega al menos un título y una categoría para poder guardar el recurso.",
        tone: "warning",
      });
      return;
    }
    const hasCourseStructure = countCourseResources(resourceForm.courseModules) > 0;
    if (
      resourceForm.status === "published" &&
      !resourceForm.url.trim() &&
      !hasCourseStructure
    ) {
      await alert({
        title: "Completa el recurso",
        message:
          editorKind === "course"
            ? "Antes de publicar el curso, vincula una URL o construye al menos un módulo con recursos internos."
            : "Antes de publicar, sube el archivo a R2 o agrega una URL válida para que el recurso quede disponible.",
        tone: "warning",
      });
      return;
    }
    if (
      editorKind === "course" &&
      resourceForm.status === "published" &&
      !hasCourseStructure
    ) {
      await alert({
        title: "Estructura pendiente",
        message:
          "Un curso publicado debe tener al menos un módulo con un recurso interno.",
        tone: "warning",
      });
      return;
    }

    setSubmittingResource(true);
    try {
      if (editingResourceId) {
        await updateContent(editingResourceId, buildResourcePayload());
      } else {
        await createContent(buildResourcePayload());
      }

      closeResourceModal(true);
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError("No se pudo guardar el recurso", error);
    } finally {
      setSubmittingResource(false);
    }
  };

  const addTagToResourceForm = React.useCallback((rawValue: string) => {
    const normalized = normalizeTag(rawValue);
    if (!normalized) return;

    setResourceForm((prev) => {
      const exists = prev.tags.some(
        (tag) => tag.toLowerCase() === normalized.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, tags: [...prev.tags, normalized] };
    });
    setResourceTagDraft("");
  }, []);

  const removeTagFromResourceForm = React.useCallback((value: string) => {
    setResourceForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== value),
    }));
  }, []);

  const onChangeResourceContentType = React.useCallback(
    (nextType: ContentType) => {
      setMetadataAssistantResult(null);
      setResourceForm((prev) => ({
        ...prev,
        contentType: nextType,
        category:
          resourceCategoryMode === "preset" && !prev.category
            ? CONTENT_TYPE_EXPERIENCE[nextType].categoryPresets[0] ?? ""
            : prev.category,
        durationLabel:
          !prev.durationLabel && CONTENT_TYPE_EXPERIENCE[nextType].durationPresets[0]
            ? CONTENT_TYPE_EXPERIENCE[nextType].durationPresets[0]
            : prev.durationLabel,
        courseModules:
          nextType === "scorm" && prev.courseModules.length === 0
            ? [createEmptyCourseModule()]
            : prev.courseModules,
      }));
    },
    [resourceCategoryMode],
  );

  const onChangeEditorKind = React.useCallback((nextKind: ResourceEditorKind) => {
    setMetadataAssistantResult(null);
    if (nextKind === "course") {
      setResourceForm((prev) => ({
        ...prev,
        contentType: "scorm",
        category: prev.category || CONTENT_TYPE_EXPERIENCE.scorm.categoryPresets[0],
        durationLabel:
          prev.durationLabel || CONTENT_TYPE_EXPERIENCE.scorm.durationPresets[0],
        courseModules:
          prev.courseModules.length > 0 ? prev.courseModules : [createEmptyCourseModule()],
      }));
      return;
    }

    setResourceForm((prev) => ({
      ...prev,
      contentType: prev.contentType === "scorm" ? "video" : prev.contentType,
    }));
  }, []);

  const onExtractMetadataWithAi = React.useCallback(async () => {
    if (!isResourceManager || metadataAssistantLoading) return;

    const hasSignal =
      resourceForm.url.trim().length > 0 ||
      resourceForm.title.trim().length > 0 ||
      resourceForm.description.trim().length > 0;

    if (!hasSignal) {
      await alert({
        title: "Agrega contexto primero",
        message:
          "Pega una URL, un título o una descripción para que el asistente pueda sugerir metadatos útiles.",
        tone: "warning",
      });
      return;
    }

    setMetadataAssistantLoading(true);
    try {
      const result = await extractLearningMetadataWithAi({
        kind: editorKind,
        contentType: resourceForm.contentType,
        url: resourceForm.url.trim() || null,
        title: resourceForm.title.trim() || null,
        description: resourceForm.description.trim() || null,
        category: resourceForm.category.trim() || null,
        durationLabel: resourceForm.durationLabel.trim() || null,
      });

      const suggestedCategory = result.suggestion.category.trim();
      const knownCategory = uniqueStrings([
        ...CONTENT_TYPE_EXPERIENCE[resourceForm.contentType].categoryPresets,
        ...resources.map((resource) => resource.category),
        suggestedCategory,
      ]).some((category) => category === suggestedCategory);

      const shouldReplaceCourseStructure =
        editorKind === "course" &&
        result.suggestion.courseModules.length > 0 &&
        !hasMeaningfulCourseStructure(resourceForm.courseModules);

      setMetadataAssistantResult(result);
      setResourceCategoryMode(
        suggestedCategory && !knownCategory ? "custom" : "preset",
      );
      setCustomCategoryDraft(
        suggestedCategory && !knownCategory ? suggestedCategory : "",
      );

      setResourceForm((prev) => ({
        ...prev,
        title: result.suggestion.title || prev.title,
        description: result.suggestion.description || prev.description,
        category: suggestedCategory || prev.category,
        durationLabel: result.suggestion.durationLabel ?? prev.durationLabel,
        pillar: result.suggestion.pillar ?? prev.pillar,
        component: result.suggestion.component ?? prev.component,
        competency: result.suggestion.competency ?? prev.competency,
        stage: result.suggestion.stage ?? prev.stage,
        audience: result.suggestion.audience ?? prev.audience,
        tags: uniqueStrings([...prev.tags, ...result.suggestion.tags]),
        courseModules: shouldReplaceCourseStructure
          ? result.suggestion.courseModules
          : prev.courseModules,
      }));
    } catch (error) {
      await showError(
        "No se pudieron extraer metadatos con el asistente IA",
        error,
      );
    } finally {
      setMetadataAssistantLoading(false);
    }
  }, [
    alert,
    editorKind,
    isResourceManager,
    metadataAssistantLoading,
    resourceForm.category,
    resourceForm.contentType,
    resourceForm.courseModules,
    resourceForm.description,
    resourceForm.durationLabel,
    resourceForm.title,
    resourceForm.url,
    resources,
    showError,
  ]);

  const onSelectResourceCategory = React.useCallback((value: string) => {
    if (value === "__custom") {
      setResourceCategoryMode("custom");
      setCustomCategoryDraft("");
      setResourceForm((prev) => ({ ...prev, category: "" }));
      return;
    }

    setResourceCategoryMode("preset");
    setCustomCategoryDraft("");
    setResourceForm((prev) => ({ ...prev, category: value }));
  }, []);

  const addCourseModule = React.useCallback(() => {
    setResourceForm((prev) => ({
      ...prev,
      courseModules: [...prev.courseModules, createEmptyCourseModule()],
    }));
  }, []);

  const updateCourseModule = React.useCallback(
    (moduleId: string, field: "title" | "description", value: string) => {
      setResourceForm((prev) => ({
        ...prev,
        courseModules: prev.courseModules.map((module) =>
          module.id === moduleId ? { ...module, [field]: value } : module,
        ),
      }));
    },
    [],
  );

  const removeCourseModule = React.useCallback((moduleId: string) => {
    setResourceForm((prev) => ({
      ...prev,
      courseModules:
        prev.courseModules.length <= 1
          ? [createEmptyCourseModule()]
          : prev.courseModules.filter((module) => module.id !== moduleId),
    }));
  }, []);

  const addCourseModuleResource = React.useCallback((moduleId: string) => {
    setResourceForm((prev) => ({
      ...prev,
      courseModules: prev.courseModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              resources: [...module.resources, createEmptyCourseResource()],
            }
          : module,
      ),
    }));
  }, []);

  const updateCourseModuleResource = React.useCallback(
    (
      moduleId: string,
      resourceId: string,
      field:
        | "title"
        | "description"
        | "contentType"
        | "url"
        | "durationLabel",
      value: string,
    ) => {
      setResourceForm((prev) => ({
        ...prev,
        courseModules: prev.courseModules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                resources: module.resources.map((resource) =>
                  resource.id === resourceId
                    ? {
                        ...resource,
                        [field]:
                          field === "contentType"
                            ? (value as CourseModuleResourceType)
                            : value,
                      }
                    : resource,
                ),
              }
            : module,
        ),
      }));
    },
    [],
  );

  const removeCourseModuleResource = React.useCallback(
    (moduleId: string, resourceId: string) => {
      setResourceForm((prev) => ({
        ...prev,
        courseModules: prev.courseModules.map((module) => {
          if (module.id !== moduleId) {
            return module;
          }

          const nextResources =
            module.resources.length <= 1
              ? [createEmptyCourseResource()]
              : module.resources.filter((resource) => resource.id !== resourceId);

          return {
            ...module,
            resources: nextResources,
          };
        }),
      }));
    },
    [],
  );

  const resourceSetupChecklist = React.useMemo(
    () => {
      const baseChecklist = [
        {
          label: "Título y categoría",
          ready: Boolean(resourceForm.title.trim() && resourceForm.category.trim()),
        },
        {
          label:
            editorKind === "course"
              ? "Activo principal o URL del curso"
              : "Activo o URL vinculada",
          ready:
            editorKind === "course"
              ? Boolean(
                  resourceForm.url.trim() ||
                    countCourseResources(resourceForm.courseModules) > 0,
                )
              : Boolean(resourceForm.url.trim()),
        },
        {
          label:
            editorKind === "course"
              ? "Módulos y recursos del curso"
              : "Mapa de competencias",
          ready:
            editorKind === "course"
              ? countCourseResources(resourceForm.courseModules) > 0
              : Boolean(
                  resourceForm.pillar &&
                    resourceForm.component &&
                    resourceForm.competency,
                ),
        },
        {
          label:
            editorKind === "course"
              ? "Tags y señales del curso"
              : "Tags de descubrimiento",
          ready: resourceForm.tags.length > 0,
        },
      ];

      if (editorKind === "course") {
        baseChecklist.splice(3, 0, {
          label: "Mapa de competencias",
          ready: Boolean(
            resourceForm.pillar &&
              resourceForm.component &&
              resourceForm.competency,
          ),
        });
      }

      return baseChecklist;
    },
    [
      editorKind,
      resourceForm.category,
      resourceForm.competency,
      resourceForm.component,
      resourceForm.courseModules,
      resourceForm.pillar,
      resourceForm.tags.length,
      resourceForm.title,
      resourceForm.url,
    ],
  );

  React.useEffect(() => {
    if (!isResourceModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("app-learning-editor-open");
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeResourceModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("app-learning-editor-open");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeResourceModal, isResourceModalOpen]);

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
              Recursos, cursos y workbooks en una sola ruta.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/82 md:text-base">
              {isOpenLeader
                ? "Explora recursos marcados como free y activa el programa para desbloquear la biblioteca completa, los cursos premium y los workbooks."
                : "Explora contenido conectado al mapa de competencias, retoma tus workbooks y sigue tu progreso sin salir de la experiencia."}
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
                cursos activos
              </span>
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90">
                {isOpenLeader
                  ? "Solo contenido free visible"
                  : `${workbooks.length} workbooks activos en catálogo`}
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
                {isOpenLeader
                  ? "Accede al contenido libre por formato, pilar o competencia."
                  : "Busca por formato, estado, pilar o competencia."}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--app-border)] bg-white/78 p-4">
              <div className="w-fit rounded-[14px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                <Layers3 size={18} />
              </div>
              <p className="mt-4 font-extrabold text-[var(--app-ink)]">
                Cursos estructurados
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {isOpenLeader
                  ? "Disponibles al activar el programa completo."
                  : "Acceso directo a cursos listos para navegar."}
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
                {isOpenLeader
                  ? "Los workbooks se habilitan cuando activas el programa."
                  : "Cada workbook refleja el avance real del usuario."}
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
            label: "Cursos",
            value: resources.filter(
              (resource) => resource.contentType === "scorm",
            ).length,
            hint: "Cursos estructurados disponibles",
          },
          {
            label: "Workbooks",
            value: workbooks.length,
            hint: isOpenLeader
              ? "Disponibles al activar plan 4Shine"
              : "Instancias únicas por líder",
          },
          {
            label: "Habilitados",
            value: workbooks.filter(
              (workbook) => workbook.accessState === "active",
            ).length,
            hint: isOpenLeader
              ? "La cuenta free no desbloquea workbooks"
              : "Editables hoy según cronograma",
          },
        ]}
      />

      {loading ? (
        <div className="app-panel p-6 text-sm text-[var(--app-muted)]">
          Cargando módulo...
        </div>
      ) : (
        <>
          {isOpenLeader && (
            <AccessOfferPanel
              badge="Acceso free"
              title="Tu biblioteca abierta ya está activa."
              description="Esta cuenta puede ver y comentar únicamente los recursos etiquetados como free. Para desbloquear la biblioteca completa, los cursos premium y los 10 workbooks del programa, activa 4Shine."
              products={programOffers}
              primaryAction={{
                href: "/dashboard",
                label: "Ver plan 4Shine",
              }}
              note="Los recursos gratuitos siguen disponibles desde esta misma vista. El upgrade suma contenido premium, workbooks únicos por usuario y continuidad completa del journey."
            />
          )}

          {isResourceManager && (
            <section className={panelClass}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <p className="app-section-kicker">Administración</p>
                  <h3
                    className="app-display-title mt-2 text-3xl font-semibold"
                    data-display-font="true"
                  >
                    Agrega recursos y cursos desde un editor completo.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                    Admin y gestor ahora crean recursos y cursos desde una
                    pantalla completa: carga directa a R2, listas desplegables,
                    sugerencias inteligentes, metadatos conectados al mapa
                    4Shine y estructura interna por módulos para los cursos.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="app-chip-soft">
                      <FileUp size={13} />
                      R2 conectado
                    </span>
                    <span className="app-chip-soft">
                      <Lightbulb size={13} />
                      Campos inteligentes
                    </span>
                    <span className="app-chip-soft">
                      <CheckCircle2 size={13} />
                      Metadatos listos para búsqueda y filtrado
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:min-w-[19rem]">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Publicados
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                        {publishedResourceCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Borradores
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                        {draftResourceCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Curados
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                        {recommendedResourceCount}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        Cursos
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                        {activeCourseCount}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="app-button-primary w-full"
                    onClick={openCreateResourceModal}
                  >
                    <Plus size={16} />
                    Abrir editor completo
                  </button>
                </div>
              </div>
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
                  Biblioteca individual + cursos
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {isOpenLeader
                    ? "Esta cuenta ve solo contenidos free. Los líderes suscritos y los iShiners acceden a la biblioteca completa; gestores y admins administran el catálogo."
                    : "Los líderes e iShiners pueden buscar, filtrar, visualizar y comentar. Los gestores y admins administran el catálogo."}
                </p>
              </div>

              {isResourceManager && (
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={openCreateResourceModal}
                >
                  <Plus size={16} />
                  Nuevo recurso o curso
                </button>
              )}
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
                      Cursos destacados
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
                            Curso
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
                        <span>
                          {resource.structurePayload.modules?.length ?? 0} módulos
                        </span>
                        <span>
                          {countCourseResources(
                            normalizeCourseModulesFromStructure(
                              resource.structurePayload,
                            ),
                          )}{" "}
                          recursos internos
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
                        {resource.contentType === "scorm" && (
                          <>
                            <span>
                              {resource.structurePayload.modules?.length ?? 0} módulos
                            </span>
                            <span>
                              {countCourseResources(
                                normalizeCourseModulesFromStructure(
                                  resource.structurePayload,
                                ),
                              )}{" "}
                              recursos internos
                            </span>
                          </>
                        )}
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

                      {selectedResource.contentType === "scorm" && (
                        <div className="rounded-[20px] border border-[var(--app-border)] bg-white/74 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="app-section-kicker">Estructura del curso</p>
                              <p className="mt-1 text-sm text-[var(--app-muted)]">
                                Módulos internos y recursos que componen la experiencia.
                              </p>
                            </div>
                            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-3 py-1 text-xs text-[var(--app-muted)]">
                              {selectedResource.structurePayload.modules?.length ?? 0} módulos
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {normalizeCourseModulesFromStructure(
                              selectedResource.structurePayload,
                            ).length > 0 ? (
                              normalizeCourseModulesFromStructure(
                                selectedResource.structurePayload,
                              ).map((module, moduleIndex) => (
                                <div
                                  key={module.id}
                                  className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                        Módulo {moduleIndex + 1}
                                      </p>
                                      <h5 className="mt-1 text-sm font-semibold text-[var(--app-ink)]">
                                        {module.title}
                                      </h5>
                                      {module.description && (
                                        <p className="mt-1 text-sm text-[var(--app-muted)]">
                                          {module.description}
                                        </p>
                                      )}
                                    </div>
                                    <span className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]">
                                      {module.resources.length} recursos
                                    </span>
                                  </div>

                                  <div className="mt-3 space-y-2">
                                    {module.resources.map((courseResource) => (
                                      <div
                                        key={courseResource.id}
                                        className="rounded-[14px] bg-white px-3 py-3"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-chip)] px-2.5 py-1 text-xs text-[var(--app-muted)]">
                                            {courseModuleResourceTypeLabel(
                                              courseResource.contentType,
                                            )}
                                          </span>
                                          {courseResource.durationLabel && (
                                            <span className="rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1 text-xs text-[var(--app-muted)]">
                                              {courseResource.durationLabel}
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-[var(--app-ink)]">
                                          {courseResource.title}
                                        </p>
                                        {courseResource.description && (
                                          <p className="mt-1 text-sm text-[var(--app-muted)]">
                                            {courseResource.description}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-[16px] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]">
                                Este curso aún no tiene módulos cargados.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="rounded-[20px] border border-[var(--app-border)] bg-white/74 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="app-section-kicker">Comentarios</p>
                            <p className="mt-1 text-sm text-[var(--app-muted)]">
                              Conversación sobre este contenido entre líderes,
                              iShiners y equipo gestor.
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
                  {isOpenLeader
                    ? "Workbooks del programa"
                    : "10 workbooks digitales del programa"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                  {isOpenLeader
                    ? "Los workbooks únicos por usuario se habilitan al activar el programa 4Shine."
                    : "Entra directo a cada workbook, continúa donde ibas y revisa tu avance real sincronizado por usuario."}
                </p>
              </div>
            </div>

            {isOpenLeader ? (
              <AccessOfferPanel
                badge="Programa 4Shine"
                title="Desbloquea los 10 workbooks del journey."
                description="Cada workbook es único por usuario y se libera según cronograma. Esta cuenta free no genera ni muestra instancias del programa hasta activar la suscripción."
                products={programOffers}
                primaryAction={{
                  href: "/dashboard",
                  label: "Desbloquear workbooks",
                }}
                note="Los workbooks también sincronizan progreso real con Trayectoria y Mentorías, por eso solo se crean para líderes con plan activo."
              />
            ) : (
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
            )}
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
                      Cursos
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

      {isResourceManager &&
        isResourceModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[220] bg-[linear-gradient(180deg,#fcfbff_0%,#f7f1ff_100%)]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              editingResourceId
                ? `Editar ${isCourseEditor ? "curso" : "recurso"} de aprendizaje`
                : `Crear ${isCourseEditor ? "curso" : "recurso"} de aprendizaje`
            }
            className="relative flex h-full w-full flex-col overflow-hidden"
          >
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmitResource}>
              <div
                className="border-b border-[var(--app-border)] bg-white/92 px-4 pb-4 pt-4 sm:px-6 lg:px-8"
                style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
              >
                <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="app-section-kicker">
                      {editingResourceId
                        ? `Edición de ${isCourseEditor ? "curso" : "recurso"}`
                        : `Nuevo ${isCourseEditor ? "curso" : "recurso"}`}
                    </p>
                    <h3
                      className="app-display-title mt-2 text-3xl font-semibold"
                      data-display-font="true"
                    >
                      {editingResourceId
                        ? `Edita y republica tu ${isCourseEditor ? "curso" : "recurso"}`
                        : `Crear ${isCourseEditor ? "curso" : "recurso"} de aprendizaje`}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                      {isCourseEditor
                        ? "Define la identidad del curso, su URL o paquete principal y la estructura interna por módulos y recursos."
                        : "Completa lo esencial, sube el archivo a R2 y usa los campos inteligentes para dejar el recurso listo para búsqueda, filtrado y recomendación."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="app-button-secondary"
                      onClick={() => closeResourceModal()}
                    >
                      <ArrowLeft size={16} />
                      Volver a Aprendizaje
                    </button>
                    <span className="app-chip-soft">
                      <Layers3 size={13} />
                      {isCourseEditor ? "Modo curso" : "Modo recurso"}
                    </span>
                    <span className="hidden sm:inline-flex app-chip-soft">
                      <FileUp size={13} />
                      {resourceTypeProfile.assetLabel}
                    </span>
                    <span className="hidden lg:inline-flex app-chip-soft">
                      <Lightbulb size={13} />
                      Presets por formato
                    </span>
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
                      onClick={() => closeResourceModal()}
                      aria-label="Cerrar editor"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mx-auto grid min-h-0 w-full max-w-[1540px] flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                  <div className="space-y-5">
                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-3">
                            <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                                Asistente IA de metadatos
                              </h4>
                              <p className="text-sm text-[var(--app-muted)]">
                                Usa OpenAI para sugerir metadatos editoriales y,
                                cuando detecta un enlace de YouTube, aprovecha la
                                YouTube Data API para leer título, descripción y
                                duración antes de clasificar.
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="app-chip-soft">
                              <Sparkles size={13} />
                              OpenAI
                            </span>
                            <span className="app-chip-soft">
                              <Link2 size={13} />
                              YouTube Data API
                            </span>
                            <span className="app-chip-soft">
                              <CheckCircle2 size={13} />
                              Sugerencias sobre el mapa 4Shine
                            </span>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[18rem]">
                          <button
                            type="button"
                            className="app-button-secondary w-full justify-center"
                            onClick={() => void onExtractMetadataWithAi()}
                            disabled={metadataAssistantLoading}
                          >
                            {metadataAssistantLoading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Sparkles size={16} />
                            )}
                            {metadataAssistantLoading
                              ? "Extrayendo metadatos..."
                              : "Extraer metadatos con IA"}
                          </button>
                          <p className="text-xs leading-relaxed text-[var(--app-muted)]">
                            Funciona mejor si ya pegaste una URL o escribiste un
                            título provisional. Si el enlace es de YouTube, la
                            lectura será más precisa.
                          </p>
                        </div>
                      </div>

                      {metadataAssistantResult ? (
                        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                          <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[rgba(95,52,113,0.14)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
                                {metadataAssistantResult.source.youtubeUsed
                                  ? "YouTube verificado"
                                  : "Sugerencia editorial IA"}
                              </span>
                              {metadataAssistantResult.suggestion.pillar && (
                                <span className="rounded-full border border-[rgba(95,52,113,0.14)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
                                  {getPillarLabelFromCode(
                                    metadataAssistantResult.suggestion.pillar,
                                  )}
                                </span>
                              )}
                              {metadataAssistantResult.suggestion.stage && (
                                <span className="rounded-full border border-[rgba(95,52,113,0.14)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
                                  {metadataAssistantResult.suggestion.stage}
                                </span>
                              )}
                            </div>
                            <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)]">
                              {metadataAssistantResult.editorialNote}
                            </p>
                            {metadataAssistantResult.source.youtubeWarning && (
                              <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {metadataAssistantResult.source.youtubeWarning}
                              </div>
                            )}
                          </div>

                          <div className="rounded-[20px] border border-[var(--app-border)] bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                              Qué completó
                            </p>
                            <div className="mt-3 space-y-2 text-sm text-[var(--app-muted)]">
                              <p>
                                <span className="font-semibold text-[var(--app-ink)]">
                                  Categoría:
                                </span>{" "}
                                {metadataAssistantResult.suggestion.category ||
                                  "Sin sugerencia"}
                              </p>
                              <p>
                                <span className="font-semibold text-[var(--app-ink)]">
                                  Tags:
                                </span>{" "}
                                {metadataAssistantResult.suggestion.tags.length > 0
                                  ? metadataAssistantResult.suggestion.tags.join(", ")
                                  : "Sin tags sugeridos"}
                              </p>
                              <p>
                                <span className="font-semibold text-[var(--app-ink)]">
                                  Duración:
                                </span>{" "}
                                {metadataAssistantResult.suggestion.durationLabel ||
                                  "Sin duración"}
                              </p>
                              {editorKind === "course" && (
                                <p>
                                  <span className="font-semibold text-[var(--app-ink)]">
                                    Módulos sugeridos:
                                  </span>{" "}
                                  {
                                    metadataAssistantResult.suggestion.courseModules
                                      .length
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-[20px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm leading-relaxed text-[var(--app-muted)]">
                          El asistente no publica ni reemplaza tu criterio
                          editorial: propone un punto de partida para acelerar
                          título, descripción, clasificación, tags y metadatos
                          del mapa 4Shine.
                        </div>
                      )}
                    </section>

                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                          <Lightbulb size={18} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                            Identidad del {isCourseEditor ? "curso" : "recurso"}
                          </h4>
                          <p className="text-sm text-[var(--app-muted)]">
                            {isCourseEditor
                              ? "Define el encuadre editorial, el estado y la intención del curso."
                              : "Define el tipo, el encuadre editorial y el estado del recurso."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                          <label className="app-field-label">Tipo de pieza</label>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                                !isCourseEditor
                                  ? "border-[#5a2f6b] bg-[rgba(90,47,107,0.08)] text-[var(--app-ink)]"
                                  : "border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                              }`}
                              onClick={() => onChangeEditorKind("resource")}
                            >
                              <p className="text-sm font-semibold">Recurso</p>
                              <p className="mt-1 text-sm leading-relaxed">
                                Video, documento, pódcast, artículo o pieza individual.
                              </p>
                            </button>
                            <button
                              type="button"
                              className={`rounded-[20px] border px-4 py-4 text-left transition ${
                                isCourseEditor
                                  ? "border-[#5a2f6b] bg-[rgba(90,47,107,0.08)] text-[var(--app-ink)]"
                                  : "border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                              }`}
                              onClick={() => onChangeEditorKind("course")}
                            >
                              <p className="text-sm font-semibold">Curso</p>
                              <p className="mt-1 text-sm leading-relaxed">
                                Experiencia estructurada con módulos y recursos internos.
                              </p>
                            </button>
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="app-field-label">
                            Título del {isCourseEditor ? "curso" : "recurso"}
                          </label>
                          <input
                            className="app-input"
                            placeholder={
                              isCourseEditor
                                ? "Ej. Curso de conversaciones de liderazgo con impacto"
                                : "Ej. Comunicación ejecutiva en conversaciones difíciles"
                            }
                            value={resourceForm.title}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                title: event.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        {!isCourseEditor ? (
                          <div>
                            <label className="app-field-label">Formato</label>
                            <select
                              className="app-select"
                              value={resourceForm.contentType}
                              onChange={(event) =>
                                onChangeResourceContentType(
                                  event.target.value as ContentType,
                                )
                              }
                            >
                              {RESOURCE_TYPE_OPTIONS.filter((type) => type !== "scorm").map((type) => (
                                <option key={type} value={type}>
                                  {contentTypeLabel(type)}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="app-field-label">Formato del curso</label>
                            <div className="app-input flex items-center">
                              Curso estructurado
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="app-field-label">Estado editorial</label>
                          <select
                            className="app-select"
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
                        </div>

                        <div>
                          <label className="app-field-label">Categoría</label>
                          <select
                            className="app-select"
                            value={
                              resourceCategoryMode === "custom"
                                ? "__custom"
                                : resourceForm.category
                            }
                            onChange={(event) =>
                              onSelectResourceCategory(event.target.value)
                            }
                          >
                            <option value="">Selecciona una categoría</option>
                            {categoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value="__custom">Otra categoría</option>
                          </select>
                        </div>

                        <div>
                          <label className="app-field-label">Duración visible</label>
                          <input
                            className="app-input"
                            placeholder="Ej. 12 min"
                            value={resourceForm.durationLabel}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                durationLabel: event.target.value,
                              }))
                            }
                          />
                        </div>

                        {resourceCategoryMode === "custom" && (
                          <div className="lg:col-span-2">
                            <label className="app-field-label">
                              Nueva categoría
                            </label>
                            <input
                              className="app-input"
                              placeholder="Define una categoría propia"
                              value={customCategoryDraft}
                              onChange={(event) => {
                                setCustomCategoryDraft(event.target.value);
                                setResourceForm((prev) => ({
                                  ...prev,
                                  category: event.target.value,
                                }));
                              }}
                            />
                          </div>
                        )}

                        <div className="lg:col-span-2">
                          <div className="flex flex-wrap gap-2">
                            {resourceTypeProfile.categoryPresets.map((category) => (
                              <button
                                key={category}
                                type="button"
                                className="app-chip-soft transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]"
                                onClick={() => onSelectResourceCategory(category)}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {resourceTypeProfile.durationPresets.map((duration) => (
                              <button
                                key={duration}
                                type="button"
                                className="app-chip-soft transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-ink)]"
                                onClick={() =>
                                  setResourceForm((prev) => ({
                                    ...prev,
                                    durationLabel: duration,
                                  }))
                                }
                              >
                                {duration}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                        <label className="app-field-label">
                          Descripción y contexto de uso
                        </label>
                        <textarea
                          className="app-textarea"
                          placeholder={
                            isCourseEditor
                              ? "Explica qué recorrido propone este curso, qué resultados habilita y cómo se integra con la experiencia del líder."
                              : "Explica cuándo conviene usar este recurso, qué transforma y cómo se conecta con la experiencia del líder."
                          }
                          value={resourceForm.description}
                          onChange={(event) =>
                            setResourceForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <label className="lg:col-span-2 flex items-center gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-ink)]">
                          <input
                            type="checkbox"
                            checked={resourceForm.isRecommended}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                isRecommended: event.target.checked,
                              }))
                            }
                          />
                          {isCourseEditor
                            ? "Marcar como curso recomendado dentro del catálogo"
                            : "Marcar como recurso recomendado dentro del catálogo"}
                        </label>
                      </div>
                    </section>

                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                          <FileUp size={18} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                            {isCourseEditor
                              ? "Curso, paquete o URL de lanzamiento"
                              : "Archivo o URL del recurso"}
                          </h4>
                          <p className="text-sm text-[var(--app-muted)]">
                            {isCourseEditor
                              ? "Carga el activo principal a R2 o pega la URL de acceso del curso."
                              : "Carga el activo a R2 o pega la URL final del recurso."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div>
                          <label className="app-field-label">
                            {resourceTypeProfile.assetLabel}
                          </label>
                          <input
                            className="app-input"
                            placeholder={resourceTypeProfile.urlPlaceholder}
                            value={resourceForm.url}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                url: event.target.value,
                              }))
                            }
                          />
                          <p className="mt-2 text-sm text-[var(--app-muted)]">
                            {resourceTypeProfile.uploadHelp}
                          </p>
                        </div>

                        <div className="flex items-end">
                          <R2UploadButton
                            moduleCode="aprendizaje"
                            action={editingResourceId ? "update" : "create"}
                            entityTable="app_learning.content_items"
                            fieldName="url"
                            pathPrefix={`aprendizaje/recursos/${resourceForm.contentType}`}
                            accept={resourceTypeProfile.accept}
                            buttonLabel={resourceTypeProfile.uploadLabel}
                            className="app-button-secondary min-w-[14rem]"
                            onUploaded={(url, payload) => {
                              setUploadedResourceAsset(payload);
                              setResourceForm((prev) => ({
                                ...prev,
                                url,
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                        {uploadedResourceAsset ? (
                          <div className="flex flex-col gap-2 text-sm text-[var(--app-muted)]">
                            <div className="flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              Archivo cargado en R2
                            </div>
                            <p>{uploadedResourceAsset.fileName}</p>
                            <p>
                              {formatFileSize(uploadedResourceAsset.size)} ·{" "}
                              {uploadedResourceAsset.contentType}
                            </p>
                            <a
                              href={uploadedResourceAsset.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f2360] transition hover:text-[#3d194a]"
                            >
                              <Link2 size={14} />
                              Ver activo cargado
                            </a>
                          </div>
                        ) : resourceForm.url ? (
                          <div className="flex flex-col gap-2 text-sm text-[var(--app-muted)]">
                            <div className="flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                              <Link2 size={16} />
                              Recurso vinculado
                            </div>
                            <p className="break-all">{resourceForm.url}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--app-muted)]">
                            Aún no hay un activo vinculado. Puedes dejarlo en
                            borrador y terminar luego, o subir{" "}
                            {isCourseEditor ? "el activo principal" : "el archivo"}{" "}
                            ahora mismo.
                          </p>
                        )}
                      </div>
                    </section>

                    {isCourseEditor && (
                      <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                              <Layers3 size={18} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                                Estructura interna del curso
                              </h4>
                              <p className="text-sm text-[var(--app-muted)]">
                                Organiza el curso por módulos y agrega los recursos
                                que componen cada tramo de la experiencia.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="app-button-secondary"
                            onClick={addCourseModule}
                          >
                            <Plus size={16} />
                            Agregar módulo
                          </button>
                        </div>

                        <div className="mt-5 space-y-4">
                          {resourceForm.courseModules.map((module, moduleIndex) => (
                            <div
                              key={module.id}
                              className="rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                    Módulo {moduleIndex + 1}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                                    {module.resources.length} recursos internos en este módulo.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="app-button-ghost"
                                  onClick={() => removeCourseModule(module.id)}
                                >
                                  <Trash2 size={15} />
                                  Eliminar módulo
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <div>
                                  <label className="app-field-label">Título del módulo</label>
                                  <input
                                    className="app-input"
                                    placeholder="Ej. Módulo 1 · Preparar la conversación"
                                    value={module.title}
                                    onChange={(event) =>
                                      updateCourseModule(
                                        module.id,
                                        "title",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="app-field-label">Descripción del módulo</label>
                                  <input
                                    className="app-input"
                                    placeholder="Propósito, foco o resultado esperado"
                                    value={module.description ?? ""}
                                    onChange={(event) =>
                                      updateCourseModule(
                                        module.id,
                                        "description",
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="mt-5 space-y-3">
                                {module.resources.map((courseResource, resourceIndex) => (
                                  <div
                                    key={courseResource.id}
                                    className="rounded-[18px] border border-[var(--app-border)] bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                          Recurso {resourceIndex + 1}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        className="app-button-ghost"
                                        onClick={() =>
                                          removeCourseModuleResource(
                                            module.id,
                                            courseResource.id,
                                          )
                                        }
                                      >
                                        <Trash2 size={15} />
                                        Eliminar recurso
                                      </button>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                      <div className="lg:col-span-2">
                                        <label className="app-field-label">Título del recurso interno</label>
                                        <input
                                          className="app-input"
                                          placeholder="Ej. Video de introducción"
                                          value={courseResource.title}
                                          onChange={(event) =>
                                            updateCourseModuleResource(
                                              module.id,
                                              courseResource.id,
                                              "title",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div>
                                        <label className="app-field-label">Tipo</label>
                                        <select
                                          className="app-select"
                                          value={courseResource.contentType}
                                          onChange={(event) =>
                                            updateCourseModuleResource(
                                              module.id,
                                              courseResource.id,
                                              "contentType",
                                              event.target.value,
                                            )
                                          }
                                        >
                                          {COURSE_MODULE_RESOURCE_TYPE_OPTIONS.map((type) => (
                                            <option key={type} value={type}>
                                              {courseModuleResourceTypeLabel(type)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="app-field-label">Duración</label>
                                        <input
                                          className="app-input"
                                          placeholder="Ej. 8 min"
                                          value={courseResource.durationLabel ?? ""}
                                          onChange={(event) =>
                                            updateCourseModuleResource(
                                              module.id,
                                              courseResource.id,
                                              "durationLabel",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="lg:col-span-2">
                                        <label className="app-field-label">URL o activo del recurso</label>
                                        <input
                                          className="app-input"
                                          placeholder="https://..."
                                          value={courseResource.url ?? ""}
                                          onChange={(event) =>
                                            updateCourseModuleResource(
                                              module.id,
                                              courseResource.id,
                                              "url",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="lg:col-span-2">
                                        <label className="app-field-label">Nota contextual</label>
                                        <input
                                          className="app-input"
                                          placeholder="Explica cómo se usa dentro del módulo"
                                          value={courseResource.description ?? ""}
                                          onChange={(event) =>
                                            updateCourseModuleResource(
                                              module.id,
                                              courseResource.id,
                                              "description",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4">
                                <button
                                  type="button"
                                  className="app-button-secondary"
                                  onClick={() => addCourseModuleResource(module.id)}
                                >
                                  <Plus size={16} />
                                  Agregar recurso al módulo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(55,32,80,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[#4f2360]">
                          <Layers3 size={18} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                            Metadatos del mapa 4Shine
                          </h4>
                          <p className="text-sm text-[var(--app-muted)]">
                            Usa listas dependientes para conectar{" "}
                            {isCourseEditor ? "el curso" : "el recurso"} con la
                            taxonomía oficial.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                          <label className="app-field-label">Pilar 4Shine</label>
                          <select
                            className="app-select"
                            value={resourceForm.pillar}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                pillar: event.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona un pilar</option>
                            {COMPETENCY_PILLAR_OPTIONS.map((pillar) => (
                              <option key={pillar.value} value={pillar.value}>
                                {pillar.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="app-field-label">Componente</label>
                          <select
                            className="app-select"
                            value={resourceForm.component}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                component: event.target.value,
                              }))
                            }
                            disabled={componentOptions.length === 0}
                          >
                            <option value="">Selecciona un componente</option>
                            {componentOptions.map((component) => (
                              <option key={component.value} value={component.value}>
                                {component.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="app-field-label">Competencia</label>
                          <select
                            className="app-select"
                            value={resourceForm.competency}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                competency: event.target.value,
                              }))
                            }
                            disabled={competencyOptions.length === 0}
                          >
                            <option value="">Selecciona una competencia</option>
                            {competencyOptions.map((competency) => (
                              <option
                                key={competency.value}
                                value={competency.value}
                              >
                                {competency.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="app-field-label">Etapa del programa</label>
                          <select
                            className="app-select"
                            value={resourceForm.stage}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                stage: event.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona una etapa</option>
                            {stageOptions.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="app-field-label">Audiencia principal</label>
                          <select
                            className="app-select"
                            value={resourceForm.audience}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                audience: event.target.value,
                              }))
                            }
                          >
                            {audienceOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                        {resourceObservableBehaviors.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2 font-semibold text-[var(--app-ink)]">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              Conductas observables vinculadas
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-[var(--app-muted)]">
                              {resourceObservableBehaviors
                                .slice(0, 4)
                                .map((behavior) => (
                                  <li key={behavior} className="flex gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7d5a92]" />
                                    <span>{behavior}</span>
                                  </li>
                                ))}
                            </ul>
                            {resourceObservableBehaviors.length > 4 && (
                              <p className="mt-3 text-xs font-medium text-[var(--app-muted)]">
                                +{resourceObservableBehaviors.length - 4} conductas
                                adicionales en el mapa oficial.
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-[var(--app-ink)]">
                              Mapa 4Shine aún incompleto
                            </p>
                            <p className="mt-2 text-sm text-[var(--app-muted)]">
                              Selecciona pilar, componente y competencia para
                              conectar {isCourseEditor ? "el curso" : "el recurso"}{" "}
                              con la taxonomía oficial.
                            </p>
                          </>
                        )}
                      </div>
                    </section>

                    <ResourceTagComposer
                      tags={resourceForm.tags}
                      draft={resourceTagDraft}
                      suggestions={smartTagSuggestions.slice(0, 12)}
                      onDraftChange={setResourceTagDraft}
                      onAddTag={addTagToResourceForm}
                      onRemoveTag={removeTagFromResourceForm}
                    />
                  </div>
                </div>

                <aside className="min-h-0 overflow-y-auto border-t border-[var(--app-border)] bg-[rgba(252,249,255,0.96)] px-4 py-5 xl:border-l xl:border-t-0 sm:px-6 lg:px-7 lg:py-6">
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-[rgba(95,52,113,0.12)] bg-[linear-gradient(135deg,rgba(81,40,95,0.96),rgba(121,76,145,0.92),rgba(243,183,209,0.9))] p-5 text-white shadow-[0_22px_40px_rgba(55,32,80,0.14)]">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-white/72">
                        Vista rápida
                      </p>
                      <h4 className="mt-3 text-2xl font-semibold leading-tight">
                        {resourceForm.title.trim() ||
                          (isCourseEditor
                            ? "Tu curso todavía no tiene título"
                            : "Tu recurso todavía no tiene título")}
                      </h4>
                      <p className="mt-3 text-sm leading-relaxed text-white/80">
                        {resourceForm.description.trim() ||
                          (isCourseEditor
                            ? "Aquí verás una lectura rápida del curso mientras completas su estructura, metadatos y acceso."
                            : "Aquí verás una lectura rápida del recurso mientras completas el formulario.")}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                          {contentTypeLabel(resourceForm.contentType)}
                        </span>
                        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                          {resourceForm.category || "Categoría pendiente"}
                        </span>
                        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                          {statusLabel(resourceForm.status)}
                        </span>
                        {isCourseEditor && (
                          <>
                            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                              {resourceForm.courseModules.length} módulos
                            </span>
                            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                              {currentCourseResourceCount} recursos internos
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isCourseEditor && (
                      <div className="rounded-[24px] border border-[var(--app-border)] bg-white/90 p-5">
                        <div className="flex items-center gap-2">
                          <Layers3 size={18} className="text-[#5f3471]" />
                          <h4 className="font-semibold text-[var(--app-ink)]">
                            Resumen del curso
                          </h4>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                              Módulos
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                              {resourceForm.courseModules.length}
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                              Recursos internos
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                              {currentCourseResourceCount}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)]">
                          Diseña el curso como una ruta clara: cada módulo debe
                          resolver un tramo concreto y cada recurso debe tener un
                          propósito visible.
                        </p>
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[var(--app-border)] bg-white/90 p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <h4 className="font-semibold text-[var(--app-ink)]">
                          Checklist de publicación
                        </h4>
                      </div>
                      <div className="mt-4 space-y-3">
                        {resourceSetupChecklist.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3"
                          >
                            <span className="text-sm font-medium text-[var(--app-ink)]">
                              {item.label}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.ready
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-[var(--app-border)] bg-white text-[var(--app-muted)]"
                              }`}
                            >
                              {item.ready ? "Listo" : "Pendiente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[var(--app-border)] bg-white/90 p-5">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-[#5f3471]" />
                        <h4 className="font-semibold text-[var(--app-ink)]">
                          Recomendación editorial
                        </h4>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
                        {resourceTypeProfile.description}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
                        {resourceForm.stage
                          ? `Este ${isCourseEditor ? "curso" : "recurso"} quedará asociado a ${resourceForm.stage} y podrá ser descubierto por audiencia ${audienceOptions.find((option) => option.value === resourceForm.audience)?.label ?? resourceForm.audience}.`
                          : "Agrega una etapa del programa para ordenar mejor el contenido dentro de la experiencia."}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              <div
                className="border-t border-[var(--app-border)] bg-white/94 px-4 py-4 sm:px-6 lg:px-8"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-[var(--app-muted)]">
                    {isCourseEditor
                      ? "Puedes dejar el curso en borrador y retomarlo más tarde. Si lo publicas ahora, asegúrate de tener acceso, estructura y metadatos completos."
                      : "Puedes dejar el recurso en borrador y retomarlo más tarde. Si lo publicas ahora, asegúrate de tener activo y metadatos completos."}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="app-button-secondary"
                      onClick={() => closeResourceModal()}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingResource}
                      className="app-button-primary disabled:opacity-60"
                    >
                      {editingResourceId ? <Save size={16} /> : <Plus size={16} />}
                      {submittingResource
                        ? "Guardando..."
                        : editingResourceId
                          ? "Guardar cambios"
                          : isCourseEditor
                            ? "Crear curso"
                            : "Crear recurso"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
