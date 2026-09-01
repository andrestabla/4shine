'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { listCohorts, type CohortRecord } from '@/features/cohortes/client';

/**
 * Selector de cohorte compartido por las pantallas que filtran personas.
 *
 * Se oculta solo si no hay cohortes creadas o si el usuario no tiene permiso
 * para verlas: así no aparece un control vacío en la interfaz de quien no
 * trabaja con cohortes.
 */
export function CohortFilter({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (cohortId: string) => void;
  className?: string;
}) {
  const [cohorts, setCohorts] = React.useState<CohortRecord[]>([]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await listCohorts();
        if (active) setCohorts(data);
      } catch {
        // Sin permiso o sin cohortes: el filtro simplemente no se muestra.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (cohorts.length === 0) return null;

  return (
    <label className={`inline-flex items-center gap-1.5 ${className}`}>
      <Users size={14} className="shrink-0 text-[var(--app-muted)]" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Filtrar por cohorte"
        className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
      >
        <option value="">Todas las cohortes</option>
        {cohorts.map((cohort) => (
          <option key={cohort.cohortId} value={cohort.cohortId}>
            {cohort.name} ({cohort.memberCount})
          </option>
        ))}
      </select>
    </label>
  );
}
