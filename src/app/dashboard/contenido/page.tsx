'use client';

import React from 'react';
import Link from 'next/link';
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Film,
  Globe,
  Headphones,
  Layers,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import type { ModuleCode } from '@/lib/permissions';
import { formatDate, formatDateTime } from '@/lib/format-date';
import {
  createContent,
  deleteContent,
  restoreContent,
  purgeContent,
  listContent,
  updateContent,
  type ContentItemRecord,
  type ContentScope,
  type ContentType,
} from '@/features/content/client';

const SCOPE_OPTIONS: ContentScope[] = ['aprendizaje', 'metodologia', 'formacion_mentores', 'formacion_lideres'];
const TYPE_OPTIONS: ContentType[] = ['video', 'pdf', 'scorm', 'article', 'podcast', 'html', 'ppt', 'activity', 'assignment'];

const SCOPE_LABELS: Record<ContentScope, string> = {
  aprendizaje: 'Aprendizaje',
  metodologia: 'Metodología',
  formacion_mentores: 'Formación Advisors',
  formacion_lideres: 'Formación Líderes',
};

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

const TYPE_ICONS: Record<ContentType, React.ComponentType<{ size?: number; className?: string }>> = {
  video: Film,
  pdf: FileText,
  scorm: Layers,
  article: FileText,
  podcast: Headphones,
  html: Globe,
  ppt: Presentation,
  activity: Trophy,
  assignment: ClipboardCheck,
};

const TYPE_TINTS: Record<ContentType, { bg: string; fg: string }> = {
  video: { bg: 'bg-rose-100', fg: 'text-rose-700' },
  pdf: { bg: 'bg-red-100', fg: 'text-red-700' },
  scorm: { bg: 'bg-violet-100', fg: 'text-violet-700' },
  article: { bg: 'bg-amber-100', fg: 'text-amber-700' },
  podcast: { bg: 'bg-purple-100', fg: 'text-purple-700' },
  html: { bg: 'bg-cyan-100', fg: 'text-cyan-700' },
  ppt: { bg: 'bg-orange-100', fg: 'text-orange-700' },
  activity: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
  assignment: { bg: 'bg-sky-100', fg: 'text-sky-700' },
};

const STATUS_LABELS: Record<ContentItemRecord['status'], string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
  rejected: 'Rechazado',
};

const STATUS_STYLE: Record<ContentItemRecord['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-700',
  rejected: 'bg-rose-100 text-rose-800',
};

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
type TypeFilter = 'all' | ContentType;
type StatusFilter = 'all' | ContentItemRecord['status'];

interface CreateFormState {
  scope: ContentScope;
  title: string;
  category: string;
  contentType: ContentType;
  url: string;
  description: string;
}

function toLocalDate(value: string): string {
  return formatDate(value);
}

function toRelativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return toLocalDate(value);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
}) {
  return (
    <div className="app-panel relative overflow-hidden p-4">
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full ${tint} opacity-20`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
            {label}
          </p>
          <p className="mt-1 text-3xl font-black text-[var(--app-ink)]">{value}</p>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">{hint}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${tint}`}>
          <Icon size={16} className="text-[var(--brand-primary)]" />
        </div>
      </div>
    </div>
  );
}

export default function ContenidoPage() {
  const { can, refreshBootstrap } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [items, setItems] = React.useState<ContentItemRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>('all');
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [search, setSearch] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

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
      setCreateForm((prev) => ({ ...prev, scope: creatableScopes[0] }));
    }
  }, [createForm.scope, creatableScopes]);

  const [view, setView] = React.useState<'activos' | 'papelera'>('activos');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listContent(scopeFilter === 'all' ? undefined : scopeFilter, {
        trashed: view === 'papelera',
      });
      setItems(data);
    } catch (loadError) {
      await showError('No se pudo cargar el contenido', loadError);
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, view, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Cerrar dropdown de acciones al hacer click afuera
  React.useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

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
      setCreateForm((prev) => ({ ...prev, title: '', category: '', url: '', description: '' }));
      setCreateOpen(false);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      await showError('No se pudo crear el contenido', createError);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleRecommended = async (item: ContentItemRecord) => {
    try {
      await updateContent(item.contentId, { isRecommended: !item.isRecommended });
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

  const onToggleLibrary = async (item: ContentItemRecord) => {
    try {
      await updateContent(item.contentId, { showInLibrary: !item.showInLibrary });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la visibilidad', updateError);
    }
  };

  const onDelete = async (item: ContentItemRecord) => {
    const isConfirmed = await confirm({
      title: 'Mover a la papelera',
      message: `¿Mover "${item.title}" a la papelera? Podrás restaurarlo después; no aparecerá en Aprendizaje mientras esté en la papelera.`,
      confirmText: 'Mover a papelera',
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

  const onRestore = async (item: ContentItemRecord) => {
    try {
      await restoreContent(item.contentId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (restoreError) {
      await showError('No se pudo restaurar el contenido', restoreError);
    }
  };

  const onPurge = async (item: ContentItemRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar definitivamente',
      message: `Esto borra "${item.title}" de forma permanente e irreversible. ¿Continuar?`,
      confirmText: 'Eliminar definitivamente',
      cancelText: 'Cancelar',
      tone: 'error',
    });
    if (!isConfirmed) return;
    try {
      await purgeContent(item.contentId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (purgeError) {
      await showError('No se pudo eliminar definitivamente', purgeError);
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

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
      if (typeFilter !== 'all' && item.contentType !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.category} ${item.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, scopeFilter, typeFilter, statusFilter, search]);

  const canCreate = creatableScopes.length > 0;
  const canApproveAny = SCOPE_OPTIONS.some((scope) => can(MODULE_BY_SCOPE[scope], 'approve'));

  const stats = React.useMemo(
    () => ({
      total: items.length,
      published: items.filter((i) => i.status === 'published').length,
      draft: items.filter((i) => i.status === 'draft').length,
      recommended: items.filter((i) => i.isRecommended).length,
      activities: items.filter((i) => i.contentType === 'activity').length,
    }),
    [items],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Gestión de Contenido"
          subtitle="Biblioteca académica y recursos de formación. Crea, organiza y publica."
        />
        {canCreate && (
          <button
            type="button"
            className="app-button-primary inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={15} />
            Nuevo contenido
          </button>
        )}
      </div>

      {/* Stats con branding */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          hint="Registros cargados"
          icon={Layers}
          tint="bg-[var(--brand-primary)]/10"
        />
        <StatCard
          label="Publicado"
          value={stats.published}
          hint="Contenido público"
          icon={CheckCircle2}
          tint="bg-emerald-100"
        />
        <StatCard
          label="Borrador"
          value={stats.draft}
          hint="Sin publicar"
          icon={EyeOff}
          tint="bg-slate-100"
        />
        <StatCard
          label="Recomendados"
          value={stats.recommended}
          hint="Destacados"
          icon={Star}
          tint="bg-amber-100"
        />
        <StatCard
          label="Actividades"
          value={stats.activities}
          hint="Quizzes activos"
          icon={Trophy}
          tint="bg-violet-100"
        />
      </div>

      {/* Vista: activos / papelera */}
      <div className="inline-flex rounded-full border border-[var(--app-border)] bg-white p-1">
        {([
          { key: 'activos', label: 'Activos' },
          { key: 'papelera', label: 'Papelera' },
        ] as const).map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={
              'rounded-full px-4 py-1.5 text-xs font-bold transition-colors ' +
              (view === v.key ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]')
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <section className="app-panel p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
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
          <select
            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
          >
            <option value="all">Todos los alcances</option>
            {SCOPE_OPTIONS.map((scope) => (
              <option key={scope} value={scope}>
                {SCOPE_LABELS[scope]}
              </option>
            ))}
          </select>
          <select
            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="all">Todos los tipos</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <select
            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as ContentItemRecord['status'][]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="self-center text-xs text-[var(--app-muted)]">
            <b className="text-[var(--app-ink)]">{filtered.length}</b> resultado{filtered.length === 1 ? '' : 's'}
          </p>
        </div>
      </section>

      {/* Lista de contenidos */}
      {loading ? (
        <div className="app-panel p-6 text-center text-sm text-[var(--app-muted)]">Cargando contenido…</div>
      ) : filtered.length === 0 ? (
        <section className="app-panel p-6">
          <EmptyState message="No hay contenido para el filtro seleccionado." />
        </section>
      ) : (
        <section className="app-panel overflow-hidden p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                <tr>
                  <th className="px-4 py-3">Contenido</th>
                  <th className="px-4 py-3">Alcance</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Destacado</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const Icon = TYPE_ICONS[item.contentType];
                  const tint = TYPE_TINTS[item.contentType];
                  const moduleCode = MODULE_BY_SCOPE[item.scope];
                  const canUpdateItem = can(moduleCode, 'update');
                  const canDeleteItem = can(moduleCode, 'delete');
                  const canApproveItem = can(moduleCode, 'approve');
                  return (
                    <tr
                      key={item.contentId}
                      className="border-t border-[var(--app-border)] transition hover:bg-[var(--app-surface-muted)]/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${tint.bg}`}
                          >
                            <Icon size={16} className={tint.fg} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--app-ink)]">{item.title}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--app-muted)]">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tint.bg} ${tint.fg}`}>
                                {TYPE_LABELS[item.contentType]}
                              </span>
                              <span>·</span>
                              <span>{item.category}</span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 hover:text-[var(--brand-primary)]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--app-muted)]">{SCOPE_LABELS[item.scope]}</td>
                      <td className="px-4 py-3">
                        {canUpdateItem ? (
                          <select
                            className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[item.status]}`}
                            value={item.status}
                            onChange={(e) =>
                              void onStatusChange(item, e.target.value as ContentItemRecord['status'])
                            }
                          >
                            <option value="draft">{STATUS_LABELS.draft}</option>
                            <option value="pending_review">{STATUS_LABELS.pending_review}</option>
                            {canApproveItem && <option value="published">{STATUS_LABELS.published}</option>}
                            <option value="archived">{STATUS_LABELS.archived}</option>
                            {canApproveItem && <option value="rejected">{STATUS_LABELS.rejected}</option>}
                          </select>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canUpdateItem ? (
                          <button
                            type="button"
                            onClick={() => void onToggleRecommended(item)}
                            className={`rounded-full p-1.5 transition ${
                              item.isRecommended
                                ? 'bg-amber-100 text-amber-600'
                                : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'
                            }`}
                            aria-label={item.isRecommended ? 'Quitar destacado' : 'Marcar destacado'}
                          >
                            <Star size={14} fill={item.isRecommended ? 'currentColor' : 'none'} />
                          </button>
                        ) : item.isRecommended ? (
                          <Star size={14} className="mx-auto text-amber-600" fill="currentColor" />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--app-muted)]">
                        <span title={formatDateTime(item.updatedAt)}>
                          {toRelativeTime(item.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId((prev) => (prev === item.contentId ? null : item.contentId));
                            }}
                            className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                            aria-label="Más acciones"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenuId === item.contentId && (
                            <div
                              className="absolute right-0 z-20 mt-1 w-48 rounded-[12px] border border-[var(--app-border)] bg-white p-1 shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/dashboard/aprendizaje/recursos/${item.contentId}`}
                                target="_blank"
                                className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                              >
                                <Eye size={13} />
                                Visualizar
                              </Link>
                              {canUpdateItem && item.contentType === 'activity' && (
                                <Link
                                  href={`/dashboard/contenido/${item.contentId}/actividad`}
                                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  <Trophy size={13} />
                                  Editar actividad
                                </Link>
                              )}
                              {canUpdateItem && item.contentType === 'assignment' && (
                                <Link
                                  href={`/dashboard/contenido/${item.contentId}/tarea`}
                                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  <ClipboardCheck size={13} />
                                  Editar tarea
                                </Link>
                              )}
                              {canUpdateItem && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void onRename(item);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  <Pencil size={13} />
                                  Renombrar
                                </button>
                              )}
                              {canUpdateItem && view === 'activos' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void onStatusChange(item, 'archived');
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  <Archive size={13} />
                                  Archivar
                                </button>
                              )}
                              {canUpdateItem && view === 'activos' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void onToggleLibrary(item);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  {item.showInLibrary ? <EyeOff size={13} /> : <Eye size={13} />}
                                  {item.showInLibrary ? 'Ocultar de biblioteca' : 'Mostrar en biblioteca'}
                                </button>
                              )}
                              {item.url && view === 'activos' && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                                >
                                  <ExternalLink size={13} />
                                  URL externa
                                </a>
                              )}
                              {canDeleteItem && view === 'activos' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void onDelete(item);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 size={13} />
                                  Mover a papelera
                                </button>
                              )}
                              {canDeleteItem && view === 'papelera' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void onRestore(item);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <RotateCcw size={13} />
                                    Restaurar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void onPurge(item);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 size={13} />
                                    Eliminar definitivamente
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 p-2 md:hidden">
            {filtered.map((item) => {
              const Icon = TYPE_ICONS[item.contentType];
              const tint = TYPE_TINTS[item.contentType];
              const moduleCode = MODULE_BY_SCOPE[item.scope];
              const canUpdateItem = can(moduleCode, 'update');
              const canDeleteItem = can(moduleCode, 'delete');
              return (
                <article key={item.contentId} className="rounded-[14px] border border-[var(--app-border)] bg-white p-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${tint.bg}`}>
                      <Icon size={16} className={tint.fg} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[var(--app-ink)]">{item.title}</p>
                      <p className="text-xs text-[var(--app-muted)]">
                        {SCOPE_LABELS[item.scope]} · {item.category}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tint.bg} ${tint.fg}`}>
                          {TYPE_LABELS[item.contentType]}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                        {item.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Star size={9} fill="currentColor" />
                            Destacado
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Link
                          href={`/dashboard/aprendizaje/recursos/${item.contentId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)]"
                        >
                          <Eye size={11} />
                          Visualizar
                        </Link>
                        {canUpdateItem && item.contentType === 'activity' && (
                          <Link
                            href={`/dashboard/contenido/${item.contentId}/actividad`}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--app-ink)]"
                          >
                            <Trophy size={11} />
                            Actividad
                          </Link>
                        )}
                        {canUpdateItem && item.contentType === 'assignment' && (
                          <Link
                            href={`/dashboard/contenido/${item.contentId}/tarea`}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--app-ink)]"
                          >
                            <ClipboardCheck size={11} />
                            Tarea
                          </Link>
                        )}
                        {canUpdateItem && view === 'activos' && (
                          <button
                            type="button"
                            onClick={() => void onRename(item)}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--app-ink)]"
                          >
                            <Pencil size={11} />
                            Renombrar
                          </button>
                        )}
                        {canUpdateItem && view === 'activos' && (
                          <button
                            type="button"
                            onClick={() => void onToggleLibrary(item)}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--app-ink)]"
                          >
                            {item.showInLibrary ? <EyeOff size={11} /> : <Eye size={11} />}
                            {item.showInLibrary ? 'Ocultar' : 'Mostrar'}
                          </button>
                        )}
                        {canDeleteItem && view === 'activos' && (
                          <button
                            type="button"
                            onClick={() => void onDelete(item)}
                            className="inline-flex items-center gap-1 rounded-[10px] border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600"
                          >
                            <Trash2 size={11} />
                            Papelera
                          </button>
                        )}
                        {canDeleteItem && view === 'papelera' && (
                          <>
                            <button
                              type="button"
                              onClick={() => void onRestore(item)}
                              className="inline-flex items-center gap-1 rounded-[10px] border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700"
                            >
                              <RotateCcw size={11} />
                              Restaurar
                            </button>
                            <button
                              type="button"
                              onClick={() => void onPurge(item)}
                              className="inline-flex items-center gap-1 rounded-[10px] border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600"
                            >
                              <Trash2 size={11} />
                              Eliminar def.
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {canApproveAny && (
        <p className="text-xs text-[var(--app-muted)]">
          <Eye size={11} className="mr-1 inline" />
          La publicación está controlada por permiso <code className="rounded bg-[var(--app-surface-muted)] px-1.5 py-0.5">approve</code> por módulo.
        </p>
      )}

      {/* Modal: Nuevo contenido */}
      {createOpen && canCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => !submitting && setCreateOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-t-[24px] bg-white shadow-2xl sm:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--brand-primary)]/10">
                  <Plus size={15} className="text-[var(--brand-primary)]" />
                </div>
                <h3 className="text-lg font-black text-[var(--app-ink)]">Nuevo contenido</h3>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setCreateOpen(false)}
                className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <form className="space-y-4 p-5" onSubmit={onCreate}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="app-field-label">Alcance</span>
                  <select
                    className="app-select"
                    value={createForm.scope}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, scope: e.target.value as ContentScope }))
                    }
                  >
                    {creatableScopes.map((scope) => (
                      <option key={scope} value={scope}>
                        {SCOPE_LABELS[scope]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="app-field-label">Tipo</span>
                  <select
                    className="app-select"
                    value={createForm.contentType}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, contentType: e.target.value as ContentType }))
                    }
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="app-field-label">Título</span>
                  <input
                    className="app-input"
                    placeholder="Ej. Comunicación efectiva en equipos remotos"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="app-field-label">Categoría</span>
                  <input
                    className="app-input"
                    placeholder="Ej. Masterclass, Quiz, Recurso…"
                    value={createForm.category}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
                    required
                  />
                </label>
              </div>

              {createForm.contentType === 'activity' ? (
                <div className="flex items-start gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <Trophy size={14} className="mt-0.5 shrink-0" />
                  <p>
                    Para <b>actividad</b> no se requiere URL ni archivo. Una vez creado el contenido, haz click
                    en <b>"Editar actividad"</b> del menú de acciones para configurar las preguntas (9 tipos
                    disponibles).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block">
                    <span className="app-field-label">URL del recurso (opcional)</span>
                    <input
                      className="app-input"
                      placeholder="https://… o subir archivo abajo"
                      value={createForm.url}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, url: e.target.value }))}
                    />
                  </label>
                  <div className="text-right">
                    <R2UploadButton
                      moduleCode={MODULE_BY_SCOPE[createForm.scope]}
                      action="create"
                      fieldName="contentUrl"
                      entityTable="app_learning.content_items"
                      pathPrefix={`contenido/${createForm.scope}/${createForm.contentType}`}
                      accept={ACCEPT_BY_CONTENT_TYPE[createForm.contentType]}
                      buttonLabel="Subir archivo a R2"
                      className="app-button-secondary inline-flex items-center gap-1.5"
                      onUploaded={(url) => setCreateForm((prev) => ({ ...prev, url }))}
                    />
                  </div>
                </div>
              )}

              <label className="block">
                <span className="app-field-label">Descripción (opcional)</span>
                <textarea
                  className="app-textarea min-h-20"
                  placeholder="Breve descripción del contenido."
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>

              <div className="flex flex-col-reverse justify-end gap-2 border-t border-[var(--app-border)] pt-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-[12px] border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-ink)]"
                  onClick={() => !submitting && setCreateOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="app-button-primary inline-flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? 'Creando…' : 'Crear contenido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
