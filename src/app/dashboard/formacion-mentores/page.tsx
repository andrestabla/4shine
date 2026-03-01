'use client';

import React from 'react';
import { MENTOR_TRAINING } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';

export default function FormacionMentoresPage() {
  return (
    <div>
      <PageTitle title="Formación Mentores" subtitle="Ruta de capacitación para mentores activos." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MENTOR_TRAINING.map((item) => (
          <article key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{item.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{item.category}</p>
            <p className="text-xs text-slate-500 mt-3">Duración: {item.duration}</p>
            <p className="text-xs text-slate-500">Progreso: {item.progress ?? 0}%</p>
          </article>
        ))}
      </div>
    </div>
  );
}
