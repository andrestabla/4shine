'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, Loader2, X } from 'lucide-react';
import { getLearningWorkbook } from '@/features/aprendizaje/client';
import { buildWorkbookAnswers, type WorkbookAnswerGroup } from '@/lib/workbooks-v2-registry';

interface Props {
  workbookId: string;
  workbookCode: string;
  title: string;
  ownerName: string;
  deepLink: string;
  onClose: () => void;
}

/**
 * Lectura de las respuestas de un workbook, para advisor, gestor y admin.
 *
 * Es SOLO LECTURA a propósito: el acompañamiento necesita ver lo que el líder
 * escribió, y abrir el editor con la cuenta de otra persona fue justo lo que
 * antes borraba su trabajo.
 */
export function WorkbookAnswersModal({
  workbookId,
  workbookCode,
  title,
  ownerName,
  deepLink,
  onClose,
}: Props) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<WorkbookAnswerGroup[]>([]);
  const [stats, setStats] = React.useState({ answered: 0, total: 0 });
  const [orphan, setOrphan] = React.useState<{ fieldId: string; answer: string }[]>([]);
  const [legacy, setLegacy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const workbook = await getLearningWorkbook(workbookId);
        if (cancelled) return;
        const parsed = buildWorkbookAnswers(workbookCode, workbook.statePayload);
        setGroups(parsed.groups);
        setStats({ answered: parsed.answered, total: parsed.total });
        setOrphan(parsed.orphan.map((o) => ({ fieldId: o.fieldId, answer: o.answer })));
        setLegacy(parsed.legacy);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el workbook.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workbookId, workbookCode]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.4rem] bg-white shadow-2xl sm:rounded-[1.4rem]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Respuestas de ${title}`}
      >
        <header className="flex items-start gap-3 border-b border-[var(--app-border)] px-5 py-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-[var(--app-ink)] text-white">
            <BookOpen size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-[var(--app-ink)]">{title}</h2>
            <p className="text-xs text-[var(--app-muted)]">
              Respuestas de {ownerName}
              {!loading && stats.total > 0 && ` · ${stats.answered} de ${stats.total} campos`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full border border-[var(--app-border)] p-1.5 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
          >
            <X size={15} />
          </button>
        </header>

        <div className="min-h-[140px] flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="flex items-center gap-2 py-6 text-sm text-[var(--app-muted)]">
              <Loader2 size={14} className="animate-spin" /> Cargando respuestas…
            </p>
          ) : error ? (
            <p className="py-6 text-sm text-rose-700">{error}</p>
          ) : groups.length === 0 && orphan.length === 0 ? (
            <div className="py-6">
              <p className="text-sm text-[var(--app-muted)]">
                Este workbook todavía no tiene respuestas guardadas.
              </p>
              {legacy && (
                <p className="mt-2 rounded-[0.9rem] border border-amber-200 bg-amber-50 p-3 text-[12.6px] text-amber-800">
                  Hay contenido guardado en el formato anterior del workbook. Esta vista no lo interpreta
                  para no mostrarte texto de la plantilla como si fueran respuestas del líder; ábrelo con
                  el botón de abajo para revisarlo.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group, index) => (
                <section key={`${group.sectionLabel}-${index}`}>
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                    {group.sectionLabel}
                    {group.groupTitle ? ` · ${group.groupTitle}` : ''}
                  </p>
                  <div className="space-y-3">
                    {group.answers.map((answer) => (
                      <div
                        key={answer.fieldId}
                        className="rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/45 p-3"
                      >
                        <p className="text-[12.4px] font-bold text-[var(--app-ink)]">{answer.label}</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--app-ink)]">
                          {answer.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {orphan.length > 0 && (
                <section>
                  <p className="mb-2 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                    Respuestas de una versión anterior del workbook
                  </p>
                  <div className="space-y-3">
                    {orphan.map((item) => (
                      <div key={item.fieldId} className="rounded-[0.9rem] border border-dashed border-[var(--app-border)] p-3">
                        <p className="text-[11px] font-semibold text-[var(--app-muted)]">{item.fieldId}</p>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--app-ink)]">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-border)] px-5 py-3">
          <p className="text-[11px] text-[var(--app-muted)]">
            Vista de solo lectura: nada de lo que hagas aquí modifica el trabajo del líder.
          </p>
          <Link
            href={deepLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
          >
            Abrir el workbook <ExternalLink size={12} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
