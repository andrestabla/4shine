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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="px-4 py-3">Líder</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Próxima sesión</th>
              </tr>
            </thead>
            <tbody>
              {mentees.map((leader) => (
                <tr key={leader.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{leader.name}</td>
                  <td className="px-4 py-3 text-slate-600">{leader.company}</td>
                  <td className="px-4 py-3 text-slate-600">{leader.planType}</td>
                  <td className="px-4 py-3 text-slate-600">{leader.progress}%</td>
                  <td className="px-4 py-3 text-slate-600">{leader.nextSession}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
