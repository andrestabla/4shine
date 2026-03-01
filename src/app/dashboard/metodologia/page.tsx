'use client';

import React from 'react';
import { METHODOLOGY_CONTENT } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function MetodologiaPage() {
  return (
    <div>
      <PageTitle title="Metodología" subtitle="Repositorio estructurado del marco 4Shine." />

      {METHODOLOGY_CONTENT.length === 0 ? (
        <EmptyState message="No hay recursos metodológicos." />
      ) : (
        <div className="space-y-4">
          {METHODOLOGY_CONTENT.map((resource) => (
            <article key={resource.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="font-semibold text-slate-800">{resource.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{resource.type}</span>
              </div>
              <p className="text-sm text-slate-500">{resource.description}</p>
              <div className="mt-3 text-xs text-slate-500 flex items-center gap-3">
                <span>{resource.category}</span>
                <span>{resource.date}</span>
                <span>Likes: {resource.likes}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
