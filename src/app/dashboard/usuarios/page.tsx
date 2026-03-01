'use client';

import React from 'react';
import { USERS } from '@/data/mockData';
import { PageTitle } from '@/components/dashboard/PageTitle';

export default function UsuariosPage() {
  const rows = Object.values(USERS);

  return (
    <div>
      <PageTitle title="Gestión Usuarios" subtitle="Vista administrativa de usuarios por rol." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((user) => (
          <article key={user.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800">{user.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{user.role}</p>
            <p className="text-sm text-slate-500">{user.company}</p>
            <p className="text-xs text-slate-500 mt-2">{user.location}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
