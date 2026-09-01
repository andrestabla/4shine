'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarRange, ChevronRight, Loader2, Plus, Users } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  createCohort,
  listCohorts,
  type CohortRecord,
  type CohortStatus,
} from '@/features/cohortes/client';

const STATUS_STYLE: Record<CohortStatus, { label: string; chip: string }> = {
  active: { label: 'Activa', chip: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  planned: { label: 'Planeada', chip: 'border-sky-200 bg-sky-50 text-sky-700' },
  completed: { label: 'Finalizada', chip: 'border-slate-200 bg-slate-50 text-slate-600' },
  archived: { label: 'Archivada', chip: 'border-slate-200 bg-slate-50 text-slate-500' },
};

function formatRange(startsAt: string | null, endsAt: string | null): string {
  const fmt = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  if (startsAt && endsAt) return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  if (startsAt) return `Desde ${fmt(startsAt)}`;
  if (endsAt) return `Hasta ${fmt(endsAt)}`;
  return 'Sin fechas definidas';
}

export default function CohortesPage() {
  const { can } = useUser();
  const { alert } = useAppDialog();
  const canCreate = can('cohortes', 'create');

  const [cohorts, setCohorts] = React.useState<CohortRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    status: 'planned' as CohortStatus,
    startsAt: '',
    endsAt: '',
  });

  const showError = React.useCallback(
    async (fallback: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallback,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setCohorts(await listCohorts());
    } catch (error) {
      await showError('No se pudieron cargar las cohortes.', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await createCohort({
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      });
      setForm({ name: '', description: '', status: 'planned', startsAt: '', endsAt: '' });
      setShowForm(false);
      await load();
    } catch (error) {
      await showError('No se pudo crear la cohorte.', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle
        title="Cohortes"
        subtitle="Agrupa líderes para personalizar sus accesos y leer su avance en conjunto."
      />

      {canCreate && (
        <section className="app-panel p-4 sm:p-5">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-bold text-white"
            >
              <Plus size={14} /> Nueva cohorte
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <p className="app-section-kicker">Nueva cohorte</p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nombre (p. ej. Cohorte 5 · Marca Ejecutiva)"
                  required
                  className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--app-ink)] md:col-span-2"
                />
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Descripción (opcional): a quién agrupa y para qué"
                  className="min-h-[70px] rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--app-ink)] md:col-span-2"
                />
                <label className="text-xs font-semibold text-[var(--app-muted)]">
                  Estado
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, status: event.target.value as CohortStatus }))
                    }
                    className="mt-1 w-full rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--app-ink)]"
                  >
                    <option value="planned">Planeada</option>
                    <option value="active">Activa</option>
                    <option value="completed">Finalizada</option>
                    <option value="archived">Archivada</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-[var(--app-muted)]">
                    Inicio
                    <input
                      type="date"
                      value={form.startsAt}
                      onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                      className="mt-1 w-full rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
                    />
                  </label>
                  <label className="text-xs font-semibold text-[var(--app-muted)]">
                    Fin
                    <input
                      type="date"
                      value={form.endsAt}
                      onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                      className="mt-1 w-full rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {creating ? 'Creando…' : 'Crear cohorte'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-ink)]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--app-muted)]">
          <Loader2 size={16} className="animate-spin" /> Cargando cohortes…
        </div>
      ) : cohorts.length === 0 ? (
        <div className="app-panel p-8 text-center">
          <p className="text-sm font-bold text-[var(--app-ink)]">Aún no hay cohortes</p>
          <p className="mt-1 text-[13px] text-[var(--app-muted)]">
            Crea la primera para agrupar líderes, ajustar sus accesos y ver su avance en conjunto.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cohorts.map((cohort) => {
            const style = STATUS_STYLE[cohort.status];
            return (
              <Link
                key={cohort.cohortId}
                href={`/dashboard/administracion/cohortes/${cohort.cohortId}`}
                className="app-panel flex flex-col gap-2 p-4 transition hover:border-[var(--brand-primary)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--app-ink)]">
                      {cohort.name}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-[var(--app-muted)]">
                      {cohort.cohortCode}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${style.chip}`}
                  >
                    {style.label}
                  </span>
                </div>

                {cohort.description && (
                  <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--app-muted)]">
                    {cohort.description}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-[11.5px] text-[var(--app-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} /> {cohort.memberCount} miembro
                    {cohort.memberCount === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarRange size={13} /> {formatRange(cohort.startsAt, cohort.endsAt)}
                  </span>
                  <ChevronRight size={14} className="ml-auto" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
