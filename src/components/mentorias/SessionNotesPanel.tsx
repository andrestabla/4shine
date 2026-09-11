'use client';

import React from 'react';
import { FileText, Loader2, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import {
  createSessionNote,
  deleteSessionNote,
  listSessionNotesForLeader,
  updateSessionNote,
  type SessionNoteRecord,
} from '@/features/mentorias/client';

export interface NotableSession {
  sessionId: string;
  title: string;
  mentorName?: string | null;
  startsAt: string;
}

interface NoteFormState {
  sessionId: string;
  noteDate: string;
  comment: string;
  documentUrl: string;
  documentName: string;
  documentSize: number;
  documentContentType: string;
}

const todayValue = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const emptyForm = (): NoteFormState => ({
  sessionId: '',
  noteDate: todayValue(),
  comment: '',
  documentUrl: '',
  documentName: '',
  documentSize: 0,
  documentContentType: '',
});

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Notas de las mentorías de un líder: fecha + comentario escrito y/o documento
 * (.pdf o .docx). Se monta en el 360 del líder —donde advisor, gestor y admin
 * las escriben— y en la pestaña del programa, donde el líder solo las lee.
 */
export function SessionNotesPanel({
  leaderUserId,
  canManage,
  currentUserId,
  isStaff,
  sessions = [],
}: {
  leaderUserId: string;
  canManage: boolean;
  /** Para decidir qué notas puede editar un advisor (solo las suyas). */
  currentUserId?: string;
  /** Gestor o admin: editan y borran cualquier nota. */
  isStaff?: boolean;
  /** Sesiones sobre las que se puede agregar una nota. */
  sessions?: NotableSession[];
}) {
  const { alert, confirm } = useAppDialog();
  const [notes, setNotes] = React.useState<SessionNoteRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<NoteFormState>(emptyForm);

  const showError = React.useCallback(
    async (fallback: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallback,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await listSessionNotesForLeader(leaderUserId));
    } catch (error) {
      await showError('No se pudieron cargar las notas.', error);
    } finally {
      setLoading(false);
    }
  }, [leaderUserId, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const canEditNote = (note: SessionNoteRecord) =>
    canManage && (isStaff || (currentUserId ? note.createdBy === currentUserId : false));

  const startEdit = (note: SessionNoteRecord) => {
    setEditingId(note.noteId);
    setShowForm(true);
    setForm({
      sessionId: note.sessionId,
      noteDate: note.noteDate.slice(0, 10),
      comment: note.comment ?? '',
      documentUrl: note.documentUrl ?? '',
      documentName: note.documentName ?? '',
      documentSize: note.documentSize,
      documentContentType: note.documentContentType ?? '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId && !form.sessionId) {
      await alert({ title: 'Falta la mentoría', message: 'Selecciona la mentoría a la que pertenece la nota.', tone: 'warning' });
      return;
    }
    if (!form.noteDate) {
      await alert({ title: 'Falta la fecha', message: 'Indica la fecha de la nota.', tone: 'warning' });
      return;
    }
    if (!form.comment.trim() && !form.documentUrl) {
      await alert({
        title: 'Nota vacía',
        message: 'Escribe un comentario o adjunta un documento. Al menos uno de los dos es obligatorio.',
        tone: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        noteDate: form.noteDate,
        comment: form.comment.trim() || null,
        documentUrl: form.documentUrl || null,
        documentName: form.documentName || null,
        documentSize: form.documentSize,
        documentContentType: form.documentContentType || null,
      };
      if (editingId) {
        await updateSessionNote(editingId, payload);
      } else {
        await createSessionNote({ sessionId: form.sessionId, ...payload });
      }
      resetForm();
      await load();
    } catch (error) {
      await showError('No se pudo guardar la nota.', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note: SessionNoteRecord) => {
    const ok = await confirm({
      title: 'Eliminar nota',
      message: `Se eliminará la nota del ${formatDate(note.noteDate)} sobre "${note.sessionTitle}".`,
      confirmText: 'Eliminar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteSessionNote(note.noteId);
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la nota.', error);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
        <Loader2 size={13} className="animate-spin" /> Cargando notas…
      </p>
    );
  }

  const inputClass =
    'w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          Notas de mentoría
        </p>
        {canManage && !showForm && (
          <button
            type="button"
            onClick={() => { setForm(emptyForm()); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-[11.5px] font-bold text-white"
          >
            <Plus size={12} /> Agregar nota
          </button>
        )}
      </div>

      {canManage && showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-[0.9rem] border border-[var(--brand-primary)]/30 bg-[var(--app-surface-muted)] p-3"
        >
          <label className="block text-[11px] font-semibold text-[var(--app-muted)]">
            Mentoría
            {editingId ? (
              <p className="mt-1 text-[13px] font-normal text-[var(--app-ink)]">
                {notes.find((n) => n.noteId === editingId)?.sessionTitle ?? '—'}
              </p>
            ) : (
              <select
                value={form.sessionId}
                onChange={(event) => setForm((prev) => ({ ...prev, sessionId: event.target.value }))}
                required
                className={`mt-1 ${inputClass}`}
              >
                <option value="">Selecciona la mentoría…</option>
                {sessions.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {formatDate(session.startsAt)} · {session.title}
                    {session.mentorName ? ` · ${session.mentorName}` : ''}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="block text-[11px] font-semibold text-[var(--app-muted)]">
            Fecha
            <input
              type="date"
              value={form.noteDate}
              max={todayValue()}
              onChange={(event) => setForm((prev) => ({ ...prev, noteDate: event.target.value }))}
              required
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <label className="block text-[11px] font-semibold text-[var(--app-muted)]">
            Comentario (opcional si adjuntas documento)
            <textarea
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Observaciones, acuerdos, seguimiento…"
              className={`mt-1 min-h-[72px] ${inputClass}`}
            />
          </label>

          <div className="text-[11px] font-semibold text-[var(--app-muted)]">
            Documento (.pdf o .docx, opcional si escribes comentario)
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {form.documentUrl ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--app-ink)]">
                  <FileText size={12} className="text-[var(--brand-primary)]" />
                  <span className="max-w-[220px] truncate">{form.documentName || 'documento'}</span>
                  {form.documentSize > 0 && <span className="text-[var(--app-muted)]">· {formatSize(form.documentSize)}</span>}
                  <button
                    type="button"
                    title="Quitar documento"
                    onClick={() => setForm((prev) => ({ ...prev, documentUrl: '', documentName: '', documentSize: 0, documentContentType: '' }))}
                    className="ml-1 text-[var(--app-muted)] hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : (
                <R2UploadButton
                  moduleCode="mentorias"
                  action="update"
                  pathPrefix={`mentorias/notas/${form.sessionId || 'sin-sesion'}`}
                  entityTable="app_mentoring.session_notes"
                  fieldName="session_note_document"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  buttonLabel="Adjuntar documento"
                  onUploaded={(url, payload) =>
                    setForm((prev) => ({
                      ...prev,
                      documentUrl: url,
                      documentName: payload.fileName,
                      documentSize: payload.size,
                      documentContentType: payload.contentType,
                    }))
                  }
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar nota'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-[var(--app-ink)]"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-[var(--app-muted)]">
            La nota queda visible para el líder, su advisor y el equipo. No se envía ningún correo.
          </p>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="text-xs text-[var(--app-muted)]">
          {canManage ? 'Aún no hay notas de mentoría para este líder.' : 'Aún no hay notas de tus mentorías.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.noteId}
              className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-muted)] text-[var(--brand-primary)]">
                    <StickyNote size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-[var(--app-ink)]">
                      {formatDate(note.noteDate)} · {note.sessionTitle}
                    </span>
                    <span className="block text-[11.5px] text-[var(--app-muted)]">
                      {note.mentorName ? `Con ${note.mentorName}` : ''}
                      {note.createdByName ? `${note.mentorName ? ' · ' : ''}Nota de ${note.createdByName}` : ''}
                    </span>
                  </span>
                </span>
                {canEditNote(note) && (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(note)}
                      title="Editar"
                      className="rounded-full border border-[var(--app-border)] bg-white p-1.5 text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(note)}
                      title="Eliminar"
                      className="rounded-full border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                )}
              </div>
              {note.comment && (
                <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--app-ink)]">
                  {note.comment}
                </p>
              )}
              {note.documentUrl && (
                <a
                  href={note.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3 py-1 text-[11.5px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/20"
                >
                  <FileText size={12} />
                  <span className="max-w-[260px] truncate">{note.documentName || 'Ver documento'}</span>
                  {note.documentSize > 0 && <span className="font-normal text-[var(--app-muted)]">· {formatSize(note.documentSize)}</span>}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
