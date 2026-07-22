'use client';

import React from 'react';
import { Lock, Power, RefreshCcw } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useModuleVisibility } from '@/context/ModuleVisibilityContext';
import {
  listModuleVisibility,
  setModuleEnabled,
  type ModuleVisibilityEntry,
} from '@/features/modulos/client';

export default function ModulosAdminPage() {
  const { alert, confirm } = useAppDialog();
  const { refresh: refreshVisibility } = useModuleVisibility();
  const [modules, setModules] = React.useState<ModuleVisibilityEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setModules(await listModuleVisibility());
    } catch (error) {
      await alert({
        title: 'No se pudo cargar el catálogo de módulos',
        message: error instanceof Error ? error.message : 'Error desconocido.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: string, label: string, nextEnabled: boolean) {
    if (!nextEnabled) {
      const ok = await confirm({
        title: `¿Apagar "${label}"?`,
        message:
          'Desaparecerá del menú y sus pantallas dejarán de abrirse para líderes, advisors y gestores. ' +
          'Tú lo seguirás viendo marcado como apagado para poder reactivarlo. Los datos no se borran.',
        tone: 'warning',
        confirmText: 'Sí, apagar',
        cancelText: 'Cancelar',
      });
      if (!ok) return;
    }

    setBusyKey(key);
    try {
      setModules(await setModuleEnabled(key, nextEnabled));
      // El menú lateral lee del contexto: hay que refrescarlo para que el
      // cambio se vea sin recargar la página.
      await refreshVisibility();
    } catch (error) {
      await alert({
        title: 'No se pudo cambiar el estado',
        message: error instanceof Error ? error.message : 'Error desconocido.',
        tone: 'error',
      });
    } finally {
      setBusyKey(null);
    }
  }

  const offCount = modules.reduce(
    (total, entry) =>
      total +
      (entry.isEnabled ? 0 : 1) +
      entry.children.filter((child) => !child.isEnabled).length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Módulos"
        subtitle="Enciende o apaga módulos y submódulos de la plataforma para todos los usuarios."
      />

      <div className="app-list-card flex flex-wrap items-center gap-3 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
          <Power size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-[var(--app-muted)]">
            Apagar un módulo lo oculta del menú <strong>y cierra su API</strong>: nadie puede entrar
            escribiendo la URL. Como administrador lo seguirás viendo en el menú, marcado como
            apagado. Nada se borra: al encenderlo, todo vuelve tal cual.
          </p>
          {offCount > 0 && (
            <p className="mt-2 text-sm font-semibold text-amber-700">
              {offCount} {offCount === 1 ? 'elemento apagado' : 'elementos apagados'} actualmente.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="app-btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
        >
          <RefreshCcw size={15} /> Actualizar
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--app-muted)]">Cargando…</p>
      ) : (
        <div className="space-y-3">
          {modules.map((entry) => (
            <div key={entry.key} className="app-list-card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--app-ink)]">{entry.label}</h3>
                    {entry.isProtected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        <Lock size={11} /> Siempre activo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">{entry.description}</p>
                </div>
                <Toggle
                  checked={entry.isEnabled}
                  disabled={entry.isProtected || busyKey === entry.key}
                  onChange={(next) => void toggle(entry.key, entry.label, next)}
                />
              </div>

              {entry.children.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-[var(--app-border)] pt-4">
                  {entry.children.map((child) => (
                    <div key={child.key} className="flex flex-wrap items-center gap-4 pl-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--app-ink)]">{child.label}</p>
                        <p className="text-xs text-[var(--app-muted)]">{child.description}</p>
                      </div>
                      <Toggle
                        small
                        checked={child.isEnabled && entry.isEnabled}
                        // Si el padre está apagado, el hijo ya es inalcanzable:
                        // dejarlo editable sugeriría que puede rescatarse.
                        disabled={!entry.isEnabled || busyKey === child.key}
                        onChange={(next) => void toggle(child.key, child.label, next)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  small,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  small?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        small ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-emerald-500' : 'bg-slate-300',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all',
          small ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (small ? 'left-[1.15rem]' : 'left-[1.4rem]') : 'left-0.5',
        ].join(' ')}
      />
      <span className="sr-only">{checked ? 'Encendido' : 'Apagado'}</span>
    </button>
  );
}
