'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { listTemplates, deleteTemplate } from '@/features/notificaciones/client';
import type { NotificationTemplateRecord } from '@/features/notificaciones/client';
import { EVENTS_BY_KEY, MODULE_LABELS } from '@/features/notificaciones/events-catalog';
import { Plus, Pencil, Trash2, Mail, Bell, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

const MODULE_COLORS: Record<string, string> = {
  usuarios: 'bg-blue-100 text-blue-800',
  mentorias: 'bg-purple-100 text-purple-800',
  aprendizaje: 'bg-green-100 text-green-800',
  convocatorias: 'bg-amber-100 text-amber-800',
  networking: 'bg-teal-100 text-teal-800',
  mensajes: 'bg-rose-100 text-rose-800',
  workshops: 'bg-orange-100 text-orange-800',
};

export default function PlantillasPage() {
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await listTemplates();
    if (res.ok && res.data) setTemplates(res.data);
    else setError(res.error ?? 'Error al cargar plantillas');
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la plantilla "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    const res = await deleteTemplate(id);
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.templateId !== id));
    else alert(res.error ?? 'Error al eliminar');
    setDeleting(null);
  }

  // Group by module
  const grouped = templates.reduce<Record<string, NotificationTemplateRecord[]>>((acc, t) => {
    (acc[t.moduleCode] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageTitle
        title="Plantillas de mensajes"
        subtitle="Crea y gestiona las plantillas de email e in-app. Usa variables dinámicas para personalizar el contenido."
      />

      <div className="flex justify-end">
        <Link
          href="/dashboard/administracion/notificaciones/plantillas/nueva"
          className="app-button-primary flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus size={16} />
          Nueva plantilla
        </Link>
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">Cargando plantillas…</div>
      )}

      {error && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--app-muted)]">Aún no hay plantillas configuradas.</p>
          <Link
            href="/dashboard/administracion/notificaciones/plantillas/nueva"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <Plus size={14} />
            Crear primera plantilla
          </Link>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([moduleCode, items]) => (
        <section key={moduleCode} className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--app-muted)] px-1">
            {MODULE_LABELS[moduleCode] ?? moduleCode}
          </h2>
          <div className="overflow-hidden rounded-[1rem] border border-[var(--app-border)] bg-white">
            {items.map((tmpl, idx) => {
              const eventDef = EVENTS_BY_KEY[tmpl.eventKey];
              return (
                <div
                  key={tmpl.templateId}
                  className={clsx(
                    'flex items-center gap-4 px-5 py-4',
                    idx > 0 && 'border-t border-[var(--app-border)]',
                  )}
                >
                  {/* Status dot */}
                  <div className="shrink-0">
                    {tmpl.isActive ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-[var(--app-muted)]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[var(--app-ink)]">{tmpl.name}</span>
                      <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', MODULE_COLORS[tmpl.moduleCode] ?? 'bg-slate-100 text-slate-700')}>
                        {MODULE_LABELS[tmpl.moduleCode] ?? tmpl.moduleCode}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--app-muted)] mt-0.5 truncate">
                      {eventDef?.label ?? tmpl.eventKey}
                    </p>
                  </div>

                  {/* Channels */}
                  <div className="hidden sm:flex items-center gap-3 text-[var(--app-muted)]">
                    {tmpl.channelEmail && <Mail size={14} aria-label="Email" />}
                    {tmpl.channelInApp && <Bell size={14} aria-label="In-app" />}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/dashboard/administracion/notificaciones/plantillas/${tmpl.templateId}`}
                      className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </Link>
                    {!tmpl.isSystem && (
                      <button
                        onClick={() => void handleDelete(tmpl.templateId, tmpl.name)}
                        disabled={deleting === tmpl.templateId}
                        className="flex h-8 w-8 items-center justify-center rounded-[0.75rem] text-[var(--app-muted)] transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
