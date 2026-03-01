'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function WorkshopsPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const workshops = bootstrapData.workshops;

  return (
    <div>
      <PageTitle title="Workshops" subtitle="Talleres programados y participación." />

      <div className="space-y-4">
        {workshops.map((workshop) => (
          <article key={workshop.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-800">{workshop.title}</h3>
              <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{workshop.status}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{workshop.type} · {workshop.date} · {workshop.time}</p>
            <p className="text-sm text-slate-600 mt-3">{workshop.description}</p>
            <p className="text-xs text-slate-500 mt-3">Facilitador: {workshop.facilitator} · Asistentes: {workshop.attendees.length}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
