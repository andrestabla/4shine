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
      const payload: SubmitAnswerInput[] = (activity.questions ?? [])
        .filter((q): q is NonNullable<typeof q> => Boolean(q && q.questionId))
        .map((q) => ({
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

  // TEMP DIAGNÓSTICO: dump del activity completo para identificar shape malformado.
  // TODO: remover cuando se identifique la causa del crash.
  if (typeof window !== 'undefined') {
    (window as unknown as { __activityDump?: unknown }).__activityDump = activity;
    console.log('[ActivityPlayer] activity dump:', JSON.parse(JSON.stringify(activity)));
  }

  // Defensive: el backend a veces devuelve arrays con elementos null/undefined;
  // filtramos para evitar crashes downstream.
  const safeAttempts = Array.isArray(activity.userAttempts)
    ? activity.userAttempts.filter((a): a is NonNullable<typeof a> => Boolean(a))
    : [];
  const safeQuestions = Array.isArray(activity.questions)
    ? activity.questions.filter((q): q is NonNullable<typeof q> => Boolean(q && q.questionId))
    : [];

  const passed = result?.passed ?? null;
  const bestPrevious = safeAttempts
    .filter((a) => a.status === 'submitted')
    .reduce<number | null>((max, a) => {
      if (a.scorePercent == null) return max;
      return max == null || a.scorePercent > max ? a.scorePercent : max;
    }, null);
  const attemptsUsed = safeAttempts.filter((a) => a.status === 'submitted').length;
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
            <Stat label="Preguntas" value={String(safeQuestions.length)} />
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
          {safeQuestions.map((q, idx) => (
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
            {safeQuestions.map((q, idx) => {
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
          {type === 'matching' && (
            <MatchingInput payload={payload} value={value} onChange={onChange} />
          )}
          {type === 'classification' && (
            <ClassificationInput payload={payload} value={value} onChange={onChange} />
          )}
          {type === 'hotspot' && (
            <HotspotInput payload={payload} value={value} onChange={onChange} />
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
  const rawItems = ((payload as { items?: { id: string; text: string }[] })?.items) ?? [];
  const items = rawItems.filter((i): i is { id: string; text: string } => Boolean(i && i.id));
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

// ─── Phase 2 inputs ──────────────────────────────────────────────────────────

interface NamedItem { id: string; text: string }

function shuffled<T>(arr: T[], seed: string): T[] {
  // Determinístico por seed (questionId) para que no se reordene cada render.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 9301 + 49297) % 233280;
    const j = Math.floor((h / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function MatchingInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const rawLeft = ((payload as { leftItems?: NamedItem[] })?.leftItems) ?? [];
  const rawRight = ((payload as { rightItems?: NamedItem[] })?.rightItems) ?? [];
  const left: NamedItem[] = rawLeft.filter((i): i is NamedItem => Boolean(i && i.id));
  const rightRaw: NamedItem[] = rawRight.filter((i): i is NamedItem => Boolean(i && i.id));
  const right = React.useMemo(
    () => shuffled(rightRaw, rightRaw.map((r) => r.id).join('|')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rightRaw.map((r) => r.id).join('|')],
  );

  const pairs: Array<[string, string]> = Array.isArray((value as { pairs?: Array<[string, string]> } | null)?.pairs)
    ? (value as { pairs: Array<[string, string]> }).pairs
    : [];
  const [selectedLeft, setSelectedLeft] = React.useState<string | null>(null);

  const pairOf = (id: string, side: 'L' | 'R'): string | undefined => {
    if (side === 'L') return pairs.find(([l]) => l === id)?.[1];
    return pairs.find(([, r]) => r === id)?.[0];
  };

  const togglePair = (leftId: string, rightId: string) => {
    // Si ya están emparejados, despareja
    const exists = pairs.some(([l, r]) => l === leftId && r === rightId);
    let next: Array<[string, string]>;
    if (exists) {
      next = pairs.filter(([l, r]) => !(l === leftId && r === rightId));
    } else {
      // Remover cualquier pareja previa de leftId o rightId, luego agregar nueva
      next = pairs.filter(([l, r]) => l !== leftId && r !== rightId);
      next.push([leftId, rightId]);
    }
    onChange({ pairs: next });
    setSelectedLeft(null);
  };

  const onLeftClick = (id: string) => {
    setSelectedLeft((prev) => (prev === id ? null : id));
  };
  const onRightClick = (id: string) => {
    if (selectedLeft) togglePair(selectedLeft, id);
  };

  // Mapa de colores estables por pareja
  const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
  const colorOfPair = (leftId: string): string | undefined => {
    const idx = left.findIndex((l) => l.id === leftId);
    if (idx < 0) return undefined;
    return colors[idx % colors.length];
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[var(--app-muted)]">
        Toca un concepto de la izquierda y luego su pareja de la derecha para conectarlos.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {left.map((item) => {
            const matchedRight = pairOf(item.id, 'L');
            const color = matchedRight ? colorOfPair(item.id) : undefined;
            const sel = selectedLeft === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onLeftClick(item.id)}
                className="flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-sm transition"
                style={{
                  borderColor: sel ? 'var(--brand-primary)' : color ?? 'var(--app-border)',
                  background: sel ? 'color-mix(in srgb, var(--brand-primary) 8%, white)' : color ? `color-mix(in srgb, ${color} 8%, white)` : 'white',
                }}
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color ?? '#cbd5e1' }}
                />
                <span className="text-[var(--app-ink)]">{item.text}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-1.5">
          {right.map((item) => {
            const matchedLeft = pairOf(item.id, 'R');
            const color = matchedLeft ? colorOfPair(matchedLeft) : undefined;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRightClick(item.id)}
                className="flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-sm transition disabled:opacity-50"
                disabled={!selectedLeft && !matchedLeft}
                style={{
                  borderColor: color ?? 'var(--app-border)',
                  background: color ? `color-mix(in srgb, ${color} 8%, white)` : 'white',
                }}
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color ?? '#cbd5e1' }}
                />
                <span className="text-[var(--app-ink)]">{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClassificationInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const rawBuckets = ((payload as { buckets?: Array<{ id: string; label: string }> })?.buckets) ?? [];
  const rawItemsClass = ((payload as { items?: NamedItem[] })?.items) ?? [];
  const buckets = rawBuckets.filter(
    (b): b is { id: string; label: string } => Boolean(b && b.id),
  );
  const itemsRaw: NamedItem[] = rawItemsClass.filter((i): i is NamedItem => Boolean(i && i.id));
  const items = React.useMemo(
    () => shuffled(itemsRaw, itemsRaw.map((i) => i.id).join('|')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsRaw.map((i) => i.id).join('|')],
  );

  const assignments: Record<string, string> =
    ((value as { assignments?: Record<string, string> } | null)?.assignments) ?? {};
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const assign = (itemId: string, bucketId: string | null) => {
    const next = { ...assignments };
    if (bucketId === null) delete next[itemId];
    else next[itemId] = bucketId;
    onChange({ assignments: next });
    setSelectedItem(null);
  };

  const unassigned = items.filter((i) => !assignments[i.id]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--app-muted)]">
        Toca un item y luego la categoría a la que pertenece.
      </p>
      {unassigned.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--app-muted)]">
            Por clasificar ({unassigned.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setSelectedItem((prev) => (prev === it.id ? null : it.id))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedItem === it.id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                    : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                }`}
              >
                {it.text}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {buckets.map((b) => {
          const inBucket = items.filter((it) => assignments[it.id] === b.id);
          return (
            <div
              key={b.id}
              className={`rounded-[12px] border border-dashed p-3 transition ${
                selectedItem ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 cursor-pointer' : 'border-[var(--app-border)] bg-white'
              }`}
              onClick={() => selectedItem && assign(selectedItem, b.id)}
            >
              <p className="mb-2 text-sm font-bold text-[var(--app-ink)]">{b.label}</p>
              {inBucket.length === 0 ? (
                <p className="text-[11px] text-[var(--app-muted)]">Vacío</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {inBucket.map((it) => (
                    <span
                      key={it.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--app-ink)]"
                    >
                      {it.text}
                      <button
                        type="button"
                        aria-label="Quitar"
                        onClick={(e) => {
                          e.stopPropagation();
                          assign(it.id, null);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HotspotInput({
  payload,
  value,
  onChange,
}: {
  payload: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const imageUrl = (payload as { imageUrl?: string })?.imageUrl ?? '';
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const x = Number((value as { x?: number } | null)?.x);
  const y = Number((value as { y?: number } | null)?.y);
  const hasPos = Number.isFinite(x) && Number.isFinite(y);

  const onImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    onChange({ x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) });
  };

  if (!imageUrl) {
    return <p className="text-sm text-[var(--app-muted)]">Falta imagen.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[var(--app-muted)]">
        Haz click sobre la zona de la imagen que responde a la pregunta.
      </p>
      <div
        ref={containerRef}
        onClick={onImageClick}
        className="relative inline-block w-full max-w-lg cursor-crosshair overflow-hidden rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Pregunta" className="block w-full" />
        {hasPos && (
          <div
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: 24,
              height: 24,
              transform: 'translate(-50%, -50%)',
              border: '3px solid var(--brand-primary)',
              borderRadius: '50%',
              background: 'rgba(124, 58, 237, 0.2)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
