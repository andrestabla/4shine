'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';

export default function NetworkingPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const networking = bootstrapData.networking;
  const interestGroups = bootstrapData.interestGroups;

  return (
    <div>
      <PageTitle title="Networking" subtitle="Conecta con líderes y participa en grupos de interés." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Contactos</h3>
          <div className="space-y-3">
            {networking.map((contact) => (
              <article key={contact.id} className="border border-slate-100 rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{contact.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {contact.role} · {contact.company} · {contact.location}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{contact.tags.join(', ')}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{contact.status}</span>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Grupos</h3>
          <div className="space-y-3">
            {interestGroups.map((group) => (
              <article key={group.id} className="border border-slate-100 rounded-lg p-3">
                <p className="font-medium text-slate-800">{group.name}</p>
                <p className="text-xs text-slate-500 mt-1">{group.description}</p>
                <p className="text-xs text-slate-500 mt-2">Miembros: {group.members}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
