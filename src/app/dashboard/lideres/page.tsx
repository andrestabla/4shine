'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function LideresPage() {
  const { bootstrapData, currentRole } = useUser();
  const [query, setQuery] = React.useState('');

  if (!bootstrapData) return null;

  const isElevated = currentRole === 'admin' || currentRole === 'gestor' || currentRole === 'mentor';
  const normalizedQuery = query.trim().toLowerCase();
  const mentees = bootstrapData.mentees.filter((leader) => {
    if (!normalizedQuery) return true;
    return [leader.name, leader.email, leader.company, leader.industry]
      .map((value) => value.toLowerCase())
      .some((value) => value.includes(normalizedQuery));
  });

  return (
    <div>
      <PageTitle title="Líderes" subtitle="Seguimiento 360 de cada líder: workbooks, diagnóstico, mentorías, contenido, networking, convocatorias y workshops." />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar por nombre, email, empresa o industria"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-focus)]"
        />
        <span className="text-xs text-[var(--app-muted)]">{mentees.length} líderes</span>
      </div>

      <div className="app-table-shell">
        <div className="overflow-x-auto">
          <table className="app-table text-sm">
            <thead>
              <tr className="text-left">
                <th>Líder</th>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Progreso (contenidos)</th>
                <th>Próxima sesión</th>
                {isElevated && <th aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {mentees.map((leader) => (
                <tr key={leader.userId || leader.id}>
                  <td className="font-medium text-[var(--app-ink)]">
                    {isElevated && leader.userId ? (
                      <Link
                        href={`/dashboard/lideres/${leader.userId}`}
                        className="text-[var(--brand-primary)] hover:underline"
                      >
                        {leader.name}
                      </Link>
                    ) : (
                      leader.name
                    )}
                    <div className="text-xs text-[var(--app-muted)]">{leader.email}</div>
                  </td>
                  <td className="text-[var(--app-muted)]">{leader.company}</td>
                  <td className="text-[var(--app-muted)]">{leader.planType}</td>
                  <td className="text-[var(--app-muted)]">{leader.progress}%</td>
                  <td className="text-[var(--app-muted)]">{leader.nextSession}</td>
                  {isElevated && (
                    <td>
                      {leader.userId && (
                        <Link
                          href={`/dashboard/lideres/${leader.userId}`}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/20"
                        >
                          Ver 360 <ExternalLink size={12} />
                        </Link>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {mentees.length === 0 && (
                <tr>
                  <td colSpan={isElevated ? 6 : 5} className="text-center text-sm text-[var(--app-muted)]">
                    No hay líderes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
