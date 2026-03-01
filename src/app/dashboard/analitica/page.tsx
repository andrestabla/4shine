'use client';

import React from 'react';
import { MENTEES, MENTORSHIPS, WORKSHOPS, JOBS } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';

export default function AnaliticaPage() {
  const avgProgress =
    MENTEES.length > 0 ? Math.round(MENTEES.reduce((acc, mentee) => acc + mentee.progress, 0) / MENTEES.length) : 0;

  const completedMentorships = MENTORSHIPS.filter((session) => session.status === 'completed').length;

  return (
    <div>
      <PageTitle title="Analítica" subtitle="Indicadores globales de operación y engagement." />

      <StatGrid
        stats={[
          { label: 'Líderes', value: MENTEES.length, hint: 'Participantes activos' },
          { label: 'Progreso promedio', value: `${avgProgress}%`, hint: 'Ruta aprendizaje' },
          { label: 'Mentorías completadas', value: completedMentorships, hint: 'Sesiones cerradas' },
          { label: 'Workshops', value: WORKSHOPS.length, hint: 'Eventos programados' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3">Resumen</h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>Convocatorias activas: {JOBS.length}</li>
          <li>Mentorías totales: {MENTORSHIPS.length}</li>
          <li>Sesiones por completar: {MENTORSHIPS.filter((session) => session.status === 'scheduled').length}</li>
          <li>Líderes en estado crítico: {MENTEES.filter((mentee) => mentee.status === 'danger').length}</li>
        </ul>
      </div>
    </div>
  );
}
