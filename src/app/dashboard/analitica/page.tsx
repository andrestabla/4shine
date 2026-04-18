'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { getDiscoveryOverview } from '@/features/descubrimiento/client';
import type { DiscoveryOverviewFilters, DiscoveryOverviewPayload } from '@/features/descubrimiento/types';
import { yearsToLabel, YEARS_EXPERIENCE_OPTIONS } from '@/lib/demographics';

export default function AnaliticaPage() {
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState<DiscoveryOverviewPayload | null>(null);
  const [filters, setFilters] = React.useState<DiscoveryOverviewFilters>({});
  const [activeTab, setActiveTab] = React.useState<'general' | 'descubrimiento'>('descubrimiento');

  const loadOverview = React.useCallback(async (nextFilters: DiscoveryOverviewFilters) => {
    setLoading(true);
    try {
      const payload = await getDiscoveryOverview(nextFilters);
      setOverview(payload);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadOverview(filters);
  }, [filters, loadOverview]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Analitica"
        subtitle="Resultados globales del diagnostico con filtros por usuario, pais, cargo, género y experiencia."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] ${
            activeTab === 'general'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)]'
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('descubrimiento')}
          className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] ${
            activeTab === 'descubrimiento'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)]'
          }`}
        >
          Descubrimiento
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="app-panel p-6 text-sm text-[var(--app-muted)]">
          Esta pestana se mantiene para indicadores operativos generales.
        </div>
      )}

      {activeTab === 'descubrimiento' && (
        <>
          <div className="app-panel p-4">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <select
                value={filters.userId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    userId: event.target.value || undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Usuario</option>
                {overview?.availableFilters.users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.name || user.userId}
                  </option>
                ))}
              </select>

              <select
                value={filters.country ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    country: event.target.value || undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Pais</option>
                {overview?.availableFilters.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                value={filters.jobRole ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    jobRole: event.target.value || undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Cargo</option>
                {overview?.availableFilters.jobRoles.map((jobRole) => (
                  <option key={jobRole} value={jobRole}>
                    {jobRole}
                  </option>
                ))}
              </select>

              <select
                value={filters.gender ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    gender: event.target.value || undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Género</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>

              <select
                value={YEARS_EXPERIENCE_OPTIONS.find((o) => o.min === filters.yearsExperienceMin)?.key ?? ''}
                onChange={(event) => {
                  const opt = YEARS_EXPERIENCE_OPTIONS.find((o) => o.key === event.target.value);
                  setFilters((current) => ({
                    ...current,
                    yearsExperienceMin: opt?.min,
                    yearsExperienceMax: opt?.max === Number.POSITIVE_INFINITY ? undefined : opt?.max,
                  }));
                }}
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              >
                <option value="">Experiencia</option>
                {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <StatGrid
            stats={[
              {
                label: 'Diagnosticos',
                value: overview?.stats.totalDiagnostics ?? 0,
                hint: 'Con filtros activos',
              },
              {
                label: 'Completados',
                value: overview?.stats.completedDiagnostics ?? 0,
                hint: 'Indice global disponible',
              },
              {
                label: 'Indice promedio',
                value: `${overview?.stats.averageGlobalIndex ?? 0}%`,
                hint: 'Global',
              },
              {
                label: 'Registros',
                value: overview?.rows.length ?? 0,
                hint: 'En la tabla',
              },
            ]}
          />

          <div className="app-panel overflow-auto p-4">
            {loading ? (
              <p className="text-sm text-[var(--app-muted)]">Cargando resultados...</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)]">
                    <th className="px-2 py-2">ID</th>
                    <th className="px-2 py-2">Usuario</th>
                    <th className="px-2 py-2">Pais</th>
                    <th className="px-2 py-2">Cargo</th>
                    <th className="px-2 py-2">Género</th>
                    <th className="px-2 py-2">Exp.</th>
                    <th className="px-2 py-2">Avance</th>
                    <th className="px-2 py-2">Indice</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.rows.map((row) => (
                    <tr key={row.sessionId} className="border-b border-[var(--app-border)]">
                      <td className="px-2 py-2 font-semibold">{row.diagnosticIdentifier}</td>
                      <td className="px-2 py-2">{row.participantName}</td>
                      <td className="px-2 py-2">{row.country || '-'}</td>
                      <td className="px-2 py-2">{row.jobRole || '-'}</td>
                      <td className="px-2 py-2">{row.gender || '-'}</td>
                      <td className="px-2 py-2">{yearsToLabel(row.yearsExperience)}</td>
                      <td className="px-2 py-2">{row.completionPercent}%</td>
                      <td className="px-2 py-2">{row.globalIndex ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
