"use client";

// LearningCourseEditor — wizard de creación/edición de cursos y recursos.
//
// Originalmente vivía dentro de /dashboard/aprendizaje/page.tsx. Se extrajo
// como componente reutilizable para servir también /dashboard/formacion-mentores
// con la MISMA UX (4 pasos, asistente IA, mapa 4Shine, módulos internos,
// certificados, tags, R2/SCORM upload).
//
// Lo único que cambia entre scopes es:
//   - el scope que se manda al guardar (createContent/updateContent)
//   - el label del botón "Volver a ..." (vía prop backLabel)
//   - el pathPrefix de los uploads a R2 (derivado del scope)
//   - el moduleCode usado en R2UploadButton (derivado del scope)
//
// El parent controla cuándo abrir y qué recurso editar; el editor maneja
// internamente todo el estado del wizard, la IA, los módulos del curso, etc.

import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  FileUp,
  Layers3,
  Lightbulb,
  Link2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { ActivityPicker } from "@/components/aprendizaje/ActivityPicker";
import { AssignmentPicker } from "@/components/aprendizaje/AssignmentPicker";
import { R2UploadButton } from "@/components/ui/R2UploadButton";
import { ScormUploadButton } from "@/components/ui/ScormUploadButton";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import {
  extractLearningMetadataWithAi,
  type CertificateTemplateRecord,
  type LearningMetadataAssistantResult,
  type LearningResourceRecord,
  type LearningScope,
} from "@/features/aprendizaje/client";
import {
  LEARNING_AUDIENCE_OPTIONS,
  LEARNING_PROGRAM_STAGE_OPTIONS,
} from "@/features/aprendizaje/metadata-assistant";
import {
  createContent,
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
import type { ModuleCode } from "@/lib/permissions";

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type ResourceEditorKind = "resource" | "course";

export interface LearningCourseEditorProps {
  /** Si está cerrado no se renderiza nada (no se monta el portal). */
  open: boolean;
  /** Scope donde se creará/actualizará el contenido. */
  scope: LearningScope;
  /** Recurso a editar; null/undefined = modo creación. */
  editingResource?: LearningResourceRecord | null;
  /** Modo inicial cuando es creación (resource | course). Default: "resource". */
  initialKind?: ResourceEditorKind;
  /** Catálogo actual (para sugerencias de categoría/etapa/tags). */
  resources: LearningResourceRecord[];
  /** Plantillas de certificado disponibles. */
  certificateTemplates: CertificateTemplateRecord[];
  /** True si el rol tiene permisos de gestión (gestor/admin). */
  isResourceManager: boolean;
  /** Label del botón "volver" del header (ej. "Volver a Aprendizaje"). */
  backLabel?: string;
  /** Se llama cuando se cierra el editor (cancelar o tras guardar). */
  onClose: () => void;
  /** Se llama tras guardar OK. El parent recarga su lista y refresca bootstrap. */
  onSaved: () => void;
}

// ─── Constantes editor-only ──────────────────────────────────────────────────

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

type LibraryLocationOption = "contenidos_libres" | "cursos";

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
  thumbnailUrl: string;
  isRecommended: boolean;
  showInLibrary: boolean;
  libraryLocation: LibraryLocationOption;
  courseModules: CourseModule[];
  certificateTemplateId: string | null;
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
  thumbnailUrl: "",
  isRecommended: false,
  showInLibrary: true,
  libraryLocation: "contenidos_libres",
  courseModules: [],
  certificateTemplateId: null,
};

type ResourceEditorStepKey =
  | "identity"
  | "asset"
  | "taxonomy"
  | "discovery";

interface ResourceEditorStepItem {
  key: ResourceEditorStepKey;
  title: string;
  description: string;
  ready: boolean;
}

const COURSE_MODULE_RESOURCE_TYPE_OPTIONS: CourseModuleResourceType[] = [
  "video",
  "pdf",
  "article",
  "podcast",
  "html",
  "ppt",
  "link",
  "activity",
  "assignment",
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
    categoryPresets: ["Masterclass", "Cápsula", "Tutorial", "Caso práctico"],
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
  activity: {
    description: "Quiz o evaluación auto-calificada. Sin video/PDF — el contenido es la actividad misma.",
    assetLabel: "Actividad (configura en Contenido)",
    uploadLabel: "",
    uploadHelp: "Las preguntas se configuran desde Contenido → botón Actividad. Aquí solo defines metadatos.",
    urlPlaceholder: "",
    accept: "",
    categoryPresets: ["Quiz", "Evaluación", "Práctica"],
    durationPresets: ["5 min", "10 min", "15 min", "20 min"],
    tagPresets: ["quiz", "evaluacion", "practica"],
  },
  assignment: {
    description: "Tarea o entrega del líder. Sube archivos o URL para revisión y calificación por adviser/gestor/admin.",
    assetLabel: "Tarea (configura en Contenido)",
    uploadLabel: "",
    uploadHelp: "Las instrucciones, criterios y formatos aceptados se configuran desde Contenido → botón Tarea.",
    urlPlaceholder: "",
    accept: "",
    categoryPresets: ["Tarea", "Proyecto", "Entrega"],
    durationPresets: ["30 min", "1 h", "2 h", "1 día", "1 semana"],
    tagPresets: ["tarea", "proyecto", "entrega"],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
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

function getContentTypeAccept(type: ContentType): string {
  return CONTENT_TYPE_EXPERIENCE[type]?.accept || "*/*";
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
  if (!structurePayload || !Array.isArray(structurePayload.modules)) return [];

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
    (total, module) =>
      total + (module.resources?.filter((resource) => resource.title.trim().length > 0).length ?? 0),
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

function createInitialResourceForm(
  kind: ResourceEditorKind = "resource",
): ResourceFormState {
  if (kind === "course") {
    return {
      ...EMPTY_RESOURCE_FORM,
      contentType: "scorm",
      category: CONTENT_TYPE_EXPERIENCE.scorm.categoryPresets[0] ?? "",
      durationLabel: CONTENT_TYPE_EXPERIENCE.scorm.durationPresets[0] ?? "",
      libraryLocation: "cursos",
      courseModules: [createEmptyCourseModule()],
    };
  }

  return { ...EMPTY_RESOURCE_FORM, courseModules: [] };
}

// El módulo de permisos donde se guarda el contenido depende del scope.
// Aprendizaje usa el módulo `aprendizaje`; formación de advisers usa
// `formacion_mentores`. Esto afecta los R2 uploads y el path donde se
// guardan los assets.
function moduleCodeForScope(scope: LearningScope): ModuleCode {
  return scope === "formacion_mentores" ? "formacion_mentores" : "aprendizaje";
}

function r2PathPrefixForScope(scope: LearningScope): string {
  return scope === "formacion_mentores" ? "formacion-mentores" : "aprendizaje";
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

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
                className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--app-ink)]"
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

function LearningEditorStepNav({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: ResourceEditorStepItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(index)}
            className={`min-w-[13rem] rounded-[20px] border px-4 py-3 text-left transition ${
              isActive
                ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                : "border-[var(--app-border)] bg-white/84 hover:border-[var(--app-border-strong)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  step.ready
                    ? "bg-emerald-100 text-emerald-700"
                    : isActive
                      ? "bg-[var(--brand-primary)] text-white"
                      : "bg-[var(--app-surface-muted)] text-[var(--app-muted)]"
                }`}
              >
                {step.ready ? <CheckCircle2 size={14} /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  {step.title}
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-[var(--app-muted)]">
                  {step.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LearningEditorSupportRail({
  isCourseEditor,
  title,
  description,
  contentType,
  category,
  status,
  courseModuleCount,
  courseResourceCount,
  checklist,
  editorialDescription,
  stageLabel,
  audienceLabel,
}: {
  isCourseEditor: boolean;
  title: string;
  description: string;
  contentType: ContentType;
  category: string;
  status: ContentStatus;
  courseModuleCount: number;
  courseResourceCount: number;
  checklist: Array<{ label: string; ready: boolean }>;
  editorialDescription: string;
  stageLabel: string;
  audienceLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-[24px] border p-5 text-white"
        style={{
          borderColor: "var(--brand-border)",
          background:
            "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-primary) 60%, var(--brand-accent) 100%)",
          boxShadow: "0 22px 40px rgba(0,0,0,0.14)",
        }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/72">
          Vista rápida
        </p>
        <h4 className="mt-3 text-2xl font-semibold leading-tight">
          {title.trim() ||
            (isCourseEditor
              ? "Tu curso todavía no tiene título"
              : "Tu recurso todavía no tiene título")}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          {description.trim() ||
            (isCourseEditor
              ? "Aquí verás una lectura rápida del curso mientras completas estructura, metadatos y acceso."
              : "Aquí verás una lectura rápida del recurso mientras completas la configuración.")}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
            {contentTypeLabel(contentType)}
          </span>
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
            {category || "Categoría pendiente"}
          </span>
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
            {statusLabel(status)}
          </span>
          {isCourseEditor && (
            <>
              <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                {courseModuleCount} módulos
              </span>
              <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                {courseResourceCount} recursos internos
              </span>
            </>
          )}
        </div>
      </div>

      {isCourseEditor && (
        <div className="rounded-[24px] border border-[var(--app-border)] bg-white/90 p-5">
          <div className="flex items-center gap-2">
            <Layers3 size={18} className="text-[var(--brand-primary)]" />
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
                {courseModuleCount}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Recursos internos
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[var(--app-ink)]">
                {courseResourceCount}
              </p>
            </div>
          </div>
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
          {checklist.map((item) => (
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
          <Lightbulb size={18} className="text-[var(--brand-primary)]" />
          <h4 className="font-semibold text-[var(--app-ink)]">
            Recomendación editorial
          </h4>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
          {editorialDescription}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
          {stageLabel
            ? `Quedará asociado a ${stageLabel} y se descubrirá para audiencia ${audienceLabel}.`
            : "Agrega etapa del programa y audiencia para que este contenido aparezca en el momento correcto."}
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function LearningCourseEditor({
  open,
  scope,
  editingResource,
  initialKind = "resource",
  resources,
  certificateTemplates,
  isResourceManager,
  backLabel = "Volver a Aprendizaje",
  onClose,
  onSaved,
}: LearningCourseEditorProps) {
  const { alert } = useAppDialog();
  const editingResourceId = editingResource?.contentId ?? null;
  const moduleCode = moduleCodeForScope(scope);
  const r2PathScopePrefix = r2PathPrefixForScope(scope);

  const [resourceForm, setResourceForm] = React.useState<ResourceFormState>(
    EMPTY_RESOURCE_FORM,
  );
  const [submittingResource, setSubmittingResource] = React.useState(false);
  const [resourceTagDraft, setResourceTagDraft] = React.useState("");
  const [resourceCategoryMode, setResourceCategoryMode] = React.useState<
    "preset" | "custom"
  >("preset");
  const [customCategoryDraft, setCustomCategoryDraft] = React.useState("");
  const [uploadedResourceAsset, setUploadedResourceAsset] =
    React.useState<R2UploadResponse | null>(null);
  const [coursePackageKind, setCoursePackageKind] = React.useState<
    "scorm" | "html"
  >("scorm");
  const [metadataAssistantResult, setMetadataAssistantResult] =
    React.useState<LearningMetadataAssistantResult | null>(null);
  const [metadataAssistantLoading, setMetadataAssistantLoading] =
    React.useState(false);
  const [resourceEditorStepIndex, setResourceEditorStepIndex] =
    React.useState(0);

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

  // ── Bootstrap del formulario al abrir ──
  // - Si hay editingResource: popula desde el record.
  // - Si no: arranca limpio según initialKind.
  // Se ejecuta cuando cambia el id (no en cada render).
  React.useEffect(() => {
    if (!open) return;
    if (editingResource) {
      const knownCategory = uniqueStrings([
        ...CONTENT_TYPE_EXPERIENCE[editingResource.contentType].categoryPresets,
        ...resources.map((item) => item.category),
      ]).some((category) => category === editingResource.category);

      setResourceForm({
        title: editingResource.title,
        category: editingResource.category,
        contentType: editingResource.contentType,
        url: editingResource.url ?? "",
        description: editingResource.description ?? "",
        durationLabel: editingResource.durationLabel ?? "",
        status: editingResource.status,
        tags: editingResource.tags,
        pillar: editingResource.competencyMetadata.pillar ?? "",
        component:
          editingResource.competencyMetadata.component ??
          editingResource.competencyMetadata.skill ??
          "",
        competency: editingResource.competencyMetadata.competency ?? "",
        stage: editingResource.competencyMetadata.stage ?? "",
        audience: editingResource.competencyMetadata.audience ?? "lider",
        thumbnailUrl: editingResource.thumbnailUrl ?? "",
        isRecommended: editingResource.isRecommended,
        showInLibrary: editingResource.showInLibrary ?? true,
        libraryLocation:
          editingResource.libraryLocation === "cursos" ? "cursos" : "contenidos_libres",
        courseModules: normalizeCourseModulesFromStructure(
          editingResource.structurePayload,
        ),
        certificateTemplateId: editingResource.certificateTemplateId ?? null,
      });
      setResourceTagDraft("");
      setCustomCategoryDraft(knownCategory ? "" : editingResource.category);
      setResourceCategoryMode(knownCategory ? "preset" : "custom");
    } else {
      setResourceForm(createInitialResourceForm(initialKind));
      setResourceTagDraft("");
      setResourceCategoryMode("preset");
      setCustomCategoryDraft("");
    }
    setUploadedResourceAsset(null);
    setMetadataAssistantResult(null);
    setResourceEditorStepIndex(0);
    // Solo queremos re-bootstrappear al abrir o al cambiar de record concreto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingResourceId, initialKind]);

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

  // Cascade: si cambia el pilar, limpiar componente/competencia inválidos.
  React.useEffect(() => {
    if (!resourceForm.pillar) {
      if (resourceForm.component || resourceForm.competency) {
        setResourceForm((prev) => ({ ...prev, component: "", competency: "" }));
      }
      return;
    }

    if (
      resourceForm.component &&
      !componentOptions.some((option) => option.value === resourceForm.component)
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
        ...resources.flatMap((resource) => resource.tags).slice(0, 20),
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

  const currentCourseResourceCount = countCourseResources(
    resourceForm.courseModules,
  );
  const currentAudienceLabel =
    audienceOptions.find((option) => option.value === resourceForm.audience)
      ?.label ?? resourceForm.audience;

  // ── Callbacks del formulario ──

  const buildResourcePayload = React.useCallback(
    () => ({
      scope,
      title: resourceForm.title.trim(),
      category: resourceForm.category.trim(),
      contentType: resourceForm.contentType,
      url: resourceForm.url.trim() || null,
      description: resourceForm.description.trim() || null,
      durationLabel: resourceForm.durationLabel.trim() || null,
      status: resourceForm.status,
      thumbnailUrl: resourceForm.thumbnailUrl.trim() || null,
      isRecommended: resourceForm.isRecommended,
      showInLibrary: resourceForm.showInLibrary,
      libraryLocation: resourceForm.libraryLocation,
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
      certificateTemplateId:
        editorKind === "course" ? resourceForm.certificateTemplateId : undefined,
    }),
    [
      editorKind,
      resourceForm.audience,
      resourceForm.category,
      resourceForm.certificateTemplateId,
      resourceForm.competency,
      resourceForm.component,
      resourceForm.contentType,
      resourceForm.courseModules,
      resourceForm.description,
      resourceForm.durationLabel,
      resourceForm.isRecommended,
      resourceForm.showInLibrary,
      resourceForm.libraryLocation,
      resourceForm.pillar,
      resourceForm.stage,
      resourceForm.status,
      resourceForm.tags,
      resourceForm.thumbnailUrl,
      resourceForm.title,
      resourceForm.url,
      scope,
    ],
  );

  const onSubmitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isResourceManager) return;
    if (!resourceForm.title.trim() || !resourceForm.category.trim()) {
      await alert({
        title: "Completa los datos base",
        message: "Agrega al menos un título y una categoría para poder guardar el recurso.",
        tone: "warning",
      });
      return;
    }
    const hasCourseStructure =
      countCourseResources(resourceForm.courseModules) > 0;
    const hasScormPackage =
      editorKind === "course" &&
      resourceForm.contentType === "scorm" &&
      Boolean(resourceForm.url.trim());
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
      !hasCourseStructure &&
      !hasScormPackage
    ) {
      await alert({
        title: "Estructura pendiente",
        message:
          "Un curso publicado debe tener un paquete SCORM cargado o al menos un módulo con un recurso interno.",
        tone: "warning",
      });
      return;
    }

    setSubmittingResource(true);
    try {
      const saveRequest = editingResourceId
        ? updateContent(editingResourceId, buildResourcePayload())
        : createContent(buildResourcePayload());
      await saveRequest;
      onSaved();
      onClose();
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
          prev.courseModules.length > 0
            ? prev.courseModules
            : [createEmptyCourseModule()],
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
        | "durationLabel"
        | "linkedContentId",
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
          if (module.id !== moduleId) return module;
          const nextResources =
            module.resources.length <= 1
              ? [createEmptyCourseResource()]
              : module.resources.filter((resource) => resource.id !== resourceId);
          return { ...module, resources: nextResources };
        }),
      }));
    },
    [],
  );

  const resourceSetupChecklist = React.useMemo(() => {
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
          resourceForm.pillar && resourceForm.component && resourceForm.competency,
        ),
      });
    }

    return baseChecklist;
  }, [
    editorKind,
    resourceForm.category,
    resourceForm.competency,
    resourceForm.component,
    resourceForm.courseModules,
    resourceForm.pillar,
    resourceForm.tags.length,
    resourceForm.title,
    resourceForm.url,
  ]);

  const resourceEditorSteps = React.useMemo<ResourceEditorStepItem[]>(
    () => [
      {
        key: "identity",
        title: "Base e IA",
        description: "Tipo, título, categoría y apoyo del asistente.",
        ready: Boolean(resourceForm.title.trim() && resourceForm.category.trim()),
      },
      {
        key: "asset",
        title: isCourseEditor ? "Acceso y estructura" : "Activo y acceso",
        description: isCourseEditor
          ? "URL principal, carga a R2 y módulos del curso."
          : "Archivo, URL y disponibilidad del recurso.",
        ready:
          editorKind === "course"
            ? Boolean(
                resourceForm.url.trim() ||
                  countCourseResources(resourceForm.courseModules) > 0,
              )
            : Boolean(resourceForm.url.trim()),
      },
      {
        key: "taxonomy",
        title: "Mapa 4Shine",
        description: "Pilar, componente, competencia, etapa y audiencia.",
        ready: Boolean(
          resourceForm.pillar && resourceForm.component && resourceForm.competency,
        ),
      },
      {
        key: "discovery",
        title: "Descubrimiento",
        description: "Tags, revisión final y publicación.",
        ready: resourceForm.tags.length > 0,
      },
    ],
    [
      editorKind,
      isCourseEditor,
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

  const currentResourceEditorStep =
    resourceEditorSteps[
      Math.min(resourceEditorStepIndex, resourceEditorSteps.length - 1)
    ] ?? resourceEditorSteps[0];
  const completedEditorSteps = resourceEditorSteps.filter(
    (step) => step.ready,
  ).length;
  const isIdentityEditorStep = currentResourceEditorStep.key === "identity";
  const isAssetEditorStep = currentResourceEditorStep.key === "asset";
  const isTaxonomyEditorStep = currentResourceEditorStep.key === "taxonomy";
  const isDiscoveryEditorStep = currentResourceEditorStep.key === "discovery";

  const goToResourceEditorStep = React.useCallback(
    (nextIndex: number) => {
      const lastIndex = resourceEditorSteps.length - 1;
      setResourceEditorStepIndex(Math.max(0, Math.min(lastIndex, nextIndex)));
    },
    [resourceEditorSteps.length],
  );

  const goToNextResourceEditorStep = React.useCallback(async () => {
    if (resourceEditorStepIndex === 0) {
      if (!resourceForm.title.trim() || !resourceForm.category.trim()) {
        await alert({
          title: "Completa la base del contenido",
          message:
            "Antes de continuar, define al menos el título y la categoría. Eso ayuda a que el resto del flujo sea más inteligente.",
          tone: "warning",
        });
        return;
      }
    }
    goToResourceEditorStep(resourceEditorStepIndex + 1);
  }, [
    alert,
    goToResourceEditorStep,
    resourceEditorStepIndex,
    resourceForm.category,
    resourceForm.title,
  ]);

  const goToPreviousResourceEditorStep = React.useCallback(() => {
    goToResourceEditorStep(resourceEditorStepIndex - 1);
  }, [goToResourceEditorStep, resourceEditorStepIndex]);

  const handleClose = React.useCallback(
    (force = false) => {
      if (submittingResource && !force) return;
      onClose();
    },
    [onClose, submittingResource],
  );

  // Body overflow + Escape para cerrar.
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("app-learning-editor-open");
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("app-learning-editor-open");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleClose, open]);

  if (!open || !isResourceManager || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[220] bg-[var(--brand-surface)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          editingResourceId
            ? `Editar ${isCourseEditor ? "curso" : "recurso"}`
            : `Crear ${isCourseEditor ? "curso" : "recurso"}`
        }
        className="relative flex h-full w-full flex-col overflow-hidden"
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmitResource}>
          <div
            className="border-b border-[var(--app-border)] bg-white/94 px-4 pb-4 pt-4 sm:px-6 lg:px-8"
            style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
          >
            <div className="mx-auto w-full max-w-[1540px]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                      ? `Edita ${isCourseEditor ? "tu curso" : "tu recurso"} con un flujo guiado`
                      : `Crear ${isCourseEditor ? "curso" : "recurso"}`}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                    {isCourseEditor
                      ? "Define base editorial, acceso principal, estructura interna, metadatos y publicación desde una sola experiencia."
                      : "Completa base editorial, activo, metadatos y descubrimiento con una secuencia clara y ligera."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="app-button-secondary"
                    onClick={() => handleClose()}
                  >
                    <ArrowLeft size={16} />
                    {backLabel}
                  </button>
                  <span className="app-chip-soft">
                    <Layers3 size={13} />
                    {isCourseEditor ? "Modo curso" : "Modo recurso"}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
                    onClick={() => handleClose()}
                    aria-label="Cerrar editor"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--app-ink)]">
                      Paso {resourceEditorStepIndex + 1} de{" "}
                      {resourceEditorSteps.length}
                    </p>
                    <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                      {completedEditorSteps}/{resourceEditorSteps.length} listos
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    {currentResourceEditorStep.description}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-primary)_0%,var(--brand-accent)_100%)] transition-all"
                      style={{
                        width: `${
                          ((resourceEditorStepIndex + 1) /
                            resourceEditorSteps.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <span className="app-chip-soft">
                    <FileUp size={13} />
                    {resourceTypeProfile.assetLabel}
                  </span>
                  <span className="app-chip-soft">
                    <Lightbulb size={13} />
                    Flujo guiado
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <LearningEditorStepNav
                  steps={resourceEditorSteps}
                  activeIndex={resourceEditorStepIndex}
                  onSelect={goToResourceEditorStep}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto grid min-h-0 w-full max-w-[1540px] flex-1 grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
              <div className="space-y-5">
                <div className="2xl:hidden rounded-[24px] border border-[var(--app-border)] bg-white/90 p-4 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                        Resumen rápido
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-[var(--app-ink)]">
                        {resourceForm.title.trim() ||
                          (isCourseEditor
                            ? "Curso sin título aún"
                            : "Recurso sin título aún")}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="app-chip-soft">
                        {contentTypeLabel(resourceForm.contentType)}
                      </span>
                      <span className="app-chip-soft">
                        {resourceForm.category || "Categoría pendiente"}
                      </span>
                      <span className="app-chip-soft">
                        {completedEditorSteps}/{resourceEditorSteps.length} pasos listos
                      </span>
                    </div>
                  </div>
                </div>

                {isIdentityEditorStep && (
                  <>
                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-3">
                            <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                                Asistente IA de metadatos
                              </h4>
                              <p className="text-sm text-[var(--app-muted)]">
                                Usa OpenAI para sugerir metadatos editoriales y, cuando detecta un enlace de YouTube, aprovecha la YouTube Data API para leer título, descripción y duración antes de clasificar.
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
                            Funciona mejor si ya pegaste una URL o escribiste un título provisional. Si el enlace es de YouTube, la lectura será más precisa.
                          </p>
                        </div>
                      </div>

                      {metadataAssistantResult ? (
                        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                          <div className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
                                {metadataAssistantResult.source.youtubeUsed
                                  ? "YouTube verificado"
                                  : "Sugerencia editorial IA"}
                              </span>
                              {metadataAssistantResult.suggestion.pillar && (
                                <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
                                  {getPillarLabelFromCode(
                                    metadataAssistantResult.suggestion.pillar,
                                  )}
                                </span>
                              )}
                              {metadataAssistantResult.suggestion.stage && (
                                <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)]">
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
                                  {metadataAssistantResult.suggestion.courseModules.length}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-[20px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm leading-relaxed text-[var(--app-muted)]">
                          El asistente no publica ni reemplaza tu criterio editorial: propone un punto de partida para acelerar título, descripción, clasificación, tags y metadatos del mapa 4Shine.
                        </div>
                      )}
                    </section>

                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
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
                                  ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] text-[var(--app-ink)]"
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
                                  ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] text-[var(--app-ink)]"
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
                            <label className="app-field-label">Nueva categoría</label>
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
                            Imagen de carátula (Thumbnail)
                          </label>
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-1 flex-col gap-2">
                              <input
                                className="app-input"
                                placeholder="URL de la imagen o cárgala directamente"
                                value={resourceForm.thumbnailUrl}
                                onChange={(event) =>
                                  setResourceForm((prev) => ({
                                    ...prev,
                                    thumbnailUrl: event.target.value,
                                  }))
                                }
                              />
                              <p className="text-xs text-[var(--app-muted)]">
                                Se visualizará en las tarjetas del catálogo. Ideal 800x450px.
                              </p>
                              <div className="mt-2">
                                <R2UploadButton
                                  moduleCode={moduleCode}
                                  action={editingResourceId ? "update" : "create"}
                                  entityTable="app_learning.content_items"
                                  fieldName="thumbnail_url"
                                  pathPrefix={`${r2PathScopePrefix}/thumbnails/${resourceForm.contentType}`}
                                  accept="image/*"
                                  buttonLabel="Subir carátula a R2"
                                  className="app-button-secondary w-full justify-center lg:w-auto"
                                  onUploaded={(url) => {
                                    setResourceForm((prev) => ({
                                      ...prev,
                                      thumbnailUrl: url,
                                    }));
                                  }}
                                />
                              </div>
                            </div>

                            {resourceForm.thumbnailUrl && (
                              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-[16px] border border-[var(--app-border)] bg-black/5">
                                <img
                                  src={resourceForm.thumbnailUrl}
                                  alt="Preview carátula"
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                  onClick={() =>
                                    setResourceForm((prev) => ({
                                      ...prev,
                                      thumbnailUrl: "",
                                    }))
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
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

                        <label className="lg:col-span-2 flex items-start gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-ink)]">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={resourceForm.showInLibrary}
                            onChange={(event) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                showInLibrary: event.target.checked,
                              }))
                            }
                          />
                          <span>
                            <span className="block font-semibold">Mostrar en la biblioteca de Aprendizaje</span>
                            <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                              Si lo desmarcas, queda publicado pero NO aparece en Contenidos libres/Cursos; seguirá
                              disponible dentro de un curso o por enlace directo.
                            </span>
                          </span>
                        </label>

                        {isCourseEditor && scope === "aprendizaje" && (
                          <div className="lg:col-span-2">
                            <label className="app-field-label">
                              Ubicación en aprendizaje
                            </label>
                            <p className="text-xs text-[var(--app-muted)] mb-2">
                              Decide en qué pestaña aparecerá este curso. Solo puede vivir en una.
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(
                                [
                                  {
                                    value: "cursos" as const,
                                    label: "Cursos",
                                    description:
                                      "Vista enfocada en experiencias estructuradas con módulos.",
                                  },
                                  {
                                    value: "contenidos_libres" as const,
                                    label: "Contenidos libres",
                                    description:
                                      "Biblioteca general junto a videos, pódcasts y documentos.",
                                  },
                                ]
                              ).map((option) => {
                                const isActive =
                                  resourceForm.libraryLocation === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                      setResourceForm((prev) => ({
                                        ...prev,
                                        libraryLocation: option.value,
                                      }))
                                    }
                                    className={`text-left rounded-[18px] border px-4 py-3 transition ${
                                      isActive
                                        ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
                                        : "border-[var(--app-border)] bg-white hover:border-[var(--app-border-strong)]"
                                    }`}
                                  >
                                    <p className="text-sm font-semibold text-[var(--app-ink)]">
                                      {option.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                                      {option.description}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}

                {isAssetEditorStep && (
                  <>
                    <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
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

                        <div className="flex flex-col gap-2 lg:items-end">
                          {resourceForm.contentType === "scorm" ? (
                            <>
                              <div
                                className="inline-flex rounded-full border p-1 text-xs font-semibold"
                                style={{
                                  borderColor: "var(--app-border)",
                                  background: "white",
                                }}
                              >
                                {(
                                  [
                                    { key: "scorm" as const, label: "SCORM" },
                                    { key: "html" as const, label: "HTML" },
                                  ]
                                ).map((opt) => {
                                  const active = coursePackageKind === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => setCoursePackageKind(opt.key)}
                                      className="rounded-full px-3 py-1 transition"
                                      style={
                                        active
                                          ? {
                                              background: "var(--brand-primary)",
                                              color: "var(--brand-on-dark)",
                                            }
                                          : { color: "var(--app-muted)" }
                                      }
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <ScormUploadButton
                                className="app-button-secondary min-w-[14rem]"
                                packageKind={coursePackageKind}
                                onUploaded={async ({
                                  entryUrl,
                                  fileCount,
                                  packageKind,
                                }) => {
                                  const kindLabel =
                                    packageKind === "scorm" ? "SCORM" : "HTML";
                                  setUploadedResourceAsset({
                                    key: entryUrl,
                                    url: entryUrl,
                                    bucket: "",
                                    size: 0,
                                    contentType: "application/zip",
                                    fileName: `Paquete ${kindLabel} (${fileCount} archivos)`,
                                  });
                                  setResourceForm((prev) => ({
                                    ...prev,
                                    url: entryUrl,
                                  }));

                                  if (editingResourceId) {
                                    try {
                                      await updateContent(editingResourceId, {
                                        url: entryUrl,
                                      });
                                    } catch (err) {
                                      console.error(
                                        "[scorm-upload] No se pudo auto-persistir la URL:",
                                        err,
                                      );
                                    }
                                  }
                                }}
                              />
                            </>
                          ) : (
                            <R2UploadButton
                              moduleCode={moduleCode}
                              action={editingResourceId ? "update" : "create"}
                              entityTable="app_learning.content_items"
                              fieldName="url"
                              pathPrefix={`${r2PathScopePrefix}/recursos/${resourceForm.contentType}`}
                              accept={resourceTypeProfile.accept}
                              buttonLabel={resourceTypeProfile.uploadLabel}
                              className="app-button-secondary min-w-[14rem]"
                              onUploaded={(url, payload) => {
                                setUploadedResourceAsset(payload);
                                setResourceForm((prev) => ({ ...prev, url }));
                              }}
                            />
                          )}
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
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:text-[var(--brand-darker)]"
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
                            Aún no hay un activo vinculado. Puedes dejarlo en borrador y terminar luego, o subir{" "}
                            {isCourseEditor ? "el activo principal" : "el archivo"}{" "}
                            ahora mismo.
                          </p>
                        )}
                      </div>
                    </section>

                    {isCourseEditor && (
                      <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                              <Layers3 size={18} />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                                Estructura interna del curso
                              </h4>
                              <p className="text-sm text-[var(--app-muted)]">
                                Organiza el curso por módulos y agrega los recursos que componen cada tramo de la experiencia.
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
                                  <label className="app-field-label">
                                    Título del módulo
                                  </label>
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
                                  <label className="app-field-label">
                                    Descripción del módulo
                                  </label>
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
                                        <label className="app-field-label">
                                          Título del recurso interno
                                        </label>
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
                                        {courseResource.contentType === "activity" ? (
                                          <>
                                            <label className="app-field-label">
                                              Actividad vinculada
                                            </label>
                                            <ActivityPicker
                                              value={courseResource.linkedContentId}
                                              onChange={(selection) => {
                                                updateCourseModuleResource(
                                                  module.id,
                                                  courseResource.id,
                                                  "linkedContentId",
                                                  selection?.contentId ?? "",
                                                );
                                                if (selection && !courseResource.title.trim()) {
                                                  updateCourseModuleResource(
                                                    module.id,
                                                    courseResource.id,
                                                    "title",
                                                    selection.title,
                                                  );
                                                }
                                              }}
                                            />
                                          </>
                                        ) : courseResource.contentType === "assignment" ? (
                                          <>
                                            <label className="app-field-label">
                                              Tarea vinculada
                                            </label>
                                            <AssignmentPicker
                                              value={courseResource.linkedContentId}
                                              onChange={(selection) => {
                                                updateCourseModuleResource(
                                                  module.id,
                                                  courseResource.id,
                                                  "linkedContentId",
                                                  selection?.contentId ?? "",
                                                );
                                                if (selection && !courseResource.title.trim()) {
                                                  updateCourseModuleResource(
                                                    module.id,
                                                    courseResource.id,
                                                    "title",
                                                    selection.title,
                                                  );
                                                }
                                              }}
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <label className="app-field-label">
                                              URL o activo del recurso
                                            </label>
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
                                            <div className="mt-2 text-right">
                                              <R2UploadButton
                                                moduleCode={moduleCode}
                                                action={editingResourceId ? "update" : "create"}
                                                entityTable="app_learning.content_items"
                                                fieldName="structure_payload"
                                                pathPrefix={`${r2PathScopePrefix}/cursos/${editingResourceId || "new"}/recursos`}
                                                accept={getContentTypeAccept(
                                                  courseResource.contentType as ContentType,
                                                )}
                                                buttonLabel="Subir activo a R2"
                                                className="app-button-secondary text-xs"
                                                onUploaded={(url) => {
                                                  updateCourseModuleResource(
                                                    module.id,
                                                    courseResource.id,
                                                    "url",
                                                    url,
                                                  );
                                                }}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <div className="lg:col-span-2">
                                        <label className="app-field-label">
                                          Nota contextual
                                        </label>
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
                  </>
                )}

                {isTaxonomyEditorStep && (
                  <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                        <Layers3 size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                          Metadatos del mapa 4Shine
                        </h4>
                        <p className="text-sm text-[var(--app-muted)]">
                          Usa listas dependientes para conectar{" "}
                          {isCourseEditor ? "el curso" : "el recurso"} con la taxonomía oficial.
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
                            <option key={competency.value} value={competency.value}>
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
                            {resourceObservableBehaviors.slice(0, 4).map((behavior) => (
                              <li key={behavior} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                                <span>{behavior}</span>
                              </li>
                            ))}
                          </ul>
                          {resourceObservableBehaviors.length > 4 && (
                            <p className="mt-3 text-xs font-medium text-[var(--app-muted)]">
                              +{resourceObservableBehaviors.length - 4} conductas adicionales en el mapa oficial.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-[var(--app-ink)]">
                            Mapa 4Shine aún incompleto
                          </p>
                          <p className="mt-2 text-sm text-[var(--app-muted)]">
                            Selecciona pilar, componente y competencia para conectar{" "}
                            {isCourseEditor ? "el curso" : "el recurso"} con la taxonomía oficial.
                          </p>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {isDiscoveryEditorStep && (
                  <>
                    <ResourceTagComposer
                      tags={resourceForm.tags}
                      draft={resourceTagDraft}
                      suggestions={smartTagSuggestions.slice(0, 12)}
                      onDraftChange={setResourceTagDraft}
                      onAddTag={addTagToResourceForm}
                      onRemoveTag={removeTagFromResourceForm}
                    />

                    {isCourseEditor && (
                      <section className="rounded-[24px] border border-[var(--app-border)] bg-white/88 p-5 shadow-[0_18px_38px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <div className="rounded-[16px] bg-[var(--app-chip)] p-3 text-[var(--brand-primary)]">
                            <Award size={18} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-[var(--app-ink)]">
                              Certificado del curso
                            </h4>
                            <p className="text-sm text-[var(--app-muted)]">
                              Selecciona la plantilla que se entregará al completar el 100% del curso.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="app-field-label">
                            Plantilla de certificado
                          </label>
                          <select
                            className="app-select"
                            value={resourceForm.certificateTemplateId ?? ""}
                            onChange={(e) =>
                              setResourceForm((prev) => ({
                                ...prev,
                                certificateTemplateId: e.target.value || null,
                              }))
                            }
                          >
                            <option value="">Sin certificado</option>
                            {certificateTemplates.map((t) => (
                              <option key={t.templateId} value={t.templateId}>
                                Plantilla {t.templateNumber} — {t.name}
                              </option>
                            ))}
                          </select>
                          {resourceForm.certificateTemplateId &&
                            (() => {
                              const selected = certificateTemplates.find(
                                (t) =>
                                  t.templateId === resourceForm.certificateTemplateId,
                              );
                              return selected ? (
                                <div className="mt-3 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-muted)]">
                                  <p className="font-semibold text-[var(--app-ink)]">
                                    {selected.name}
                                  </p>
                                  <p className="mt-1">
                                    {selected.headlineText}{" "}
                                    <span className="italic">
                                      [Nombre del participante]
                                    </span>{" "}
                                    {selected.bodyText}
                                  </p>
                                  <p className="mt-1 text-xs">
                                    {selected.organizationName}
                                  </p>
                                </div>
                              ) : null;
                            })()}
                        </div>
                      </section>
                    )}

                    <div className="2xl:hidden">
                      <LearningEditorSupportRail
                        isCourseEditor={isCourseEditor}
                        title={resourceForm.title}
                        description={resourceForm.description}
                        contentType={resourceForm.contentType}
                        category={resourceForm.category}
                        status={resourceForm.status}
                        courseModuleCount={resourceForm.courseModules.length}
                        courseResourceCount={currentCourseResourceCount}
                        checklist={resourceSetupChecklist}
                        editorialDescription={resourceTypeProfile.description}
                        stageLabel={resourceForm.stage}
                        audienceLabel={currentAudienceLabel}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <aside className="hidden min-h-0 overflow-y-auto border-l border-[var(--app-border)] bg-[rgba(252,249,255,0.96)] px-4 py-5 2xl:block sm:px-6 lg:px-7 lg:py-6">
              <LearningEditorSupportRail
                isCourseEditor={isCourseEditor}
                title={resourceForm.title}
                description={resourceForm.description}
                contentType={resourceForm.contentType}
                category={resourceForm.category}
                status={resourceForm.status}
                courseModuleCount={resourceForm.courseModules.length}
                courseResourceCount={currentCourseResourceCount}
                checklist={resourceSetupChecklist}
                editorialDescription={resourceTypeProfile.description}
                stageLabel={resourceForm.stage}
                audienceLabel={currentAudienceLabel}
              />
            </aside>
          </div>

          <div
            className="border-t border-[var(--app-border)] bg-white/94 px-4 py-4 sm:px-6 lg:px-8"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--app-ink)]">
                  {currentResourceEditorStep.title}
                </p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {isCourseEditor
                    ? "Puedes avanzar por pasos o guardar y salir en cualquier momento. El curso quedará listo cuando estructura, acceso y metadatos estén completos."
                    : "Puedes avanzar por pasos o guardar y salir en cualquier momento. El recurso quedará listo cuando activo, metadatos y descubrimiento estén completos."}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  className="app-button-ghost"
                  onClick={() => handleClose()}
                >
                  Cancelar
                </button>
                {resourceEditorStepIndex > 0 && (
                  <button
                    type="button"
                    className="app-button-secondary"
                    onClick={goToPreviousResourceEditorStep}
                  >
                    <ArrowLeft size={16} />
                    Atrás
                  </button>
                )}
                {resourceEditorStepIndex < resourceEditorSteps.length - 1 && (
                  <button
                    className="app-button-secondary"
                    type="submit"
                    disabled={submittingResource}
                  >
                    {editingResourceId ? <Save size={16} /> : <Plus size={16} />}
                    {submittingResource ? "Guardando..." : "Guardar y salir"}
                  </button>
                )}
                {resourceEditorStepIndex < resourceEditorSteps.length - 1 ? (
                  <button
                    type="button"
                    className="app-button-primary"
                    onClick={() => void goToNextResourceEditorStep()}
                  >
                    Continuar
                    <ArrowRight size={16} />
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
