'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function GestionFormacionMentoresPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const mentorAssignments = bootstrapData.mentorAssignments;

  return (
    <div>
      <PageTitle title="Gestión Formación iShiners" subtitle="Asignaciones y estado de cursos por iShine." />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="px-4 py-3">iShine</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Asignado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {mentorAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{assignment.mentorName}</td>
                  <td className="px-4 py-3 text-slate-600">{assignment.courseTitle}</td>
                  <td className="px-4 py-3 text-slate-600">{assignment.assignedDate}</td>
                  <td className="px-4 py-3 text-slate-600">{assignment.status}</td>
                  <td className="px-4 py-3 text-slate-600">{assignment.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
