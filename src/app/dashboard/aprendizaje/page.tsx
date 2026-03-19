'use client';

import Link from 'next/link';
import React from 'react';
import {
  BookOpen,
  CalendarClock,
  Download,
  Eye,
  Layers3,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  createLearningComment,
  deleteLearningWorkbook,
  listLearningResources,
  listLearningWorkbooks,
  updateLearningWorkbook,
  type LearningResourceRecord,
  type WorkbookRecord,
} from '@/features/aprendizaje/client';
import {
  createContent,
  deleteContent,
  updateContent,
  type ContentStatus,
  type ContentType,
} from '@/features/content/client';
import {
  COMPETENCY_PILLAR_OPTIONS,
  getCompetencyOptions,
  getComponentOptionsByPillarCode,
  getObservableBehaviors,
  getPillarLabelFromCode,
} from '@/features/aprendizaje/competency-map';
import { WORKBOOKS_V2_CATALOG } from '@/lib/workbooks-v2-catalog';

const RESOURCE_TYPE_OPTIONS: ContentType[] = ['video', 'podcast', 'pdf', 'article', 'html', 'ppt', 'scorm'];
const RESOURCE_STATUS_OPTIONS: ContentStatus[] = ['draft', 'pending_review', 'published', 'archived', 'rejected'];

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

interface WorkbookEditorState {
  title: string;
  description: string;
  availableFrom: string;
  isEnabled: boolean;
  isHidden: boolean;
  currentFocus: string;
  leadershipReflection: string;
  actionPlan: string;
  successMetrics: string;
  ishinerNotes: string;
}

const EMPTY_RESOURCE_FORM: ResourceFormState = {
  title: '',
  category: '',
  contentType: 'video',
  url: '',
  description: '',
  durationLabel: '',
  status: 'draft',
  tagsInput: '',
  pillar: '',
  component: '',
  competency: '',
  stage: '',
  audience: 'lider',
  isRecommended: false,
};

const EMPTY_WORKBOOK_EDITOR: WorkbookEditorState = {
  title: '',
  description: '',
  availableFrom: '',
  isEnabled: true,
  isHidden: false,
  currentFocus: '',
  leadershipReflection: '',
  actionPlan: '',
  successMetrics: '',
  ishinerNotes: '',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function roleLabel(role: string | null | undefined): string {
  if (!role) return 'Usuario';
  if (role === 'mentor') return 'Ishiner';
  if (role === 'lider') return 'Líder';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Admin';
  return role;
}

function contentTypeLabel(type: ContentType): string {
  if (type === 'pdf') return 'PDF';
  if (type === 'ppt') return 'PPT';
  if (type === 'scorm') return 'SCORM';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function statusLabel(status: ContentStatus): string {
  if (status === 'pending_review') return 'En revisión';
  if (status === 'published') return 'Publicado';
  if (status === 'archived') return 'Archivado';
  if (status === 'rejected') return 'Rechazado';
  return 'Borrador';
}

function workbookStateLabel(state: WorkbookRecord['accessState']): string {
  if (state === 'scheduled') return 'Programado';
  if (state === 'disabled') return 'Deshabilitado';
  if (state === 'hidden') return 'Oculto';
  return 'Activo';
}

function workbookStateClasses(state: WorkbookRecord['accessState']): string {
  if (state === 'scheduled') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (state === 'disabled') return 'bg-slate-100 text-slate-600 border border-slate-200';
  if (state === 'hidden') return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}

function resourceBadgeClasses(status: ContentStatus): string {
  if (status === 'published') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (status === 'pending_review') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (status === 'archived') return 'bg-slate-100 text-slate-600 border border-slate-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-sky-50 text-sky-700 border border-sky-200';
}

function pillarLabel(value: string | null | undefined): string {
  return getPillarLabelFromCode(value);
}

function workbookToEditor(workbook: WorkbookRecord | null): WorkbookEditorState {
  if (!workbook) {
    return EMPTY_WORKBOOK_EDITOR;
  }

  return {
    title: workbook.title,
    description: workbook.description ?? '',
    availableFrom: toDateTimeLocal(workbook.availableFrom),
    isEnabled: workbook.isEnabled,
    isHidden: workbook.isHidden,
    currentFocus: workbook.editableFields.currentFocus,
    leadershipReflection: workbook.editableFields.leadershipReflection,
    actionPlan: workbook.editableFields.actionPlan,
    successMetrics: workbook.editableFields.successMetrics,
    ishinerNotes: workbook.editableFields.ishinerNotes,
  };
}

function workbookDownloadContent(workbook: WorkbookRecord, draft: WorkbookEditorState): string {
  return [
    `4Shine Learning Workbook`,
    `ID único: ${workbook.workbookId}`,
    `Workbook: ${draft.title || workbook.title}`,
    `Usuario: ${workbook.ownerName}`,
    `Pilar: ${pillarLabel(workbook.pillarCode)}`,
    `Estado: ${workbookStateLabel(workbook.accessState)}`,
    `Disponible desde: ${formatDateTime(workbook.availableFrom)}`,
    '',
    `Descripción`,
    draft.description || workbook.description || 'Sin descripción',
    '',
    `Foco actual`,
    draft.currentFocus || 'Sin contenido',
    '',
    `Reflexión de liderazgo`,
    draft.leadershipReflection || 'Sin contenido',
    '',
    `Plan de acción`,
    draft.actionPlan || 'Sin contenido',
    '',
    `Indicadores de éxito`,
    draft.successMetrics || 'Sin contenido',
    '',
    `Notas del ishiner`,
    draft.ishinerNotes || 'Sin contenido',
  ].join('\n');
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export default function AprendizajePage() {
  const { currentRole, can, refreshBootstrap } = useUser();
  const { alert, confirm } = useAppDialog();

  const [resources, setResources] = React.useState<LearningResourceRecord[]>([]);
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingResource, setSubmittingResource] = React.useState(false);
  const [savingWorkbook, setSavingWorkbook] = React.useState(false);
  const [resourceSearch, setResourceSearch] = React.useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = React.useState<'all' | ContentType>('all');
  const [resourceStatusFilter, setResourceStatusFilter] = React.useState<'all' | ContentStatus>('all');
  const [resourcePillarFilter, setResourcePillarFilter] = React.useState<'all' | string>('all');
  const [selectedResourceId, setSelectedResourceId] = React.useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = React.useState<string | null>(null);
  const [resourceForm, setResourceForm] = React.useState<ResourceFormState>(EMPTY_RESOURCE_FORM);
  const [commentDrafts, setCommentDrafts] = React.useState<Record<string, string>>({});
  const [workbookOwnerFilter, setWorkbookOwnerFilter] = React.useState<'all' | string>('all');
  const [workbookSearch, setWorkbookSearch] = React.useState('');
  const [selectedWorkbookId, setSelectedWorkbookId] = React.useState<string | null>(null);
  const [workbookEditor, setWorkbookEditor] = React.useState<WorkbookEditorState>(EMPTY_WORKBOOK_EDITOR);

  const isResourceManager = currentRole === 'gestor' || currentRole === 'admin';
  const isWorkbookManager = currentRole === 'gestor' || currentRole === 'admin';
  const canEditWorkbook = can('aprendizaje', 'update');

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const loadModule = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resourceData, workbookData] = await Promise.all([listLearningResources(), listLearningWorkbooks()]);
      setResources(resourceData);
      setWorkbooks(workbookData);
    } catch (error) {
      await showError('No se pudo cargar el módulo de aprendizaje', error);
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
        setResourceForm((prev) => ({ ...prev, component: '', competency: '' }));
      }
      return;
    }

    if (resourceForm.component && !componentOptions.some((option) => option.value === resourceForm.component)) {
      setResourceForm((prev) => ({ ...prev, component: '', competency: '' }));
      return;
    }

    if (resourceForm.competency && !competencyOptions.some((option) => option.value === resourceForm.competency)) {
      setResourceForm((prev) => ({ ...prev, competency: '' }));
    }
  }, [componentOptions, competencyOptions, resourceForm.component, resourceForm.competency, resourceForm.pillar]);

  const filteredResources = resources.filter((resource) => {
    const normalizedQuery = resourceSearch.trim().toLowerCase();
    const searchable = [
      resource.title,
      resource.description ?? '',
      resource.category,
      resource.authorName ?? '',
      resource.tags.join(' '),
      resource.competencyMetadata.component ?? '',
      resource.competencyMetadata.competency ?? '',
      resource.competencyMetadata.stage ?? '',
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
    const matchesType = resourceTypeFilter === 'all' || resource.contentType === resourceTypeFilter;
    const matchesStatus = resourceStatusFilter === 'all' || resource.status === resourceStatusFilter;
    const matchesPillar =
      resourcePillarFilter === 'all' || (resource.competencyMetadata.pillar ?? '') === resourcePillarFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPillar;
  });

  React.useEffect(() => {
    if (filteredResources.length === 0) {
      setSelectedResourceId(null);
      return;
    }

    const exists = filteredResources.some((resource) => resource.contentId === selectedResourceId);
    if (!exists) {
      setSelectedResourceId(filteredResources[0].contentId);
    }
  }, [filteredResources, selectedResourceId]);

  const selectedResource = filteredResources.find((resource) => resource.contentId === selectedResourceId) ?? null;
  const scormResources = filteredResources.filter((resource) => resource.contentType === 'scorm');
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
    const matchesOwner = workbookOwnerFilter === 'all' || workbook.ownerUserId === workbookOwnerFilter;
    const normalizedQuery = workbookSearch.trim().toLowerCase();
    const searchable = [workbook.title, workbook.description ?? '', workbook.ownerName, pillarLabel(workbook.pillarCode)]
      .join(' ')
      .toLowerCase();
    const matchesSearch = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
    return matchesOwner && matchesSearch;
  });

  React.useEffect(() => {
    if (currentRole === 'lider' && workbooks[0] && workbookOwnerFilter !== workbooks[0].ownerUserId) {
      setWorkbookOwnerFilter(workbooks[0].ownerUserId);
    }
  }, [currentRole, workbookOwnerFilter, workbooks]);

  React.useEffect(() => {
    if (filteredWorkbooks.length === 0) {
      setSelectedWorkbookId(null);
      return;
    }

    const exists = filteredWorkbooks.some((workbook) => workbook.workbookId === selectedWorkbookId);
    if (!exists) {
      setSelectedWorkbookId(filteredWorkbooks[0].workbookId);
    }
  }, [filteredWorkbooks, selectedWorkbookId]);

  const selectedWorkbook = filteredWorkbooks.find((workbook) => workbook.workbookId === selectedWorkbookId) ?? null;
  const workbookCatalogBySlug = React.useMemo(
    () => new Map(WORKBOOKS_V2_CATALOG.map((item) => [item.slug.toLowerCase(), item])),
    [],
  );
  const selectedWorkbookDigital = selectedWorkbook
    ? workbookCatalogBySlug.get(selectedWorkbook.templateCode.toLowerCase()) ?? null
    : null;

  React.useEffect(() => {
    setWorkbookEditor(workbookToEditor(selectedWorkbook));
  }, [selectedWorkbook]);

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
      url: resource.url ?? '',
      description: resource.description ?? '',
      durationLabel: resource.durationLabel ?? '',
      status: resource.status,
      tagsInput: resource.tags.join(', '),
      pillar: resource.competencyMetadata.pillar ?? '',
      component: resource.competencyMetadata.component ?? resource.competencyMetadata.skill ?? '',
      competency: resource.competencyMetadata.competency ?? '',
      stage: resource.competencyMetadata.stage ?? '',
      audience: resource.competencyMetadata.audience ?? 'lider',
      isRecommended: resource.isRecommended,
    });
  };

  const buildResourcePayload = () => ({
    scope: 'aprendizaje' as const,
    title: resourceForm.title.trim(),
    category: resourceForm.category.trim(),
    contentType: resourceForm.contentType,
    url: resourceForm.url.trim() || null,
    description: resourceForm.description.trim() || null,
    durationLabel: resourceForm.durationLabel.trim() || null,
    status: resourceForm.status,
    isRecommended: resourceForm.isRecommended,
    tags: resourceForm.tagsInput
      .split(',')
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
      await showError('No se pudo guardar el recurso', error);
    } finally {
      setSubmittingResource(false);
    }
  };

  const onChangeResourceStatus = async (resource: LearningResourceRecord, status: ContentStatus) => {
    if (!isResourceManager) return;

    try {
      await updateContent(resource.contentId, { status });
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo actualizar el estado del recurso', error);
    }
  };

  const onDeleteResource = async (resource: LearningResourceRecord) => {
    if (!isResourceManager) return;

    const accepted = await confirm({
      title: 'Eliminar recurso',
      message: `¿Deseas eliminar "${resource.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });

    if (!accepted) return;

    try {
      await deleteContent(resource.contentId);
      if (selectedResourceId === resource.contentId) {
        setSelectedResourceId(null);
      }
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo eliminar el recurso', error);
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
      setCommentDrafts((prev) => ({ ...prev, [resource.contentId]: '' }));
      await Promise.all([loadModule(), refreshBootstrap()]);
    } catch (error) {
      await showError('No se pudo guardar el comentario', error);
    }
  };

  const onSaveWorkbook = async () => {
    if (!selectedWorkbook || !canEditWorkbook) return;

    setSavingWorkbook(true);
    try {
      await updateLearningWorkbook(selectedWorkbook.workbookId, {
        title: isWorkbookManager ? workbookEditor.title.trim() : undefined,
        description: isWorkbookManager ? workbookEditor.description.trim() || null : undefined,
        availableFrom: isWorkbookManager
          ? workbookEditor.availableFrom
            ? new Date(workbookEditor.availableFrom).toISOString()
            : undefined
          : undefined,
        isEnabled: isWorkbookManager ? workbookEditor.isEnabled : undefined,
        isHidden: isWorkbookManager ? workbookEditor.isHidden : undefined,
        editableFields: {
          currentFocus: workbookEditor.currentFocus,
          leadershipReflection: workbookEditor.leadershipReflection,
          actionPlan: workbookEditor.actionPlan,
          successMetrics: workbookEditor.successMetrics,
          ishinerNotes: workbookEditor.ishinerNotes,
        },
      });

      await loadModule();
    } catch (error) {
      await showError('No se pudo guardar el workbook', error);
    } finally {
      setSavingWorkbook(false);
    }
  };

  const onDownloadWorkbook = async () => {
    if (!selectedWorkbook) return;

    const fileContent = workbookDownloadContent(selectedWorkbook, workbookEditor);
    const safeTitle = (workbookEditor.title || selectedWorkbook.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    downloadTextFile(`${safeTitle || 'workbook'}-${selectedWorkbook.workbookId.slice(0, 8)}.txt`, fileContent);

    try {
      await updateLearningWorkbook(selectedWorkbook.workbookId, {
        markDownloaded: true,
      });
      await loadModule();
    } catch (error) {
      await showError('El archivo se descargó, pero no pudimos registrar la descarga', error);
    }
  };

  const onDeleteWorkbook = async () => {
    if (!selectedWorkbook || !isWorkbookManager) return;

    const accepted = await confirm({
      title: 'Eliminar workbook',
      message: `¿Deseas eliminar el workbook "${selectedWorkbook.title}" de ${selectedWorkbook.ownerName}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });

    if (!accepted) return;

    try {
      await deleteLearningWorkbook(selectedWorkbook.workbookId);
      setSelectedWorkbookId(null);
      await loadModule();
    } catch (error) {
      await showError('No se pudo eliminar el workbook', error);
    }
  };

  const workbookInputsDisabled =
    !selectedWorkbook ||
    !canEditWorkbook ||
    (!isWorkbookManager && selectedWorkbook.accessState !== 'active');

  return (
    <div className="space-y-6">
      <PageTitle
        title="Aprendizaje"
        subtitle="Biblioteca de recursos, paquetes SCORM y workbooks digitales con acceso diferenciado por rol."
      />

      <StatGrid
        stats={[
          { label: 'Recursos', value: resources.length, hint: 'Biblioteca total del módulo' },
          { label: 'SCORM', value: resources.filter((resource) => resource.contentType === 'scorm').length, hint: 'Paquetes agrupados disponibles' },
          { label: 'Workbooks', value: workbooks.length, hint: 'Instancias únicas por líder' },
          {
            label: 'Habilitados',
            value: workbooks.filter((workbook) => workbook.accessState === 'active').length,
            hint: 'Editables hoy según cronograma',
          },
        ]}
      />

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              <Sparkles size={14} />
              Learning Hub 4Shine
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">Recursos individuales, SCORM y workbooks en una sola experiencia</h3>
            <p className="mt-2 text-sm text-slate-200">
              El módulo quedó preparado con metadatos flexibles de competencias, comentarios persistentes y workbooks por usuario
              que se habilitan según el cronograma del programa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-slate-100 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">Líder</p>
              <p className="mt-2 font-medium">Busca, comenta y trabaja sus workbook.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">Ishiner</p>
              <p className="mt-2 font-medium">Acompaña y edita workbooks habilitados.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">Gestor</p>
              <p className="mt-2 font-medium">Gestiona recursos y controla visibilidad.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">Admin</p>
              <p className="mt-2 font-medium">Opera con control total del módulo.</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Cargando módulo...</div>
      ) : (
        <>
          {isResourceManager && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Administración</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    {editingResourceId ? 'Editar recurso de aprendizaje' : 'Crear recurso de aprendizaje'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Los recursos quedan etiquetados con metadatos de competencias y también pueden publicarse como paquetes SCORM.
                  </p>
                </div>

                {editingResourceId && (
                  <button
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={resetResourceForm}
                    type="button"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <form className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmitResource}>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Título del recurso"
                  value={resourceForm.title}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Categoría"
                  value={resourceForm.category}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, category: event.target.value }))}
                  required
                />
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={resourceForm.contentType}
                  onChange={(event) =>
                    setResourceForm((prev) => ({ ...prev, contentType: event.target.value as ContentType }))
                  }
                >
                  {RESOURCE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {contentTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={resourceForm.status}
                  onChange={(event) =>
                    setResourceForm((prev) => ({ ...prev, status: event.target.value as ContentStatus }))
                  }
                >
                  {RESOURCE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2"
                  placeholder="URL del recurso o paquete"
                  value={resourceForm.url}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, url: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Duración"
                  value={resourceForm.durationLabel}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, durationLabel: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Tags separados por coma"
                  value={resourceForm.tagsInput}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
                />
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={resourceForm.pillar}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, pillar: event.target.value }))}
                >
                  <option value="">Pilar 4Shine</option>
                  {COMPETENCY_PILLAR_OPTIONS.map((pillar) => (
                    <option key={pillar.value} value={pillar.value}>
                      {pillar.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={resourceForm.component}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, component: event.target.value }))}
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
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={resourceForm.competency}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, competency: event.target.value }))}
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
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Etapa del programa"
                  value={resourceForm.stage}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, stage: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  placeholder="Audiencia"
                  value={resourceForm.audience}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, audience: event.target.value }))}
                />
                <textarea
                  className="min-h-28 rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2 xl:col-span-3"
                  placeholder="Descripción y contexto de uso"
                  value={resourceForm.description}
                  onChange={(event) => setResourceForm((prev) => ({ ...prev, description: event.target.value }))}
                />
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    checked={resourceForm.isRecommended}
                    onChange={(event) => setResourceForm((prev) => ({ ...prev, isRecommended: event.target.checked }))}
                    type="checkbox"
                  />
                  Marcar como recomendado
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2 xl:col-span-2">
                  {resourceForm.competency ? (
                    <>
                      <p className="font-semibold text-slate-800">Conductas observables vinculadas</p>
                      <p className="mt-1">
                        {getObservableBehaviors(resourceForm.pillar, resourceForm.component, resourceForm.competency).length} conductas
                        cargadas desde el mapa 4Shine.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">Mapa de competencias 4Shine</p>
                      <p className="mt-1">Selecciona pilar, componente y competencia para etiquetar el recurso con el mapa oficial.</p>
                    </>
                  )}
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                  disabled={submittingResource}
                  type="submit"
                >
                  {editingResourceId ? <Save size={16} /> : <Plus size={16} />}
                  {editingResourceId ? 'Guardar cambios' : 'Crear recurso'}
                </button>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recursos</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Biblioteca individual + paquetes SCORM</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Los líderes e ishiners pueden buscar, filtrar, visualizar y comentar. Los gestores y admins administran el catálogo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm xl:col-span-2">
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <Search size={16} />
                  <input
                    className="w-full bg-transparent py-1 text-sm text-slate-900 outline-none"
                    placeholder="Buscar por título, categoría, tags o competencia"
                    value={resourceSearch}
                    onChange={(event) => setResourceSearch(event.target.value)}
                  />
                </label>
              </div>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none"
                value={resourceTypeFilter}
                onChange={(event) => setResourceTypeFilter(event.target.value as 'all' | ContentType)}
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
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none"
                  value={resourceStatusFilter}
                  onChange={(event) => setResourceStatusFilter(event.target.value as 'all' | ContentStatus)}
                >
                  <option value="all">Todos los estados</option>
                  {RESOURCE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none"
                  value={resourcePillarFilter}
                  onChange={(event) => setResourcePillarFilter(event.target.value)}
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
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-700">
                    <Layers3 size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Paquetes SCORM destacados</h4>
                    <p className="text-sm text-slate-600">Disponibles como agrupadores de contenido dentro del programa.</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {scormResources.slice(0, 3).map((resource) => (
                    <button
                      key={resource.contentId}
                      className="rounded-2xl border border-amber-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => setSelectedResourceId(resource.contentId)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">SCORM</p>
                          <h5 className="mt-2 font-semibold text-slate-900">{resource.title}</h5>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${resourceBadgeClasses(resource.status)}`}>
                          {statusLabel(resource.status)}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{resource.description ?? 'Sin descripción disponible.'}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span>{resource.durationLabel ?? 'Duración flexible'}</span>
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
                      className={`rounded-3xl border p-5 shadow-sm transition ${
                        selectedResource?.contentId === resource.contentId
                          ? 'border-slate-900 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button className="text-left" onClick={() => setSelectedResourceId(resource.contentId)} type="button">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                selectedResource?.contentId === resource.contentId
                                  ? 'border border-white/15 bg-white/10 text-white'
                                  : resourceBadgeClasses(resource.status)
                              }`}
                            >
                              {statusLabel(resource.status)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                selectedResource?.contentId === resource.contentId
                                  ? 'border border-white/15 bg-white/10 text-white'
                                  : 'border border-slate-200 bg-slate-50 text-slate-600'
                              }`}
                            >
                              {contentTypeLabel(resource.contentType)}
                            </span>
                            {resource.isRecommended && (
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  selectedResource?.contentId === resource.contentId
                                    ? 'border border-amber-300/40 bg-amber-400/10 text-amber-100'
                                    : 'border border-amber-200 bg-amber-50 text-amber-700'
                                }`}
                              >
                                Recomendado
                              </span>
                            )}
                          </div>
                          <h4 className="mt-3 text-lg font-semibold">{resource.title}</h4>
                          <p
                            className={`mt-2 text-sm ${
                              selectedResource?.contentId === resource.contentId ? 'text-slate-200' : 'text-slate-600'
                            }`}
                          >
                            {resource.description ?? 'Sin descripción disponible.'}
                          </p>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          {isResourceManager && (
                            <>
                              <button
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                                  selectedResource?.contentId === resource.contentId
                                    ? 'border border-white/15 bg-white/10 text-white'
                                    : 'border border-slate-200 bg-slate-50 text-slate-700'
                                }`}
                                onClick={() => populateResourceForm(resource)}
                                type="button"
                              >
                                <Pencil size={15} />
                                Editar
                              </button>
                              <button
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                                  selectedResource?.contentId === resource.contentId
                                    ? 'border border-rose-300/20 bg-rose-500/10 text-rose-100'
                                    : 'border border-rose-200 bg-rose-50 text-rose-700'
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
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                                selectedResource?.contentId === resource.contentId
                                  ? 'border border-white/15 bg-white/10 text-white'
                                  : 'border border-slate-200 bg-slate-50 text-slate-700'
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
                          selectedResource?.contentId === resource.contentId ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        <span>{resource.category}</span>
                        <span>{resource.durationLabel ?? 'Sin duración'}</span>
                        <span>{pillarLabel(resource.competencyMetadata.pillar)}</span>
                        <span>{resource.comments.length} comentarios</span>
                        <span>{resource.progressPercent}% avance</span>
                      </div>

                      {isResourceManager && (
                        <div className="mt-4">
                          <select
                            className={`rounded-xl px-3 py-2 text-sm outline-none ${
                              selectedResource?.contentId === resource.contentId
                                ? 'border border-white/15 bg-white/10 text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                            value={resource.status}
                            onChange={(event) => void onChangeResourceStatus(resource, event.target.value as ContentStatus)}
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

                <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {selectedResource ? (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Detalle</p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-900">{selectedResource.title}</h4>
                        <p className="mt-2 text-sm text-slate-600">{selectedResource.description ?? 'Sin descripción disponible.'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Autor</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{selectedResource.authorName ?? '4Shine'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Publicado</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{formatDate(selectedResource.publishedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Componente</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {selectedResource.competencyMetadata.component ?? 'Sin definir'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Competencia</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {selectedResource.competencyMetadata.competency ?? 'Sin definir'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Metadatos</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                            {pillarLabel(selectedResource.competencyMetadata.pillar)}
                          </span>
                          {(selectedResource.tags.length ? selectedResource.tags : ['Sin tags']).map((tag) => (
                            <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Etapa</p>
                            <p className="mt-2 text-sm text-slate-700">{selectedResource.competencyMetadata.stage ?? 'Sin definir'}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Audiencia</p>
                            <p className="mt-2 text-sm text-slate-700">{selectedResource.competencyMetadata.audience ?? 'Liderazgo'}</p>
                          </div>
                        </div>
                        {selectedResourceBehaviors.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Conductas observables</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                              {selectedResourceBehaviors.map((behavior) => (
                                <li key={behavior} className="rounded-xl bg-white px-3 py-2">
                                  {behavior}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Comentarios</p>
                            <p className="mt-1 text-sm text-slate-500">Conversación sobre el recurso entre líderes, ishiners y equipo gestor.</p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                            <MessageCircle size={14} />
                            {selectedResource.comments.length}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {selectedResource.comments.length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Todavía no hay comentarios en este recurso.</p>
                          ) : (
                            selectedResource.comments.map((comment) => (
                              <article key={comment.commentId} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{comment.authorName}</p>
                                    <p className="text-xs text-slate-500">{roleLabel(comment.authorRole)}</p>
                                  </div>
                                  <span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">{comment.commentText}</p>
                              </article>
                            ))
                          )}
                        </div>

                        <div className="mt-4 space-y-3">
                          <textarea
                            className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                            placeholder="Escribe un comentario sobre este recurso"
                            value={commentDrafts[selectedResource.contentId] ?? ''}
                            onChange={(event) =>
                              setCommentDrafts((prev) => ({
                                ...prev,
                                [selectedResource.contentId]: event.target.value,
                              }))
                            }
                          />
                          <button
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            onClick={() => void onSubmitComment(selectedResource)}
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workbooks</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">10 workbooks digitales únicos por líder</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Se habilitan según cronograma. Líderes e ishiners editan campos permitidos; gestores y admins administran visibilidad,
                  habilitación y eliminación.
                </p>
              </div>
              <Link
                href="/dashboard/aprendizaje/workbooks-v2"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <BookOpen size={16} />
                Abrir biblioteca digital v2
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-slate-500">
                      <Search size={16} />
                      <input
                        className="w-full bg-transparent py-1 text-sm text-slate-900 outline-none"
                        placeholder="Buscar workbook por título, usuario o pilar"
                        value={workbookSearch}
                        onChange={(event) => setWorkbookSearch(event.target.value)}
                      />
                    </label>
                  </div>
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none"
                    value={workbookOwnerFilter}
                    onChange={(event) => setWorkbookOwnerFilter(event.target.value)}
                    disabled={currentRole === 'lider'}
                  >
                    <option value="all">Todos los líderes</option>
                    {workbookOwners.map((owner) => (
                      <option key={owner.userId} value={owner.userId}>
                        {owner.ownerName}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredWorkbooks.length === 0 ? (
                  <EmptyState message="No hay workbooks disponibles con este filtro." />
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {filteredWorkbooks.map((workbook) => (
                      <button
                        key={workbook.workbookId}
                        className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                          selectedWorkbook?.workbookId === workbook.workbookId
                            ? 'border-slate-900 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedWorkbookId(workbook.workbookId)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                                selectedWorkbook?.workbookId === workbook.workbookId ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              Workbook {String(workbook.sequenceNo).padStart(2, '0')}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold">{workbook.title}</h4>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${workbookStateClasses(workbook.accessState)}`}>
                            {workbookStateLabel(workbook.accessState)}
                          </span>
                        </div>

                        <p
                          className={`mt-3 text-sm ${
                            selectedWorkbook?.workbookId === workbook.workbookId ? 'text-slate-200' : 'text-slate-600'
                          }`}
                        >
                          {workbook.description ?? 'Sin descripción disponible.'}
                        </p>

                        <div
                          className={`mt-4 flex flex-wrap items-center gap-4 text-xs ${
                            selectedWorkbook?.workbookId === workbook.workbookId ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          <span>{workbook.ownerName}</span>
                          <span>{pillarLabel(workbook.pillarCode)}</span>
                          <span>{workbook.completionPercent}% completado</span>
                          <span>{formatDate(workbook.availableFrom)}</span>
                          {workbookCatalogBySlug.has(workbook.templateCode.toLowerCase()) && <span>Versión digital</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {selectedWorkbook ? (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Editor</p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-900">{selectedWorkbook.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedWorkbook.ownerName} · {pillarLabel(selectedWorkbook.pillarCode)} · {selectedWorkbook.workbookId}
                        </p>
                        {selectedWorkbookDigital && (
                          <p className="mt-2 text-sm text-slate-500">
                            Digital: {selectedWorkbookDigital.code} · {selectedWorkbookDigital.statusLabel}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${workbookStateClasses(selectedWorkbook.accessState)}`}>
                        {workbookStateLabel(selectedWorkbook.accessState)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Disponible desde</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">{formatDateTime(selectedWorkbook.availableFrom)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Última descarga</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">{formatDateTime(selectedWorkbook.lastDownloadedAt)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <input
                        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        value={workbookEditor.title}
                        onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, title: event.target.value }))}
                        disabled={!isWorkbookManager}
                        placeholder="Título del workbook"
                      />
                      <textarea
                        className="min-h-24 rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        value={workbookEditor.description}
                        onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, description: event.target.value }))}
                        disabled={!isWorkbookManager}
                        placeholder="Descripción del workbook"
                      />
                    </div>

                    {isWorkbookManager && (
                      <div className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                          <ShieldCheck size={16} />
                          Controles de gestión
                        </div>
                        <input
                          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                          type="datetime-local"
                          value={workbookEditor.availableFrom}
                          onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, availableFrom: event.target.value }))}
                        />
                        <label className="flex items-center gap-3 text-sm text-slate-700">
                          <input
                            checked={workbookEditor.isEnabled}
                            onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, isEnabled: event.target.checked }))}
                            type="checkbox"
                          />
                          Workbook habilitado
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-700">
                          <input
                            checked={workbookEditor.isHidden}
                            onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, isHidden: event.target.checked }))}
                            type="checkbox"
                          />
                          Ocultar para líder e ishiner
                        </label>
                      </div>
                    )}

                    <div className="space-y-3">
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Foco actual del líder"
                        value={workbookEditor.currentFocus}
                        onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, currentFocus: event.target.value }))}
                        disabled={workbookInputsDisabled}
                      />
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Reflexión de liderazgo"
                        value={workbookEditor.leadershipReflection}
                        onChange={(event) =>
                          setWorkbookEditor((prev) => ({ ...prev, leadershipReflection: event.target.value }))
                        }
                        disabled={workbookInputsDisabled}
                      />
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Plan de acción"
                        value={workbookEditor.actionPlan}
                        onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, actionPlan: event.target.value }))}
                        disabled={workbookInputsDisabled}
                      />
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Indicadores de éxito"
                        value={workbookEditor.successMetrics}
                        onChange={(event) =>
                          setWorkbookEditor((prev) => ({ ...prev, successMetrics: event.target.value }))
                        }
                        disabled={workbookInputsDisabled}
                      />
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Notas del ishiner"
                        value={workbookEditor.ishinerNotes}
                        onChange={(event) => setWorkbookEditor((prev) => ({ ...prev, ishinerNotes: event.target.value }))}
                        disabled={workbookInputsDisabled}
                      />
                    </div>

                    {!isWorkbookManager && selectedWorkbook.accessState !== 'active' && (
                      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Este workbook todavía no está habilitado para edición según el cronograma o la configuración del programa.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        onClick={() => void onSaveWorkbook()}
                        type="button"
                        disabled={savingWorkbook || workbookInputsDisabled}
                      >
                        <Save size={16} />
                        Guardar
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => void onDownloadWorkbook()}
                        type="button"
                      >
                        <Download size={16} />
                        Descargar
                      </button>
                      {selectedWorkbookDigital && (
                        <Link
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          href={`/dashboard/aprendizaje/workbooks-v2/${selectedWorkbookDigital.slug}`}
                        >
                          <BookOpen size={16} />
                          {selectedWorkbookDigital.isImplemented ? 'Abrir versión digital' : 'Ver estado digital'}
                        </Link>
                      )}
                      {isWorkbookManager && (
                        <button
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                          onClick={() => void onDeleteWorkbook()}
                          type="button"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="Selecciona un workbook para editarlo o descargarlo." />
                )}
              </aside>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-900/5 p-3 text-slate-700">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Recursos individuales</h4>
                    <p className="text-sm text-slate-500">Videos, pódcast y documentos listos para búsqueda y comentario.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-700">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Paquetes SCORM</h4>
                    <p className="text-sm text-slate-500">Agrupados como experiencias completas de aprendizaje.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Cronograma de workbooks</h4>
                    <p className="text-sm text-slate-500">Cada líder recibe 10 workbooks únicos con habilitación gradual.</p>
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
