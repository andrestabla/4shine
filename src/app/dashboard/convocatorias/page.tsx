'use client';

import React from 'react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  createJobPost,
  deleteJobPost,
  listJobPosts,
  updateJobPost,
  type JobPostRecord,
  type WorkMode,
} from '@/features/convocatorias/client';

interface CreateFormState {
  title: string;
  companyName: string;
  location: string;
  workMode: WorkMode;
  description: string;
}

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', {
    dateStyle: 'medium',
  });
}

export default function ConvocatoriasPage() {
  const { can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const [jobs, setJobs] = React.useState<JobPostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<CreateFormState>({
    title: '',
    companyName: '',
    location: '',
    workMode: 'hibrido',
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
      const data = await listJobPosts();
      setJobs(data);
    } catch (loadError) {
      await showError('No se pudieron cargar las convocatorias', loadError);
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
    if (!form.title.trim() || !form.companyName.trim() || !form.description.trim()) return;

    try {
      await createJobPost({
        title: form.title.trim(),
        companyName: form.companyName.trim(),
        location: form.location.trim() || null,
        workMode: form.workMode,
        description: form.description.trim(),
        isActive: true,
      });
      setForm({
        title: '',
        companyName: '',
        location: '',
        workMode: 'hibrido',
        description: '',
      });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      await showError('No se pudo crear la convocatoria', createError);
    }
  };

  const onToggleActive = async (job: JobPostRecord) => {
    try {
      await updateJobPost(job.jobPostId, { isActive: !job.isActive });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la convocatoria', updateError);
    }
  };

  const onDelete = async (job: JobPostRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar convocatoria',
      message: `¿Deseas eliminar la convocatoria "${job.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteJobPost(job.jobPostId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar la convocatoria', deleteError);
    }
  };

  const onRename = async (job: JobPostRecord) => {
    const title = await prompt({
      title: 'Renombrar convocatoria',
      message: 'Ingresa el nuevo título.',
      label: 'Título',
      defaultValue: job.title,
      placeholder: 'Título de convocatoria',
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
    });

    if (!title || !title.trim() || title.trim() === job.title) return;

    try {
      await updateJobPost(job.jobPostId, { title: title.trim() });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la convocatoria', updateError);
    }
  };

  if (isCommunityLocked) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Convocatorias"
          subtitle="Las oportunidades y convocatorias del ecosistema se habilitan con el programa 4Shine."
        />
        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Desbloquea Convocatorias con el plan 4Shine."
          description="Este módulo te abre acceso a oportunidades, búsquedas y dinámicas del ecosistema. Está disponible para líderes con el programa activo."
          products={programOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver plan 4Shine',
          }}
          note="Cuando actives el programa, Convocatorias se integrará con tu Trayectoria y tus siguientes desafíos."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Convocatorias" subtitle="Oportunidades profesionales con CRUD real." />

      {can('convocatorias', 'create') && (
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
            placeholder="Empresa"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            required
          />
          <input
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            placeholder="Ubicación"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          />
          <select
            className="border border-slate-300 rounded-md px-2 py-2 text-sm"
            value={form.workMode}
            onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value as WorkMode }))}
          >
            <option value="presencial">presencial</option>
            <option value="hibrido">hibrido</option>
            <option value="remoto">remoto</option>
            <option value="voluntariado">voluntariado</option>
          </select>
          <button className="rounded-md bg-slate-900 text-white text-sm px-3 py-2" type="submit">
            Crear
          </button>
          <textarea
            className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-6"
            placeholder="Descripción"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            required
          />
        </form>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
      ) : jobs.length === 0 ? (
        <EmptyState message="No hay convocatorias registradas." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <article key={job.jobPostId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{job.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{job.workMode ?? '-'}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      job.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {job.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {job.companyName} · {job.location ?? 'Remoto'}
              </p>
              <p className="text-sm text-slate-600 mt-3">{job.description}</p>
              <p className="text-xs text-slate-500 mt-3">
                Publicada: {toDateLabel(job.postedAt)} · {job.applicants} postulaciones
              </p>
              <div className="flex items-center gap-2 mt-4">
                {can('convocatorias', 'update') && (
                  <>
                    <button
                      className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                      type="button"
                      onClick={() => void onToggleActive(job)}
                    >
                      {job.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                      type="button"
                      onClick={() => void onRename(job)}
                    >
                      Renombrar
                    </button>
                  </>
                )}
                {can('convocatorias', 'delete') && (
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                    type="button"
                    onClick={() => void onDelete(job)}
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
