"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { useAppDialog } from "@/components/ui/AppDialogProvider";
import { requestApi } from "@/lib/api-client";

interface GroupReminderWindow {
  windowMinutes: number;
  label: string;
  isEnabled: boolean;
}

const ENDPOINT = "/api/v1/modules/mentorias/group-reminders";

export default function GroupRemindersAdminPage() {
  const { alert } = useAppDialog();
  const [windows, setWindows] = React.useState<GroupReminderWindow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingMin, setSavingMin] = React.useState<number | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const data = await requestApi<GroupReminderWindow[]>(ENDPOINT);
        setWindows(data ?? []);
      } catch {
        setWindows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (windowMinutes: number, isEnabled: boolean) => {
    setSavingMin(windowMinutes);
    // Optimista
    setWindows((prev) => prev.map((w) => (w.windowMinutes === windowMinutes ? { ...w, isEnabled } : w)));
    try {
      const data = await requestApi<GroupReminderWindow[]>(ENDPOINT, {
        method: "PATCH",
        body: JSON.stringify({ windowMinutes, isEnabled }),
      });
      if (data) setWindows(data);
    } catch (err) {
      // Revertir
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
    <div className="space-y-6">
      <Link
        href="/dashboard/administracion/notificaciones"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft size={14} /> Volver a notificaciones
      </Link>

      <PageTitle
        title="Recordatorios de sesiones grupales"
        subtitle="Define con cuánta anticipación se envían los recordatorios automáticos de cada sesión grupal."
      />

      <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)] flex items-start gap-3">
        <Clock size={15} className="mt-0.5 shrink-0 text-[var(--app-ink)]" />
        <div>
          <p className="mb-1 font-medium text-[var(--app-ink)]">¿Cómo funciona?</p>
          <p>
            Por cada ventana activa, todos los usuarios con acceso a mentorías grupales reciben un recordatorio de las
            sesiones próximas. El mensaje se toma de la plantilla del evento{" "}
            <Link
              href="/dashboard/administracion/notificaciones/plantillas"
              className="font-semibold text-[var(--brand-primary)] underline"
            >
              «Recordatorio de sesión grupal»
            </Link>
            . El envío es automático y no se duplica.
          </p>
        </div>
      </div>

      <section className="app-panel p-5 sm:p-6">
        <p className="app-section-kicker">Ventanas de recordatorio</p>
        {loading ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" /> Cargando…
          </p>
        ) : (
          <div className="mt-4 space-y-2">
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
    </div>
  );
}
