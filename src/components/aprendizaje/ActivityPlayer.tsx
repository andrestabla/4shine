'use client';

import React from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  getActivityForLearner,
  startActivityAttempt,
  submitActivityAttempt,
  type ActivityForLearner,
  type QuestionType,
  type SubmitAnswerInput,
  type SubmitAttemptResult,
} from '@/features/aprendizaje/activities/client';

type AnswerState = Record<string, unknown>;

export function ActivityPlayer({ contentId }: { contentId: string }) {
  const { alert } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [activity, setActivity] = React.useState<ActivityForLearner | null>(null);
  const [phase, setPhase] = React.useState<'intro' | 'playing' | 'result'>('intro');
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<AnswerState>({});
  const [result, setResult] = React.useState<SubmitAttemptResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivityForLearner(contentId);
      setActivity(data);
    } catch (error) {
      console.error('[activity-player] load failed', error);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onStart = async () => {
    if (!activity) return;
    try {
      const { attemptId: id } = await startActivityAttempt(activity.activityId);
      setAttemptId(id);
      setAnswers({});
      setPhase('playing');
    } catch (error) {
      await alert({
        title: 'No se pudo iniciar',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
        tone: 'error',
      });
    }
  };

  const onSubmit = async () => {
    if (!attemptId || !activity) return;
    setSubmitting(true);
    try {
      const payload: SubmitAnswerInput[] = activity.questions.map((q) => ({
        questionId: q.questionId,
        answer: answers[q.questionId] ?? null,
      }));
      const res = await submitActivityAttempt(attemptId, payload);
      setResult(res);
      setPhase('result');
      await load();
    } catch (error) {
      await alert({
        title: 'Error al enviar',
        message: error instanceof Error ? error.message : 'No se pudo enviar.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-[var(--app-muted)]">Cargando actividad…</p>;
  if (!activity) return null;

  const passed = result?.passed ?? null;
  const bestPrevious = activity.userAttempts
    .filter((a) => a.status === 'submitted')
    .reduce<number | null>((max, a) => {
      if (a.scorePercent == null) return max;
      return max == null || a.scorePercent > max ? a.scorePercent : max;
    }, null);
  const attemptsUsed = activity.userAttempts.filter((a) => a.status === 'submitted').length;
  const attemptsExhausted =
    activity.maxAttempts > 0 && attemptsUsed >= activity.maxAttempts && phase === 'intro';

  return (
    <section className="app-panel p-5 sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <Trophy size={18} className="text-[var(--brand-primary)]" />
        <h3 className="text-lg font-black text-[var(--app-ink)]">{activity.title}</h3>
      </div>
      {activity.instructions && (
        <p className="mb-4 whitespace-pre-line text-sm text-[var(--app-muted)]">{activity.instructions}</p>
      )}

      {phase === 'intro' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Preguntas" value={String(activity.questions.length)} />
            <Stat label="Aprobar con" value={`${activity.passingScore}%`} />
            <Stat
              label="Intentos"
              value={
                activity.maxAttempts === 0
                  ? `${attemptsUsed} / ∞`
                  : `${attemptsUsed} / ${activity.maxAttempts}`
              }
            />
            <Stat
              label="Mejor intento"
              value={bestPrevious != null ? `${bestPrevious}%` : '—'}
            />
          </div>
          <button
            type="button"
            className="app-button-primary inline-flex items-center gap-2"
            disabled={attemptsExhausted}
            onClick={() => void onStart()}
          >
            {attemptsUsed > 0 ? 'Volver a intentar' : 'Empezar actividad'}
          </button>
          {attemptsExhausted && (
            <p className="text-xs text-rose-600">Alcanzaste el máximo de intentos permitidos.</p>
          )}
        </div>
      )}

      {phase === 'playing' && (
        <div className="space-y-4">
          {activity.questions.map((q, idx) => (
            <PlayerQuestion
              key={q.questionId}
              index={idx}
              type={q.type}
              prompt={q.prompt}
              points={q.points}
              payload={q.payload}
              value={answers[q.questionId]}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.questionId]: v }))}
            />
          ))}
          <div className="sticky bottom-2 z-10 flex justify-end gap-2 rounded-[16px] border border-[var(--app-border)] bg-white/95 p-3 shadow-sm backdrop-blur">
            <button
              type="button"
              className="rounded-[12px] border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-ink)]"
              onClick={() => {
                setPhase('intro');
                setAttemptId(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="app-button-primary"
              disabled={submitting}
              onClick={() => void onSubmit()}
            >
              {submitting ? 'Calificando…' : 'Enviar respuestas'}
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="space-y-4">
          <div
            className={`rounded-[16px] border-2 p-5 text-center ${
              passed
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-amber-300 bg-amber-50'
            }`}
          >
            {passed ? (
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
            ) : (
              <RotateCcw size={36} className="mx-auto text-amber-600" />
            )}
            <p className="mt-2 text-2xl font-black text-[var(--app-ink)]">
              {result.scorePercent}%
            </p>
            <p className="text-xs text-[var(--app-muted)]">
              {result.pointsEarned} / {result.pointsPossible} puntos · {passed ? '¡Aprobaste!' : 'Sigue practicando'}
            </p>
          </div>
          <div className="space-y-2">
            {activity.questions.map((q, idx) => {
              const pq = result.perQuestion.find((r) => r.questionId === q.questionId);
              if (!pq) return null;
              return (
                <details
                  key={q.questionId}
                  className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
                >
                  <summary className="flex cursor-pointer items-center gap-2">
                    {pq.isCorrect ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <XCircle size={15} className="text-rose-500" />
                    )}
                    <span className="line-clamp-1 flex-1 font-semibold text-[var(--app-ink)]">
                      {idx + 1}. {q.prompt}
                    </span>
                    <span className="text-xs text-[var(--app-muted)]">
                      {pq.pointsEarned}/{pq.pointsPossible} pts
                    </span>
                  </summary>
                  {pq.explanation && (
                    <p className="mt-2 text-xs text-[var(--app-muted)]">
                      <b className="text-[var(--app-ink)]">Explicación:</b> {pq.explanation}
                    </p>
                  )}
                </details>
              );
            })}
          </div>
          <button
            type="button"
            className="app-button-secondary"
            onClick={() => {
              setPhase('intro');
              setResult(null);
              setAttemptId(null);
            }}
          >
            Volver al resumen
          </button>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-black text-[var(--app-ink)]">{value}</p>
    </div>
  );
}

function PlayerQuestion(props: {
  index: number;
  type: QuestionType;
  prompt: string;
  points: number;
  payload: unknown;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { index, type, prompt, points, payload, value, onChange } = props;
  const [expanded, setExpanded] = React.useState(true);
  return (
    <article className="rounded-[14px] border border-[var(--app-border)] bg-white">
      <header className="flex items-center gap-2 border-b border-[var(--app-border)] px-3 py-2">
        <p className="flex-1 text-sm font-semibold text-[var(--app-ink)]">
          {index + 1}. {prompt}
        </p>
        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
          {points} pts
        </span>
        <button
          type="button"
          className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </header>
      {expanded && (
        <div className="p-3">
          {type === 'single_choice' && (
            <SingleChoiceInput payload={payload} value={value} onChange={onChange} />
          )}
          {type === 'multiple_choice' && (
            <MultipleChoiceInput payload={payload} value={value} onChange={onChange} />
          )}
          {type === 'true_false' && <TrueFalseInput value={value} onChange={onChange} />}
          {type === 'fill_blank' && <FillBlankInput value={value} onChange={onChange} />}
          {type === 'numeric' && <NumericInput value={value} onChange={onChange} />}
          {type === 'ordering' && (
            <OrderingInput payload={payload} value={value} onChange={onChange} />
          )}
        </div>
      )}
    </article>
  );
}

function SingleChoiceInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const options = ((payload as { options?: { id: string; text: string }[] })?.options) ?? [];
  const selected = (value as { optionId?: string } | null)?.optionId;
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm ${
            selected === opt.id
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
              : 'border-[var(--app-border)]'
          }`}
        >
          <input
            type="radio"
            checked={selected === opt.id}
            onChange={() => onChange({ optionId: opt.id })}
            className="h-4 w-4 accent-[var(--brand-primary)]"
          />
          <span className="text-[var(--app-ink)]">{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

function MultipleChoiceInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const options = ((payload as { options?: { id: string; text: string }[] })?.options) ?? [];
  const selected = new Set(((value as { optionIds?: string[] } | null)?.optionIds) ?? []);
  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const checked = selected.has(opt.id);
        return (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm ${
              checked
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                : 'border-[var(--app-border)]'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(opt.id);
                else next.delete(opt.id);
                onChange({ optionIds: Array.from(next) });
              }}
              className="h-4 w-4 accent-[var(--brand-primary)]"
            />
            <span className="text-[var(--app-ink)]">{opt.text}</span>
          </label>
        );
      })}
    </div>
  );
}

function TrueFalseInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const v = (value as { value?: boolean } | null)?.value;
  return (
    <div className="flex gap-2">
      {[true, false].map((b) => (
        <button
          key={String(b)}
          type="button"
          onClick={() => onChange({ value: b })}
          className={`flex-1 rounded-[12px] border px-4 py-3 text-sm font-semibold ${
            v === b
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
              : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
          }`}
        >
          {b ? 'Verdadero' : 'Falso'}
        </button>
      ))}
    </div>
  );
}

function FillBlankInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const text = String((value as { text?: unknown } | null)?.text ?? '');
  return (
    <input
      className="app-input"
      value={text}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Escribe tu respuesta…"
    />
  );
}

function NumericInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const v = (value as { value?: number | string } | null)?.value ?? '';
  return (
    <input
      type="number"
      className="app-input"
      value={v as string}
      onChange={(e) => onChange({ value: e.target.value })}
      placeholder="Escribe el número"
    />
  );
}

function OrderingInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const items = ((payload as { items?: { id: string; text: string }[] })?.items) ?? [];
  const initialOrder = items.map((i) => i.id);
  const currentOrder: string[] =
    Array.isArray((value as { order?: string[] } | null)?.order) &&
    ((value as { order: string[] }).order.length === items.length)
      ? (value as { order: string[] }).order
      : initialOrder;
  const itemById = new Map(items.map((i) => [i.id, i]));

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= currentOrder.length) return;
    const next = [...currentOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ order: next });
  };

  return (
    <div className="space-y-1.5">
      {currentOrder.map((id, i) => {
        const item = itemById.get(id);
        if (!item) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-2 rounded-[10px] border border-[var(--app-border)] bg-white px-3 py-2"
          >
            <span className="w-5 text-center text-xs font-bold text-[var(--app-muted)]">{i + 1}</span>
            <span className="flex-1 text-sm text-[var(--app-ink)]">{item.text}</span>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
              aria-label="Subir"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              disabled={i === currentOrder.length - 1}
              onClick={() => move(i, 1)}
              className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
              aria-label="Bajar"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
