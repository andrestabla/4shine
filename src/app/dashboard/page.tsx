'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import { NEWS_UPDATES, QUOTES, MENTEES, MENTORSHIPS, LEARNING_CONTENT } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';

export default function DashboardHomePage() {
  const { currentUser, currentRole } = useUser();

  if (!currentUser || !currentRole) return null;

  const quote = QUOTES[0];

  const roleStats = {
    lider: [
      { label: 'Progreso', value: `${currentUser.stats.progress ?? 0}%`, hint: 'Ruta personal' },
      { label: 'Tests', value: currentUser.stats.tests ?? 0, hint: 'Completados' },
      { label: 'Conexiones', value: currentUser.stats.connections ?? 0, hint: 'Networking activo' },
      { label: 'Recursos', value: LEARNING_CONTENT.length, hint: 'Disponibles' },
    ],
    mentor: [
      { label: 'Mentees activos', value: currentUser.stats.students ?? MENTEES.length, hint: 'Asignados' },
      { label: 'Horas mentoría', value: currentUser.stats.hours ?? 0, hint: 'Acumuladas' },
      { label: 'Rating', value: currentUser.stats.rating ?? 0, hint: 'Promedio' },
      { label: 'Sesiones', value: MENTORSHIPS.length, hint: 'Totales' },
    ],
    gestor: [
      { label: 'Contenido', value: currentUser.stats.managedContent ?? LEARNING_CONTENT.length, hint: 'Gestionado' },
      { label: 'Pendientes', value: currentUser.stats.pendingReviews ?? 0, hint: 'Por revisar' },
      { label: 'Satisfacción', value: currentUser.stats.programSatisfaction ?? 'N/A', hint: 'Programa' },
      { label: 'Mentorías', value: MENTORSHIPS.length, hint: 'Total' },
    ],
    admin: [
      { label: 'Usuarios', value: currentUser.stats.totalUsers ?? MENTEES.length, hint: 'Activos' },
      { label: 'Cohortes', value: currentUser.stats.activeCohorts ?? 0, hint: 'En curso' },
      { label: 'Uptime', value: currentUser.stats.uptime ?? 'N/A', hint: 'Plataforma' },
      { label: 'Noticias', value: NEWS_UPDATES.length, hint: 'Publicadas' },
    ],
  }[currentRole];

  return (
    <div>
      <PageTitle
        title="Resumen Ejecutivo"
        subtitle="Vista consolidada del estado de tu experiencia en 4Shine."
      />

      <StatGrid stats={roleStats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Novedades</h3>
          <div className="space-y-4">
            {NEWS_UPDATES.slice(0, 4).map((news) => (
              <article key={news.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                <h4 className="font-semibold text-slate-800">{news.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{news.summary}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {news.category} · {news.date}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-amber-300 mb-3">Mensaje motivador</p>
          <blockquote className="text-sm leading-relaxed italic">{quote?.text ?? 'Sigue adelante.'}</blockquote>
          <p className="text-xs text-amber-400 mt-4">{quote?.author ?? '4SHINE'}</p>
        </aside>
      </div>
    </div>
  );
}
