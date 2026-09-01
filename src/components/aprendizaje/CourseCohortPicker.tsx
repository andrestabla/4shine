'use client';

import React from 'react';
import { EyeOff, Loader2, Users } from 'lucide-react';
import {
  getContentCohorts,
  listCohorts,
  setContentCohorts,
  type CohortRecord,
  type ContentCohortMode,
} from '@/features/cohortes/client';

/**
 * Conecta un curso con cohortes, en uno de dos modos:
 *
 *   Asignar   → solo los miembros de esas cohortes ven el curso.
 *   Restringir→ los miembros de esas cohortes NO lo ven; el resto sí.
 *
 * Se guarda al instante en vez de esperar al botón del editor: es una regla de
 * visibilidad y conviene que quede aplicada apenas se decide.
 */
export function CourseCohortPicker({ contentId }: { contentId: string }) {
  const [cohorts, setCohorts] = React.useState<CohortRecord[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [mode, setMode] = React.useState<ContentCohortMode>('allow');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [all, assigned] = await Promise.all([listCohorts(), getContentCohorts(contentId)]);
        if (!active) return;
        setCohorts(all);
        setSelected(new Set(assigned.map((item) => item.cohortId)));
        // El modo guardado es el de las filas existentes; si no hay, "asignar".
        if (assigned.length > 0) setMode(assigned[0].mode);
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

  const persist = async (ids: Set<string>, nextMode: ContentCohortMode) => {
    const previous = new Set(selected);
    const previousMode = mode;
    setSelected(ids);
    setMode(nextMode);
    setSaving(true);
    setMessage(null);
    try {
      await setContentCohorts(contentId, Array.from(ids), nextMode);
      setMessage(
        ids.size === 0
          ? 'Sin restricción: el curso se rige por el plan, como antes.'
          : nextMode === 'allow'
            ? `Visible solo para ${ids.size} cohorte${ids.size === 1 ? '' : 's'}.`
            : `Oculto para ${ids.size} cohorte${ids.size === 1 ? '' : 's'}; el resto lo ve.`,
      );
    } catch (error) {
      setSelected(previous);
      setMode(previousMode);
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el cambio.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (cohortId: string) => {
    const next = new Set(selected);
    if (next.has(cohortId)) next.delete(cohortId);
    else next.add(cohortId);
    void persist(next, mode);
  };

  const changeMode = (nextMode: ContentCohortMode) => {
    if (nextMode === mode) return;
    // Si ya hay cohortes marcadas, cambiar el modo invierte la regla sobre las
    // mismas cohortes; si no hay ninguna, solo se recuerda la elección.
    if (selected.size === 0) {
      setMode(nextMode);
      return;
    }
    void persist(selected, nextMode);
  };

  return (
    <div className="lg:col-span-2">
      <label className="app-field-label flex items-center gap-1.5">
        <Users size={13} /> Cohortes
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
            <button
              type="button"
              disabled={saving}
              onClick={() => changeMode('allow')}
              className={
                mode === 'allow'
                  ? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--app-ink)] bg-[var(--app-ink)] px-3 py-1.5 text-[11.5px] font-bold text-white'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
              }
            >
              <Users size={12} /> Asignar a cohortes
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => changeMode('deny')}
              className={
                mode === 'deny'
                  ? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--app-ink)] bg-[var(--app-ink)] px-3 py-1.5 text-[11.5px] font-bold text-white'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
              }
            >
              <EyeOff size={12} /> Restringir a cohortes
            </button>
          </div>

          <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--app-muted)]">
            {mode === 'allow'
              ? 'Asignar: solo verán el curso los usuarios que pertenezcan a las cohortes marcadas.'
              : 'Restringir: se ocultará el curso a los usuarios que pertenezcan a las cohortes marcadas; el resto lo verá.'}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {cohorts.map((cohort) => {
              const on = selected.has(cohort.cohortId);
              const activeClass =
                mode === 'allow'
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                  : 'border-amber-500 bg-amber-500 text-white';
              return (
                <button
                  key={cohort.cohortId}
                  type="button"
                  disabled={saving}
                  onClick={() => toggle(cohort.cohortId)}
                  className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-60 ${
                    on
                      ? `font-bold ${activeClass}`
                      : 'border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
                  }`}
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
              : 'Admin y gestor siempre lo ven, para poder administrarlo.'}
          </p>
        </>
      )}

      {message && <p className="mt-1 text-[11.5px] text-[var(--app-ink)]">{message}</p>}
    </div>
  );
}
