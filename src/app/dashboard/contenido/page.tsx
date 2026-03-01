'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { useUser } from '@/context/UserContext';

export default function ContenidoPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const learningContent = bootstrapData.learningContent;
  const methodologyContent = bootstrapData.methodologyContent;

  const totalLearning = learningContent.length;
  const totalMethodology = methodologyContent.length;

  return (
    <div>
      <PageTitle title="Gestión Contenido" subtitle="Inventario consolidado de recursos de aprendizaje y metodología." />

      <StatGrid
        stats={[
          { label: 'Aprendizaje', value: totalLearning, hint: 'Recursos publicados' },
          { label: 'Metodología', value: totalMethodology, hint: 'Recursos publicados' },
          {
            label: 'Total',
            value: totalLearning + totalMethodology,
            hint: 'Contenido activo',
          },
          {
            label: 'Recomendados',
            value:
              learningContent.filter((item) => item.isRecommended).length +
              methodologyContent.filter((item) => item.liked).length,
            hint: 'Destacados',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {learningContent.slice(0, 8).map((item) => (
          <article key={`learning-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{item.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aprendizaje · {item.type} · {item.category}
            </p>
          </article>
        ))}
        {methodologyContent.slice(0, 8).map((item) => (
          <article key={`method-${item.id}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{item.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Metodología · {item.type} · {item.category}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
