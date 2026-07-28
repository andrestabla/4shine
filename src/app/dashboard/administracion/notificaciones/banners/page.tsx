'use client';

// Constructor premium de banners: piezas destacadas que se muestran EN LÍNEA
// en la parte superior de un módulo del dashboard (a diferencia de los popups,
// que son modales). Cada banner se puede dirigir a roles específicos, a una
// audiencia por estado de suscripción (p. ej. líderes SIN plan activo) y a
// módulos concretos. Comparte la tabla y API de popups (display_mode='banner').

import React from 'react';
import { Megaphone, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { BannerCard } from '@/components/popups/BannerRuntime';
import { MODULE_CATALOG } from '@/features/modulos/catalog';
import {
  createPopup,
  deletePopup,
  listPopups,
  updatePopup,
  type BannerStyle,
  type PopupFrequency,
  type PopupRecord,
  type PopupRole,
  type PopupSubscriptionTarget,
} from '@/features/popups/client';
import {
  BANNER_STYLE_LABELS,
  POPUP_FREQUENCY_LABELS,
  POPUP_ROLES,
  POPUP_ROLE_LABELS,
  SUBSCRIPTION_TARGET_LABELS,
} from '@/features/popups/types';

interface EditorState {
  popupId: string | null;
  name: string;
  isActive: boolean;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  bannerStyle: BannerStyle;
  targetRoles: PopupRole[];
  targetSubscription: PopupSubscriptionTarget;
  targetAllModules: boolean;
  targetPaths: string[];
  frequency: PopupFrequency;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  ctaColor: string;
  imageUrl: string;
  minHeight: number;
}

const EMPTY: EditorState = {
  popupId: null,
  name: '',
  isActive: true,
  title: '',
  message: '',
  ctaLabel: '',
  ctaUrl: '',
  bannerStyle: 'brand',
  targetRoles: [],
  targetSubscription: 'any',
  targetAllModules: false,
  targetPaths: ['/dashboard'],
  frequency: 'session',
  bgStart: '#0D1B2A',
  bgEnd: '#1A1F2B',
  textColor: '#FFFFFF',
  ctaColor: '#D4AF37',
  imageUrl: '',
  minHeight: 0,
};

// Módulos elegibles como destino (top-level del catálogo).
const MODULE_OPTIONS = MODULE_CATALOG.filter((m) => m.key !== 'usuarios').map((m) => ({
  label: m.label,
  path: m.path,
}));

export default function BannerBuilderPage() {
  const { confirm, alert } = useAppDialog();
  const [banners, setBanners] = React.useState<PopupRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editor, setEditor] = React.useState<EditorState | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('moduleCode', 'usuarios');
      fd.append('action', 'manage');
      fd.append('pathPrefix', 'banners');
      const res = await fetch('/api/v1/uploads/r2', { method: 'POST', body: fd });
      const json = await res.json();
      const url: string | undefined = json?.data?.url;
      if (!res.ok || !url) throw new Error(json?.detail || json?.error || 'No se pudo subir la imagen.');
      setEditor((p) => (p ? { ...p, imageUrl: url } : p));
    } catch (err) {
      await alert({ title: 'Error al subir', message: err instanceof Error ? err.message : 'Error inesperado.', tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await listPopups();
    if (res.ok && res.data) setBanners(res.data.filter((p) => p.displayMode === 'banner'));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => setEditor({ ...EMPTY });
  const startEdit = (b: PopupRecord) =>
    setEditor({
      popupId: b.popupId,
      name: b.name,
      isActive: b.isActive,
      title: b.title,
      message: b.message,
      ctaLabel: b.ctaLabel,
      ctaUrl: b.ctaUrl,
      bannerStyle: b.bannerStyle,
      targetRoles: b.targetRoles,
      targetSubscription: b.targetSubscription,
      targetAllModules: b.targetMode === 'all',
      targetPaths: b.targetPaths.length > 0 ? b.targetPaths : ['/dashboard'],
      frequency: b.frequency,
      bgStart: b.bannerBgStart || '#0D1B2A',
      bgEnd: b.bannerBgEnd || '#1A1F2B',
      textColor: b.bannerTextColor || '#FFFFFF',
      ctaColor: b.bannerCtaColor || '#D4AF37',
      imageUrl: b.bannerImageUrl,
      minHeight: b.bannerMinHeight,
    });

  const save = async () => {
    if (!editor) return;
    if (!editor.title.trim()) {
      await alert({ title: 'Falta el título', message: 'El banner necesita al menos un título.', tone: 'warning' });
      return;
    }
    if (!editor.targetAllModules && editor.targetPaths.length === 0) {
      await alert({ title: 'Falta el destino', message: 'Elige al menos un módulo o marca "Todos los módulos".', tone: 'warning' });
      return;
    }
    setSaving(true);
    const payload = {
      name: editor.name.trim() || editor.title.trim(),
      isActive: editor.isActive,
      displayMode: 'banner' as const,
      bannerStyle: editor.bannerStyle,
      triggerType: 'immediate' as const,
      title: editor.title.trim(),
      message: editor.message.trim(),
      ctaLabel: editor.ctaLabel.trim(),
      ctaUrl: editor.ctaUrl.trim(),
      dismissLabel: '',
      targetRoles: editor.targetRoles,
      targetSubscription: editor.targetSubscription,
      targetMode: (editor.targetAllModules ? 'all' : 'include') as 'all' | 'include',
      targetPaths: editor.targetAllModules ? [] : editor.targetPaths,
      frequency: editor.frequency,
      bannerBgStart: editor.bannerStyle === 'custom' ? editor.bgStart : '',
      bannerBgEnd: editor.bannerStyle === 'custom' ? editor.bgEnd : '',
      bannerTextColor: editor.bannerStyle === 'custom' ? editor.textColor : '',
      bannerCtaColor: editor.bannerStyle === 'custom' ? editor.ctaColor : '',
      bannerImageUrl: editor.imageUrl.trim(),
      bannerMinHeight: editor.minHeight,
    };
    const res = editor.popupId
      ? await updatePopup(editor.popupId, payload)
      : await createPopup(payload);
    setSaving(false);
    if (!res.ok) {
      await alert({ title: 'No se pudo guardar', message: res.error ?? 'Error inesperado.', tone: 'error' });
      return;
    }
    setEditor(null);
    await load();
  };

  const toggleActive = async (b: PopupRecord) => {
    const res = await updatePopup(b.popupId, { isActive: !b.isActive });
    if (res.ok && res.data) setBanners((prev) => prev.map((x) => (x.popupId === b.popupId ? res.data! : x)));
  };

  const remove = async (b: PopupRecord) => {
    const ok = await confirm({
      title: 'Eliminar banner',
      message: `¿Eliminar el banner "${b.name || b.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!ok) return;
    const res = await deletePopup(b.popupId);
    if (res.ok) setBanners((prev) => prev.filter((x) => x.popupId !== b.popupId));
  };

  const toggleRole = (role: PopupRole) =>
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            targetRoles: prev.targetRoles.includes(role)
              ? prev.targetRoles.filter((r) => r !== role)
              : [...prev.targetRoles, role],
          }
        : prev,
    );

  const togglePath = (path: string) =>
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            targetPaths: prev.targetPaths.includes(path)
              ? prev.targetPaths.filter((p) => p !== path)
              : [...prev.targetPaths, path],
          }
        : prev,
    );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Banner Builder"
        subtitle="Crea banners premium que se destacan dentro de un módulo, dirigidos a roles y audiencias específicas."
      />

      {/* ── Editor ─────────────────────────────────────────────────────── */}
      {editor ? (
        <section className="app-panel space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="app-section-kicker">{editor.popupId ? 'Editar banner' : 'Nuevo banner'}</p>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              onClick={() => setEditor(null)}
            >
              Cancelar
            </button>
          </div>

          {/* Vista previa en vivo */}
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Vista previa</p>
            <BannerCard
              title={editor.title || 'Título del banner'}
              message={editor.message || 'Mensaje del banner: cuenta en una línea qué gana el usuario.'}
              ctaLabel={editor.ctaLabel || 'Acción'}
              ctaUrl={editor.ctaUrl || '#'}
              style={editor.bannerStyle}
              visuals={{
                bgStart: editor.bgStart,
                bgEnd: editor.bgEnd,
                textColor: editor.textColor,
                ctaColor: editor.ctaColor,
                imageUrl: editor.imageUrl.trim(),
                minHeight: editor.minHeight,
              }}
              onDismiss={() => undefined}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm md:col-span-2"
              placeholder="Nombre interno (solo admin)"
              value={editor.name}
              onChange={(e) => setEditor((p) => (p ? { ...p, name: e.target.value } : p))}
            />
            <input
              className="rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm md:col-span-2"
              placeholder="Título visible"
              value={editor.title}
              onChange={(e) => setEditor((p) => (p ? { ...p, title: e.target.value } : p))}
            />
            <textarea
              className="min-h-[64px] rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm md:col-span-2"
              placeholder="Mensaje"
              value={editor.message}
              onChange={(e) => setEditor((p) => (p ? { ...p, message: e.target.value } : p))}
            />
            <input
              className="rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
              placeholder="Texto del botón (CTA)"
              value={editor.ctaLabel}
              onChange={(e) => setEditor((p) => (p ? { ...p, ctaLabel: e.target.value } : p))}
            />
            <input
              className="rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
              placeholder="URL del botón (p. ej. /dashboard/comprar-sesiones)"
              value={editor.ctaUrl}
              onChange={(e) => setEditor((p) => (p ? { ...p, ctaUrl: e.target.value } : p))}
            />
          </div>

          {/* Estilo */}
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Estilo</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(BANNER_STYLE_LABELS) as BannerStyle[]).map((styleKey) => (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => setEditor((p) => (p ? { ...p, bannerStyle: styleKey } : p))}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                    editor.bannerStyle === styleKey
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                      : 'border-[var(--app-border)] bg-white text-[var(--app-muted)]'
                  }`}
                >
                  {BANNER_STYLE_LABELS[styleKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Colores personalizados */}
          {editor.bannerStyle === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ['bgStart', 'Fondo (inicio)'],
                ['bgEnd', 'Fondo (fin)'],
                ['textColor', 'Texto'],
                ['ctaColor', 'Botón'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-white px-3 py-2">
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                    value={editor[key]}
                    onChange={(e) => setEditor((p) => (p ? { ...p, [key]: e.target.value } : p))}
                  />
                  <span className="text-xs font-semibold text-[var(--app-muted)]">{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Imagen de fondo + altura */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Imagen de fondo (opcional)</p>
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                  placeholder="URL de la imagen"
                  value={editor.imageUrl}
                  onChange={(e) => setEditor((p) => (p ? { ...p, imageUrl: e.target.value } : p))}
                />
                <label className="inline-flex shrink-0 cursor-pointer items-center rounded-[14px] border border-[var(--app-border)] bg-white px-3 py-2.5 text-xs font-bold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]">
                  {uploading ? 'Subiendo…' : 'Subir'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => void onUploadImage(e)} />
                </label>
                {editor.imageUrl && (
                  <button
                    type="button"
                    className="shrink-0 rounded-[14px] border border-[var(--app-border)] px-3 text-xs font-semibold text-[var(--app-muted)]"
                    onClick={() => setEditor((p) => (p ? { ...p, imageUrl: '' } : p))}
                  >
                    Quitar
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-[var(--app-muted)]">La imagen va al fondo (cover) con un velo del color elegido para que el texto se lea.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Altura</p>
              <div className="flex flex-wrap items-center gap-2">
                {([
                  [0, 'Auto'],
                  [120, 'Compacto'],
                  [180, 'Medio'],
                  [260, 'Hero'],
                ] as const).map(([px, label]) => (
                  <button
                    key={px}
                    type="button"
                    onClick={() => setEditor((p) => (p ? { ...p, minHeight: px } : p))}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      editor.minHeight === px
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                        : 'border-[var(--app-border)] bg-white text-[var(--app-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <input
                  type="number"
                  min={0}
                  max={640}
                  className="w-24 rounded-[14px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
                  value={editor.minHeight}
                  onChange={(e) => setEditor((p) => (p ? { ...p, minHeight: Math.max(0, Math.min(640, Number(e.target.value) || 0)) } : p))}
                />
                <span className="text-xs text-[var(--app-muted)]">px (0 = auto)</span>
              </div>
            </div>
          </div>

          {/* Audiencia */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">
                Roles (vacío = todos)
              </p>
              <div className="flex flex-wrap gap-2">
                {POPUP_ROLES.map((role) => (
                  <label
                    key={role}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      editor.targetRoles.includes(role)
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                        : 'border-[var(--app-border)] bg-white text-[var(--app-muted)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={editor.targetRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {POPUP_ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Suscripción</p>
              <select
                className="w-full rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm"
                value={editor.targetSubscription}
                onChange={(e) =>
                  setEditor((p) => (p ? { ...p, targetSubscription: e.target.value as PopupSubscriptionTarget } : p))
                }
              >
                {(Object.keys(SUBSCRIPTION_TARGET_LABELS) as PopupSubscriptionTarget[]).map((k) => (
                  <option key={k} value={k}>
                    {SUBSCRIPTION_TARGET_LABELS[k]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--app-muted)]">
                «Sin suscripción activa» = usuarios sin plan vigente (p. ej. líderes que pueden comprar sesiones).
              </p>
            </div>
          </div>

          {/* Módulos destino */}
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--app-muted)]">Módulos donde aparece</p>
            <label className="mb-2 flex items-center gap-2 text-sm text-[var(--app-ink)]">
              <input
                type="checkbox"
                checked={editor.targetAllModules}
                onChange={(e) => setEditor((p) => (p ? { ...p, targetAllModules: e.target.checked } : p))}
              />
              Todos los módulos
            </label>
            {!editor.targetAllModules && (
              <div className="flex flex-wrap gap-2">
                {MODULE_OPTIONS.map((m) => (
                  <label
                    key={m.path}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      editor.targetPaths.includes(m.path)
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                        : 'border-[var(--app-border)] bg-white text-[var(--app-muted)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={editor.targetPaths.includes(m.path)}
                      onChange={() => togglePath(m.path)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Frecuencia + activo + guardar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-[var(--app-muted)]">Al cerrarse, reaparece:</span>
                <select
                  className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
                  value={editor.frequency}
                  onChange={(e) => setEditor((p) => (p ? { ...p, frequency: e.target.value as PopupFrequency } : p))}
                >
                  <option value="session">En la próxima sesión</option>
                  <option value="daily">Al día siguiente</option>
                  <option value="once">Nunca (una sola vez)</option>
                  <option value="always">Siempre</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
                <input
                  type="checkbox"
                  checked={editor.isActive}
                  onChange={(e) => setEditor((p) => (p ? { ...p, isActive: e.target.checked } : p))}
                />
                Activo
              </label>
            </div>
            <button
              type="button"
              className="app-button-primary disabled:opacity-60"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? 'Guardando…' : editor.popupId ? 'Guardar cambios' : 'Crear banner'}
            </button>
          </div>
        </section>
      ) : (
        <button type="button" className="app-button-primary inline-flex items-center gap-2" onClick={startCreate}>
          <Plus size={16} /> Nuevo banner
        </button>
      )}

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {loading ? (
          <div className="app-panel p-6 text-sm text-[var(--app-muted)]">Cargando…</div>
        ) : banners.length === 0 ? (
          <div className="app-panel flex items-center gap-3 p-6">
            <Megaphone size={18} className="text-[var(--app-muted)]" />
            <p className="text-sm text-[var(--app-muted)]">Aún no hay banners. Crea el primero.</p>
          </div>
        ) : (
          banners.map((b) => (
            <div key={b.popupId} className="app-panel space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  />
                  <p className="text-sm font-bold text-[var(--app-ink)]">{b.name || b.title}</p>
                  <span className="text-xs text-[var(--app-muted)]">
                    {b.targetRoles.length > 0
                      ? b.targetRoles.map((r) => POPUP_ROLE_LABELS[r]).join(', ')
                      : 'Todos los roles'}
                    {' · '}
                    {SUBSCRIPTION_TARGET_LABELS[b.targetSubscription]}
                    {' · '}
                    {b.targetMode === 'all' ? 'Todos los módulos' : b.targetPaths.join(', ')}
                    {' · '}
                    {POPUP_FREQUENCY_LABELS[b.frequency]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title={b.isActive ? 'Desactivar' : 'Activar'}
                    className="rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                    onClick={() => void toggleActive(b)}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    type="button"
                    title="Editar"
                    className="rounded-full border border-[var(--app-border)] p-2 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                    onClick={() => startEdit(b)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    className="rounded-full border border-red-200 p-2 text-red-500 hover:bg-red-50"
                    onClick={() => void remove(b)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <BannerCard
                title={b.title}
                message={b.message}
                ctaLabel={b.ctaLabel}
                ctaUrl={b.ctaUrl}
                style={b.bannerStyle}
                visuals={{
                  bgStart: b.bannerBgStart,
                  bgEnd: b.bannerBgEnd,
                  textColor: b.bannerTextColor,
                  ctaColor: b.bannerCtaColor,
                  imageUrl: b.bannerImageUrl,
                  minHeight: Math.min(b.bannerMinHeight, 140),
                }}
              />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
