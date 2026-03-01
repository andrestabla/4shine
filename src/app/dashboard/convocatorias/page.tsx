'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function ConvocatoriasPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const jobs = bootstrapData.jobs;

  return (
    <div>
      <PageTitle title="Convocatorias" subtitle="Oportunidades profesionales de la comunidad." />

      <div className="space-y-4">
        {jobs.map((job) => (
          <article key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-800">{job.title}</h3>
              <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{job.type}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{job.company} · {job.location}</p>
            <p className="text-sm text-slate-600 mt-3">{job.description}</p>
            <p className="text-xs text-slate-500 mt-3">
              {job.postedDate} · {job.applicants} postulaciones
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
