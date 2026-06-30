'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Layers,
  Loader2,
  Lock,
  Menu,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  createSitePage,
  deleteSitePage,
  listSitePages,
  updateSitePage,
  type SitePageSummary,
} from '@/features/site-builder/client';

const ALWAYS_ACTIVE_PAGES = [
  { label: 'Acceso (Login)', path: '/acceso', description: 'Inicio de sesión — siempre activa.' },
  { label: 'Verificación', path: '/verificar', description: 'Verificación de correo electrónico — siempre activa.' },
];

function pagePath(page: SitePageSummary): string {
  return page.slug ? `/${page.slug}` : '/';
}

export default function SitePage() {
  const { can } = useUser();
  const { alert, confirm } = useAppDialog();
  const canEdit = can('usuarios', 'manage');

  const [pages, setPages] = React.useState<SitePageSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const [showCreate, setShowCreate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newSlug, setNewSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const loadPages = React.useCallback(async () => {
    const res = await listSitePages();
    if (res.ok && res.data) {
      setPages(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error ?? 'No se pudieron cargar las páginas');
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const patchPage = async (page: SitePageSummary, patch: Parameters<typeof updateSitePage>[1]) => {
    setSavingId(page.pageId);
    const res = await updateSitePage(page.pageId, patch);
    if (res.ok && res.data) {
      setPages((prev) =>
        prev.map((p) =>
          p.pageId === page.pageId
            ? { ...p, ...patch, sectionsCount: res.data!.sections.length, updatedAt: res.data!.updatedAt }
            : p,
        ),
      );
    } else {
      await alert({ title: 'Error', message: res.error ?? 'No se pudo guardar', tone: 'error' });
    }
    setSavingId(null);
  };

  // Mueve una página arriba/abajo; el orden representa el del menú superior público.
  const movePage = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= pages.length || savingId) return;

    const reordered = [...pages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    const withOrder = reordered.map((p, i) => ({ ...p, navOrder: i }));
    const changed = withOrder.filter((p) => {
      const orig = pages.find((o) => o.pageId === p.pageId);
      return orig && orig.navOrder !== p.navOrder;
    });

    setPages(withOrder); // optimista
    setSavingId(moved.pageId);
    const results = await Promise.all(
      changed.map((p) => updateSitePage(p.pageId, { navOrder: p.navOrder })),
    );
    setSavingId(null);
    if (results.some((r) => !r.ok)) {
      await alert({ title: 'Error', message: 'No se pudo guardar el nuevo orden.', tone: 'error' });
      void loadPages();
    }
  };

  const handleDelete = async (page: SitePageSummary) => {
    const ok = await confirm({
      title: 'Eliminar página',
      message: `¿Eliminar definitivamente la página "${page.title}" (${pagePath(page)})? Esta acción no se puede deshacer.`,
      tone: 'error',
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    setSavingId(page.pageId);
    const res = await deleteSitePage(page.pageId);
    if (res.ok) {
      setPages((prev) => prev.filter((p) => p.pageId !== page.pageId));
    } else {
      await alert({ title: 'Error', message: res.error ?? 'No se pudo eliminar', tone: 'error' });
    }
    setSavingId(null);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || isCreating) return;
    setIsCreating(true);
    const res = await createSitePage({ title: newTitle.trim(), slug: newSlug.trim() });
    if (res.ok && res.data) {
      setShowCreate(false);
      setNewTitle('');
      setNewSlug('');
      setSlugTouched(false);
      window.location.href = `/dashboard/administracion/site/${res.data.pageId}`;
      return;
    }
    await alert({ title: 'Error', message: res.error ?? 'No se pudo crear la página', tone: 'error' });
    setIsCreating(false);
  };

  const suggestedSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Site"
          subtitle="Gestiona las páginas del sitio público: crea, edita su contenido por bloques, ocúltalas o elimínalas."
        />
        {canEdit && (
          <button type="button" onClick={() => setShowCreate(true)} className="app-button-primary shrink-0">
            <Plus size={15} />
            Nueva página
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="app-panel p-6 flex items-center gap-3 text-[var(--app-muted)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando páginas...</span>
        </div>
      ) : loadError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {loadError}. Verifica que la migración del site builder esté aplicada.
        </div>
      ) : (
        <>
          <div className="app-panel divide-y divide-[var(--app-border)]">
            {pages.map((page, index) => {
              const saving = savingId === page.pageId;
              return (
                <div key={page.pageId} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--app-surface)] border border-[var(--app-border)]">
                    {page.isSystem ? (
                      <Globe size={16} className="text-[var(--app-muted)]" />
                    ) : (
                      <Layers size={16} className="text-[var(--app-accent)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--app-ink)]">{page.title}</span>
                      <span className="text-xs text-[var(--app-muted)] font-mono">{pagePath(page)}</span>
                      <a
                        href={pagePath(page)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--app-muted)] hover:text-[var(--app-accent)] transition-colors"
                        title={`Abrir ${pagePath(page)}`}
                      >
                        <ExternalLink size={11} />
                      </a>
                      {page.isSystem && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-muted)]">
                          Sistema
                        </span>
                      )}
                      {page.useBuilder && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
                          Builder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--app-muted)] mt-0.5">
                      {page.sectionsCount} bloque{page.sectionsCount === 1 ? '' : 's'}
                      {page.showInNav ? ' · en menú' : ' · fuera del menú'}
                      {page.isVisible ? '' : ' · oculta'}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {saving && <Loader2 size={14} className="animate-spin text-[var(--app-muted)]" />}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => void movePage(index, -1)}
                          disabled={savingId !== null || index === 0}
                          title="Subir (antes en el menú)"
                          className="flex h-4 w-7 items-center justify-center rounded-t-md border border-[var(--app-border)] text-[var(--app-muted)] transition hover:text-[var(--app-accent)] disabled:opacity-30 disabled:hover:text-[var(--app-muted)]"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void movePage(index, 1)}
                          disabled={savingId !== null || index === pages.length - 1}
                          title="Bajar (después en el menú)"
                          className="-mt-px flex h-4 w-7 items-center justify-center rounded-b-md border border-[var(--app-border)] text-[var(--app-muted)] transition hover:text-[var(--app-accent)] disabled:opacity-30 disabled:hover:text-[var(--app-muted)]"
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void patchPage(page, { showInNav: !page.showInNav })}
                        disabled={saving}
                        title={page.showInNav ? 'Quitar del menú' : 'Mostrar en menú'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          page.showInNav
                            ? 'border-[var(--app-accent)] text-[var(--app-accent)]'
                            : 'border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                        }`}
                      >
                        <Menu size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void patchPage(page, { isVisible: !page.isVisible })}
                        disabled={saving}
                        title={page.isVisible ? 'Ocultar página' : 'Mostrar página'}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                          page.isVisible
                            ? 'border-emerald-300 text-emerald-600'
                            : 'border-red-200 text-red-500'
                        }`}
                      >
                        {page.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <Link
                        href={`/dashboard/administracion/site/${page.pageId}`}
                        title="Editar contenido"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-xs font-semibold text-[var(--app-ink)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
                      >
                        <Pencil size={13} />
                        Editar
                      </Link>
                      {!page.isSystem && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(page)}
                          disabled={saving}
                          title="Eliminar página"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-red-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {!canEdit && (
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        page.isVisible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {page.isVisible ? 'Activa' : 'Oculta'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider px-1 mb-2">
              Páginas siempre activas
            </p>
            <div className="app-panel divide-y divide-[var(--app-border)]">
              {ALWAYS_ACTIVE_PAGES.map((page) => (
                <div key={page.path} className="flex items-center gap-4 px-5 py-4 opacity-60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--app-surface)] border border-[var(--app-border)]">
                    <Lock size={14} className="text-[var(--app-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--app-ink)]">{page.label}</span>
                      <span className="text-xs text-[var(--app-muted)] font-mono">{page.path}</span>
                    </div>
                    <p className="text-xs text-[var(--app-muted)] mt-0.5">{page.description}</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--app-surface)] text-[var(--app-muted)] border border-[var(--app-border)]">
                    Siempre activa
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="app-panel w-full max-w-md p-6 space-y-4 bg-[var(--app-bg)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--app-ink)]">Nueva página</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-muted)]">Título</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!slugTouched) setNewSlug(suggestedSlug(e.target.value));
                }}
                placeholder="Ej. Casos de éxito"
                className="w-full rounded-lg border border-[var(--app-border)] bg-transparent px-3 py-2 text-sm text-[var(--app-ink)] focus:border-[var(--app-accent)] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--app-muted)]">URL (slug)</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[var(--app-muted)]">/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setNewSlug(suggestedSlug(e.target.value));
                  }}
                  placeholder="casos-de-exito"
                  className="w-full rounded-lg border border-[var(--app-border)] bg-transparent px-3 py-2 text-sm font-mono text-[var(--app-ink)] focus:border-[var(--app-accent)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={!newTitle.trim() || isCreating}
                className="app-button-primary"
              >
                {isCreating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Crear y editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
