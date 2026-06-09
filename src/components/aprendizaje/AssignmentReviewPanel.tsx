'use client';

import React from 'react';
import { ExternalLink, FileText, MessageSquare, Save, Users } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  getAssignmentForContentAdmin,
  gradeSubmission,
  listSubmissionsForAssignment,
  type ContentAssignmentRecord,
  type SubmissionUserRecord,
} from '@/features/aprendizaje/assignments/client';

const STATUS_LABELS = {
  draft: { label: 'Borrador', tone: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Pendiente revisión', tone: 'bg-amber-100 text-amber-800' },
  graded: { label: 'Calificada', tone: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazada', tone: 'bg-rose-100 text-rose-800' },
  revision_requested: { label: 'Revisión solicitada', tone: 'bg-blue-100 text-blue-800' },
} as const;

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function AssignmentReviewPanel({ contentId }: { contentId: string }) {
  const { alert } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [assignment, setAssignment] = React.useState<ContentAssignmentRecord | null>(null);
  const [submissions, setSubmissions] = React.useState<SubmissionUserRecord[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const a = await getAssignmentForContentAdmin(contentId);
      if (!a) {
        setAssignment(null);
        setSubmissions([]);
        return;
      }
      setAssignment(a);
      const list = await listSubmissionsForAssignment(a.assignmentId);
      setSubmissions(list);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudieron cargar las entregas.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [contentId, alert]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-[var(--app-muted)]">Cargando entregas…</p>;
  if (!assignment) {
    return (
      <p className="text-sm text-[var(--app-muted)]">
        Este contenido aún no tiene una tarea configurada.
      </p>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Entregas" value={String(submissions.length)} />
        <StatCard label="Pendientes" value={String(pendingCount)} tint="text-amber-700" />
        <StatCard label="Calificadas" value={String(gradedCount)} tint="text-emerald-700" />
        <StatCard label="Puntaje máx." value={`${assignment.maxScore}`} />
      </div>

      <section className="app-panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-[var(--brand-primary)]" />
          <p className="app-section-kicker">Entregas por líder</p>
        </div>
        {submissions.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">Aún no hay entregas.</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <SubmissionReviewCard
                key={sub.submissionId}
                submission={sub}
                maxScore={assignment.maxScore}
                passingScore={assignment.passingScore}
                onGraded={() => void load()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="app-panel p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${tint ?? 'text-[var(--app-ink)]'}`}>{value}</p>
    </div>
  );
}

function SubmissionReviewCard({
  submission,
  maxScore,
  passingScore,
  onGraded,
}: {
  submission: SubmissionUserRecord;
  maxScore: number;
  passingScore: number;
  onGraded: () => void;
}) {
  const { alert } = useAppDialog();
  const [open, setOpen] = React.useState(submission.status === 'submitted');
  const [score, setScore] = React.useState<number>(submission.score ?? Math.round(maxScore * 0.7));
  const [feedback, setFeedback] = React.useState<string>(submission.graderFeedback ?? '');
  const [saving, setSaving] = React.useState(false);

  const meta = STATUS_LABELS[submission.status as keyof typeof STATUS_LABELS] ?? STATUS_LABELS.draft;

  const onGrade = async (status: 'graded' | 'rejected' | 'revision_requested') => {
    if (score < 0 || score > maxScore) {
      await alert({
        title: 'Puntaje inválido',
        message: `Debe estar entre 0 y ${maxScore}.`,
        tone: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      await gradeSubmission(submission.submissionId, {
        score,
        passed: score >= passingScore,
        graderFeedback: feedback.trim() || null,
        status,
      });
      await alert({
        title: 'Guardado',
        message: 'La calificación fue registrada.',
        tone: 'success',
      });
      onGraded();
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo calificar.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-[14px] border border-[var(--app-border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--app-ink)]">{submission.userName}</p>
          <p className="text-xs text-[var(--app-muted)]">{submission.userEmail}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.tone}`}>
          {meta.label}
        </span>
        {submission.score != null && (
          <span className="text-sm font-bold text-[var(--app-ink)]">
            {submission.score} / {maxScore}
          </span>
        )}
        <span className="text-xs text-[var(--app-muted)]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-[var(--app-border)] p-3 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            <p className="text-[var(--app-muted)]">
              <b className="text-[var(--app-ink)]">Enviada:</b> {formatDate(submission.submittedAt)}
            </p>
            <p className="text-[var(--app-muted)]">
              <b className="text-[var(--app-ink)]">Última edición:</b> {formatDate(submission.updatedAt)}
            </p>
          </div>

          {submission.submissionText && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Respuesta escrita
              </p>
              <div className="whitespace-pre-line rounded-[10px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-2 text-sm text-[var(--app-ink)]">
                {submission.submissionText}
              </div>
            </div>
          )}

          {submission.submissionUrl && (
            <a
              href={submission.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <ExternalLink size={12} />
              {submission.submissionUrl}
            </a>
          )}

          {submission.submissionFiles.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Archivos ({submission.submissionFiles.length})
              </p>
              <ul className="space-y-1">
                {submission.submissionFiles.map((f, i) => (
                  <li key={`${f.url}-${i}`}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      <FileText size={12} />
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form de calificación */}
          <div className="rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 space-y-2">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              <MessageSquare size={11} />
              Calificar entrega
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
              <label className="block">
                <span className="app-field-label">Feedback al líder</span>
                <textarea
                  className="app-textarea min-h-20"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Qué hizo bien, qué puede mejorar…"
                />
              </label>
              <label className="block">
                <span className="app-field-label">Puntaje (0 - {maxScore})</span>
                <input
                  type="number"
                  min={0}
                  max={maxScore}
                  className="app-input"
                  value={score}
                  onChange={(e) => setScore(Math.max(0, Math.min(maxScore, Number(e.target.value))))}
                />
                <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                  Aprueba con ≥ {passingScore}
                </p>
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => void onGrade('revision_requested')}
                disabled={saving}
                className="rounded-[10px] border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Pedir revisión
              </button>
              <button
                type="button"
                onClick={() => void onGrade('rejected')}
                disabled={saving}
                className="rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => void onGrade('graded')}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-[10px] bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-bold text-white"
              >
                <Save size={11} />
                Calificar
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
