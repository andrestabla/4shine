'use client';

import React from 'react';
import { MENTORSHIPS } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function MentoriasPage() {
  return (
    <div>
      <PageTitle title="Mentorías" subtitle="Agenda y estado de sesiones." />

      {MENTORSHIPS.length === 0 ? (
        <EmptyState message="No hay mentorías registradas." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Mentee</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MENTORSHIPS.map((session) => (
                  <tr key={session.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{session.title}</td>
                    <td className="px-4 py-3 text-slate-600">{session.mentor}</td>
                    <td className="px-4 py-3 text-slate-600">{session.mentee ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {session.date} {session.time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{session.status}</span>
                    </td>
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
