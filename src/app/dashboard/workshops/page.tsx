'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useUser } from '@/context/UserContext';
import {
  createWorkshop,
  deleteWorkshop,
  listWorkshops,
  updateWorkshop,
  type WorkshopRecord,
  type WorkshopStatus,
  type WorkshopType,
} from '@/features/workshops/client';

interface CreateFormState {
  title: string;
  workshopType: WorkshopType;
  startsAt: string;
  endsAt: string;
  facilitatorName: string;
  meetingUrl: string;
  description: string;
}

function toDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function WorkshopsPage() {
  const { can, refreshBootstrap } = useUser();
  const [workshops, setWorkshops] = React.useState<WorkshopRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CreateFormState>({
    title: '',
    workshopType: 'formacion',
    startsAt: '',
    endsAt: '',
    facilitatorName: '',
    meetingUrl: '',
    description: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWorkshops();
      setWorkshops(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los workshops');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt || !form.endsAt) return;

    try {
      await createWorkshop({
        title: form.title.trim(),
        workshopType: form.workshopType,
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
        facilitatorName: form.facilitatorName.trim() || null,
        meetingUrl: form.meetingUrl.trim() || null,
        description: form.description.trim() || null,
      });
      setForm({
        title: '',
        workshopType: 'formacion',
        startsAt: '',
        endsAt: '',
        facilitatorName: '',
        meetingUrl: '',
        description: '',
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el workshop');
    }
  };

  const onStatusChange = async (workshop: WorkshopRecord, status: WorkshopStatus) => {
    try {
      await updateWorkshop(workshop.workshopId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el workshop');
    }
  };

  const onDelete = async (workshop: WorkshopRecord) => {
    const confirmed = window.confirm(`Eliminar workshop "${workshop.title}"?`);
    if (!confirmed) return;

    try {
      await deleteWorkshop(workshop.workshopId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el workshop');
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Workshops" subtitle="Talleres programados y participación con CRUD real." />

      {can('workshops', 'create') && (
        <form className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-2" onSubmit={onCreate}>
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <select
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            value={form.workshopType}
            onChange={(event) => setForm((prev) => ({ ...prev, workshopType: event.target.value as WorkshopType }))}
          >
            <option value="relacionamiento">relacionamiento</option>
            <option value="formacion">formacion</option>
            <option value="innovacion">innovacion</option>
            <option value="wellbeing">wellbeing</option>
            <option value="otro">otro</option>
          </select>
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
          <button className="rounded-md bg-slate-900 text-white text-sm px-3 py-2" type="submit">
            Crear
          </button>
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
            placeholder="Facilitador (opcional)"
            value={form.facilitatorName}
            onChange={(event) => setForm((prev) => ({ ...prev, facilitatorName: event.target.value }))}
          />
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
            placeholder="Link de sesión (opcional)"
            value={form.meetingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
          />
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
      ) : workshops.length === 0 ? (
        <EmptyState message="No hay workshops registrados." />
      ) : (
        <div className="space-y-4">
          {workshops.map((workshop) => (
            <article key={workshop.workshopId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{workshop.title}</h3>
                {can('workshops', 'update') ? (
                  <select
                    className="border border-slate-300 rounded px-2 py-1 text-xs"
                    value={workshop.status}
                    onChange={(event) => onStatusChange(workshop, event.target.value as WorkshopStatus)}
                  >
                    <option value="upcoming">upcoming</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{workshop.status}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {workshop.workshopType} · {toDateTime(workshop.startsAt)}
              </p>
              <p className="text-sm text-slate-600 mt-3">{workshop.description ?? 'Sin descripción'}</p>
              <p className="text-xs text-slate-500 mt-3">
                Facilitador: {workshop.facilitatorName ?? '4Shine Team'} · Asistentes: {workshop.attendees}
              </p>
              <div className="flex items-center gap-2 mt-4">
                {can('workshops', 'update') && (
                  <button
                    className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                    type="button"
                    onClick={async () => {
                      const title = window.prompt('Nuevo título', workshop.title);
                      if (!title || !title.trim() || title.trim() === workshop.title) return;
                      try {
                        await updateWorkshop(workshop.workshopId, { title: title.trim() });
                        await Promise.all([load(), refreshBootstrap()]);
                      } catch (updateError) {
                        setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el workshop');
                      }
                    }}
                  >
                    Renombrar
                  </button>
                )}
                {can('workshops', 'delete') && (
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                    type="button"
                    onClick={() => void onDelete(workshop)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
