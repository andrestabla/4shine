'use client';

import React from 'react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
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
  const { can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [workshops, setWorkshops] = React.useState<WorkshopRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<CreateFormState>({
    title: '',
    workshopType: 'formacion',
    startsAt: '',
    endsAt: '',
    facilitatorName: '',
    meetingUrl: '',
    description: '',
  });
  const isCommunityLocked =
    currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ['program_4shine'],
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
      const data = await listWorkshops();
      setWorkshops(data);
    } catch (loadError) {
      await showError('No se pudieron cargar los workshops', loadError);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isCommunityLocked) {
      setLoading(false);
      return;
    }
    void load();
  }, [isCommunityLocked, load]);

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
      await showError('No se pudo crear el workshop', createError);
    }
  };

  const onStatusChange = async (workshop: WorkshopRecord, status: WorkshopStatus) => {
    try {
      await updateWorkshop(workshop.workshopId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar el workshop', updateError);
    }
  };

  const onDelete = async (workshop: WorkshopRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar workshop',
      message: `¿Deseas eliminar el workshop "${workshop.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteWorkshop(workshop.workshopId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar el workshop', deleteError);
    }
  };

  const onRename = async (workshop: WorkshopRecord) => {
    const title = await prompt({
      title: 'Renombrar workshop',
      message: 'Ingresa el nuevo título.',
      label: 'Título',
      defaultValue: workshop.title,
      placeholder: 'Título del workshop',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
    });

    if (!title || !title.trim() || title.trim() === workshop.title) return;

    try {
      await updateWorkshop(workshop.workshopId, { title: title.trim() });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar el workshop', updateError);
    }
  };

  if (isCommunityLocked) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Workshops"
          subtitle="Los workshops del ecosistema 4Shine se activan con el programa completo."
        />
        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Activa Workshops con el plan 4Shine."
          description="Los workshops complementan la trayectoria del líder con experiencias grupales, relacionamiento y formación. Este acceso requiere el programa 4Shine."
          products={programOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver plan 4Shine',
          }}
          note="Cuando el programa está activo, Workshops se integra con tu agenda y con el resto de módulos del journey."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Workshops" subtitle="Talleres programados y participación con CRUD real." />

      {can('workshops', 'create') && (
        <form className="app-panel grid grid-cols-1 gap-2 p-4 md:grid-cols-6" onSubmit={onCreate}>
          <input
            className="app-input md:col-span-2"
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <select
            className="app-select"
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
            className="app-input"
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
            required
          />
          <input
            className="app-input"
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            required
          />
          <button className="app-button-primary" type="submit">
            Crear
          </button>
          <input
            className="app-input md:col-span-2"
            placeholder="Facilitador (opcional)"
            value={form.facilitatorName}
            onChange={(event) => setForm((prev) => ({ ...prev, facilitatorName: event.target.value }))}
          />
          <input
            className="app-input md:col-span-2"
            placeholder="Link de sesión (opcional)"
            value={form.meetingUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, meetingUrl: event.target.value }))}
          />
          <input
            className="app-input md:col-span-2"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </form>
      )}
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando...</div>
      ) : workshops.length === 0 ? (
        <EmptyState message="No hay workshops registrados." />
      ) : (
        <div className="space-y-4">
          {workshops.map((workshop) => (
            <article key={workshop.workshopId} className="app-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--app-ink)]">{workshop.title}</h3>
                {can('workshops', 'update') ? (
                  <select
                    className="app-select min-h-0 px-3 py-2 text-xs"
                    value={workshop.status}
                    onChange={(event) => onStatusChange(workshop, event.target.value as WorkshopStatus)}
                  >
                    <option value="upcoming">upcoming</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                ) : (
                  <span className="app-badge app-badge-muted">{workshop.status}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {workshop.workshopType} · {toDateTime(workshop.startsAt)}
              </p>
              <p className="mt-3 text-sm text-[var(--app-ink)]/84">{workshop.description ?? 'Sin descripción'}</p>
              <p className="mt-3 text-xs text-[var(--app-muted)]">
                Facilitador: {workshop.facilitatorName ?? '4Shine Team'} · Asistentes: {workshop.attendees}
              </p>
              <div className="mt-4 flex items-center gap-2">
                {can('workshops', 'update') && (
                  <button
                    className="app-button-secondary min-h-0 px-3 py-2 text-xs"
                    type="button"
                    onClick={() => void onRename(workshop)}
                  >
                    Renombrar
                  </button>
                )}
                {can('workshops', 'delete') && (
                  <button
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
