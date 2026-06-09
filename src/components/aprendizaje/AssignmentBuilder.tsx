'use client';

import React from 'react';
import { ClipboardCheck, FileText, Link2, Sparkles, Trash2 } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  deleteAssignment,
  getAssignmentForContentAdmin,
  upsertAssignment,
  type ContentAssignmentRecord,
} from '@/features/aprendizaje/assignments/client';

interface BuilderForm {
  title: string;
  instructions: string;
  evaluationCriteria: string;
  maxScore: number;
  passingScore: number;
  acceptFiles: boolean;
  acceptUrl: boolean;
  acceptText: boolean;
  maxFiles: number;
  allowMultipleSubmissions: boolean;
  isActive: boolean;
}

function fromRecord(rec: ContentAssignmentRecord): BuilderForm {
  return {
    title: rec.title,
    instructions: rec.instructions,
    evaluationCriteria: rec.evaluationCriteria,
    maxScore: rec.maxScore,
    passingScore: rec.passingScore,
    acceptFiles: rec.acceptFiles,
    acceptUrl: rec.acceptUrl,
    acceptText: rec.acceptText,
    maxFiles: rec.maxFiles,
    allowMultipleSubmissions: rec.allowMultipleSubmissions,
    isActive: rec.isActive,
  };
}

const DEFAULT_FORM: BuilderForm = {
  title: 'Tarea de entrega',
  instructions: '',
  evaluationCriteria: '',
  maxScore: 100,
  passingScore: 70,
  acceptFiles: true,
  acceptUrl: true,
  acceptText: true,
  maxFiles: 5,
  allowMultipleSubmissions: true,
  isActive: true,
};

export function AssignmentBuilder({ contentId }: { contentId: string }) {
  const { alert, confirm } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [hasExisting, setHasExisting] = React.useState(false);
  const [form, setForm] = React.useState<BuilderForm>(DEFAULT_FORM);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssignmentForContentAdmin(contentId);
      if (data) {
        setHasExisting(true);
        setForm(fromRecord(data));
      } else {
        setHasExisting(false);
        setForm(DEFAULT_FORM);
      }
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!form.title.trim()) {
      await alert({ title: 'Falta título', message: 'La tarea necesita un título.', tone: 'warning' });
      return;
    }
    if (!form.acceptFiles && !form.acceptUrl && !form.acceptText) {
      await alert({
        title: 'Sin formato',
        message: 'Habilita al menos un formato de entrega (archivos, URL o texto).',
        tone: 'warning',
      });
      return;
    }
    if (form.passingScore > form.maxScore) {
      await alert({
        title: 'Puntaje inválido',
        message: 'El puntaje mínimo no puede ser mayor que el máximo.',
        tone: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      await upsertAssignment({
        contentId,
        title: form.title.trim(),
        instructions: form.instructions,
        evaluationCriteria: form.evaluationCriteria,
        maxScore: form.maxScore,
        passingScore: form.passingScore,
        acceptFiles: form.acceptFiles,
        acceptUrl: form.acceptUrl,
        acceptText: form.acceptText,
        maxFiles: form.maxFiles,
        allowMultipleSubmissions: form.allowMultipleSubmissions,
        isActive: form.isActive,
      });
      await alert({ title: 'Guardado', message: 'Tarea guardada.', tone: 'success' });
      await load();
    } catch (error) {
      await alert({
        title: 'Error al guardar',
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar tarea',
      message: 'Esto elimina la tarea y todas las entregas asociadas. Esta acción no se puede deshacer.',
      tone: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await deleteAssignment(contentId);
      await alert({ title: 'Eliminada', message: 'La tarea fue eliminada.', tone: 'success' });
      setHasExisting(false);
      setForm(DEFAULT_FORM);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo eliminar.',
        tone: 'error',
      });
    }
  };

  if (loading) return <p className="text-sm text-[var(--app-muted)]">Cargando tarea…</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="app-field-label">Título de la tarea</span>
          <input
            className="app-input"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Reflexión final del módulo"
          />
        </label>
      </div>

      <section className="app-panel p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--app-ink)]">
          <ClipboardCheck size={14} className="text-[var(--brand-primary)]" />
          Instrucciones para el líder
        </p>
        <textarea
          className="app-textarea min-h-32"
          value={form.instructions}
          onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
          placeholder="Describe paso a paso lo que el líder debe hacer..."
        />
      </section>

      <section className="app-panel p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--app-ink)]">
          <Sparkles size={14} className="text-[var(--brand-primary)]" />
          Criterios de evaluación
        </p>
        <textarea
          className="app-textarea min-h-24"
          value={form.evaluationCriteria}
          onChange={(e) => setForm((prev) => ({ ...prev, evaluationCriteria: e.target.value }))}
          placeholder="Lista los criterios por los que se calificará (ej: estructura, profundidad, claridad...)"
        />
      </section>

      <section className="app-panel p-4">
        <p className="mb-3 text-sm font-bold text-[var(--app-ink)]">Formato de entrega aceptado</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex items-start gap-2 rounded-[12px] border border-[var(--app-border)] bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptFiles}
              onChange={(e) => setForm((prev) => ({ ...prev, acceptFiles: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-primary)]"
            />
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-[var(--app-ink)]">
                <FileText size={13} />
                Archivos
              </p>
              <p className="text-[11px] text-[var(--app-muted)]">PDF, doc, imágenes, etc. via R2 upload.</p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-[12px] border border-[var(--app-border)] bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, acceptUrl: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-primary)]"
            />
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-[var(--app-ink)]">
                <Link2 size={13} />
                URL
              </p>
              <p className="text-[11px] text-[var(--app-muted)]">Link externo a Drive, Notion, video, etc.</p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-[12px] border border-[var(--app-border)] bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptText}
              onChange={(e) => setForm((prev) => ({ ...prev, acceptText: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-primary)]"
            />
            <div>
              <p className="text-sm font-bold text-[var(--app-ink)]">Texto inline</p>
              <p className="text-[11px] text-[var(--app-muted)]">Respuesta escrita directamente en el formulario.</p>
            </div>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="app-field-label">Máximo de archivos</span>
            <input
              type="number"
              min={0}
              max={20}
              className="app-input"
              value={form.maxFiles}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, maxFiles: Math.max(0, Math.min(20, Number(e.target.value))) }))
              }
              disabled={!form.acceptFiles}
            />
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={form.allowMultipleSubmissions}
              onChange={(e) => setForm((prev) => ({ ...prev, allowMultipleSubmissions: e.target.checked }))}
              className="h-4 w-4 accent-[var(--brand-primary)]"
            />
            <span className="text-sm font-semibold text-[var(--app-ink)]">Permitir múltiples entregas (re-submit)</span>
          </label>
        </div>
      </section>

      <section className="app-panel p-4">
        <p className="mb-3 text-sm font-bold text-[var(--app-ink)]">Calificación</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="app-field-label">Puntaje máximo</span>
            <input
              type="number"
              min={1}
              max={1000}
              className="app-input"
              value={form.maxScore}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, maxScore: Math.max(1, Math.min(1000, Number(e.target.value))) }))
              }
            />
          </label>
          <label className="block">
            <span className="app-field-label">Puntaje mínimo para aprobar</span>
            <input
              type="number"
              min={0}
              max={1000}
              className="app-input"
              value={form.passingScore}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, passingScore: Math.max(0, Math.min(1000, Number(e.target.value))) }))
              }
            />
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 accent-[var(--brand-primary)]"
            />
            <span className="text-sm font-semibold text-[var(--app-ink)]">Tarea activa</span>
          </label>
        </div>
      </section>

      <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--app-border)] bg-white/95 p-3 shadow-sm backdrop-blur">
        {hasExisting ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            onClick={() => void onDelete()}
          >
            <Trash2 size={13} />
            Eliminar tarea
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="app-button-primary"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Guardando…' : hasExisting ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </div>
    </div>
  );
}
