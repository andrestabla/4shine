"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { GroupReminderWindowsConfig } from "@/components/dashboard/notificaciones/GroupReminderWindowsConfig";

export default function GroupRemindersAdminPage() {
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

      <GroupReminderWindowsConfig />
    </div>
  );
}
