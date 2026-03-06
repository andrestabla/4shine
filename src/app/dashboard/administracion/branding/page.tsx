'use client';

import React from 'react';
import {
  Palette,
  Sparkles,
  Type,
  PanelTop,
  PaintBucket,
  Building2,
  History,
  RotateCcw,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';
import {
  getBrandingSettings,
  listBrandingRevisions,
  revertBrandingRevision,
  updateBrandingSettings,
  type BrandingRevisionRecord,
  type BrandingSettings,
} from '@/features/administracion/client';
import {
  BRANDING_FONT_OPTIONS,
  BRANDING_PRESETS,
  DEFAULT_BRANDING_SETTINGS,
  LOGIN_LAYOUT_LABELS,
  LOGIN_LAYOUT_OPTIONS,
  type BrandingPresetCode,
} from '@/features/administracion/types';
import { deriveFocusColor, deriveHoverColor } from '@/lib/branding';

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/Bogota',
  'America/Mexico_City',
  'America/Santiago',
  'America/Lima',
  'America/New_York',
  'Europe/Madrid',
] as const;

const PAGE_WIDTH_PRESETS = ['1100px', '1260px', '1440px', '1600px', '100%'] as const;

const LOGIN_LAYOUT_DESCRIPTIONS: Record<BrandingSettings['loginLayout'], string> = {
  split: 'Panel informativo + formulario con disposición en dos columnas.',
  centered: 'Formulario centrado con bloque de mensaje superior.',
  minimal: 'Versión compacta para accesos rápidos y mobile-first.',
};

function formatDate(value: string | null): string {
  if (!value) return 'Sin cambios guardados';
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function toBrandingSettings(input: BrandingSettings): BrandingSettings {
  return {
    platformName: input.platformName,
    institutionTimezone: input.institutionTimezone,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    logoUrl: input.logoUrl,
    faviconUrl: input.faviconUrl,
    loaderText: input.loaderText,
    loaderAssetUrl: input.loaderAssetUrl,
    typography: input.typography,
    borderRadiusRem: input.borderRadiusRem,
    pageMaxWidth: input.pageMaxWidth,
    loginLayout: input.loginLayout,
    welcomeMessage: input.welcomeMessage,
    loginHeadline: input.loginHeadline,
    loginSupportMessage: input.loginSupportMessage,
    loginBackgroundImageUrl: input.loginBackgroundImageUrl,
    customCss: input.customCss,
    presetCode: input.presetCode,
  };
}

function formatRevisionReason(reason: BrandingRevisionRecord['reason']): string {
  if (reason === 'revert') return 'Reversión';
  return 'Actualización';
}

function summarizeChangedFields(fields: string[]): string {
  if (fields.length === 0) return 'Sin cambios';
  if (fields.length <= 3) return fields.join(', ');
  return `${fields.slice(0, 3).join(', ')} +${fields.length - 3}`;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 rounded border border-slate-300 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
          placeholder="#000000"
        />
      </div>
    </label>
  );
}

export default function BrandingAdminPage() {
  const { alert, confirm } = useAppDialog();
  const { applyBranding, tokens } = useBranding();
  const [settings, setSettings] = React.useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null);
  const [revisions, setRevisions] = React.useState<BrandingRevisionRecord[]>([]);
  const [revisionsLoading, setRevisionsLoading] = React.useState(true);
  const [revertingRevisionId, setRevertingRevisionId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isLoadedFromApi, setIsLoadedFromApi] = React.useState(false);

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

  const patchSettings = React.useCallback((patch: Partial<BrandingSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPreset = React.useCallback(
    (code: BrandingPresetCode) => {
      if (code === 'custom') return;
      const preset = BRANDING_PRESETS.find((item) => item.code === code);
      if (!preset) return;

      patchSettings({
        presetCode: preset.code,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
        typography: preset.typography,
        borderRadiusRem: preset.borderRadiusRem,
      });
    },
    [patchSettings],
  );

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrandingSettings();
      const next = toBrandingSettings(data);
      setSettings(next);
      setLastUpdatedAt(data.updatedAt);
      applyBranding({ ...data, ...next });
      setIsLoadedFromApi(true);
    } catch (error) {
      await showError('No se pudo cargar la configuración de branding', error);
    } finally {
      setLoading(false);
    }
  }, [applyBranding, showError]);

  const loadRevisions = React.useCallback(async () => {
    setRevisionsLoading(true);
    try {
      const data = await listBrandingRevisions(50);
      setRevisions(data);
    } catch (error) {
      await showError('No se pudo cargar el historial de branding', error);
    } finally {
      setRevisionsLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void Promise.all([loadSettings(), loadRevisions()]);
  }, [loadRevisions, loadSettings]);

  React.useEffect(() => {
    if (!isLoadedFromApi) return;
    applyBranding(settings);
  }, [applyBranding, isLoadedFromApi, settings]);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const saved = await updateBrandingSettings(settings);
      const next = toBrandingSettings(saved);

      setSettings(next);
      setLastUpdatedAt(saved.updatedAt);
      applyBranding(saved);
      void loadRevisions();

      await alert({
        title: 'Branding actualizado',
        message: 'Configuración persistida y aplicada en tiempo real en la plataforma.',
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo guardar la configuración de branding', error);
    }
  };

  const onRevertRevision = React.useCallback(
    async (revision: BrandingRevisionRecord) => {
      const approved = await confirm({
        title: 'Restaurar versión',
        message:
          'Se aplicará esta versión de branding en toda la plataforma (web/app) en tiempo real. ¿Deseas continuar?',
        tone: 'warning',
        confirmText: 'Restaurar',
        cancelText: 'Cancelar',
      });

      if (!approved) return;

      setRevertingRevisionId(revision.revisionId);
      try {
        const restored = await revertBrandingRevision(revision.revisionId);
        const next = toBrandingSettings(restored);
        setSettings(next);
        setLastUpdatedAt(restored.updatedAt);
        applyBranding(restored);
        await loadRevisions();

        await alert({
          title: 'Versión restaurada',
          message: 'El tema fue restaurado y aplicado en tiempo real.',
          tone: 'success',
        });
      } catch (error) {
        await showError('No se pudo restaurar la versión seleccionada', error);
      } finally {
        setRevertingRevisionId(null);
      }
    },
    [alert, applyBranding, confirm, loadRevisions, showError],
  );

  const hoverColor = deriveHoverColor(settings.primaryColor);
  const focusColor = deriveFocusColor(settings.primaryColor);
  const previewHasBackground = settings.loginBackgroundImageUrl.trim().length > 0;

  return (
    <div className="space-y-4">
      <PageTitle
        title="Branding y Marca"
        subtitle="Configura identidad, tema visual, login y CSS avanzado. Cambios aplicados en tiempo real (web/app)."
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando configuración...</div>
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" /> Identidad Institucional
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">
                Nombre de la Institución
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.platformName}
                  onChange={(event) => patchSettings({ platformName: event.target.value })}
                />
              </label>

              <label className="text-sm text-slate-700">
                URL del Logo
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.logoUrl}
                  onChange={(event) => patchSettings({ logoUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>

              <label className="text-sm text-slate-700">
                Huso Horario (Timezone)
                <select
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.institutionTimezone}
                  onChange={(event) => patchSettings({ institutionTimezone: event.target.value })}
                >
                  {TIMEZONE_OPTIONS.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                URL del Favicon (Icono pestaña)
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.faviconUrl}
                  onChange={(event) => patchSettings({ faviconUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-600" /> Presets Rápidos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BRANDING_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => applyPreset(preset.code)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    settings.presetCode === preset.code
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                    {preset.label}
                  </p>
                  <p className={`text-sm mt-2 ${settings.presetCode === preset.code ? 'text-slate-200' : 'text-slate-500'}`}>
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Palette size={18} className="text-blue-600" /> Colores
              </h3>

              <ColorField label="Color Primario" value={settings.primaryColor} onChange={(next) => patchSettings({ primaryColor: next, presetCode: 'custom' })} />
              <div className="text-xs text-slate-500">Genera automáticamente paletas hover/focus.</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ColorField label="Secundario" value={settings.secondaryColor} onChange={(next) => patchSettings({ secondaryColor: next, presetCode: 'custom' })} />
                <ColorField label="Acento" value={settings.accentColor} onChange={(next) => patchSettings({ accentColor: next, presetCode: 'custom' })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Hover automático</p>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: hoverColor }} />
                  <p className="text-xs mt-2 text-slate-600">{hoverColor}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Focus automático</p>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: focusColor }} />
                  <p className="text-xs mt-2 text-slate-600">{focusColor}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Type size={18} className="text-emerald-600" /> Tipografía y Forma
              </h3>

              <label className="text-sm text-slate-700">
                Fuente Principal (Google Fonts)
                <select
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.typography}
                  onChange={(event) => patchSettings({ typography: event.target.value, presetCode: 'custom' })}
                >
                  {BRANDING_FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700 block">
                Radio de Borde (Border Radius)
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  className="mt-3 w-full"
                  value={settings.borderRadiusRem}
                  onChange={(event) => patchSettings({ borderRadiusRem: Number(event.target.value), presetCode: 'custom' })}
                />
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-slate-100 rounded-md">{settings.borderRadiusRem.toFixed(1)}rem</span>
              </label>

              <label className="text-sm text-slate-700 block">
                Ancho máximo de página (Landing/Home)
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.pageMaxWidth}
                  onChange={(event) => patchSettings({ pageMaxWidth: event.target.value })}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {PAGE_WIDTH_PRESETS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      settings.pageMaxWidth === size ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-700'
                    }`}
                    onClick={() => patchSettings({ pageMaxWidth: size })}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-100 p-4 flex items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2 text-white shadow"
                  style={{ backgroundColor: settings.accentColor, borderRadius: `${settings.borderRadiusRem}rem` }}
                >
                  Botón Frontend
                </button>
                <button
                  type="button"
                  className="px-5 py-2 border"
                  style={{
                    borderColor: settings.accentColor,
                    color: settings.primaryColor,
                    borderRadius: `${settings.borderRadiusRem}rem`,
                  }}
                >
                  Outline
                </button>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <PanelTop size={18} className="text-pink-600" /> Login & Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {LOGIN_LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout}
                  type="button"
                  onClick={() => patchSettings({ loginLayout: layout })}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    settings.loginLayout === layout
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold">{LOGIN_LAYOUT_LABELS[layout]}</p>
                  <p
                    className={`text-xs mt-2 ${
                      settings.loginLayout === layout ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {LOGIN_LAYOUT_DESCRIPTIONS[layout]}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">
                Titular del Login
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.loginHeadline}
                  onChange={(event) => patchSettings({ loginHeadline: event.target.value })}
                />
              </label>

              <label className="text-sm text-slate-700">
                Mensaje de Bienvenida
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.welcomeMessage}
                  onChange={(event) => patchSettings({ welcomeMessage: event.target.value })}
                />
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                Mensaje de soporte (pie/informativo)
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.loginSupportMessage}
                  onChange={(event) => patchSettings({ loginSupportMessage: event.target.value })}
                />
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                Imagen de background login (URL)
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.loginBackgroundImageUrl}
                  onChange={(event) => patchSettings({ loginBackgroundImageUrl: event.target.value })}
                  placeholder="https://.../login-background.jpg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Si se define URL, reemplaza el fondo por imagen con overlay del tema.
                </p>
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                GIF de Carga (Platform Loader)
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.loaderAssetUrl}
                  onChange={(event) => patchSettings({ loaderAssetUrl: event.target.value })}
                  placeholder="https://.../loader.gif"
                />
                <p className="text-xs text-slate-500 mt-1">Este GIF se mostrará durante transiciones y estados de espera.</p>
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                Texto del loader
                <input
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2"
                  value={settings.loaderText}
                  onChange={(event) => patchSettings({ loaderText: event.target.value })}
                />
              </label>

              <label className="text-sm text-slate-700 md:col-span-2">
                CSS Personalizado (Avanzado)
                <textarea
                  className="mt-1 w-full min-h-28 border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs"
                  value={settings.customCss}
                  onChange={(event) => patchSettings({ customCss: event.target.value })}
                  placeholder=".sidebar { background: red !important; }"
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <PaintBucket size={18} className="text-amber-600" /> Vista previa aplicada
            </h3>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 text-white" style={{ backgroundColor: tokens.colors.primary }}>
                <p className="font-semibold">{settings.platformName}</p>
                <p className="text-xs opacity-80">{settings.typography} · {settings.institutionTimezone}</p>
              </div>
              <div
                className="p-4 bg-slate-50 space-y-3"
                style={
                  settings.loginBackgroundImageUrl
                    ? {
                        backgroundImage: `linear-gradient(115deg, rgba(15, 23, 42, 0.86), rgba(30, 41, 59, 0.72)), url("${settings.loginBackgroundImageUrl}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                <p className={`text-sm font-semibold ${previewHasBackground ? 'text-white' : 'text-slate-800'}`}>
                  {settings.loginHeadline}
                </p>
                <p className={`text-xs ${previewHasBackground ? 'text-white/80' : 'text-slate-600'}`}>
                  {settings.welcomeMessage}
                </p>
                <button
                  type="button"
                  className="px-4 py-2 text-white"
                  style={{
                    backgroundColor: tokens.colors.accent,
                    borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.1rem)`,
                  }}
                >
                  Acción primaria
                </button>
                <p className={`text-xs ${previewHasBackground ? 'text-white/70' : 'text-slate-500'}`}>
                  Layout login: {LOGIN_LAYOUT_LABELS[settings.loginLayout]}
                </p>
                <p className={`text-xs ${previewHasBackground ? 'text-white/70' : 'text-slate-500'}`}>
                  Mensaje soporte: {settings.loginSupportMessage}
                </p>
                <p className={`text-xs ${previewHasBackground ? 'text-white/70' : 'text-slate-500'}`}>
                  Ancho máximo app: {settings.pageMaxWidth}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm" type="submit">
                Guardar configuración
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 text-slate-700 px-4 py-2 text-sm"
                onClick={() => void loadSettings()}
              >
                Recargar desde DB
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Última actualización persistida: {formatDate(lastUpdatedAt)}.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <History size={18} className="text-indigo-600" /> Historial y Versionado
            </h3>

            {revisionsLoading ? (
              <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
                Cargando historial...
              </div>
            ) : revisions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
                No hay versiones guardadas aún.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="text-left">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Actor</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Campos</th>
                      <th className="px-3 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisions.map((revision) => (
                      <tr key={revision.revisionId} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                          {formatDate(revision.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {revision.createdByName ?? 'Sistema'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              revision.reason === 'revert'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {formatRevisionReason(revision.reason)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {summarizeChangedFields(revision.changedFields)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => void onRevertRevision(revision)}
                            disabled={revertingRevisionId === revision.revisionId}
                          >
                            <RotateCcw size={12} />
                            {revertingRevisionId === revision.revisionId ? 'Restaurando...' : 'Restaurar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </form>
      )}
    </div>
  );
}
