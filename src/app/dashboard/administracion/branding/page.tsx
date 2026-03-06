'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  getBrandingSettings,
  updateBrandingSettings,
  type BrandingSettings,
} from '@/features/administracion/client';
import { DEFAULT_BRANDING_SETTINGS } from '@/features/administracion/types';

function formatDate(value: string | null): string {
  if (!value) return 'Sin cambios guardados';
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BrandingAdminPage() {
  const { alert } = useAppDialog();
  const [settings, setSettings] = React.useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrandingSettings();
      setSettings({
        platformName: data.platformName,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        faviconUrl: data.faviconUrl,
        loaderText: data.loaderText,
        typography: data.typography,
      });
      setLastUpdatedAt(data.updatedAt);
    } catch (error) {
      await showError('No se pudo cargar la configuración de branding', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const saved = await updateBrandingSettings(settings);
      setSettings({
        platformName: saved.platformName,
        primaryColor: saved.primaryColor,
        accentColor: saved.accentColor,
        logoUrl: saved.logoUrl,
        faviconUrl: saved.faviconUrl,
        loaderText: saved.loaderText,
        typography: saved.typography,
      });
      setLastUpdatedAt(saved.updatedAt);
      await alert({
        title: 'Configuración guardada',
        message: 'La configuración de branding se persistió en base de datos.',
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo guardar la configuración de branding', error);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Branding y Marca"
        subtitle="Administra estilo visual del producto (colores, logo, tipografía, loader y favicon)."
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando configuración...</div>
      ) : (
        <form onSubmit={onSave} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">
                Nombre de plataforma
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={settings.platformName}
                  onChange={(event) => setSettings((prev) => ({ ...prev, platformName: event.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Tipografía
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={settings.typography}
                  onChange={(event) => setSettings((prev) => ({ ...prev, typography: event.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Color principal
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(event) => setSettings((prev) => ({ ...prev, primaryColor: event.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700">
                Color acento
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) => setSettings((prev) => ({ ...prev, accentColor: event.target.value }))}
                />
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                URL logo
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={settings.logoUrl}
                  onChange={(event) => setSettings((prev) => ({ ...prev, logoUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                URL favicon
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={settings.faviconUrl}
                  onChange={(event) => setSettings((prev) => ({ ...prev, faviconUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                Texto del loader
                <input
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
                  value={settings.loaderText}
                  onChange={(event) => setSettings((prev) => ({ ...prev, loaderText: event.target.value }))}
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm" type="submit">
                Guardar configuración
              </button>
            </div>
          </section>

          <aside className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Vista previa</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 text-white" style={{ backgroundColor: settings.primaryColor }}>
                <p className="font-semibold">{settings.platformName}</p>
                <p className="text-xs opacity-80" style={{ fontFamily: settings.typography }}>
                  {settings.typography}
                </p>
              </div>
              <div className="p-4 space-y-3 bg-slate-50">
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-slate-900"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  Botón primario
                </button>
                <p className="text-xs text-slate-500">Loader: {settings.loaderText}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Persistencia activa en base de datos. Última actualización: {formatDate(lastUpdatedAt)}.
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}
