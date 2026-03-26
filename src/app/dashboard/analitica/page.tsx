'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { useUser } from '@/context/UserContext';

export default function AnaliticaPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const { mentees, mentorships, workshops, jobs } = bootstrapData;

  const avgProgress =
    mentees.length > 0 ? Math.round(mentees.reduce((acc, mentee) => acc + mentee.progress, 0) / mentees.length) : 0;

  const completedMentorships = mentorships.filter((session) => session.status === 'completed').length;

  return (
    <div>
      <PageTitle title="Analítica" subtitle="Indicadores globales de operación y engagement." />

      <StatGrid
        stats={[
          { label: 'Líderes', value: mentees.length, hint: 'Participantes activos' },
          { label: 'Progreso promedio', value: `${avgProgress}%`, hint: 'Ruta aprendizaje' },
          { label: 'Mentorías completadas', value: completedMentorships, hint: 'Sesiones cerradas' },
          { label: 'Workshops', value: workshops.length, hint: 'Eventos programados' },
        ]}
      />

      <div className="app-panel p-6">
        <h3 className="mb-3 font-bold text-[var(--app-ink)]">Resumen</h3>
        <ul className="space-y-2 text-sm text-[var(--app-muted)]">
          <li>Convocatorias activas: {jobs.length}</li>
          <li>Mentorías totales: {mentorships.length}</li>
          <li>Sesiones por completar: {mentorships.filter((session) => session.status === 'scheduled').length}</li>
          <li>Líderes en estado crítico: {mentees.filter((mentee) => mentee.status === 'danger').length}</li>
        </ul>
      </div>
    </div>
  );
}
