'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { createRequest, type ConvocatoriaTipo } from '@/features/convocatorias/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  laboral: 'Laboral',
  proyecto_social: 'Proyecto Social',
  proveedor: 'Proveedor',
  convenio: 'Convenio',
  otra: 'Otra',
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  tipo: ConvocatoriaTipo;
  objetivo: string;
  description: string;
  fechaInicio: string;
  fechaFin: string;
  requisitos: string;
  enlacesComplementarios: string;
  numeroContacto: string;
  loading: boolean;
}

const INITIAL_FORM: FormState = {
  title: '',
  tipo: 'otra',
  objetivo: '',
  description: '',
  fechaInicio: '',
  fechaFin: '',
  requisitos: '',
  enlacesComplementarios: '',
  numeroContacto: '',
  loading: false,
};

export default function SolicitarConvocatoriaPage() {
  const router = useRouter();
  const { alert } = useAppDialog();
  // useUser imported in case future gating is needed
  useUser();

  const [form, setForm] = React.useState<FormState>(INITIAL_FORM);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setForm((s) => ({ ...s, loading: true }));
    try {
      await createRequest({
        title: form.title.trim(),
        tipo: form.tipo,
        objetivo: form.objetivo.trim(),
        description: form.description.trim(),
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        requisitos: form.requisitos.trim(),
        enlacesComplementarios: form.enlacesComplementarios.trim(),
        numeroContacto: form.numeroContacto.trim(),
      });
      await alert({
        title: '¡Solicitud enviada!',
        message: 'Tu solicitud fue recibida. El equipo 4Shine la revisará y te notificará.',
        tone: 'success',
      });
      router.push('/dashboard/convocatorias');
    } catch (err) {
      await alert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo enviar la solicitud',
        tone: 'error',
      });
      setForm((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      {/* Back */}
      <Link
        href="/dashboard/convocatorias"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-ink)] transition"
      >
        <ArrowLeft size={16} />
        Convocatorias
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-[var(--app-border)] bg-white p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--brand-surface-strong) 0%, var(--brand-surface) 100%)' }}
          >
            <Send size={18} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight text-[var(--app-ink)]">
              Solicitar publicación de convocatoria
            </h1>
            <p className="mt-0.5 text-sm text-[var(--app-muted)]">
              Cuéntanos qué convocatoria quieres publicar. El equipo 4Shine la revisará y te contactará.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Título */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Título *
            </label>
            <input
              className="app-input"
              placeholder="Nombre de la convocatoria"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Tipo
            </label>
            <select
              className="app-select"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value as ConvocatoriaTipo }))}
            >
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Objetivo */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Objetivo
            </label>
            <textarea
              className="app-textarea"
              rows={2}
              placeholder="¿Cuál es el objetivo principal de esta convocatoria?"
              value={form.objetivo}
              onChange={(e) => setForm((s) => ({ ...s, objetivo: e.target.value }))}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Descripción
            </label>
            <textarea
              className="app-textarea"
              rows={3}
              placeholder="¿Qué es? ¿A quién va dirigida? ¿Cuál es el alcance?"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                Fecha inicio
              </label>
              <input
                className="app-input"
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm((s) => ({ ...s, fechaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                Fecha fin
              </label>
              <input
                className="app-input"
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm((s) => ({ ...s, fechaFin: e.target.value }))}
              />
            </div>
          </div>

          {/* Requisitos */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Requisitos (opcional)
            </label>
            <textarea
              className="app-textarea"
              rows={2}
              placeholder="¿Qué requisitos deben cumplir los aplicantes?"
              value={form.requisitos}
              onChange={(e) => setForm((s) => ({ ...s, requisitos: e.target.value }))}
            />
          </div>

          {/* Enlaces complementarios */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Enlaces complementarios (opcional)
            </label>
            <input
              className="app-input"
              placeholder="https://... (bases, convocatoria oficial, etc.)"
              value={form.enlacesComplementarios}
              onChange={(e) => setForm((s) => ({ ...s, enlacesComplementarios: e.target.value }))}
            />
          </div>

          {/* Número de contacto */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
              Número de contacto (opcional)
            </label>
            <input
              className="app-input"
              placeholder="+57 300 000 0000"
              value={form.numeroContacto}
              onChange={(e) => setForm((s) => ({ ...s, numeroContacto: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="app-button-secondary"
              onClick={() => router.back()}
              disabled={form.loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
              disabled={form.loading || !form.title.trim()}
            >
              {form.loading ? 'Enviando...' : <><Send size={14} />Enviar solicitud</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
