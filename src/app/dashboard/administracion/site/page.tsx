'use client';

import React from 'react';
import { Globe, Lock, Loader2, Save, ExternalLink } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';

interface PageConfig {
  key: string;
  label: string;
  path: string;
  description: string;
}

const TOGGLEABLE_PAGES: PageConfig[] = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    description: 'Página principal de bienvenida del sitio.',
  },
  {
    key: 'descubrimiento',
    label: 'Diagnóstico de Equipo',
    path: '/descubrimiento',
    description: 'Test público de evaluación de cultura de equipo.',
  },
  {
    key: 'metodologia',
    label: 'Metodología',
    path: '/metodologia',
    description: 'Presentación pública de la metodología 4Shine.',
  },
  {
    key: 'planes_precios',
    label: 'Planes y Precios',
    path: '/planes-precios',
    description: 'Página de planes de suscripción y precios.',
  },
  {
    key: 'afiliados',
    label: 'Afiliados',
    path: '/afiliados',
    description: 'Programa de referidos y afiliados.',
  },
];

const ALWAYS_ACTIVE_PAGES = [
  {
    label: 'Acceso (Login)',
    path: '/acceso',
    description: 'Inicio de sesión — siempre activa.',
  },
  {
    label: 'Verificación',
    path: '/verificar',
    description: 'Verificación de correo electrónico — siempre activa.',
  },
];

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

export default function SitePage() {
  const { can } = useUser();
  const { alert } = useAppDialog();
  const [pages, setPages] = React.useState<Record<string, boolean>>(DEFAULT_PAGES);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/v1/modules/administracion/site', { credentials: 'include' });
        const data = (await res.json()) as { ok: boolean; pages?: Record<string, boolean> };
        if (data.ok && data.pages) setPages(data.pages);
      } catch {
        // keep defaults
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleToggle = (key: string) => {
    setPages((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/modules/administracion/site', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Error al guardar');
      setIsDirty(false);
      await alert({
        title: 'Configuración guardada',
        message: 'Los cambios en las páginas del sitio fueron aplicados.',
        tone: 'success',
      });
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo guardar',
        tone: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = can('usuarios', 'manage');

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Site"
          subtitle="Habilita u oculta las páginas públicas del sitio. Los cambios aplican de inmediato."
        />
        {canEdit && (
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={() => void handleSave()}
            className="app-button-primary shrink-0"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="app-panel p-6 flex items-center gap-3 text-[var(--app-muted)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando configuración...</span>
        </div>
      ) : (
        <>
          <div className="app-panel divide-y divide-[var(--app-border)]">
            {TOGGLEABLE_PAGES.map((page) => {
              const enabled = pages[page.key] !== false;
              return (
                <div key={page.key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--app-surface)] border border-[var(--app-border)]">
                    <Globe size={16} className="text-[var(--app-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--app-ink)]">{page.label}</span>
                      <span className="text-xs text-[var(--app-muted)] font-mono">{page.path}</span>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--app-muted)] hover:text-[var(--app-accent)] transition-colors"
                        title={`Abrir ${page.path}`}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <p className="text-xs text-[var(--app-muted)] mt-0.5">{page.description}</p>
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => handleToggle(page.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 ${
                        enabled ? 'bg-[var(--app-accent)]' : 'bg-[var(--app-border)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {enabled ? 'Activa' : 'Oculta'}
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

          {isDirty && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
              Tienes cambios sin guardar.
            </div>
          )}
        </>
      )}
    </div>
  );
}
