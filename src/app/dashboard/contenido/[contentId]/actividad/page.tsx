'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { ActivityBuilder } from '@/components/aprendizaje/ActivityBuilder';
import { ActivityResultsPanel } from '@/components/aprendizaje/ActivityResultsPanel';

type Tab = 'editor' | 'resultados';

export default function ContentActivityPage() {
  const params = useParams<{ contentId: string }>();
  const contentId = params?.contentId;
  const [tab, setTab] = React.useState<Tab>('editor');
  if (!contentId) return null;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/contenido"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft size={14} />
        Volver al contenido
      </Link>
      <PageTitle
        title="Actividad de evaluación"
        subtitle="Configura preguntas, califica automáticamente y consulta resultados por líder."
      />

      <div className="flex gap-1 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1 max-w-md">
        {(['editor', 'resultados'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 rounded-[10px] py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-white text-[var(--app-ink)] shadow-sm'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'editor' ? 'Editor' : 'Resultados'}
          </button>
        ))}
      </div>

      {tab === 'editor' ? (
        <ActivityBuilder contentId={contentId} />
      ) : (
        <ActivityResultsPanel contentId={contentId} />
      )}
    </div>
  );
}
