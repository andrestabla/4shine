'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import { TIMELINE, MENTEES } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';

export default function TrayectoriaPage() {
  const { currentRole } = useUser();

  return (
    <div>
      <PageTitle
        title={currentRole === 'gestor' ? 'Trayectorias Globales' : 'Mi Trayectoria'}
        subtitle="Seguimiento de hitos, progreso y estado por etapa."
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4">Línea de tiempo</h3>
        <div className="space-y-3">
          {TIMELINE.map((event) => (
            <div key={event.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
              <div>
                <p className="font-medium text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  event.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : event.status === 'current'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {event.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {currentRole === 'gestor' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Resumen de líderes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Empresa</th>
                  <th className="py-2">Progreso</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MENTEES.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{m.name}</td>
                    <td className="py-2 text-slate-600">{m.company}</td>
                    <td className="py-2 text-slate-600">{m.progress}%</td>
                    <td className="py-2 text-slate-600">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
