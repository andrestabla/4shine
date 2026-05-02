'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function FormacionMentoresPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const mentorTraining = bootstrapData.mentorTraining;

  return (
    <div>
      <PageTitle title="Formación Advisers" subtitle="Ruta de capacitación para Advisers activos." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {mentorTraining.map((item) => (
          <article key={item.id} className="app-panel p-5">
            <h3 className="font-semibold text-[var(--app-ink)]">{item.title}</h3>
            <p className="mt-1 text-sm text-[var(--app-muted)]">{item.category}</p>
            <p className="mt-3 text-xs text-[var(--app-muted)]">Duración: {item.duration}</p>
            <p className="text-xs text-[var(--app-muted)]">Progreso: {item.progress ?? 0}%</p>
          </article>
        ))}
      </div>
    </div>
  );
}
