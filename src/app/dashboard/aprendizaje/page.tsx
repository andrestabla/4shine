'use client';

import Link from 'next/link';
import React from 'react';
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
} from 'lucide-react';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  createLearningComment,
  listLearningResources,
  listLearningWorkbooks,
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

function buildWorkbookDigitalHref(workbook: WorkbookRecord): string {
  const params = new URLSearchParams({
    workbookId: workbook.workbookId,
    ownerName: workbook.ownerName,
  });

  return `/dashboard/aprendizaje/workbooks/${workbook.templateCode.toLowerCase()}?${params.toString()}`;
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function workbookProgressClasses(progress: number): string {
  if (progress >= 100) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
  if (progress >= 60) return 'bg-gradient-to-r from-blue-600 to-sky-500';
  if (progress >= 30) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  return 'bg-gradient-to-r from-slate-400 to-slate-300';
}

export default function AprendizajePage() {
  const { currentRole, refreshBootstrap } = useUser();
  const { alert, confirm } = useAppDialog();

  const [resources, setResources] = React.useState<LearningResourceRecord[]>([]);
  const [workbooks, setWorkbooks] = React.useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingResource, setSubmittingResource] = React.useState(false);
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

  const isResourceManager = currentRole === 'gestor' || currentRole === 'admin';

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
  const workbookCatalogBySlug = React.useMemo(
    () => new Map(WORKBOOKS_V2_CATALOG.map((item) => [item.slug.toLowerCase(), item])),
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

  return (
    <div className="space-y-6">
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
                <h3 className="mt-1 text-xl font-semibold text-slate-900">10 workbooks digitales del programa</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Entra directo a cada workbook, continúa donde ibas y revisa tu avance real sincronizado por usuario.
                </p>
              </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.7fr)]">
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
                  {currentRole === 'lider' ? (
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tu ruta</span>
                      <span className="ml-3 font-semibold text-slate-900">
                        {workbookOwners.find((owner) => owner.userId === workbookOwnerFilter)?.ownerName ?? 'Tus workbooks'}
                      </span>
                    </div>
                  ) : (
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none"
                      value={workbookOwnerFilter}
                      onChange={(event) => setWorkbookOwnerFilter(event.target.value)}
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
                      const digitalWorkbook = workbookCatalogBySlug.get(workbook.templateCode.toLowerCase()) ?? null;
                      const progress = clampPercent(workbook.completionPercent);

                      return (
                        <Link
                          key={workbook.workbookId}
                          href={buildWorkbookDigitalHref(workbook)}
                          className="group rounded-[28px] border border-slate-200 bg-white p-4 text-left text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)] sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Workbook {String(workbook.sequenceNo).padStart(2, '0')}
                              </p>
                              <h4 className="mt-2 text-xl font-semibold leading-tight transition group-hover:text-slate-700">
                                {workbook.title}
                              </h4>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${workbookStateClasses(workbook.accessState)}`}>
                              {workbookStateLabel(workbook.accessState)}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                            {digitalWorkbook?.summary ?? workbook.description ?? 'Sin descripción disponible.'}
                          </p>

                          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                              <span>Progreso real</span>
                              <span className="font-semibold text-slate-900">{progress}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                              <div className={`h-full rounded-full ${workbookProgressClasses(progress)}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            {currentRole !== 'lider' && <span>{workbook.ownerName}</span>}
                            <span>{pillarLabel(workbook.pillarCode)}</span>
                            <span>{formatDate(workbook.availableFrom)}</span>
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                              <BookOpen size={16} />
                              {progress > 0 ? 'Continuar workbook' : 'Abrir workbook'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {digitalWorkbook?.code ?? `WB${String(workbook.sequenceNo)}`}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
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
