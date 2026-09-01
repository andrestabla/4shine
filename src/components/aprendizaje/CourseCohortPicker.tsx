'use client';

import React from 'react';
import { Loader2, Users } from 'lucide-react';
import {
  getContentCohorts,
  listCohorts,
  setContentCohorts,
  type CohortRecord,
} from '@/features/cohortes/client';

/**
 * Restringe un curso a una o varias cohortes.
 *
 * Sin cohortes marcadas el curso se comporta como siempre (lo rigen el plan y
 * los permisos). Con al menos una, solo lo verán quienes pertenezcan a ella.
 *
 * Guarda al instante en vez de esperar al botón del editor: la restricción es
 * de visibilidad y conviene que quede aplicada apenas se decide.
 */
export function CourseCohortPicker({ contentId }: { contentId: string }) {
  const [cohorts, setCohorts] = React.useState<CohortRecord[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [all, assigned] = await Promise.all([
          listCohorts(),
          getContentCohorts(contentId),
        ]);
        if (!active) return;
        setCohorts(all);
        setSelected(new Set(assigned.map((item) => item.cohortId)));
      } catch {
        if (active) setMessage('No se pudieron cargar las cohortes.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [contentId]);

  const toggle = async (cohortId: string) => {
    const next = new Set(selected);
    if (next.has(cohortId)) next.delete(cohortId);
    else next.add(cohortId);
    setSelected(next);
    setSaving(true);
    setMessage(null);
    try {
      await setContentCohorts(contentId, Array.from(next));
      setMessage(
        next.size === 0
          ? 'Sin restricción: el curso se rige por el plan, como antes.'
          : `Restringido a ${next.size} cohorte${next.size === 1 ? '' : 's'}.`,
      );
    } catch (error) {
      setSelected(selected); // revertir si el servidor rechazó
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la restricción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lg:col-span-2">
      <label className="app-field-label flex items-center gap-1.5">
        <Users size={13} /> Restringir a cohortes
      </label>

      {loading ? (
        <p className="mt-1 flex items-center gap-2 text-[12.5px] text-[var(--app-muted)]">
          <Loader2 size={13} className="animate-spin" /> Cargando cohortes…
        </p>
      ) : cohorts.length === 0 ? (
        <p className="mt-1 text-[12.5px] text-[var(--app-muted)]">
          Aún no hay cohortes creadas. Puedes crearlas en Administración → Cohortes.
        </p>
      ) : (
        <>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cohorts.map((cohort) => {
              const on = selected.has(cohort.cohortId);
              return (
                <button
                  key={cohort.cohortId}
                  type="button"
                  disabled={saving}
                  onClick={() => void toggle(cohort.cohortId)}
                  className={
                    on
                      ? 'rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-60'
                      : 'rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)] disabled:opacity-60'
                  }
                >
                  {cohort.name}
                  <span className="ml-1 opacity-70">({cohort.memberCount})</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--app-muted)]">
            {selected.size === 0
              ? 'Sin cohortes marcadas, el curso se ve según el plan de cada líder.'
              : 'Solo los miembros de las cohortes marcadas verán este curso. Admin y gestor lo ven siempre para administrarlo.'}
          </p>
        </>
      )}

      {message && <p className="mt-1 text-[11.5px] text-[var(--app-ink)]">{message}</p>}
    </div>
  );
}
