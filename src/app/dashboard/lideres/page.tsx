'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function LideresPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const mentees = bootstrapData.mentees;

  return (
    <div>
      <PageTitle title="Líderes" subtitle="Seguimiento de participantes y nivel de avance." />

      <div className="app-table-shell">
        <div className="overflow-x-auto">
          <table className="app-table text-sm">
            <thead>
              <tr className="text-left">
                <th>Líder</th>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Progreso</th>
                <th>Próxima sesión</th>
              </tr>
            </thead>
            <tbody>
              {mentees.map((leader) => (
                <tr key={leader.id}>
                  <td className="font-medium text-[var(--app-ink)]">{leader.name}</td>
                  <td className="text-[var(--app-muted)]">{leader.company}</td>
                  <td className="text-[var(--app-muted)]">{leader.planType}</td>
                  <td className="text-[var(--app-muted)]">{leader.progress}%</td>
                  <td className="text-[var(--app-muted)]">{leader.nextSession}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
