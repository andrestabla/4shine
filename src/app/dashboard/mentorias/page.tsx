'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  createMentorship,
  deleteMentorship,
  listMentorships,
  updateMentorship,
  type MentorshipRecord,
  type MentorshipSessionType,
  type MentorshipStatus,
} from '@/features/mentorias/client';

interface CreateFormState {
  title: string;
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  meetingUrl: string;
}

function toLocalDatetime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function MentoriasPage() {
  const { can, refreshBootstrap } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [sessions, setSessions] = React.useState<MentorshipRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<CreateFormState>({
    title: '',
    startsAt: '',
    endsAt: '',
    sessionType: 'individual',
    meetingUrl: '',
  });

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMentorships();
      setSessions(data);
    } catch (loadError) {
      await showError('No se pudieron cargar las mentorías', loadError);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt || !form.endsAt) return;

    setSaving(true);
    try {
      await createMentorship({
        title: form.title.trim(),
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
        sessionType: form.sessionType,
        meetingUrl: form.meetingUrl.trim() || null,
      });
      setForm({
        title: '',
        startsAt: '',
        endsAt: '',
        sessionType: 'individual',
        meetingUrl: '',
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      await showError('No se pudo crear la mentoría', createError);
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (session: MentorshipRecord, status: MentorshipStatus) => {
    try {
      await updateMentorship(session.sessionId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la mentoría', updateError);
    }
  };

  const onDelete = async (session: MentorshipRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar mentoría',
      message: `¿Deseas eliminar la mentoría "${session.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteMentorship(session.sessionId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar la mentoría', deleteError);
    }
  };

  const onRename = async (session: MentorshipRecord) => {
    const nextTitle = await prompt({
      title: 'Renombrar mentoría',
      message: 'Ingresa el nuevo título de la sesión.',
      label: 'Título',
      defaultValue: session.title,
      placeholder: 'Título de mentoría',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
    });

    if (!nextTitle || !nextTitle.trim() || nextTitle.trim() === session.title) return;

    try {
      await updateMentorship(session.sessionId, { title: nextTitle.trim() });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la mentoría', updateError);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Mentorías" subtitle="Agenda y estado de sesiones con CRUD real." />

      {can('mentorias', 'create') && (
        <form className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-2" onSubmit={onCreate}>
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
            required
          />
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            required
          />
          <select
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            value={form.sessionType}
            onChange={(event) => setForm((prev) => ({ ...prev, sessionType: event.target.value as MentorshipSessionType }))}
          >
            <option value="individual">individual</option>
            <option value="grupal">grupal</option>
          </select>
          <button
            className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-50"
            type="submit"
            disabled={saving}
          >
            Crear
          </button>
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-6"
            placeholder="URL de reunión (opcional)"
            value={form.meetingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
          />
        </form>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
      ) : sessions.length === 0 ? (
        <EmptyState message="No hay mentorías registradas." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Mentee</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{session.title}</td>
                    <td className="px-4 py-3 text-slate-600">{session.mentorName}</td>
                    <td className="px-4 py-3 text-slate-600">{session.menteeName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{toLocalDatetime(session.startsAt)}</td>
                    <td className="px-4 py-3">
                      {can('mentorias', 'update') ? (
                        <select
                          className="border border-slate-300 rounded px-2 py-1 text-xs"
                          value={session.status}
                          onChange={(event) => onStatusChange(session, event.target.value as MentorshipStatus)}
                        >
                          <option value="scheduled">scheduled</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="pending_rating">pending_rating</option>
                          <option value="pending_approval">pending_approval</option>
                          <option value="no_show">no_show</option>
                        </select>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{session.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {can('mentorias', 'update') && (
                          <button
                            className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                            type="button"
                            onClick={() => void onRename(session)}
                          >
                            Renombrar
                          </button>
                        )}
                        {can('mentorias', 'delete') && (
                          <button
                            className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                            onClick={() => void onDelete(session)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
