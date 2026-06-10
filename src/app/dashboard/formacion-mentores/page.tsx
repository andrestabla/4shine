'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { LearningResourceCard } from '@/components/aprendizaje/LearningResourceCard';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  listLearningResources,
  getLearningResourceDetail,
  type LearningResourceRecord,
} from '@/features/aprendizaje/client';
import {
  createContent,
  deleteContent,
  updateContent,
  type ContentStatus,
  type ContentType,
} from '@/features/content/client';

const SCOPE = 'formacion_mentores' as const;
const PAGE_SIZE = 18;

const TYPE_OPTIONS: ContentType[] = [
  'scorm',
  'video',
  'pdf',
  'article',
  'podcast',
  'html',
  'ppt',
];

const TYPE_LABELS: Record<ContentType, string> = {
  video: 'Video',
  pdf: 'PDF',
  scorm: 'Curso (SCORM)',
  article: 'Artículo',
  podcast: 'Podcast',
  html: 'HTML',
  ppt: 'Presentación',
  activity: 'Actividad',
  assignment: 'Tarea',
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
  rejected: 'Rechazado',
};

const ACCEPT_BY_CONTENT_TYPE: Partial<Record<ContentType, string>> = {
  video: 'video/*',
  pdf: 'application/pdf',
  scorm: '.zip,application/zip,application/x-zip-compressed',
  podcast: 'audio/*',
  html: 'text/html,.html,.htm',
  ppt: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

interface CourseFormState {
  title: string;
  category: string;
  contentType: ContentType;
  url: string;
  description: string;
  durationLabel: string;
  status: ContentStatus;
}

const EMPTY_FORM: CourseFormState = {
  title: '',
  category: 'Curso',
  contentType: 'scorm',
  url: '',
  description: '',
  durationLabel: '',
  status: 'draft',
};

export default function FormacionMentoresPage() {
  const { can, refreshBootstrap } = useUser();
  const { alert, confirm } = useAppDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editRequestedId = searchParams.get('edit');

  const [items, setItems] = React.useState<LearningResourceRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | ContentStatus>('all');

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CourseFormState>(EMPTY_FORM);

  const canCreate = can(SCOPE, 'create');
  const canUpdate = can(SCOPE, 'update');
  const canDelete = can(SCOPE, 'delete');
  const canApprove = can(SCOPE, 'approve');
  const canManage = canCreate || canUpdate || canDelete;

  const deferredSearch = React.useDeferredValue(search);

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

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLearningResources({
        scope: SCOPE,
        q: deferredSearch,
        status: canManage && statusFilter !== 'all' ? statusFilter : null,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (loadError) {
      await showError('No se pudieron cargar los cursos de formación', loadError);
    } finally {
      setLoading(false);
    }
  }, [canManage, deferredSearch, page, statusFilter, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Resetea a página 1 cuando cambian filtros/búsqueda
  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const populateFormFromRecord = React.useCallback((record: LearningResourceRecord) => {
    setEditingId(record.contentId);
    setForm({
      title: record.title,
      category: record.category,
      contentType: record.contentType,
      url: record.url ?? '',
      description: record.description ?? '',
      durationLabel: record.durationLabel ?? '',
      status: record.status,
    });
    setEditorOpen(true);
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (contentId: string) => {
    const existing = items.find((item) => item.contentId === contentId);
    if (existing) {
      populateFormFromRecord(existing);
    }
  };

  // Si llegamos desde el detalle con `?edit=<id>`, abrimos automáticamente el
  // editor (mismo patrón que la página de aprendizaje).
  React.useEffect(() => {
    if (!editRequestedId || !canUpdate || editorOpen) return;
    let cancelled = false;
    const openRequested = async () => {
      try {
        const record =
          items.find((item) => item.contentId === editRequestedId) ??
          (await getLearningResourceDetail(editRequestedId));
        if (cancelled) return;
        populateFormFromRecord(record);
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete('edit');
        const nextQuery = nextParams.toString();
        router.replace(
          nextQuery ? `/dashboard/formacion-mentores?${nextQuery}` : '/dashboard/formacion-mentores',
          { scroll: false },
        );
      } catch (error) {
        if (!cancelled) {
          void showError('No se pudo abrir el curso para edición', error);
        }
      }
    };
    void openRequested();
    return () => {
      cancelled = true;
    };
  }, [editRequestedId, canUpdate, editorOpen, items, populateFormFromRecord, router, searchParams, showError]);

  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.category.trim()) {
      await alert({
        title: 'Completa los datos base',
        message: 'Agrega al menos un título y una categoría para guardar el curso.',
        tone: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateContent(editingId, {
          title: form.title.trim(),
          category: form.category.trim(),
          contentType: form.contentType,
          url: form.url.trim() || null,
          description: form.description.trim() || null,
          durationLabel: form.durationLabel.trim() || null,
          status: form.status,
        });
      } else {
        await createContent({
          scope: SCOPE,
          title: form.title.trim(),
          category: form.category.trim(),
          contentType: form.contentType,
          url: form.url.trim() || null,
          description: form.description.trim() || null,
          durationLabel: form.durationLabel.trim() || null,
          status: form.status,
        });
      }
      setEditorOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (submitError) {
      await showError('No se pudo guardar el curso', submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (contentId: string) => {
    const target = items.find((item) => item.contentId === contentId);
    const accepted = await confirm({
      title: 'Eliminar curso',
      message: target
        ? `¿Deseas eliminar "${target.title}"? Esta acción no se puede deshacer.`
        : '¿Deseas eliminar este curso? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!accepted) return;
    try {
      await deleteContent(contentId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar el curso', deleteError);
    }
  };

  const visibleStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = total === 0 ? 0 : visibleStart + items.length - 1;
  const paginationItems = React.useMemo(() => {
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Formación Advisers"
          subtitle="Cursos y recursos de capacitación para Advisers activos."
        />
        {canCreate && (
          <button
            type="button"
            className="app-button-primary inline-flex items-center gap-2"
            onClick={openCreate}
          >
            <Plus size={15} />
            Nuevo curso
          </button>
        )}
      </div>

      <section className="app-panel p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              type="text"
              className="w-full rounded-[12px] border border-[var(--app-border)] bg-white pl-9 pr-3 py-2 text-sm"
              placeholder="Buscar por título, categoría o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <select
              className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ContentStatus)}
            >
              <option value="all">Todos los estados</option>
              {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          )}
          <p className="self-center text-xs text-[var(--app-muted)]">
            {total === 0
              ? 'Sin resultados'
              : `Mostrando ${visibleStart}-${visibleEnd} de ${total}`}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="app-panel p-6 text-center text-sm text-[var(--app-muted)]">
          Cargando cursos…
        </div>
      ) : items.length === 0 ? (
        <section className="app-panel p-6">
          <EmptyState
            message={
              canCreate
                ? 'Aún no hay cursos de formación. Crea el primero con el botón "Nuevo curso".'
                : 'Aún no hay cursos publicados para Advisers.'
            }
          />
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {items.map((item) => (
              <LearningResourceCard
                key={item.contentId}
                resource={item}
                href={`/dashboard/formacion-mentores/${item.contentId}`}
                canManage={canManage}
                onEdit={canUpdate ? openEdit : undefined}
                onDelete={canDelete ? onDelete : undefined}
              />
            ))}
          </section>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--app-border)] bg-white/82 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--app-muted)]">
                Página {page} de {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>
                {paginationItems.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={
                      pageNumber === page
                        ? 'inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white'
                        : 'inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white px-4 text-sm font-semibold text-[var(--app-ink)]'
                    }
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editorOpen && canManage && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={closeEditor}
        >
          <div
            className="w-full max-w-2xl rounded-t-[24px] bg-white shadow-2xl sm:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--brand-primary)]/10">
                  {editingId ? (
                    <Pencil size={15} className="text-[var(--brand-primary)]" />
                  ) : (
                    <Plus size={15} className="text-[var(--brand-primary)]" />
                  )}
                </div>
                <h3 className="text-lg font-black text-[var(--app-ink)]">
                  {editingId ? 'Editar curso' : 'Nuevo curso'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <form className="space-y-4 p-5" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="app-field-label">Título</span>
                  <input
                    className="app-input"
                    placeholder="Ej. Acompañamiento del adviser en sesión 1"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="app-field-label">Categoría</span>
                  <input
                    className="app-input"
                    placeholder="Ej. Curso, Masterclass, Ruta…"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="app-field-label">Tipo</span>
                  <select
                    className="app-select"
                    value={form.contentType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, contentType: e.target.value as ContentType }))
                    }
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="app-field-label">Duración (opcional)</span>
                  <input
                    className="app-input"
                    placeholder="Ej. 45 min, 1 h, 2 sesiones"
                    value={form.durationLabel}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationLabel: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="app-field-label">Estado</span>
                  <select
                    className="app-select"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ContentStatus }))}
                  >
                    <option value="draft">{STATUS_LABELS.draft}</option>
                    <option value="pending_review">{STATUS_LABELS.pending_review}</option>
                    {canApprove && <option value="published">{STATUS_LABELS.published}</option>}
                    <option value="archived">{STATUS_LABELS.archived}</option>
                    {canApprove && <option value="rejected">{STATUS_LABELS.rejected}</option>}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="app-field-label">URL del curso (opcional)</span>
                  <input
                    className="app-input"
                    placeholder="https://… o sube el archivo abajo"
                    value={form.url}
                    onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  />
                </label>
                <div className="text-right">
                  <R2UploadButton
                    moduleCode={SCOPE}
                    action={editingId ? 'update' : 'create'}
                    fieldName="contentUrl"
                    entityTable="app_learning.content_items"
                    pathPrefix={`contenido/${SCOPE}/${form.contentType}`}
                    accept={ACCEPT_BY_CONTENT_TYPE[form.contentType]}
                    buttonLabel="Subir archivo a R2"
                    className="app-button-secondary inline-flex items-center gap-1.5"
                    onUploaded={(url) => setForm((prev) => ({ ...prev, url }))}
                  />
                </div>
              </div>

              <label className="block">
                <span className="app-field-label">Descripción (opcional)</span>
                <textarea
                  className="app-textarea min-h-24"
                  placeholder="Resumen breve del curso, objetivos y a quién va dirigido."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>

              <div className="flex flex-col-reverse justify-end gap-2 border-t border-[var(--app-border)] pt-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-ink)]"
                  onClick={closeEditor}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="app-button-primary inline-flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting
                    ? editingId
                      ? 'Guardando…'
                      : 'Creando…'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
