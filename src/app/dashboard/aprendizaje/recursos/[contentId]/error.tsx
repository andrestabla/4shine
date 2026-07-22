'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function ResourceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[recursos/[contentId]] runtime error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <Link
        href="/dashboard/aprendizaje"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
      >
        <ArrowLeft size={14} />
        Volver a Aprendizaje
      </Link>

      <section className="app-panel p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={20} className="text-rose-600" />
          <h2 className="text-lg font-black text-[var(--app-ink)]">Error al cargar el recurso</h2>
        </div>
        <p className="mb-4 text-sm text-[var(--app-muted)]">
          No pudimos mostrar este recurso. Intenta de nuevo; si persiste, avísanos.
        </p>

        <pre className="overflow-x-auto whitespace-pre-wrap rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
{error?.message || 'Unknown error'}
{error?.stack ? `\n\n${error.stack.split('\n').slice(0, 12).join('\n')}` : ''}
        </pre>

        {error?.digest && (
          <p className="mt-2 text-[11px] text-[var(--app-muted)]">
            digest: <code className="rounded bg-[var(--app-surface-muted)] px-1.5 py-0.5 font-mono">{error.digest}</code>
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white"
          >
            <RotateCcw size={14} />
            Reintentar
          </button>
          <Link
            href="/dashboard/aprendizaje"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-ink)]"
          >
            Volver al listado
          </Link>
        </div>
      </section>
    </div>
  );
}
