"use client";

import React from "react";
import { Clock, Loader2 } from "lucide-react";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { requestApi } from "@/lib/api-client";

interface ReminderWindow {
  windowMinutes: number;
  label: string;
  isEnabled: boolean;
}

const ENDPOINT = "/api/v1/modules/mentorias/group-reminders";

/**
 * Configuración de las ventanas de recordatorio (72h/24h/12h/6h/3h/1h/30m) para
 * un evento de recordatorio dado (sesión 1:1 o grupal). Reutilizable en la
 * página dedicada y dentro del editor de la plantilla del evento.
 */
export function ReminderWindowsConfig({ eventKey }: { eventKey: string }) {
  const { alert } = useAppDialog();
  const [windows, setWindows] = React.useState<ReminderWindow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingMin, setSavingMin] = React.useState<number | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const data = await requestApi<ReminderWindow[]>(`${ENDPOINT}?eventKey=${encodeURIComponent(eventKey)}`);
        if (active) setWindows(data ?? []);
      } catch {
        if (active) setWindows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventKey]);

  const toggle = async (windowMinutes: number, isEnabled: boolean) => {
    setSavingMin(windowMinutes);
    setWindows((prev) => prev.map((w) => (w.windowMinutes === windowMinutes ? { ...w, isEnabled } : w)));
    try {
      const data = await requestApi<ReminderWindow[]>(ENDPOINT, {
        method: "PATCH",
        body: JSON.stringify({ eventKey, windowMinutes, isEnabled }),
      });
      if (data) setWindows(data);
    } catch (err) {
      setWindows((prev) => prev.map((w) => (w.windowMinutes === windowMinutes ? { ...w, isEnabled: !isEnabled } : w)));
      await alert({
        title: "No se pudo guardar",
        message: err instanceof Error ? err.message : "Inténtalo nuevamente.",
        tone: "error",
      });
    } finally {
      setSavingMin(null);
    }
  };

  return (
    <section className="app-panel p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-[var(--brand-primary)]" />
        <p className="app-section-kicker">Ventanas de recordatorio</p>
      </div>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Define con cuánta anticipación se envía este recordatorio. Cada ventana activa dispara el mensaje de forma
        automática, sin duplicar.
      </p>
      {loading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--app-muted)]">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </p>
      ) : windows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--app-muted)]">No hay ventanas configurables para este recordatorio.</p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {windows.map((w) => (
            <label
              key={w.windowMinutes}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-[var(--app-border)] bg-white px-4 py-3"
            >
              <span className="text-sm font-semibold text-[var(--app-ink)]">{w.label}</span>
              <span className="flex items-center gap-2">
                {savingMin === w.windowMinutes && <Loader2 size={14} className="animate-spin text-[var(--app-muted)]" />}
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--brand-primary)]"
                  checked={w.isEnabled}
                  disabled={savingMin === w.windowMinutes}
                  onChange={(e) => void toggle(w.windowMinutes, e.target.checked)}
                />
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
