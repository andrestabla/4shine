'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { AssignmentBuilder } from '@/components/aprendizaje/AssignmentBuilder';
import { AssignmentReviewPanel } from '@/components/aprendizaje/AssignmentReviewPanel';

type Tab = 'editor' | 'entregas';

export default function ContentAssignmentPage() {
  const params = useParams<{ contentId: string }>();
  const contentId = params?.contentId;
  const [tab, setTab] = React.useState<Tab>('editor');
  if (!contentId) return null;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Tarea de entrega"
        subtitle="Configura instrucciones, criterios de evaluación y revisa las entregas del líder."
      />

      <div className="flex max-w-md gap-1 rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
        {(['editor', 'entregas'] as const).map((t) => (
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
            {t === 'editor' ? 'Editor' : 'Entregas'}
          </button>
        ))}
      </div>

      {tab === 'editor' ? (
        <AssignmentBuilder contentId={contentId} />
      ) : (
        <AssignmentReviewPanel contentId={contentId} />
      )}
    </div>
  );
}
