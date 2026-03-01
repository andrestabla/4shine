'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';

interface BrandingSettings {
  platformName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loaderText: string;
  typography: string;
}

const STORAGE_KEY = '4shine-admin-branding-v1';

const DEFAULT_SETTINGS: BrandingSettings = {
  platformName: '4Shine Platform',
  primaryColor: '#0f172a',
  accentColor: '#f59e0b',
  logoUrl: '',
  faviconUrl: '',
  loaderText: 'Cargando 4Shine...',
  typography: 'Instrument Sans',
};

export default function BrandingAdminPage() {
  const [settings, setSettings] = React.useState<BrandingSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<BrandingSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore invalid local storage payload
    }
  }, []);

  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Branding y Marca"
        subtitle="Administra estilo visual del producto (colores, logo, tipografía, loader y favicon)."
      />

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
            {saved && <p className="text-sm text-emerald-700">Configuración guardada.</p>}
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
            Esta configuración se guarda localmente en el navegador; en siguiente fase se persiste vía API.
          </p>
        </aside>
      </form>
    </div>
  );
}
