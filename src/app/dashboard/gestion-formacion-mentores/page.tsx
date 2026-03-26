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

      <div className="app-table-shell">
        <div className="overflow-x-auto">
          <table className="app-table text-sm">
            <thead>
              <tr className="text-left">
                <th>iShine</th>
                <th>Curso</th>
                <th>Asignado</th>
                <th>Estado</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {mentorAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="font-medium text-[var(--app-ink)]">{assignment.mentorName}</td>
                  <td className="text-[var(--app-muted)]">{assignment.courseTitle}</td>
                  <td className="text-[var(--app-muted)]">{assignment.assignedDate}</td>
                  <td className="text-[var(--app-muted)]">{assignment.status}</td>
                  <td className="text-[var(--app-muted)]">{assignment.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
