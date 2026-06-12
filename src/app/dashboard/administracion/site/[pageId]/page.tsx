'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { SiteBlockView } from '@/components/site-builder/BlockRenderer';
import {
  BLOCK_DEFINITIONS,
  BLOCK_DEFINITION_MAP,
  createBlock,
  type BlockField,
} from '@/features/site-builder/registry';
import { getSitePage, updateSitePage } from '@/features/site-builder/client';
import type { SiteBlock, SitePage } from '@/features/site-builder/types';

const PREVIEW_WIDTH = 1240;

/* ───────────────────────── Field inputs ───────────────────────── */

const inputClass =
  'w-full rounded-lg border border-[var(--app-border)] bg-transparent px-2.5 py-1.5 text-xs text-[var(--app-ink)] focus:border-[var(--app-accent)] focus:outline-none';

function ImageFieldInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { alert } = useAppDialog();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('moduleCode', 'usuarios');
      formData.append('action', 'manage');
      formData.append('pathPrefix', 'site-builder');
      const res = await fetch('/api/v1/uploads/r2', { method: 'POST', credentials: 'include', body: formData });
      const data = (await res.json()) as { ok: boolean; data?: { url?: string }; error?: string; detail?: string };
      if (!data.ok || !data.data?.url) throw new Error(data.error ?? 'No se pudo subir la imagen');
      onChange(data.data.url);
    } catch (error) {
      await alert({
        title: 'Error al subir',
        message: error instanceof Error ? error.message : 'No se pudo subir la imagen',
        tone: 'error',
      });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          title="Subir imagen"
          className="flex h-7 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
        >
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-16 w-full rounded-lg border border-[var(--app-border)] object-cover" />
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: BlockField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    case 'textarea':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={field.key === 'body' || field.key === 'html' ? 6 : 3}
          className={`${inputClass} resize-y font-[inherit]`}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={inputClass}
        />
      );
    case 'toggle':
      return (
        <button
          type="button"
          role="switch"
          aria-checked={value === true}
          onClick={() => onChange(value !== true)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            value === true ? 'bg-[var(--app-accent)]' : 'bg-[var(--app-border)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              value === true ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      );
    case 'select':
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#0D1B2A'}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-[var(--app-border)] bg-transparent p-0.5"
          />
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#5b2d8a"
            className={inputClass}
          />
        </div>
      );
    case 'image':
      return <ImageFieldInput value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    case 'list': {
      const list = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      const itemLabel = field.itemLabel ?? 'Elemento';
      const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= list.length) return;
        const next = [...list];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onChange(next);
      };
      return (
        <div className="space-y-2">
          {list.map((item, index) => (
            <div key={index} className="rounded-lg border border-[var(--app-border)] p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  {itemLabel} {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveItem(index, index - 1)} disabled={index === 0} className="text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-30">
                    <ChevronUp size={13} />
                  </button>
                  <button type="button" onClick={() => moveItem(index, index + 1)} disabled={index === list.length - 1} className="text-[var(--app-muted)] hover:text-[var(--app-ink)] disabled:opacity-30">
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(list.filter((_, i) => i !== index))}
                    className="text-[var(--app-muted)] hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {(field.itemFields ?? []).map((itemField) => (
                <div key={itemField.key} className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--app-muted)]">{itemField.label}</label>
                  <FieldInput
                    field={itemField}
                    value={item[itemField.key]}
                    onChange={(next) => {
                      const updated = [...list];
                      updated[index] = { ...item, [itemField.key]: next };
                      onChange(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const empty: Record<string, unknown> = {};
              for (const itemField of field.itemFields ?? []) {
                empty[itemField.key] = itemField.type === 'toggle' ? false : '';
              }
              onChange([...list, empty]);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--app-border)] py-1.5 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
          >
            <Plus size={13} />
            Agregar {itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }
    default:
      return null;
  }
}

/* ───────────────────────── Editor page ───────────────────────── */

export default function SiteBuilderEditorPage() {
  const params = useParams<{ pageId: string }>();
  const router = useRouter();
  const { can } = useUser();
  const { alert, confirm } = useAppDialog();
  const canEdit = can('usuarios', 'manage');

  const [page, setPage] = React.useState<SitePage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [panelMode, setPanelMode] = React.useState<'block' | 'page'>('page');
  const [showPalette, setShowPalette] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const [previewScale, setPreviewScale] = React.useState(0.5);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(Math.min(1, (el.clientWidth - 16) / PREVIEW_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  React.useEffect(() => {
    void (async () => {
      const res = await getSitePage(params.pageId);
      if (res.ok && res.data) {
        setPage(res.data);
      } else {
        setLoadError(res.error ?? 'No se pudo cargar la página');
      }
      setIsLoading(false);
    })();
  }, [params.pageId]);

  const mutatePage = (updater: (prev: SitePage) => SitePage) => {
    setPage((prev) => (prev ? updater(prev) : prev));
    setIsDirty(true);
  };

  const mutateSections = (updater: (sections: SiteBlock[]) => SiteBlock[]) => {
    mutatePage((prev) => ({ ...prev, sections: updater(prev.sections) }));
  };

  const selectedBlock = page?.sections.find((b) => b.blockId === selectedId) ?? null;
  const selectedDef = selectedBlock ? BLOCK_DEFINITION_MAP[selectedBlock.type] : null;

  const handleSave = async () => {
    if (!page || isSaving) return;
    setIsSaving(true);
    const res = await updateSitePage(page.pageId, {
      title: page.title,
      slug: page.isSystem ? undefined : page.slug,
      navLabel: page.navLabel,
      showInNav: page.showInNav,
      isVisible: page.isVisible,
      useBuilder: page.useBuilder,
      sections: page.sections,
      seo: page.seo,
    });
    if (res.ok && res.data) {
      setPage(res.data);
      setIsDirty(false);
    } else {
      await alert({ title: 'Error', message: res.error ?? 'No se pudo guardar', tone: 'error' });
    }
    setIsSaving(false);
  };

  const handleBack = async () => {
    if (isDirty) {
      const leave = await confirm({
        title: 'Cambios sin guardar',
        message: 'Tienes cambios sin guardar. ¿Salir de todas formas?',
        tone: 'warning',
        confirmText: 'Salir sin guardar',
      });
      if (!leave) return;
    }
    router.push('/dashboard/administracion/site');
  };

  const addBlock = (type: SiteBlock['type']) => {
    const block = createBlock(type);
    mutateSections((sections) => [...sections, block]);
    setSelectedId(block.blockId);
    setPanelMode('block');
    setShowPalette(false);
  };

  const moveBlock = (from: number, to: number) => {
    if (!page || to < 0 || to >= page.sections.length) return;
    mutateSections((sections) => {
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const duplicateBlock = (index: number) => {
    mutateSections((sections) => {
      const source = sections[index];
      const copy: SiteBlock = {
        ...createBlock(source.type),
        props: JSON.parse(JSON.stringify(source.props)) as SiteBlock['props'],
        isVisible: source.isVisible,
      };
      const next = [...sections];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removeBlock = (index: number) => {
    mutateSections((sections) => sections.filter((_, i) => i !== index));
    setSelectedId(null);
  };

  const updateBlockProp = (key: string, value: unknown) => {
    if (!selectedBlock) return;
    mutateSections((sections) =>
      sections.map((b) => (b.blockId === selectedBlock.blockId ? { ...b, props: { ...b.props, [key]: value } } : b)),
    );
  };

  if (isLoading) {
    return (
      <div className="app-panel p-6 flex items-center gap-3 text-[var(--app-muted)]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Cargando editor...</span>
      </div>
    );
  }

  if (loadError || !page) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {loadError ?? 'Página no encontrada'}
        </div>
        <Link href="/dashboard/administracion/site" className="app-button-primary inline-flex">
          <ArrowLeft size={15} />
          Volver a Site
        </Link>
      </div>
    );
  }

  const publicPath = page.slug ? `/${page.slug}` : '/';

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => void handleBack()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-muted)] transition hover:text-[var(--app-ink)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-[var(--app-ink)]">{page.title}</h1>
            <p className="text-xs text-[var(--app-muted)] font-mono">{publicPath}</p>
          </div>
          {isDirty && (
            <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              Sin guardar
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {page.isSystem && !page.useBuilder && (
            <span className="hidden md:inline text-[11px] text-[var(--app-muted)]">
              El sitio muestra la versión original — activa “Usar builder” en ajustes de página.
            </span>
          )}
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 text-xs font-semibold text-[var(--app-ink)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
          >
            <ExternalLink size={13} />
            Ver página
          </a>
          {canEdit && (
            <button type="button" onClick={() => void handleSave()} disabled={!isDirty || isSaving} className="app-button-primary">
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Left: block list + palette */}
        <div className="flex w-60 shrink-0 flex-col gap-3 overflow-y-auto">
          <div className="app-panel p-3 space-y-1.5">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Bloques</span>
              <button
                type="button"
                onClick={() => setPanelMode('page')}
                title="Ajustes de página"
                className={`flex h-6 w-6 items-center justify-center rounded transition ${
                  panelMode === 'page' ? 'bg-[var(--app-surface)] text-[var(--app-accent)]' : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                }`}
              >
                <Settings size={13} />
              </button>
            </div>
            {page.sections.length === 0 && (
              <p className="px-1 py-2 text-xs text-[var(--app-muted)]">Aún no hay bloques. Agrega el primero.</p>
            )}
            {page.sections.map((block, index) => {
              const def = BLOCK_DEFINITION_MAP[block.type];
              const isSelected = selectedId === block.blockId && panelMode === 'block';
              return (
                <div
                  key={block.blockId}
                  draggable={canEdit}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== index) {
                      moveBlock(dragIndex, index);
                      setDragIndex(index);
                    }
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  onClick={() => {
                    setSelectedId(block.blockId);
                    setPanelMode('block');
                  }}
                  className={`group flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-2 transition ${
                    isSelected
                      ? 'border-[var(--app-accent)] bg-[var(--app-surface)]'
                      : 'border-[var(--app-border)] hover:border-[var(--app-accent)]'
                  } ${block.isVisible ? '' : 'opacity-50'}`}
                >
                  <GripVertical size={13} className="shrink-0 cursor-grab text-[var(--app-muted)]" />
                  <span className="flex-1 truncate text-xs font-semibold text-[var(--app-ink)]">
                    {def?.label ?? block.type}
                  </span>
                  {canEdit && (
                    <span className="hidden items-center gap-0.5 group-hover:flex">
                      <button
                        type="button"
                        title={block.isVisible ? 'Ocultar bloque' : 'Mostrar bloque'}
                        onClick={(e) => {
                          e.stopPropagation();
                          mutateSections((sections) =>
                            sections.map((b) => (b.blockId === block.blockId ? { ...b, isVisible: !b.isVisible } : b)),
                          );
                        }}
                        className="text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                      >
                        {block.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        type="button"
                        title="Duplicar"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(index);
                        }}
                        className="text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(index);
                        }}
                        className="text-[var(--app-muted)] hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowPalette((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--app-border)] py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
              >
                {showPalette ? <X size={13} /> : <Plus size={13} />}
                {showPalette ? 'Cerrar' : 'Agregar bloque'}
              </button>
            )}
          </div>

          {showPalette && (
            <div className="app-panel p-3 space-y-1.5">
              <span className="block px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Tipos de bloque
              </span>
              {BLOCK_DEFINITIONS.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => addBlock(def.type)}
                  className="w-full rounded-lg border border-[var(--app-border)] px-2.5 py-2 text-left transition hover:border-[var(--app-accent)]"
                >
                  <span className="block text-xs font-semibold text-[var(--app-ink)]">{def.label}</span>
                  <span className="block text-[11px] leading-snug text-[var(--app-muted)]">{def.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: live preview */}
        <div ref={previewContainerRef} className="app-panel min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
          <div
            style={{
              width: PREVIEW_WIDTH,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              height: 'fit-content',
            }}
          >
            <div className="overflow-hidden rounded-xl border border-[var(--app-border)]" style={{ background: 'var(--brand-dark)' }}>
              {page.sections.length === 0 ? (
                <div className="flex h-[420px] items-center justify-center text-white/50">
                  <p className="text-lg">Agrega bloques para construir la página</p>
                </div>
              ) : (
                page.sections.map((block) => {
                  const isSelected = selectedId === block.blockId && panelMode === 'block';
                  return (
                    <div
                      key={block.blockId}
                      onClick={() => {
                        setSelectedId(block.blockId);
                        setPanelMode('block');
                      }}
                      className={`relative cursor-pointer transition ${block.isVisible ? '' : 'opacity-40'}`}
                      style={isSelected ? { outline: '3px solid var(--app-accent, #D4AF37)', outlineOffset: '-3px' } : undefined}
                    >
                      <SiteBlockView block={block} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: properties panel */}
        <div className="w-72 shrink-0 overflow-y-auto">
          <div className="app-panel p-4 space-y-3">
            {panelMode === 'block' && selectedBlock && selectedDef ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--app-ink)]">{selectedDef.label}</h3>
                  <button
                    type="button"
                    onClick={() => setPanelMode('page')}
                    className="text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                    title="Ajustes de página"
                  >
                    <Settings size={14} />
                  </button>
                </div>
                {selectedDef.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--app-muted)]">{field.label}</label>
                    <FieldInput
                      field={field}
                      value={selectedBlock.props[field.key]}
                      onChange={(next) => updateBlockProp(field.key, next)}
                    />
                    {field.help && <p className="text-[10px] text-[var(--app-muted)]">{field.help}</p>}
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-[var(--app-ink)]">Ajustes de página</h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--app-muted)]">Título</label>
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => mutatePage((prev) => ({ ...prev, title: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--app-muted)]">Slug (URL)</label>
                  <input
                    type="text"
                    value={page.slug}
                    disabled={page.isSystem}
                    onChange={(e) => mutatePage((prev) => ({ ...prev, slug: e.target.value }))}
                    className={`${inputClass} font-mono disabled:opacity-50`}
                  />
                  {page.isSystem && (
                    <p className="text-[10px] text-[var(--app-muted)]">Las páginas del sistema mantienen su URL.</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--app-muted)]">Etiqueta en el menú</label>
                  <input
                    type="text"
                    value={page.navLabel}
                    onChange={(e) => mutatePage((prev) => ({ ...prev, navLabel: e.target.value }))}
                    placeholder={page.title}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-semibold text-[var(--app-muted)]">Mostrar en el menú</span>
                  <FieldInput
                    field={{ key: 'showInNav', label: '', type: 'toggle' }}
                    value={page.showInNav}
                    onChange={(next) => mutatePage((prev) => ({ ...prev, showInNav: next === true }))}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-semibold text-[var(--app-muted)]">Página visible</span>
                  <FieldInput
                    field={{ key: 'isVisible', label: '', type: 'toggle' }}
                    value={page.isVisible}
                    onChange={(next) => mutatePage((prev) => ({ ...prev, isVisible: next === true }))}
                  />
                </div>
                {page.isSystem && (
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--app-ink)]">Usar builder</span>
                      <FieldInput
                        field={{ key: 'useBuilder', label: '', type: 'toggle' }}
                        value={page.useBuilder}
                        onChange={(next) => mutatePage((prev) => ({ ...prev, useBuilder: next === true }))}
                      />
                    </div>
                    <p className="text-[10px] leading-snug text-[var(--app-muted)]">
                      Activado: el sitio muestra los bloques de este editor. Desactivado: muestra la versión original codificada de la página.
                    </p>
                  </div>
                )}
                <div className="border-t border-[var(--app-border)] pt-3 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">SEO</span>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--app-muted)]">Meta título</label>
                    <input
                      type="text"
                      value={page.seo.metaTitle ?? ''}
                      onChange={(e) => mutatePage((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--app-muted)]">Meta descripción</label>
                    <textarea
                      value={page.seo.metaDescription ?? ''}
                      onChange={(e) =>
                        mutatePage((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))
                      }
                      rows={3}
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
