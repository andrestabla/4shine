'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Play, Plus, Trash2, Video } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  createSessionRecording,
  deleteSessionRecording,
  listSessionRecordingsForLeader,
  updateSessionRecording,
  type SessionRecordingRecord,
} from '@/features/mentorias/client';

export interface RecordableSession {
  sessionId: string;
  title: string;
  mentorName?: string | null;
  startsAt: string;
}

const EMPTY_FORM = {
  sessionId: '',
  title: '',
  recordingUrl: '',
  durationMinutes: '',
  recordedAt: '',
  description: '',
};

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Grabaciones de las mentorías 1:1 de un líder.
 *
 * Se usa en dos lugares con el mismo componente: el 360 del líder —donde
 * gestor y admin además pueden cargarlas— y la pestaña del programa, donde el
 * líder solo las consulta. Así lo que ve cada uno no se desincroniza.
 */
export function SessionRecordingsPanel({
  leaderUserId,
  canManage,
  sessions = [],
}: {
  leaderUserId: string;
  canManage: boolean;
  /** Sesiones sobre las que se puede cargar una grabación. */
  sessions?: RecordableSession[];
}) {
  const { alert, confirm } = useAppDialog();
  const [recordings, setRecordings] = React.useState<SessionRecordingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ ...EMPTY_FORM });

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
      setRecordings(await listSessionRecordingsForLeader(leaderUserId));
    } catch (error) {
      await showError('No se pudieron cargar las grabaciones.', error);
    } finally {
      setLoading(false);
    }
  }, [leaderUserId, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (recording: SessionRecordingRecord) => {
    setEditingId(recording.recordingId);
    setShowForm(true);
    setForm({
      sessionId: recording.sessionId,
      title: recording.title,
      recordingUrl: recording.recordingUrl,
      durationMinutes: recording.durationMinutes ? String(recording.durationMinutes) : '',
      recordedAt: recording.recordedAt ? recording.recordedAt.slice(0, 16) : '',
      description: recording.description ?? '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.recordingUrl.trim()) return;
    if (!editingId && !form.sessionId) {
      await alert({ title: 'Falta la sesión', message: 'Elige la sesión que grabaste.', tone: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        recordingUrl: form.recordingUrl.trim(),
        description: form.description.trim() || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : 0,
        recordedAt: form.recordedAt ? new Date(form.recordedAt).toISOString() : null,
      };
      if (editingId) {
        await updateSessionRecording(editingId, payload);
      } else {
        await createSessionRecording({ sessionId: form.sessionId, ...payload });
      }
      resetForm();
      await load();
    } catch (error) {
      await showError('No se pudo guardar la grabación.', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recording: SessionRecordingRecord) => {
    const ok = await confirm({
      title: 'Eliminar grabación',
      message: `Se eliminará "${recording.title}". El líder dejará de verla.`,
      confirmText: 'Eliminar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteSessionRecording(recording.recordingId);
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la grabación.', error);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
        <Loader2 size={13} className="animate-spin" /> Cargando grabaciones…
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          Grabaciones de sesiones
        </p>
        {canManage && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-[11.5px] font-bold text-white"
          >
            <Plus size={12} /> Cargar grabación
          </button>
        )}
      </div>

      {canManage && showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-[0.9rem] border border-[var(--brand-primary)]/30 bg-[var(--app-surface-muted)] p-3"
        >
          {!editingId && (
            <select
              value={form.sessionId}
              onChange={(event) => setForm((prev) => ({ ...prev, sessionId: event.target.value }))}
              required
              className="w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
            >
              <option value="">Selecciona la sesión…</option>
              {sessions.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {formatDate(session.startsAt)} · {session.title}
                  {session.mentorName ? ` · ${session.mentorName}` : ''}
                </option>
              ))}
            </select>
          )}

          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Título de la grabación"
            required
            className="w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
          />
          <input
            value={form.recordingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, recordingUrl: event.target.value }))}
            placeholder="URL de la grabación (Zoom u otro)"
            required
            className="w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="datetime-local"
              value={form.recordedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, recordedAt: event.target.value }))}
              className="rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
            />
            <input
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, durationMinutes: event.target.value.replace(/[^\d]/g, '') }))
              }
              placeholder="Duración (min)"
              inputMode="numeric"
              className="rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Notas de la sesión (opcional)"
            className="min-h-[64px] w-full rounded-[0.75rem] border border-[var(--app-border)] bg-white px-3 py-2 text-[13px] text-[var(--app-ink)]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--brand-primary)] px-3.5 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Publicar grabación'}
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
            La grabación queda visible para el líder, su advisor y el equipo. No se envía ningún
            correo al publicarla.
          </p>
        </form>
      )}

      {recordings.length === 0 ? (
        <p className="text-xs text-[var(--app-muted)]">
          {canManage
            ? 'Aún no hay grabaciones cargadas para este líder.'
            : 'Aún no hay grabaciones de tus sesiones.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {recordings.map((recording) => (
            <li
              key={recording.recordingId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-muted)] text-[var(--brand-primary)]">
                  <Video size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-[var(--app-ink)]">
                    {recording.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-[var(--app-muted)]">
                    {recording.sessionTitle}
                    {recording.mentorName ? ` · ${recording.mentorName}` : ''}
                    {recording.recordedAt ? ` · ${formatDate(recording.recordedAt)}` : ''}
                    {recording.durationMinutes > 0 ? ` · ${recording.durationMinutes} min` : ''}
                  </span>
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={`/dashboard/mentorias/grabaciones/${recording.recordingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1.5 text-[11.5px] font-bold text-white"
                >
                  <Play size={12} /> Ver grabación
                </Link>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(recording)}
                      title="Editar"
                      className="rounded-full border border-[var(--app-border)] bg-white p-1.5 text-[var(--app-muted)] hover:text-[var(--brand-primary)]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(recording)}
                      title="Eliminar"
                      className="rounded-full border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
