'use client';

import React from 'react';
import { useUser } from '@/context/UserContext';
import { PageTitle } from '@/components/dashboard/PageTitle';

export default function PerfilPage() {
  const { currentUser } = useUser();
  if (!currentUser) return null;

  return (
    <div>
      <PageTitle title="Mi Perfil" subtitle="Información profesional y plan de desarrollo." />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full ${currentUser.color} text-white font-bold flex items-center justify-center text-xl`}>
            {currentUser.avatar}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
            <p className="text-sm text-slate-500">{currentUser.profession ?? currentUser.role}</p>
            <p className="text-sm text-slate-500">{currentUser.company} · {currentUser.location}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600">{currentUser.bio ?? 'Perfil en proceso de actualización.'}</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-slate-500">Plan</p>
            <p className="font-semibold text-slate-800">{currentUser.planType ?? 'Standard'}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-slate-500">Industria</p>
            <p className="font-semibold text-slate-800">{currentUser.industry ?? 'General'}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-slate-500">Intereses</p>
            <p className="font-semibold text-slate-800">{currentUser.interests?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
