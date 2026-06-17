'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  getConvocatoria,
  updateConvocatoria,
  type ConvocatoriaTipo,
  type ConvocatoriaStatus,
} from '@/features/convocatorias/client';

const TIPO_LABELS: Record<ConvocatoriaTipo, string> = {
  laboral: 'Laboral',
  proyecto_social: 'Proyecto Social',
  proveedor: 'Proveedor',
  convenio: 'Convenio',
  otra: 'Otra',
};

interface FormState {
  title: string;
  tipo: ConvocatoriaTipo;
  objetivo: string;
  description: string;
  fechaInicio: string;
  fechaFin: string;
  requisitos: string;
  enlacesComplementarios: string;
  contactoTelefono: string;
  contactoEmail: string;
  empresaSolicitante: string;
  solicitudArchivoLabel: string;
  solicitudArchivoRequerido: boolean;
  solicitudUrlLabel: string;
  solicitudUrlRequerido: boolean;
  location: string;
  externalUrl: string;
  status: ConvocatoriaStatus;
  loading: boolean;
}

export default function EditarConvocatoriaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useUser();
  const { alert } = useAppDialog();

  const [form, setForm] = React.useState<FormState | null>(null);
  const [fetching, setFetching] = React.useState(true);

  const set = (patch: Partial<FormState>) => setForm((s) => s ? { ...s, ...patch } : s);

  React.useEffect(() => {
    if (!can('convocatorias', 'update')) {
      router.replace(`/dashboard/convocatorias/${id}`);
      return;
    }
    getConvocatoria(id)
      .then((item) => {
        setForm({
          title: item.title,
          tipo: item.tipo,
          objetivo: item.objetivo,
          description: item.description,
          fechaInicio: item.fechaInicio ?? '',
          fechaFin: item.fechaFin ?? '',
          requisitos: item.requisitos,
          enlacesComplementarios: item.enlacesComplementarios,
          contactoTelefono: item.contactoTelefono,
          contactoEmail: item.contactoEmail,
          empresaSolicitante: item.empresaSolicitante,
          solicitudArchivoLabel: item.solicitudArchivoLabel,
          solicitudArchivoRequerido: item.solicitudArchivoRequerido,
          solicitudUrlLabel: item.solicitudUrlLabel,
          solicitudUrlRequerido: item.solicitudUrlRequerido,
          location: item.location ?? '',
          externalUrl: item.externalUrl ?? '',
          status: item.status,
          loading: false,
        });
      })
      .catch(() => router.replace(`/dashboard/convocatorias/${id}`))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.title.trim()) return;
    set({ loading: true });
    try {
      await updateConvocatoria(id, {
        title: form.title.trim(),
        tipo: form.tipo,
        objetivo: form.objetivo.trim(),
        description: form.description.trim(),
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        requisitos: form.requisitos.trim(),
        enlacesComplementarios: form.enlacesComplementarios.trim(),
        contactoTelefono: form.contactoTelefono.trim(),
        contactoEmail: form.contactoEmail.trim(),
        empresaSolicitante: form.empresaSolicitante.trim(),
        solicitudArchivoLabel: form.solicitudArchivoLabel.trim(),
        solicitudArchivoRequerido: form.solicitudArchivoRequerido,
        solicitudUrlLabel: form.solicitudUrlLabel.trim(),
        solicitudUrlRequerido: form.solicitudUrlRequerido,
        location: form.location.trim() || null,
        externalUrl: form.externalUrl.trim() || null,
        status: form.status,
      });
      router.push(`/dashboard/convocatorias/${id}`);
    } catch (err) {
      await alert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo guardar la convocatoria',
        tone: 'error',
      });
      set({ loading: false });
    }
  };

  const label = (text: string, required = false) => (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
      {text}{required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );

  if (fetching || !form) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[var(--app-muted)]">
        Cargando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-[var(--app-ink)]">Editar convocatoria</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Actualiza la información. Los cambios se aplican de inmediato.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Información básica */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">Información básica</h2>

          <div>
            {label('Título', true)}
            <input
              className="app-input"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              {label('Tipo')}
              <select className="app-select" value={form.tipo} onChange={(e) => set({ tipo: e.target.value as ConvocatoriaTipo })}>
                {(Object.entries(TIPO_LABELS) as [ConvocatoriaTipo, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              {label('Estado')}
              <select className="app-select" value={form.status} onChange={(e) => set({ status: e.target.value as ConvocatoriaStatus })}>
                <option value="draft">Borrador</option>
                <option value="open">Abierta</option>
                <option value="closed">Cerrada</option>
                <option value="suspended">Suspendida</option>
              </select>
            </div>
          </div>

          <div>
            {label('Objetivo')}
            <textarea className="app-textarea" rows={2} placeholder="Objetivo principal de la convocatoria" value={form.objetivo} onChange={(e) => set({ objetivo: e.target.value })} />
          </div>

          <div>
            {label('Descripción')}
            <textarea className="app-textarea" rows={4} placeholder="¿Qué es? ¿A quién va dirigida? ¿Cuál es el alcance?" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
        </div>

        {/* Fechas y requisitos */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">Fechas y requisitos</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {label('Fecha inicio')}
              <input className="app-input" type="date" value={form.fechaInicio} onChange={(e) => set({ fechaInicio: e.target.value })} />
            </div>
            <div>
              {label('Fecha fin')}
              <input className="app-input" type="date" value={form.fechaFin} onChange={(e) => set({ fechaFin: e.target.value })} />
            </div>
          </div>

          <div>
            {label('Requisitos')}
            <textarea className="app-textarea" rows={3} placeholder="Requisitos para aplicar (opcional)" value={form.requisitos} onChange={(e) => set({ requisitos: e.target.value })} />
          </div>

          <div>
            {label('Enlace complementario')}
            <input className="app-input" placeholder="https://... (opcional)" value={form.enlacesComplementarios} onChange={(e) => set({ enlacesComplementarios: e.target.value })} />
          </div>
        </div>

        {/* Contacto y ubicación */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">Contacto y ubicación</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              {label('Teléfono de contacto')}
              <input className="app-input" placeholder="+57 300 000 0000 (opcional)" value={form.contactoTelefono} onChange={(e) => set({ contactoTelefono: e.target.value })} />
            </div>
            <div>
              {label('Correo de contacto')}
              <input className="app-input" type="email" placeholder="contacto@ejemplo.com (opcional)" value={form.contactoEmail} onChange={(e) => set({ contactoEmail: e.target.value })} />
            </div>
          </div>

          <div>
            {label('Empresa solicitante')}
            <input className="app-input" placeholder="Nombre de la empresa u organización (opcional)" value={form.empresaSolicitante} onChange={(e) => set({ empresaSolicitante: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              {label('Ubicación')}
              <input className="app-input" placeholder="Ciudad, País o Remoto" value={form.location} onChange={(e) => set({ location: e.target.value })} />
            </div>
            <div>
              {label('URL externa')}
              <input className="app-input" placeholder="https://... (opcional)" value={form.externalUrl} onChange={(e) => set({ externalUrl: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Requisitos de postulación */}
        <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--app-muted)]">Requisitos de postulación</h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">Si necesitas que el postulante adjunte un archivo o proporcione una URL al aplicar, configúralo aquí.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="solicitud-archivo-req"
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--app-border)] accent-[var(--brand-primary)]"
                checked={form.solicitudArchivoRequerido}
                onChange={(e) => set({ solicitudArchivoRequerido: e.target.checked })}
              />
              <label htmlFor="solicitud-archivo-req" className="text-sm font-semibold text-[var(--app-ink)]">Solicitar archivo adjunto</label>
            </div>
            {form.solicitudArchivoRequerido && (
              <div className="ml-7">
                {label('Etiqueta del campo de archivo')}
                <input
                  className="app-input"
                  placeholder="ej. Hoja de vida (PDF)"
                  value={form.solicitudArchivoLabel}
                  onChange={(e) => set({ solicitudArchivoLabel: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                id="solicitud-url-req"
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--app-border)] accent-[var(--brand-primary)]"
                checked={form.solicitudUrlRequerido}
                onChange={(e) => set({ solicitudUrlRequerido: e.target.checked })}
              />
              <label htmlFor="solicitud-url-req" className="text-sm font-semibold text-[var(--app-ink)]">Solicitar URL</label>
            </div>
            {form.solicitudUrlRequerido && (
              <div className="ml-7">
                {label('Etiqueta del campo de URL')}
                <input
                  className="app-input"
                  placeholder="ej. Portafolio o LinkedIn"
                  value={form.solicitudUrlLabel}
                  onChange={(e) => set({ solicitudUrlLabel: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="app-button-secondary" onClick={() => router.push(`/dashboard/convocatorias/${id}`)} disabled={form.loading}>
            Cancelar
          </button>
          <button type="submit" className="app-button-primary" disabled={form.loading || !form.title.trim()}>
            {form.loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
