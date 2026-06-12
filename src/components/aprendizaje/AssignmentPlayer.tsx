'use client';

import React from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  Send,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import {
  getAssignmentForLearner,
  upsertMySubmission,
  type AssignmentFile,
  type AssignmentForLearner,
  type SubmissionRecord,
  type SubmissionStatus,
} from '@/features/aprendizaje/assignments/client';

const STATUS_LABELS: Record<SubmissionStatus, { label: string; tone: string }> = {
  draft: { label: 'Borrador', tone: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Enviada (pendiente revisión)', tone: 'bg-amber-100 text-amber-800' },
  graded: { label: 'Calificada', tone: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazada', tone: 'bg-rose-100 text-rose-800' },
  revision_requested: { label: 'Revisión solicitada', tone: 'bg-blue-100 text-blue-800' },
};

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function AssignmentPlayer({ contentId }: { contentId: string }) {
  const { alert, confirm } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [assignment, setAssignment] = React.useState<AssignmentForLearner | null>(null);
  const [submissionText, setSubmissionText] = React.useState('');
  const [submissionUrl, setSubmissionUrl] = React.useState('');
  const [files, setFiles] = React.useState<AssignmentFile[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssignmentForLearner(contentId);
      setAssignment(data);
      // Pre-rellenar con el draft existente si lo hay.
      const draftOrLatest = data?.mySubmissions.find(
        (s) => s.status === 'draft' || s.status === 'revision_requested',
      );
      if (draftOrLatest) {
        setSubmissionText(draftOrLatest.submissionText ?? '');
        setSubmissionUrl(draftOrLatest.submissionUrl ?? '');
        setFiles(draftOrLatest.submissionFiles ?? []);
      } else {
        setSubmissionText('');
        setSubmissionUrl('');
        setFiles([]);
      }
    } catch (error) {
      console.error('[AssignmentPlayer] load failed', error);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const doSubmit = async (asSubmit: boolean) => {
    if (!assignment) return;
    setSubmitting(true);
    try {
      await upsertMySubmission(assignment.assignmentId, {
        submissionText: assignment.acceptText ? submissionText : null,
        submissionUrl: assignment.acceptUrl ? submissionUrl : null,
        submissionFiles: assignment.acceptFiles ? files : [],
        submit: asSubmit,
      });
      await alert({
        title: asSubmit ? 'Entrega enviada' : 'Borrador guardado',
        message: asSubmit
          ? 'Tu entrega quedó marcada como enviada. El adviser la revisará.'
          : 'Tu progreso queda guardado. Puedes editarlo después.',
        tone: 'success',
      });
      await load();
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo guardar la entrega.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmSubmit = async () => {
    if (!assignment) return;
    const hasContent =
      submissionText.trim().length > 0 || submissionUrl.trim().length > 0 || files.length > 0;
    if (!hasContent) {
      await alert({
        title: 'Entrega vacía',
        message: 'Agrega texto, URL o archivos antes de enviar.',
        tone: 'warning',
      });
      return;
    }
    const ok = await confirm({
      title: 'Enviar entrega',
      message: '¿Quieres marcar esta entrega como enviada? El adviser la revisará y calificará.',
      tone: 'info',
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    await doSubmit(true);
  };

  if (loading) return <p className="text-sm text-[var(--app-muted)]">Cargando tarea…</p>;
  if (!assignment) return null;

  const activeSubmission = assignment.mySubmissions.find(
    (s) => s.status === 'draft' || s.status === 'revision_requested',
  );
  const lastSubmitted = assignment.mySubmissions.find((s) => s.status === 'submitted' || s.status === 'graded' || s.status === 'rejected');
  const submittedSubmissions = assignment.mySubmissions.filter((s) => s.status !== 'draft');
  const canEditDraft = !lastSubmitted || assignment.allowMultipleSubmissions || lastSubmitted.status === 'revision_requested';
  const filesAtLimit = files.length >= assignment.maxFiles;

  return (
    <section className="app-panel p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={18} className="text-[var(--brand-primary)]" />
        <h3 className="text-lg font-black text-[var(--app-ink)]">{assignment.title}</h3>
      </div>

      {assignment.instructions && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
            <ClipboardCheck size={11} /> Instrucciones
          </p>
          <div className="whitespace-pre-line rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-ink)]">
            {assignment.instructions}
          </div>
        </div>
      )}

      {assignment.evaluationCriteria && (
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
            <Sparkles size={11} /> Criterios de evaluación
          </p>
          <div className="whitespace-pre-line rounded-[12px] border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 p-3 text-sm text-[var(--app-ink)]">
            {assignment.evaluationCriteria}
          </div>
        </div>
      )}

      {/* Mostrar última entrega calificada */}
      {lastSubmitted && (lastSubmitted.status === 'graded' || lastSubmitted.status === 'rejected') && (
        <div
          className={`rounded-[14px] border-2 p-4 ${
            lastSubmitted.passed
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-rose-300 bg-rose-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {lastSubmitted.passed ? (
              <CheckCircle2 size={18} className="text-emerald-700" />
            ) : (
              <XCircle size={18} className="text-rose-700" />
            )}
            <p className="text-sm font-black text-[var(--app-ink)]">
              {lastSubmitted.passed ? '¡Aprobaste!' : 'No aprobaste'}
              {' · '}
              {lastSubmitted.score ?? 0} / {assignment.maxScore} pts
            </p>
          </div>
          {lastSubmitted.graderFeedback && (
            <div className="mt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Comentarios del revisor
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-[var(--app-ink)]">
                {lastSubmitted.graderFeedback}
              </p>
            </div>
          )}
          {lastSubmitted.graderName && (
            <p className="mt-1 text-[11px] text-[var(--app-muted)]">
              Revisado por {lastSubmitted.graderName} · {formatDate(lastSubmitted.gradedAt)}
            </p>
          )}
        </div>
      )}

      {/* Form de entrega */}
      {canEditDraft ? (
        <div className="space-y-3 rounded-[14px] border border-[var(--app-border)] bg-white p-4">
          <p className="text-sm font-bold text-[var(--app-ink)]">Tu entrega</p>

          {assignment.acceptText && (
            <label className="block">
              <span className="app-field-label">Respuesta escrita</span>
              <textarea
                className="app-textarea min-h-24"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Escribe tu respuesta aquí…"
              />
            </label>
          )}

          {assignment.acceptUrl && (
            <label className="block">
              <span className="app-field-label">
                <Link2 size={11} className="mr-1 inline" />
                URL del entregable (Drive, Notion, video, etc.)
              </span>
              <input
                type="url"
                className="app-input"
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          )}

          {assignment.acceptFiles && assignment.maxFiles > 0 && (
            <div>
              <span className="app-field-label">
                <FileText size={11} className="mr-1 inline" />
                Archivos ({files.length} / {assignment.maxFiles})
              </span>
              {files.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={`${f.url}-${i}`}
                      className="flex items-center gap-2 rounded-[10px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1.5"
                    >
                      <FileText size={13} className="text-[var(--app-muted)]" />
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 truncate text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        {f.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="rounded-full p-1 text-rose-600 hover:bg-rose-50"
                        aria-label="Quitar archivo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!filesAtLimit && (
                <R2UploadButton
                  moduleCode="aprendizaje"
                  action="update"
                  pathPrefix={`assignments/submissions/${contentId}`}
                  accept="*/*"
                  entityTable="app_learning.assignment_submissions"
                  fieldName="submission_files"
                  buttonLabel="Subir archivo"
                  className="app-button-secondary inline-flex items-center gap-1.5"
                  onUploaded={(url, meta) => {
                    setFiles((prev) => [
                      ...prev,
                      {
                        url,
                        name: meta?.fileName || 'archivo',
                        size: meta?.size ?? null,
                      },
                    ]);
                  }}
                />
              )}
              {filesAtLimit && (
                <p className="text-[11px] text-[var(--app-muted)]">
                  Has alcanzado el límite de archivos. Elimina alguno para subir más.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--app-border)] pt-3">
            <button
              type="button"
              className="flex-1 rounded-[12px] border border-[var(--app-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--app-ink)] sm:flex-none sm:py-2"
              disabled={submitting}
              onClick={() => void doSubmit(false)}
            >
              Guardar borrador
            </button>
            <button
              type="button"
              className="app-button-primary inline-flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
              disabled={submitting}
              onClick={() => void onConfirmSubmit()}
            >
              <Send size={13} />
              {submitting ? 'Enviando…' : 'Enviar entrega'}
            </button>
          </div>
          {activeSubmission && (
            <p className="text-[11px] text-[var(--app-muted)]">
              <span
                className={`mr-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  STATUS_LABELS[activeSubmission.status].tone
                }`}
              >
                {STATUS_LABELS[activeSubmission.status].label}
              </span>
              Última edición: {formatDate(activeSubmission.updatedAt)}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Esta tarea solo permite una entrega y ya enviaste la tuya. Espera la revisión.
        </div>
      )}

      {/* Historial de entregas anteriores */}
      {submittedSubmissions.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
            Mis entregas ({submittedSubmissions.length})
          </p>
          <div className="space-y-2">
            {submittedSubmissions.map((sub) => (
              <SubmissionCard key={sub.submissionId} submission={sub} maxScore={assignment.maxScore} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SubmissionCard({
  submission,
  maxScore,
}: {
  submission: SubmissionRecord;
  maxScore: number;
}) {
  return (
    <details className="rounded-[12px] border border-[var(--app-border)] bg-white p-3">
      <summary className="cursor-pointer">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_LABELS[submission.status].tone}`}
          >
            {STATUS_LABELS[submission.status].label}
          </span>
          <span className="text-xs text-[var(--app-muted)]">
            {formatDate(submission.submittedAt ?? submission.updatedAt)}
          </span>
          {submission.score != null && (
            <span className="ml-auto text-xs font-bold text-[var(--app-ink)]">
              {submission.score} / {maxScore} pts
            </span>
          )}
        </div>
      </summary>
      <div className="mt-2 space-y-2 text-xs text-[var(--app-muted)]">
        {submission.submissionText && (
          <p className="whitespace-pre-line text-[var(--app-ink)]">{submission.submissionText}</p>
        )}
        {submission.submissionUrl && (
          <a
            href={submission.submissionUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <ExternalLink size={11} />
            {submission.submissionUrl}
          </a>
        )}
        {submission.submissionFiles.length > 0 && (
          <ul className="space-y-1">
            {submission.submissionFiles.map((f, i) => (
              <li key={`${f.url}-${i}`}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  <FileText size={11} />
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        )}
        {submission.graderFeedback && (
          <div className="rounded-[10px] bg-[var(--app-surface-muted)] p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider">Feedback del revisor</p>
            <p className="mt-0.5 whitespace-pre-line text-[var(--app-ink)]">{submission.graderFeedback}</p>
          </div>
        )}
      </div>
    </details>
  );
}
