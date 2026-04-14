'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { getDiscoveryOverview } from '@/features/descubrimiento/client';
import type { DiscoveryOverviewFilters, DiscoveryOverviewPayload } from '@/features/descubrimiento/types';

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
        subtitle="Resultados globales del diagnostico con filtros por usuario, pais, cargo, edad y experiencia."
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

              <input
                type="number"
                placeholder="Edad min"
                value={filters.ageMin ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    ageMin: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />

              <input
                type="number"
                placeholder="Edad max"
                value={filters.ageMax ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    ageMax: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />

              <input
                type="number"
                placeholder="Experiencia min"
                value={filters.yearsExperienceMin ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    yearsExperienceMin: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="h-10 rounded-[12px] border border-[var(--app-border)] bg-white px-3 text-sm"
              />
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
                    <th className="px-2 py-2">Edad</th>
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
                      <td className="px-2 py-2">{row.age ?? '-'}</td>
                      <td className="px-2 py-2">{row.yearsExperience ?? '-'}</td>
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
