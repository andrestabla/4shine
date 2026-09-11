'use client';

import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { WorkbookAnnexRecord } from '@/features/lideres/client';

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Lista compacta de anexos PDF de un workbook; reutilizada en el 360 y en Aprendizaje. */
export function WorkbookAnnexList({
  annexes,
  onDelete,
  emptyText,
}: {
  annexes: WorkbookAnnexRecord[];
  onDelete?: (annex: WorkbookAnnexRecord) => void;
  emptyText?: string;
}) {
  if (annexes.length === 0) {
    return emptyText ? <p className="text-[11.5px] text-[var(--app-muted)]">{emptyText}</p> : null;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {annexes.map((annex) => (
        <li key={annex.annexId} className="inline-flex max-w-full items-center gap-1">
          <a
            href={annex.fileUrl}
            target="_blank"
            rel="noreferrer"
            title={`${annex.fileName}${annex.fileSize ? ` · ${formatSize(annex.fileSize)}` : ''}`}
            className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-2.5 py-1 text-[11.5px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/20"
            onClick={(event) => event.stopPropagation()}
          >
            <FileText size={12} className="shrink-0" />
            <span className="truncate">{annex.title}</span>
          </a>
          {onDelete && (
            <button
              type="button"
              title="Eliminar anexo"
              onClick={(event) => { event.stopPropagation(); onDelete(annex); }}
              className="rounded-full border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={11} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
