'use client';

import React from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import {
  getCourseParticipation,
  type CourseActivityRef,
  type CourseParticipationReport,
  type CourseTaskRef,
  type ParticipantSummary,
} from '@/features/aprendizaje/course-participation-client';
import { gradeSubmission, listSubmissionsForAssignment, getAssignmentForContentAdmin } from '@/features/aprendizaje/assignments/client';
import type {
  ContentAssignmentRecord,
  SubmissionUserRecord,
} from '@/features/aprendizaje/assignments/client';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

interface Props {
  contentId: string;
}

export function CourseParticipationPanel({ contentId }: Props) {
  const { alert } = useAppDialog();
  const [report, setReport] = React.useState<CourseParticipationReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [drawer, setDrawer] = React.useState<{
    taskRef: CourseTaskRef;
    userId: string;
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourseParticipation(contentId);
      setReport(data);
    } catch (error) {
      await alert({
        title: 'Error al cargar el reporte',
        message: error instanceof Error ? error.message : 'No se pudo cargar.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [contentId, alert]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-5 text-sm text-[var(--app-muted)]">Cargando reporte de participación…</div>
    );
  }
  if (!report) return null;

  const filtered = report.participants.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 p-4">
      {/* Overview */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Participantes" value={String(report.totals.totalParticipants)} icon={<Users size={14} />} />
        <Stat
          label="Progreso promedio"
          value={`${report.totals.averageProgress}%`}
          icon={<CheckCircle2 size={14} />}
        />
        <Stat
          label="Actividades aprobadas"
          value={`${report.totals.activitiesPassedTotal} / ${report.totals.activitiesAttemptedTotal || '—'}`}
          icon={<Trophy size={14} />}
        />
        <Stat
          label="Tareas por revisar"
          value={String(report.totals.pendingTaskReviews)}
          tint={report.totals.pendingTaskReviews > 0 ? 'text-amber-700' : undefined}
          icon={<ClipboardCheck size={14} />}
        />
      </section>

      {/* Buscador + refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[12px] border border-[var(--app-border)] bg-white py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-bold"
        >
          <RefreshCw size={12} />
          Actualizar
        </button>
      </div>

      {/* Tabla de participantes */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--app-muted)]">No hay participantes con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[var(--app-border)] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                <th className="sticky left-0 z-10 bg-[var(--app-surface-muted)] px-3 py-2 text-left">Participante</th>
                <th className="px-3 py-2 text-left">Progreso</th>
                {report.activities.map((a) => (
                  <th key={a.activityContentId} className="px-3 py-2 text-left">
                    <span className="inline-flex items-center gap-1">
                      <Trophy size={10} />
                      {a.resourceTitle}
                    </span>
                  </th>
                ))}
                {report.tasks.map((t) => (
                  <th key={t.taskContentId} className="px-3 py-2 text-left">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardCheck size={10} />
                      {t.resourceTitle}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.userId} className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-surface-muted)]/30">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <p className="font-bold text-[var(--app-ink)]">{p.name}</p>
                    <p className="text-[11px] text-[var(--app-muted)]">{p.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    <ProgressBar value={p.progressPercent} />
                  </td>
                  {report.activities.map((a) => {
                    const r = p.activityResults[a.activityContentId];
                    return (
                      <td key={a.activityContentId} className="px-3 py-2">
                        <ActivityCell result={r} passingScore={a.passingScore} />
                      </td>
                    );
                  })}
                  {report.tasks.map((t) => {
                    const r = p.taskResults[t.taskContentId];
                    return (
                      <td key={t.taskContentId} className="px-3 py-2">
                        <TaskCell
                          result={r}
                          maxScore={t.maxScore}
                          onClick={() => setDrawer({ taskRef: t, userId: p.userId })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.activities.length === 0 && report.tasks.length === 0 && (
        <p className="rounded-[12px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-center text-xs text-[var(--app-muted)]">
          Este curso no tiene actividades ni tareas vinculadas. Agrégalas desde el editor.
        </p>
      )}

      {drawer && (
        <TaskReviewDrawer
          taskRef={drawer.taskRef}
          userId={drawer.userId}
          userName={filtered.find((p) => p.userId === drawer.userId)?.name ?? ''}
          onClose={() => setDrawer(null)}
          onGraded={() => {
            setDrawer(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tint?: string;
}) {
  return (
    <div className="rounded-[12px] border border-[var(--app-border)] bg-white p-3">
      <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {icon}
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-black ${tint ?? 'text-[var(--app-ink)]'}`}>{value}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
        <div
          className={`h-full rounded-full ${v >= 100 ? 'bg-emerald-500' : 'bg-[var(--brand-primary)]'}`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-[var(--app-muted)]">{v}%</span>
    </div>
  );
}

function ActivityCell({
  result,
  passingScore,
}: {
  result: ParticipantSummary['activityResults'][string] | undefined;
  passingScore: number;
}) {
  if (!result || result.attempts === 0) {
    return <span className="text-[11px] text-[var(--app-muted)]">—</span>;
  }
  const passed = result.passed;
  return (
    <div className="space-y-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}
      >
        {passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
        {result.bestScore != null ? `${Math.round(result.bestScore)}%` : '—'}
      </span>
      <p className="text-[10px] text-[var(--app-muted)]">
        {result.attempts} {result.attempts === 1 ? 'intento' : 'intentos'} · mín {passingScore}%
      </p>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Borrador', tone: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Por revisar', tone: 'bg-amber-100 text-amber-800' },
  graded: { label: 'Calificada', tone: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rechazada', tone: 'bg-rose-100 text-rose-800' },
  revision_requested: { label: 'Revisión solicitada', tone: 'bg-blue-100 text-blue-800' },
};

function TaskCell({
  result,
  maxScore,
  onClick,
}: {
  result: ParticipantSummary['taskResults'][string] | undefined;
  maxScore: number;
  onClick: () => void;
}) {
  if (!result || result.status === 'none') {
    return <span className="text-[11px] text-[var(--app-muted)]">—</span>;
  }
  const meta = STATUS_LABEL[result.status] ?? STATUS_LABEL.draft;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-0.5 text-left"
    >
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.tone} group-hover:underline`}>
        <Eye size={10} />
        {meta.label}
      </span>
      {result.score != null && (
        <p className="text-[10px] font-bold text-[var(--app-ink)]">
          {result.score} / {maxScore}
        </p>
      )}
    </button>
  );
}

// ─── Drawer de revisión + calificación inline ────────────────────────────────

function TaskReviewDrawer({
  taskRef,
  userId,
  userName,
  onClose,
  onGraded,
}: {
  taskRef: CourseTaskRef;
  userId: string;
  userName: string;
  onClose: () => void;
  onGraded: () => void;
}) {
  const { alert } = useAppDialog();
  const [assignment, setAssignment] = React.useState<ContentAssignmentRecord | null>(null);
  const [submission, setSubmission] = React.useState<SubmissionUserRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [score, setScore] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, subs] = await Promise.all([
          getAssignmentForContentAdmin(taskRef.taskContentId),
          listSubmissionsForAssignment(taskRef.taskId),
        ]);
        if (!alive) return;
        setAssignment(a);
        // Tomamos la entrega más reciente del user específico.
        const mine = subs
          .filter((s) => s.userId === userId)
          .sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1))[0] ?? null;
        setSubmission(mine);
        if (mine) {
          setScore(mine.score ?? Math.round((a?.maxScore ?? 100) * 0.7));
          setFeedback(mine.graderFeedback ?? '');
        }
      } catch (error) {
        await alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'No se pudo cargar la entrega.',
          tone: 'error',
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [taskRef, userId, alert]);

  const onGrade = async (status: 'graded' | 'rejected' | 'revision_requested') => {
    if (!submission || !assignment) return;
    if (score < 0 || score > assignment.maxScore) {
      await alert({
        title: 'Puntaje inválido',
        message: `Debe estar entre 0 y ${assignment.maxScore}.`,
        tone: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      await gradeSubmission(submission.submissionId, {
        score,
        passed: score >= assignment.passingScore,
        graderFeedback: feedback.trim() || null,
        status,
      });
      await alert({
        title: 'Guardado',
        message: 'Calificación registrada.',
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
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--app-border)] p-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
              Entrega
            </p>
            <h3 className="text-sm font-black text-[var(--app-ink)]">{taskRef.taskTitle}</h3>
            <p className="text-xs text-[var(--app-muted)]">{userName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--app-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--app-muted)]"
          >
            Cerrar
          </button>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-[var(--app-muted)]">Cargando…</p>
        ) : !submission ? (
          <div className="p-5">
            <p className="text-sm text-[var(--app-muted)]">
              Este participante aún no envía su entrega.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                        <ExternalLink size={11} />
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assignment && (
              <div className="rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Calificar
                </p>
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
                  <span className="app-field-label">
                    Puntaje (0 - {assignment.maxScore}) · mín para aprobar: {assignment.passingScore}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={assignment.maxScore}
                    className="app-input"
                    value={score}
                    onChange={(e) =>
                      setScore(Math.max(0, Math.min(assignment.maxScore, Number(e.target.value))))
                    }
                  />
                </label>
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void onGrade('revision_requested')}
                    disabled={saving}
                    className="rounded-[10px] border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    Pedir revisión
                  </button>
                  <button
                    type="button"
                    onClick={() => void onGrade('rejected')}
                    disabled={saving}
                    className="rounded-[10px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onGrade('graded')}
                    disabled={saving}
                    className="rounded-[10px] bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Calificar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
