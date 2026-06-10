'use client';

import React from 'react';
import { Check, ClipboardCheck, ExternalLink, Search } from 'lucide-react';
import {
  listAvailableAssignments,
  type AvailableAssignmentRecord,
} from '@/features/aprendizaje/assignments/client';

interface AssignmentPickerProps {
  /** content_id de la tarea seleccionada (lo que va en linkedContentId). */
  value: string | null | undefined;
  /** Se llama con el content_id y la metadata mínima al seleccionar. */
  onChange: (selection: { contentId: string; title: string } | null) => void;
}

export function AssignmentPicker({ value, onChange }: AssignmentPickerProps) {
  const [items, setItems] = React.useState<AvailableAssignmentRecord[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    listAvailableAssignments()
      .then((data) => setItems(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las tareas.'),
      );
  }, []);

  const filtered = React.useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.contentTitle.toLowerCase().includes(q) ||
        it.assignmentTitle.toLowerCase().includes(q),
    );
  }, [items, query]);

  const selected = items?.find((it) => it.contentId === value) ?? null;

  if (error) {
    return (
      <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
        {error}
      </div>
    );
  }
  if (items === null) {
    return <p className="text-xs text-[var(--app-muted)]">Cargando banco de tareas…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs text-[var(--app-muted)]">
        Aún no hay tareas disponibles. Crea una en{' '}
        <a
          href="/dashboard/contenido"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-bold text-[var(--brand-primary)] hover:underline"
        >
          Contenido <ExternalLink size={11} />
        </a>{' '}
        (tipo "Tarea") y vuelve aquí.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-sky-500 bg-sky-50 p-3">
          <ClipboardCheck size={16} className="mt-0.5 shrink-0 text-sky-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--app-ink)]">{selected.assignmentTitle}</p>
            <p className="truncate text-xs text-[var(--app-muted)]">
              Adjunto a: {selected.contentTitle}
              {!selected.isActive && ' · inactiva'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-[var(--app-border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--app-muted)] hover:border-sky-600 hover:text-sky-700"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-[12px] border border-dashed border-[var(--app-border)] bg-white p-3 text-left text-sm text-[var(--app-muted)] hover:border-sky-600 hover:text-sky-700"
        >
          + Elegir tarea del banco
        </button>
      )}

      {(!selected || expanded) && (
        <div className="rounded-[12px] border border-[var(--app-border)] bg-white">
          <div className="relative border-b border-[var(--app-border)] p-2">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              type="text"
              className="w-full rounded-[10px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-8 pr-3 py-1.5 text-sm"
              placeholder="Buscar por título o tarea…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[var(--app-muted)]">
                Sin resultados.
              </li>
            ) : (
              filtered.map((it) => {
                const isSelected = it.contentId === value;
                return (
                  <li key={it.contentId}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ contentId: it.contentId, title: it.assignmentTitle });
                        setExpanded(false);
                      }}
                      className={`flex w-full items-start gap-2 border-b border-[var(--app-border)] px-3 py-2 text-left hover:bg-[var(--app-surface-muted)]/50 ${
                        isSelected ? 'bg-sky-50' : ''
                      }`}
                    >
                      <ClipboardCheck size={14} className="mt-0.5 shrink-0 text-sky-700" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--app-ink)]">
                          {it.assignmentTitle}
                        </p>
                        <p className="truncate text-[11px] text-[var(--app-muted)]">
                          {it.contentTitle}
                          {!it.isActive && ' · inactiva'}
                        </p>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 text-sky-700" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
