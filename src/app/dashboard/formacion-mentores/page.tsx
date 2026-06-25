'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, Search } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { LearningResourceCard } from '@/components/aprendizaje/LearningResourceCard';
import {
  LearningCourseEditor,
  type ResourceEditorKind,
} from '@/components/aprendizaje/LearningCourseEditor';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  getLearningResourceDetail,
  listCertificateTemplates,
  listLearningResources,
  type CertificateTemplateRecord,
  type LearningResourceRecord,
} from '@/features/aprendizaje/client';
import { deleteContent, type ContentStatus } from '@/features/content/client';

const SCOPE = 'formacion_mentores' as const;
const PAGE_SIZE = 18;

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
  rejected: 'Rechazado',
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
  const [certificateTemplates, setCertificateTemplates] = React.useState<
    CertificateTemplateRecord[]
  >([]);

  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | ContentStatus>('all');

  // Estado del editor (lo monta el componente compartido <LearningCourseEditor>).
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingResource, setEditingResource] =
    React.useState<LearningResourceRecord | null>(null);
  const [editorInitialKind, setEditorInitialKind] =
    React.useState<ResourceEditorKind>('course');

  const canCreate = can(SCOPE, 'create');
  const canUpdate = can(SCOPE, 'update');
  const canDelete = can(SCOPE, 'delete');
  const canApprove = can(SCOPE, 'approve');
  const canManage = canCreate || canUpdate || canDelete;
  const isResourceManager = canCreate || canUpdate;

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
      // Las plantillas de certificado son globales; solo las pedimos si el
      // usuario tiene permisos de gestión (gestor/admin).
      const certificatesRequest = canApprove
        ? listCertificateTemplates().catch(() => [] as CertificateTemplateRecord[])
        : Promise.resolve([] as CertificateTemplateRecord[]);

      const [result, templates] = await Promise.all([
        listLearningResources({
          scope: SCOPE,
          q: deferredSearch,
          status: canManage && statusFilter !== 'all' ? statusFilter : null,
          page,
          pageSize: PAGE_SIZE,
        }),
        certificatesRequest,
      ]);
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setCertificateTemplates(templates);
    } catch (loadError) {
      await showError('No se pudieron cargar los cursos de formación', loadError);
    } finally {
      setLoading(false);
    }
  }, [canApprove, canManage, deferredSearch, page, statusFilter, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const openCreate = React.useCallback(() => {
    setEditingResource(null);
    setEditorInitialKind('course');
    setIsEditorOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (resource: LearningResourceRecord) => {
      setEditingResource(resource);
      setIsEditorOpen(true);
    },
    [],
  );

  const closeEditor = React.useCallback(() => {
    setIsEditorOpen(false);
    setEditingResource(null);
  }, []);

  const onSaved = React.useCallback(() => {
    void Promise.all([load(), refreshBootstrap()]).catch((error) => {
      console.error('Formacion mentores background refresh failed', error);
    });
  }, [load, refreshBootstrap]);

  // Soporte para `?edit=<contentId>` (lo usa la página de detalle al hacer
  // click en "Editar"): resolvemos el recurso y abrimos el editor.
  React.useEffect(() => {
    if (!editRequestedId || !canUpdate || isEditorOpen) return;
    let cancelled = false;
    const openRequested = async () => {
      try {
        const record =
          items.find((item) => item.contentId === editRequestedId) ??
          (await getLearningResourceDetail(editRequestedId));
        if (cancelled) return;
        openEdit(record);

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete('edit');
        const nextQuery = nextParams.toString();
        router.replace(
          nextQuery
            ? `/dashboard/formacion-mentores?${nextQuery}`
            : '/dashboard/formacion-mentores',
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
  }, [
    editRequestedId,
    canUpdate,
    isEditorOpen,
    items,
    openEdit,
    router,
    searchParams,
    showError,
  ]);

  const onEditById = React.useCallback(
    (contentId: string) => {
      const target = items.find((item) => item.contentId === contentId);
      if (target) openEdit(target);
    },
    [items, openEdit],
  );

  const onDelete = React.useCallback(
    async (contentId: string) => {
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
    },
    [confirm, items, load, refreshBootstrap, showError],
  );

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
          title="Formación Advisors"
          subtitle="Cursos y recursos de capacitación para Advisors activos."
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
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            />
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
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | ContentStatus)
              }
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
                : 'Aún no hay cursos publicados para Advisors.'
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
                onEdit={canUpdate ? onEditById : undefined}
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

      <LearningCourseEditor
        open={isEditorOpen}
        scope={SCOPE}
        editingResource={editingResource}
        initialKind={editorInitialKind}
        resources={items}
        certificateTemplates={certificateTemplates}
        isResourceManager={isResourceManager}
        backLabel="Volver a Formación Advisors"
        onClose={closeEditor}
        onSaved={onSaved}
      />
    </div>
  );
}
