'use client';

import React from 'react';
import { Check, ExternalLink, Search, Trophy } from 'lucide-react';
import {
  listAvailableActivities,
  type AvailableActivityRecord,
} from '@/features/aprendizaje/activities/client';

interface ActivityPickerProps {
  /** content_id de la actividad seleccionada (lo que va en linkedContentId). */
  value: string | null | undefined;
  /** Se llama con el content_id y la metadata mínima al seleccionar. */
  onChange: (selection: { contentId: string; title: string } | null) => void;
}

export function ActivityPicker({ value, onChange }: ActivityPickerProps) {
  const [items, setItems] = React.useState<AvailableActivityRecord[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    listAvailableActivities()
      .then((data) => setItems(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las actividades.'));
  }, []);

  const filtered = React.useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.contentTitle.toLowerCase().includes(q) ||
        it.activityTitle.toLowerCase().includes(q) ||
        (it.category ?? '').toLowerCase().includes(q),
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
    return (
      <p className="text-xs text-[var(--app-muted)]">Cargando banco de actividades…</p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-xs text-[var(--app-muted)]">
        Aún no hay actividades disponibles. Crea una en{' '}
        <a
          href="/dashboard/contenido"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-bold text-[var(--brand-primary)] hover:underline"
        >
          Contenido <ExternalLink size={11} />
        </a>{' '}
        y vuelve aquí.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected card */}
      {selected ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 p-3">
          <Trophy size={16} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--app-ink)]">{selected.activityTitle}</p>
            <p className="truncate text-xs text-[var(--app-muted)]">
              Adjunto a: {selected.contentTitle} · {selected.questionCount} pregunta
              {selected.questionCount === 1 ? '' : 's'}
              {!selected.isActive && ' · inactiva'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-[var(--app-border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--app-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-[12px] border border-dashed border-[var(--app-border)] bg-white p-3 text-left text-sm text-[var(--app-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
        >
          + Elegir actividad del banco
        </button>
      )}

      {/* Picker list */}
      {(!selected || expanded) && (
        <div className="rounded-[12px] border border-[var(--app-border)] bg-white">
          <div className="relative border-b border-[var(--app-border)] p-2">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              type="text"
              className="w-full rounded-[10px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] pl-8 pr-3 py-1.5 text-sm"
              placeholder="Buscar por título, actividad o categoría…"
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
                        onChange({ contentId: it.contentId, title: it.activityTitle });
                        setExpanded(false);
                      }}
                      className={`flex w-full items-start gap-2 border-b border-[var(--app-border)] px-3 py-2 text-left hover:bg-[var(--app-surface-muted)]/50 ${
                        isSelected ? 'bg-[var(--brand-primary)]/5' : ''
                      }`}
                    >
                      <Trophy size={14} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--app-ink)]">
                          {it.activityTitle}
                        </p>
                        <p className="truncate text-[11px] text-[var(--app-muted)]">
                          {it.contentTitle} · {it.questionCount} pregunta
                          {it.questionCount === 1 ? '' : 's'}
                          {it.category && ` · ${it.category}`}
                          {!it.isActive && ' · inactiva'}
                        </p>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 text-[var(--brand-primary)]" />}
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
