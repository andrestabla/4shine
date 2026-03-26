'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import type { ModuleCode } from '@/lib/permissions';
import {
  createContent,
  deleteContent,
  listContent,
  updateContent,
  type ContentItemRecord,
  type ContentScope,
  type ContentType,
} from '@/features/content/client';

const SCOPE_OPTIONS: ContentScope[] = ['aprendizaje', 'metodologia', 'formacion_mentores', 'formacion_lideres'];
const TYPE_OPTIONS: ContentType[] = ['video', 'pdf', 'scorm', 'article', 'podcast', 'html', 'ppt'];

const MODULE_BY_SCOPE: Record<ContentScope, ModuleCode> = {
  aprendizaje: 'aprendizaje',
  metodologia: 'metodologia',
  formacion_mentores: 'formacion_mentores',
  formacion_lideres: 'contenido',
};

const ACCEPT_BY_CONTENT_TYPE: Partial<Record<ContentType, string>> = {
  video: 'video/*',
  pdf: 'application/pdf',
  scorm: '.zip,application/zip,application/x-zip-compressed',
  podcast: 'audio/*',
  html: 'text/html,.html,.htm',
  ppt: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

type ScopeFilter = 'all' | ContentScope;

interface CreateFormState {
  scope: ContentScope;
  title: string;
  category: string;
  contentType: ContentType;
  url: string;
  description: string;
}

function toLocalDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ContenidoPage() {
  const { can, refreshBootstrap } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [items, setItems] = React.useState<ContentItemRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>('all');

  const creatableScopes = React.useMemo(
    () => SCOPE_OPTIONS.filter((scope) => can(MODULE_BY_SCOPE[scope], 'create')),
    [can],
  );

  const [createForm, setCreateForm] = React.useState<CreateFormState>({
    scope: 'aprendizaje',
    title: '',
    category: '',
    contentType: 'article',
    url: '',
    description: '',
  });

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

  React.useEffect(() => {
    if (creatableScopes.length && !creatableScopes.includes(createForm.scope)) {
      setCreateForm((prev) => ({
        ...prev,
        scope: creatableScopes[0],
      }));
    }
  }, [createForm.scope, creatableScopes]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listContent(scopeFilter === 'all' ? undefined : scopeFilter);
      setItems(data);
    } catch (loadError) {
      await showError('No se pudo cargar el contenido', loadError);
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.title.trim() || !createForm.category.trim()) return;

    setSubmitting(true);
    try {
      await createContent({
        scope: createForm.scope,
        title: createForm.title.trim(),
        category: createForm.category.trim(),
        contentType: createForm.contentType,
        url: createForm.url.trim() || null,
        description: createForm.description.trim() || null,
        status: 'draft',
      });

      setCreateForm((prev) => ({
        ...prev,
        title: '',
        category: '',
        url: '',
        description: '',
      }));

      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      await showError('No se pudo crear el contenido', createError);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleRecommended = async (item: ContentItemRecord) => {
    try {
      await updateContent(item.contentId, {
        isRecommended: !item.isRecommended,
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar el contenido', updateError);
    }
  };

  const onStatusChange = async (item: ContentItemRecord, status: ContentItemRecord['status']) => {
    try {
      await updateContent(item.contentId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar el contenido', updateError);
    }
  };

  const onDelete = async (item: ContentItemRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar contenido',
      message: `¿Deseas eliminar "${item.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteContent(item.contentId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar el contenido', deleteError);
    }
  };

  const onRename = async (item: ContentItemRecord) => {
    const title = await prompt({
      title: 'Renombrar contenido',
      message: 'Ingresa el nuevo título.',
      label: 'Título',
      defaultValue: item.title,
      placeholder: 'Título de contenido',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
      tone: 'info',
    });

    if (!title || !title.trim() || title.trim() === item.title) return;

    try {
      await updateContent(item.contentId, { title: title.trim() });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar el contenido', updateError);
    }
  };

  const filtered = React.useMemo(
    () => (scopeFilter === 'all' ? items : items.filter((item) => item.scope === scopeFilter)),
    [items, scopeFilter],
  );

  const canCreate = creatableScopes.length > 0;
  const canApproveAny = SCOPE_OPTIONS.some((scope) => can(MODULE_BY_SCOPE[scope], 'approve'));

  return (
    <div className="space-y-4">
      <PageTitle title="Gestión Contenido" subtitle="CRUD real para biblioteca académica y recursos de formación." />

      <StatGrid
        stats={[
          { label: 'Total', value: items.length, hint: 'Registros cargados' },
          {
            label: 'Publicado',
            value: items.filter((item) => item.status === 'published').length,
            hint: 'Contenido público',
          },
          {
            label: 'Borrador',
            value: items.filter((item) => item.status === 'draft').length,
            hint: 'Pendiente de publicar',
          },
          {
            label: 'Recomendados',
            value: items.filter((item) => item.isRecommended).length,
            hint: 'Destacados',
          },
        ]}
      />

      <section className="app-panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--app-ink)]">Filtrar alcance:</span>
          <select
            className="app-select min-h-0 w-auto px-3 py-2 text-sm"
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
          >
            <option value="all">Todos</option>
            {SCOPE_OPTIONS.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>

        {canCreate && (
          <form className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-4" onSubmit={onCreate}>
            <select
              className="app-select"
              value={createForm.scope}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, scope: event.target.value as ContentScope }))
              }
            >
              {creatableScopes.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </select>
            <input
              className="app-input md:col-span-2"
              placeholder="Título"
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <input
              className="app-input"
              placeholder="Categoría"
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              required
            />
            <select
              className="app-select"
              value={createForm.contentType}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, contentType: event.target.value as ContentType }))
              }
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              className="app-button-primary disabled:opacity-50"
              type="submit"
              disabled={submitting}
            >
              Crear
            </button>
            <input
              className="app-input md:col-span-4"
              placeholder="URL (opcional)"
              value={createForm.url}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, url: event.target.value }))}
            />
            <R2UploadButton
              moduleCode={MODULE_BY_SCOPE[createForm.scope]}
              action="create"
              fieldName="contentUrl"
              entityTable="app_learning.content_items"
              pathPrefix={`contenido/${createForm.scope}/${createForm.contentType}`}
              accept={ACCEPT_BY_CONTENT_TYPE[createForm.contentType]}
              buttonLabel="Subir a R2"
              className="app-button-secondary h-full disabled:opacity-60 inline-flex items-center justify-center gap-2"
              onUploaded={(url) => setCreateForm((prev) => ({ ...prev, url }))}
            />
            <input
              className="app-input md:col-span-6"
              placeholder="Descripción (opcional)"
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </form>
        )}
      </section>
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay contenido para el filtro seleccionado." />
      ) : (
        <div className="app-table-shell">
          <div className="overflow-x-auto">
            <table className="app-table text-sm">
              <thead>
                <tr className="text-left">
                  <th>Título</th>
                  <th>Alcance</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Recomendado</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const moduleCode = MODULE_BY_SCOPE[item.scope];
                  const canUpdateItem = can(moduleCode, 'update');
                  const canDeleteItem = can(moduleCode, 'delete');
                  const canApproveItem = can(moduleCode, 'approve');

                  return (
                    <tr key={item.contentId} className="align-top">
                      <td>
                        <p className="font-medium text-[var(--app-ink)]">{item.title}</p>
                        <p className="text-xs text-[var(--app-muted)]">{item.category}</p>
                      </td>
                      <td className="text-[var(--app-muted)]">{item.scope}</td>
                      <td className="text-[var(--app-muted)]">{item.contentType}</td>
                      <td>
                        {canUpdateItem ? (
                          <select
                            className="app-select min-h-0 px-3 py-2 text-xs"
                            value={item.status}
                            onChange={(event) =>
                              onStatusChange(item, event.target.value as ContentItemRecord['status'])
                            }
                          >
                            <option value="draft">draft</option>
                            <option value="pending_review">pending_review</option>
                            {canApproveItem && <option value="published">published</option>}
                            <option value="archived">archived</option>
                            {canApproveItem && <option value="rejected">rejected</option>}
                          </select>
                        ) : (
                          <span className="app-badge app-badge-muted">{item.status}</span>
                        )}
                      </td>
                      <td>
                        {canUpdateItem ? (
                          <input
                            type="checkbox"
                            checked={item.isRecommended}
                            onChange={() => void onToggleRecommended(item)}
                            className="h-4 w-4"
                          />
                        ) : (
                          <span className="text-xs text-[var(--app-muted)]">{item.isRecommended ? 'Sí' : 'No'}</span>
                        )}
                      </td>
                      <td className="text-xs text-[var(--app-muted)]">{toLocalDateTime(item.updatedAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {canUpdateItem && (
                            <button
                              className="app-button-secondary min-h-0 px-3 py-2 text-xs"
                              onClick={() => void onRename(item)}
                              type="button"
                            >
                              Renombrar
                            </button>
                          )}
                          {canDeleteItem && (
                            <button
                              className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              onClick={() => void onDelete(item)}
                              type="button"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canApproveAny && (
        <p className="text-xs text-[var(--app-muted)]">
          Publicación controlada por permiso <code>approve</code> por módulo.
        </p>
      )}
    </div>
  );
}
