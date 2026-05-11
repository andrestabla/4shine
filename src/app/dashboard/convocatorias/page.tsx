'use client';

import React from 'react';
import { Lock, Megaphone } from 'lucide-react';
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
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-7 py-10 text-center sm:py-12">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem]"
            style={{ background: "linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%)" }}
          >
            <Megaphone size={22} style={{ color: "#a85f1a" }} />
          </div>
          <h1 className="mt-5 text-[1.6rem] font-black leading-tight text-[var(--app-ink)] sm:text-[1.9rem]">
            Las convocatorias del<br />ecosistema te esperan.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
            Oportunidades profesionales, búsquedas y dinámicas del ecosistema 4Shine disponibles con el programa.
          </p>
          <a
            href="https://www.4shine.co/planes-precios"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Activar programa · $3,000 USD
          </a>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Qué incluye Convocatorias</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">Accede a oportunidades alineadas a tu momento.</h2>
          <div className="mt-4 space-y-2 opacity-60">
            {[
              { label: "Oportunidades profesionales", desc: "Posiciones, proyectos y roles publicados en el ecosistema." },
              { label: "Búsquedas activas", desc: "Convocatorias abiertas por empresas del programa." },
              { label: "Integración con Trayectoria", desc: "Conectadas a tu etapa y objetivos del journey." },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3.5 rounded-[1rem] bg-[var(--app-surface-muted)] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-white">
                  <Lock size={12} className="text-[var(--app-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--app-ink)]">{f.label}</p>
                  <p className="text-[11px] text-[var(--app-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Desbloquea Convocatorias con el plan 4Shine."
          description="Este módulo te abre acceso a oportunidades, búsquedas y dinámicas del ecosistema. Está disponible para líderes con el programa activo."
          products={programOffers}
          primaryAction={{ href: '/dashboard', label: 'Ver plan 4Shine' }}
          note="Cuando actives el programa, Convocatorias se integrará con tu Trayectoria y tus siguientes desafíos."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Convocatorias" subtitle="Oportunidades profesionales con CRUD real." />

      {can('convocatorias', 'create') && (
        <form className="app-panel grid grid-cols-1 gap-2 p-4 md:grid-cols-6" onSubmit={onCreate}>
          <input
            className="app-input md:col-span-2"
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="app-input"
            placeholder="Empresa"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            required
          />
          <input
            className="app-input"
            placeholder="Ubicación"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          />
          <select
            className="app-select"
            value={form.workMode}
            onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value as WorkMode }))}
          >
            <option value="presencial">presencial</option>
            <option value="hibrido">hibrido</option>
            <option value="remoto">remoto</option>
            <option value="voluntariado">voluntariado</option>
          </select>
          <button className="app-button-primary" type="submit">
            Crear
          </button>
          <textarea
            className="app-textarea md:col-span-6"
            placeholder="Descripción"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            required
          />
        </form>
      )}
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando...</div>
      ) : jobs.length === 0 ? (
        <EmptyState message="No hay convocatorias registradas." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <article key={job.jobPostId} className="app-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--app-ink)]">{job.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="app-badge app-badge-muted">{job.workMode ?? '-'}</span>
                  <span
                    className={`app-badge ${
                      job.isActive ? 'app-badge-success' : 'app-badge-muted'
                    }`}
                  >
                    {job.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {job.companyName} · {job.location ?? 'Remoto'}
              </p>
              <p className="mt-3 text-sm text-[var(--app-ink)]/84">{job.description}</p>
              <p className="mt-3 text-xs text-[var(--app-muted)]">
                Publicada: {toDateLabel(job.postedAt)} · {job.applicants} postulaciones
              </p>
              <div className="mt-4 flex items-center gap-2">
                {can('convocatorias', 'update') && (
                  <>
                    <button
                      className="app-button-secondary min-h-0 px-3 py-2 text-xs"
                      type="button"
                      onClick={() => void onToggleActive(job)}
                    >
                      {job.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="app-button-secondary min-h-0 px-3 py-2 text-xs"
                      type="button"
                      onClick={() => void onRename(job)}
                    >
                      Renombrar
                    </button>
                  </>
                )}
                {can('convocatorias', 'delete') && (
                  <button
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
