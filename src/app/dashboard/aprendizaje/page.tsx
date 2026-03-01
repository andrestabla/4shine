'use client';

import React from 'react';
import { LEARNING_CONTENT } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function AprendizajePage() {
  return (
    <div>
      <PageTitle title="Aprendizaje" subtitle="Recursos disponibles para tu ruta de desarrollo." />

      {LEARNING_CONTENT.length === 0 ? (
        <EmptyState message="No hay contenido disponible." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {LEARNING_CONTENT.map((item) => (
            <article key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{item.type}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{item.category}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span>{item.duration}</span>
                <span>Likes: {item.likes}</span>
                <span>Progreso: {item.progress ?? 0}%</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
