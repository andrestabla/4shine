'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useUser } from '@/context/UserContext';

export default function MetodologiaPage() {
  const { bootstrapData } = useUser();
  if (!bootstrapData) return null;

  const methodologyContent = bootstrapData.methodologyContent;

  return (
    <div>
      <PageTitle title="Metodología" subtitle="Repositorio estructurado del marco 4Shine." />

      {methodologyContent.length === 0 ? (
        <EmptyState message="No hay recursos metodológicos." />
      ) : (
        <div className="space-y-4">
          {methodologyContent.map((resource) => (
            <article key={resource.id} className="app-panel p-5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--app-ink)]">{resource.title}</h3>
                <span className="app-badge app-badge-muted">{resource.type}</span>
              </div>
              <p className="text-sm text-[var(--app-muted)]">{resource.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--app-muted)]">
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
