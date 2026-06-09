'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import {
  deleteActivity as deleteActivityApi,
  getActivityForContentAdmin,
  upsertActivity,
  type ActivityRecord,
  type ChoiceOption,
  type ClassificationPayload,
  type FillBlankPayload,
  type HotspotPayload,
  type MatchingPayload,
  type MultipleChoicePayload,
  type NumericPayload,
  type OrderingPayload,
  type QuestionType,
  type SingleChoicePayload,
  type TrueFalsePayload,
  type UpsertActivityInput,
} from '@/features/aprendizaje/activities/client';

interface BuilderQuestion {
  questionId?: string;
  collapsed: boolean;
  type: QuestionType;
  prompt: string;
  explanation: string;
  points: number;
  // Per-type fields:
  scOptions: ChoiceOption[];
  mcOptions: ChoiceOption[];
  mcStrictAll: boolean;
  tfCorrect: boolean;
  fbAccepted: string; // newline separated
  fbCaseInsensitive: boolean;
  fbAccentInsensitive: boolean;
  numValue: string;
  numTolerance: string;
  ordItems: { id: string; text: string }[];
  ordCorrectOrder: string[]; // ids
  // Phase 2
  matLeft: { id: string; text: string }[];
  matRight: { id: string; text: string }[];
  /** Para matching el correctPairs es [leftItems[i].id, rightItems[i].id] por convención del editor. */
  clsBuckets: { id: string; label: string }[];
  clsItems: { id: string; text: string; correctBucketId: string }[];
  hotImageUrl: string;
  hotX: number; // 0..1
  hotY: number; // 0..1
  hotRadius: number; // 0..1
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Opción única',
  multiple_choice: 'Opción múltiple',
  true_false: 'Verdadero / Falso',
  fill_blank: 'Completar espacios',
  numeric: 'Respuesta numérica',
  ordering: 'Ordenamiento',
  matching: 'Emparejar',
  classification: 'Clasificar',
  hotspot: 'Identificar zona en imagen',
};

function newId() {
  return `q_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyQuestion(type: QuestionType): BuilderQuestion {
  return {
    collapsed: false,
    type,
    prompt: '',
    explanation: '',
    points: 1,
    scOptions: [
      { id: newId(), text: '', isCorrect: true },
      { id: newId(), text: '', isCorrect: false },
    ],
    mcOptions: [
      { id: newId(), text: '', isCorrect: true },
      { id: newId(), text: '', isCorrect: true },
      { id: newId(), text: '', isCorrect: false },
    ],
    mcStrictAll: false,
    tfCorrect: true,
    fbAccepted: '',
    fbCaseInsensitive: true,
    fbAccentInsensitive: true,
    numValue: '',
    numTolerance: '0',
    ordItems: [
      { id: newId(), text: 'Paso 1' },
      { id: newId(), text: 'Paso 2' },
      { id: newId(), text: 'Paso 3' },
    ],
    ordCorrectOrder: [],
    matLeft: [
      { id: newId(), text: 'Concepto A' },
      { id: newId(), text: 'Concepto B' },
    ],
    matRight: [
      { id: newId(), text: 'Definición A' },
      { id: newId(), text: 'Definición B' },
    ],
    clsBuckets: [
      { id: newId(), label: 'Categoría 1' },
      { id: newId(), label: 'Categoría 2' },
    ],
    clsItems: [],
    hotImageUrl: '',
    hotX: 0.5,
    hotY: 0.5,
    hotRadius: 0.08,
  };
}

function fromActivity(act: ActivityRecord): BuilderQuestion[] {
  return act.questions.map((q) => {
    const base = emptyQuestion(q.type);
    base.questionId = q.questionId;
    base.prompt = q.prompt;
    base.explanation = q.explanation ?? '';
    base.points = q.points;
    base.collapsed = true;
    const p = q.payload as unknown;
    if (q.type === 'single_choice') {
      base.scOptions = ((p as SingleChoicePayload)?.options ?? []).map((o) => ({ ...o }));
    } else if (q.type === 'multiple_choice') {
      const mp = p as MultipleChoicePayload;
      base.mcOptions = (mp?.options ?? []).map((o) => ({ ...o }));
      base.mcStrictAll = Boolean(mp?.strictAll);
    } else if (q.type === 'true_false') {
      base.tfCorrect = Boolean((p as TrueFalsePayload)?.correctAnswer);
    } else if (q.type === 'fill_blank') {
      const fp = p as FillBlankPayload;
      base.fbAccepted = (fp?.acceptedAnswers ?? []).join('\n');
      base.fbCaseInsensitive = fp?.caseInsensitive ?? true;
      base.fbAccentInsensitive = fp?.accentInsensitive ?? true;
    } else if (q.type === 'numeric') {
      const np = p as NumericPayload;
      base.numValue = String(np?.correctValue ?? '');
      base.numTolerance = String(np?.tolerance ?? 0);
    } else if (q.type === 'ordering') {
      const op = p as OrderingPayload;
      base.ordItems = (op?.items ?? []).map((i) => ({ ...i }));
      base.ordCorrectOrder = op?.correctOrder ?? base.ordItems.map((i) => i.id);
    } else if (q.type === 'matching') {
      const mp = p as MatchingPayload;
      const left = (mp?.leftItems ?? []).map((i) => ({ ...i }));
      const right = (mp?.rightItems ?? []).map((i) => ({ ...i }));
      // Reordenar `right` para que la posición i tenga la pareja correcta de left[i]
      const rightById = new Map(right.map((r) => [r.id, r]));
      const sortedRight: { id: string; text: string }[] = [];
      const correctPairs = mp?.correctPairs ?? [];
      for (const l of left) {
        const pair = correctPairs.find(([ll]) => ll === l.id);
        if (pair) {
          const r = rightById.get(pair[1]);
          if (r) sortedRight.push(r);
        }
      }
      // Rellenar con los restantes
      for (const r of right) if (!sortedRight.includes(r)) sortedRight.push(r);
      base.matLeft = left;
      base.matRight = sortedRight.length === left.length ? sortedRight : right;
    } else if (q.type === 'classification') {
      const cp = p as ClassificationPayload;
      base.clsBuckets = (cp?.buckets ?? []).map((b) => ({ ...b }));
      base.clsItems = (cp?.items ?? []).map((i) => ({ ...i }));
    } else if (q.type === 'hotspot') {
      const hp = p as HotspotPayload;
      base.hotImageUrl = hp?.imageUrl ?? '';
      base.hotX = hp?.correctRegion?.x ?? 0.5;
      base.hotY = hp?.correctRegion?.y ?? 0.5;
      base.hotRadius = hp?.correctRegion?.radius ?? 0.08;
    }
    return base;
  });
}

function toPayload(q: BuilderQuestion): unknown {
  switch (q.type) {
    case 'single_choice':
      return { options: q.scOptions };
    case 'multiple_choice':
      return { options: q.mcOptions, strictAll: q.mcStrictAll };
    case 'true_false':
      return { correctAnswer: q.tfCorrect };
    case 'fill_blank':
      return {
        acceptedAnswers: q.fbAccepted.split('\n').map((s) => s.trim()).filter(Boolean),
        caseInsensitive: q.fbCaseInsensitive,
        accentInsensitive: q.fbAccentInsensitive,
      };
    case 'numeric':
      return { correctValue: Number(q.numValue), tolerance: Number(q.numTolerance) };
    case 'ordering':
      return {
        items: q.ordItems,
        correctOrder: q.ordCorrectOrder.length === q.ordItems.length
          ? q.ordCorrectOrder
          : q.ordItems.map((i) => i.id),
      };
    case 'matching': {
      // Cada left[i] empareja con right[i] (convención del editor).
      const pairs = q.matLeft.map((l, i): [string, string] => [l.id, q.matRight[i]?.id ?? '']).filter(([, r]) => Boolean(r));
      return { leftItems: q.matLeft, rightItems: q.matRight, correctPairs: pairs };
    }
    case 'classification':
      return { buckets: q.clsBuckets, items: q.clsItems };
    case 'hotspot':
      return {
        imageUrl: q.hotImageUrl,
        correctRegion: { x: q.hotX, y: q.hotY, radius: q.hotRadius },
      };
  }
}

export function ActivityBuilder({ contentId }: { contentId: string }) {
  const { alert, confirm } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [passingScore, setPassingScore] = React.useState(70);
  const [maxAttempts, setMaxAttempts] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);
  const [questions, setQuestions] = React.useState<BuilderQuestion[]>([]);
  const [hasExisting, setHasExisting] = React.useState(false);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivityForContentAdmin(contentId);
      if (data) {
        setHasExisting(true);
        setTitle(data.title);
        setInstructions(data.instructions ?? '');
        setPassingScore(data.passingScore);
        setMaxAttempts(data.maxAttempts);
        setIsActive(data.isActive);
        setQuestions(fromActivity(data));
      } else {
        setHasExisting(false);
        setTitle('Actividad de evaluación');
      }
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateQuestion = (idx: number, patch: Partial<BuilderQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const removeQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const moveQuestion = (idx: number, delta: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, emptyQuestion(type)]);
    setShowAddMenu(false);
  };

  const onSave = async () => {
    if (!title.trim()) {
      await alert({ title: 'Falta título', message: 'La actividad necesita un título.', tone: 'warning' });
      return;
    }
    if (questions.length === 0) {
      await alert({
        title: 'Sin preguntas',
        message: 'Agrega al menos una pregunta antes de guardar.',
        tone: 'warning',
      });
      return;
    }
    // Validaciones básicas por pregunta
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        await alert({ title: 'Pregunta vacía', message: `La pregunta ${i + 1} no tiene enunciado.`, tone: 'warning' });
        return;
      }
      if (q.type === 'single_choice') {
        if (q.scOptions.length < 2) {
          await alert({
            title: 'Opciones insuficientes',
            message: `La pregunta ${i + 1} necesita al menos 2 opciones.`,
            tone: 'warning',
          });
          return;
        }
        if (!q.scOptions.some((o) => o.isCorrect)) {
          await alert({
            title: 'Sin respuesta correcta',
            message: `Marca al menos una opción correcta en la pregunta ${i + 1}.`,
            tone: 'warning',
          });
          return;
        }
      }
      if (q.type === 'multiple_choice' && !q.mcOptions.some((o) => o.isCorrect)) {
        await alert({
          title: 'Sin respuestas correctas',
          message: `Marca al menos una opción correcta en la pregunta ${i + 1}.`,
          tone: 'warning',
        });
        return;
      }
      if (q.type === 'fill_blank') {
        const accepted = q.fbAccepted.split('\n').map((s) => s.trim()).filter(Boolean);
        if (accepted.length === 0) {
          await alert({
            title: 'Sin respuestas aceptadas',
            message: `Agrega al menos una respuesta válida en la pregunta ${i + 1}.`,
            tone: 'warning',
          });
          return;
        }
      }
      if (q.type === 'numeric' && !Number.isFinite(Number(q.numValue))) {
        await alert({
          title: 'Valor inválido',
          message: `Ingresa un número correcto en la pregunta ${i + 1}.`,
          tone: 'warning',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const input: UpsertActivityInput = {
        contentId,
        title: title.trim(),
        instructions: instructions.trim() || null,
        passingScore,
        maxAttempts,
        isActive,
        questions: questions.map((q) => ({
          questionId: q.questionId,
          type: q.type,
          prompt: q.prompt.trim(),
          explanation: q.explanation.trim() || null,
          points: q.points,
          payload: toPayload(q) as never,
        })),
      };
      await upsertActivity(input);
      await alert({ title: 'Guardado', message: 'Actividad guardada correctamente.', tone: 'success' });
      await load();
    } catch (error) {
      await alert({
        title: 'Error al guardar',
        message: error instanceof Error ? error.message : 'No se pudo guardar la actividad.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar actividad',
      message: 'Esto elimina la actividad y todos los intentos asociados de los líderes. Esta acción no se puede deshacer.',
      tone: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await deleteActivityApi(contentId);
      await alert({ title: 'Eliminada', message: 'La actividad fue eliminada.', tone: 'success' });
      setHasExisting(false);
      setQuestions([]);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo eliminar.',
        tone: 'error',
      });
    }
  };

  if (loading) return <p className="text-sm text-[var(--app-muted)]">Cargando actividad…</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className="app-field-label">Título de la actividad</span>
          <input
            className="app-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Quiz de cierre del módulo"
          />
        </label>
        <label>
          <span className="app-field-label">Puntaje mínimo para aprobar (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            className="app-input"
            value={passingScore}
            onChange={(e) => setPassingScore(Math.max(0, Math.min(100, Number(e.target.value))))}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="app-field-label">Instrucciones (opcional)</span>
          <textarea
            className="app-textarea min-h-20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instrucciones para el líder antes de iniciar."
          />
        </label>
        <label>
          <span className="app-field-label">Máximo de intentos</span>
          <input
            type="number"
            min={0}
            className="app-input"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Math.max(0, Number(e.target.value)))}
          />
          <p className="mt-1 text-[11px] text-[var(--app-muted)]">0 = ilimitados</p>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand-primary)]"
          />
          <span className="text-sm font-semibold text-[var(--app-ink)]">Actividad activa</span>
        </label>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.questionId ?? `idx-${idx}`}
            index={idx}
            question={q}
            onChange={(patch) => updateQuestion(idx, patch)}
            onRemove={() => removeQuestion(idx)}
            onMoveUp={() => moveQuestion(idx, -1)}
            onMoveDown={() => moveQuestion(idx, 1)}
            canMoveUp={idx > 0}
            canMoveDown={idx < questions.length - 1}
          />
        ))}
      </div>

      {/* Add menu */}
      <div className="relative">
        <button
          type="button"
          className="app-button-secondary inline-flex items-center gap-1.5"
          onClick={() => setShowAddMenu((v) => !v)}
        >
          <Plus size={14} />
          Agregar pregunta
        </button>
        {showAddMenu && (
          <div className="absolute z-10 mt-2 grid w-full max-w-md grid-cols-2 gap-1 rounded-[14px] border border-[var(--app-border)] bg-white p-2 shadow-xl">
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
              <button
                key={t}
                type="button"
                className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
                onClick={() => addQuestion(t)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--app-border)] bg-white/95 p-3 shadow-sm backdrop-blur">
        {hasExisting ? (
          <button
            type="button"
            className="rounded-[12px] border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            onClick={() => void onDelete()}
          >
            Eliminar actividad
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
          {saving ? 'Guardando…' : hasExisting ? 'Guardar cambios' : 'Crear actividad'}
        </button>
      </div>
    </div>
  );
}

function QuestionCard(props: {
  index: number;
  question: BuilderQuestion;
  onChange: (patch: Partial<BuilderQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { index, question: q, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown } = props;
  return (
    <article className="rounded-[16px] border border-[var(--app-border)] bg-white">
      <header className="flex items-center gap-2 border-b border-[var(--app-border)] px-3 py-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--app-muted)]">
          {index + 1}. {TYPE_LABELS[q.type]}
        </span>
        <p className="ml-2 line-clamp-1 flex-1 text-sm text-[var(--app-ink)]">
          {q.prompt || <span className="text-[var(--app-muted)]">Sin enunciado…</span>}
        </p>
        <button
          type="button"
          aria-label="Subir"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          aria-label="Bajar"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
        >
          <ArrowDown size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChange({ collapsed: !q.collapsed })}
          className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
        >
          {q.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          type="button"
          aria-label="Eliminar"
          onClick={onRemove}
          className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 size={14} />
        </button>
      </header>

      {!q.collapsed && (
        <div className="space-y-3 p-3">
          <label className="block">
            <span className="app-field-label">Enunciado</span>
            <textarea
              className="app-textarea min-h-16"
              value={q.prompt}
              onChange={(e) => onChange({ prompt: e.target.value })}
              placeholder="Escribe la pregunta o instrucción."
            />
          </label>

          {q.type === 'single_choice' && (
            <OptionsEditor
              options={q.scOptions}
              singleCorrect
              onChange={(opts) => onChange({ scOptions: opts })}
            />
          )}

          {q.type === 'multiple_choice' && (
            <>
              <OptionsEditor
                options={q.mcOptions}
                singleCorrect={false}
                onChange={(opts) => onChange({ mcOptions: opts })}
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={q.mcStrictAll}
                  onChange={(e) => onChange({ mcStrictAll: e.target.checked })}
                  className="h-4 w-4 accent-[var(--brand-primary)]"
                />
                Calificar como correcto solo si marca <b>exactamente</b> todas las correctas
                (sin extras).
              </label>
            </>
          )}

          {q.type === 'true_false' && (
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => onChange({ tfCorrect: val })}
                  className={`flex-1 rounded-[12px] border px-4 py-2 text-sm font-semibold ${
                    q.tfCorrect === val
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                      : 'border-[var(--app-border)] bg-white text-[var(--app-ink)]'
                  }`}
                >
                  {val ? 'Verdadero' : 'Falso'} {q.tfCorrect === val && '✓'}
                </button>
              ))}
            </div>
          )}

          {q.type === 'fill_blank' && (
            <div className="space-y-2">
              <label className="block">
                <span className="app-field-label">Respuestas aceptadas (una por línea)</span>
                <textarea
                  className="app-textarea min-h-20 font-mono text-sm"
                  value={q.fbAccepted}
                  onChange={(e) => onChange({ fbAccepted: e.target.value })}
                  placeholder="cooperación&#10;cooperacion&#10;trabajo en equipo"
                />
              </label>
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={q.fbCaseInsensitive}
                    onChange={(e) => onChange({ fbCaseInsensitive: e.target.checked })}
                    className="h-4 w-4 accent-[var(--brand-primary)]"
                  />
                  Ignorar mayúsculas/minúsculas
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={q.fbAccentInsensitive}
                    onChange={(e) => onChange({ fbAccentInsensitive: e.target.checked })}
                    className="h-4 w-4 accent-[var(--brand-primary)]"
                  />
                  Ignorar tildes
                </label>
              </div>
            </div>
          )}

          {q.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="app-field-label">Valor correcto</span>
                <input
                  type="number"
                  className="app-input"
                  value={q.numValue}
                  onChange={(e) => onChange({ numValue: e.target.value })}
                />
              </label>
              <label>
                <span className="app-field-label">Tolerancia ±</span>
                <input
                  type="number"
                  className="app-input"
                  value={q.numTolerance}
                  onChange={(e) => onChange({ numTolerance: e.target.value })}
                />
              </label>
            </div>
          )}

          {q.type === 'ordering' && (
            <OrderingEditor question={q} onChange={onChange} />
          )}

          {q.type === 'matching' && (
            <MatchingEditor question={q} onChange={onChange} />
          )}

          {q.type === 'classification' && (
            <ClassificationEditor question={q} onChange={onChange} />
          )}

          {q.type === 'hotspot' && (
            <HotspotEditor question={q} onChange={onChange} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="app-field-label">Puntos</span>
              <input
                type="number"
                min={1}
                className="app-input"
                value={q.points}
                onChange={(e) => onChange({ points: Math.max(1, Number(e.target.value)) })}
              />
            </label>
            <label>
              <span className="app-field-label">Explicación al líder (opcional)</span>
              <input
                className="app-input"
                value={q.explanation}
                onChange={(e) => onChange({ explanation: e.target.value })}
                placeholder="Se muestra después del intento."
              />
            </label>
          </div>
        </div>
      )}
    </article>
  );
}

function OptionsEditor(props: {
  options: ChoiceOption[];
  singleCorrect: boolean;
  onChange: (opts: ChoiceOption[]) => void;
}) {
  const { options, singleCorrect, onChange } = props;
  return (
    <div className="space-y-2">
      <span className="app-field-label">Opciones</span>
      {options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input
            type={singleCorrect ? 'radio' : 'checkbox'}
            checked={opt.isCorrect}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange(
                options.map((o, j) => {
                  if (singleCorrect) return { ...o, isCorrect: j === i ? checked : false };
                  return j === i ? { ...o, isCorrect: checked } : o;
                }),
              );
            }}
            className="h-4 w-4 accent-[var(--brand-primary)]"
          />
          <input
            className="app-input flex-1"
            value={opt.text}
            onChange={(e) =>
              onChange(options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)))
            }
            placeholder={`Opción ${i + 1}`}
          />
          <button
            type="button"
            disabled={options.length <= 2}
            onClick={() => onChange(options.filter((_, j) => j !== i))}
            className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
            aria-label="Eliminar opción"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...options, { id: newId(), text: '', isCorrect: false }])
        }
        className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
      >
        <Plus size={11} />
        Agregar opción
      </button>
    </div>
  );
}

function OrderingEditor({
  question,
  onChange,
}: {
  question: BuilderQuestion;
  onChange: (patch: Partial<BuilderQuestion>) => void;
}) {
  // Si no hay correctOrder o no coincide tamaño, inicializar con orden actual.
  const correctOrder =
    question.ordCorrectOrder.length === question.ordItems.length
      ? question.ordCorrectOrder
      : question.ordItems.map((i) => i.id);

  const sortedByCorrect = correctOrder
    .map((id) => question.ordItems.find((i) => i.id === id))
    .filter((x): x is { id: string; text: string } => Boolean(x));

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= sortedByCorrect.length) return;
    const next = [...sortedByCorrect];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ordCorrectOrder: next.map((i) => i.id) });
  };

  return (
    <div className="space-y-2">
      <span className="app-field-label">Items en el ORDEN CORRECTO (de arriba abajo)</span>
      <div className="space-y-1.5">
        {sortedByCorrect.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-bold text-[var(--app-muted)]">{i + 1}</span>
            <input
              className="app-input flex-1"
              value={item.text}
              onChange={(e) =>
                onChange({
                  ordItems: question.ordItems.map((it) =>
                    it.id === item.id ? { ...it, text: e.target.value } : it,
                  ),
                })
              }
            />
            <button
              type="button"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              disabled={i === sortedByCorrect.length - 1}
              onClick={() => move(i, 1)}
              className="rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-30"
            >
              <ArrowDown size={13} />
            </button>
            <button
              type="button"
              disabled={question.ordItems.length <= 2}
              onClick={() => {
                const nextItems = question.ordItems.filter((it) => it.id !== item.id);
                onChange({
                  ordItems: nextItems,
                  ordCorrectOrder: correctOrder.filter((id) => id !== item.id),
                });
              }}
              className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const id = newId();
          const nextItems = [...question.ordItems, { id, text: `Paso ${question.ordItems.length + 1}` }];
          onChange({
            ordItems: nextItems,
            ordCorrectOrder: [...correctOrder, id],
          });
        }}
        className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
      >
        <Plus size={11} />
        Agregar item
      </button>
      <p className="text-[11px] text-[var(--app-muted)]">
        Al líder se le mostrarán mezclados; deberá ponerlos en este orden.
      </p>
    </div>
  );
}

function MatchingEditor({
  question,
  onChange,
}: {
  question: BuilderQuestion;
  onChange: (patch: Partial<BuilderQuestion>) => void;
}) {
  const updateLeft = (i: number, text: string) =>
    onChange({ matLeft: question.matLeft.map((it, j) => (j === i ? { ...it, text } : it)) });
  const updateRight = (i: number, text: string) =>
    onChange({ matRight: question.matRight.map((it, j) => (j === i ? { ...it, text } : it)) });
  const addPair = () =>
    onChange({
      matLeft: [...question.matLeft, { id: newId(), text: "" }],
      matRight: [...question.matRight, { id: newId(), text: "" }],
    });
  const removePair = (i: number) =>
    onChange({
      matLeft: question.matLeft.filter((_, j) => j !== i),
      matRight: question.matRight.filter((_, j) => j !== i),
    });

  return (
    <div className="space-y-2">
      <span className="app-field-label">Parejas correctas (cada fila es una pareja)</span>
      {question.matLeft.map((left, i) => (
        <div key={left.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <input
            className="app-input"
            value={left.text}
            onChange={(e) => updateLeft(i, e.target.value)}
            placeholder={`Concepto ${i + 1}`}
          />
          <span className="text-[var(--app-muted)]">↔</span>
          <input
            className="app-input"
            value={question.matRight[i]?.text ?? ""}
            onChange={(e) => updateRight(i, e.target.value)}
            placeholder={`Pareja ${i + 1}`}
          />
          <button
            type="button"
            disabled={question.matLeft.length <= 2}
            onClick={() => removePair(i)}
            className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
            aria-label="Eliminar pareja"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
      >
        <Plus size={11} />
        Agregar pareja
      </button>
      <p className="text-[11px] text-[var(--app-muted)]">
        Al líder se le mostrarán las dos columnas con orden mezclado y deberá emparejarlas.
      </p>
    </div>
  );
}

function ClassificationEditor({
  question,
  onChange,
}: {
  question: BuilderQuestion;
  onChange: (patch: Partial<BuilderQuestion>) => void;
}) {
  const updateBucket = (i: number, label: string) =>
    onChange({ clsBuckets: question.clsBuckets.map((b, j) => (j === i ? { ...b, label } : b)) });
  const addBucket = () =>
    onChange({ clsBuckets: [...question.clsBuckets, { id: newId(), label: `Categoría ${question.clsBuckets.length + 1}` }] });
  const removeBucket = (i: number) => {
    const removedId = question.clsBuckets[i].id;
    onChange({
      clsBuckets: question.clsBuckets.filter((_, j) => j !== i),
      clsItems: question.clsItems.filter((it) => it.correctBucketId !== removedId),
    });
  };

  const updateItem = (i: number, patch: Partial<{ text: string; correctBucketId: string }>) =>
    onChange({ clsItems: question.clsItems.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const addItem = () => {
    const firstBucket = question.clsBuckets[0]?.id ?? "";
    onChange({ clsItems: [...question.clsItems, { id: newId(), text: "", correctBucketId: firstBucket }] });
  };
  const removeItem = (i: number) => onChange({ clsItems: question.clsItems.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <div>
        <span className="app-field-label">Categorías</span>
        <div className="space-y-1.5">
          {question.clsBuckets.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2">
              <input
                className="app-input flex-1"
                value={b.label}
                onChange={(e) => updateBucket(i, e.target.value)}
                placeholder={`Categoría ${i + 1}`}
              />
              <button
                type="button"
                disabled={question.clsBuckets.length <= 2}
                onClick={() => removeBucket(i)}
                className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                aria-label="Eliminar categoría"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBucket}
            className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            <Plus size={11} /> Agregar categoría
          </button>
        </div>
      </div>
      <div>
        <span className="app-field-label">Items a clasificar</span>
        <div className="space-y-1.5">
          {question.clsItems.map((it, i) => (
            <div key={it.id} className="grid grid-cols-[1fr_180px_auto] items-center gap-2">
              <input
                className="app-input"
                value={it.text}
                onChange={(e) => updateItem(i, { text: e.target.value })}
                placeholder="Texto del item"
              />
              <select
                className="app-select"
                value={it.correctBucketId}
                onChange={(e) => updateItem(i, { correctBucketId: e.target.value })}
              >
                {question.clsBuckets.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50"
                aria-label="Eliminar item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={question.clsBuckets.length === 0}
            onClick={addItem}
            className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <Plus size={11} /> Agregar item
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[var(--app-muted)]">
        Al líder se le mostrarán los items mezclados y deberá ponerlos en la categoría correcta.
      </p>
    </div>
  );
}

function HotspotEditor({
  question,
  onChange,
}: {
  question: BuilderQuestion;
  onChange: (patch: Partial<BuilderQuestion>) => void;
}) {
  const imgRef = React.useRef<HTMLDivElement | null>(null);
  const onImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onChange({ hotX: Math.max(0, Math.min(1, x)), hotY: Math.max(0, Math.min(1, y)) });
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="app-field-label">Imagen</span>
        <div className="flex items-center gap-2">
          <R2UploadButton
            moduleCode="aprendizaje"
            action="update"
            accept="image/*"
            pathPrefix="learning/activities/hotspot"
            entityTable="app_learning.activity_questions"
            fieldName="payload"
            buttonLabel={question.hotImageUrl ? "Cambiar imagen" : "Subir imagen"}
            className="app-button-secondary"
            onUploaded={(url) => onChange({ hotImageUrl: url })}
          />
          {question.hotImageUrl && (
            <button
              type="button"
              className="text-xs font-semibold text-rose-600 hover:underline"
              onClick={() => onChange({ hotImageUrl: "" })}
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      {question.hotImageUrl && (
        <>
          <div>
            <span className="app-field-label">Marca la zona correcta (click en la imagen)</span>
            <div
              ref={imgRef}
              onClick={onImageClick}
              className="relative inline-block w-full max-w-md cursor-crosshair overflow-hidden rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={question.hotImageUrl} alt="Hotspot" className="block w-full" />
              <div
                style={{
                  position: "absolute",
                  left: `${question.hotX * 100}%`,
                  top: `${question.hotY * 100}%`,
                  width: `${question.hotRadius * 2 * 100}%`,
                  paddingTop: `${question.hotRadius * 2 * 100}%`,
                  transform: "translate(-50%, -50%)",
                  border: "2px solid #ef4444",
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
          <label className="block max-w-md">
            <span className="app-field-label">Radio de la zona correcta ({Math.round(question.hotRadius * 100)}%)</span>
            <input
              type="range"
              min={2}
              max={30}
              value={question.hotRadius * 100}
              onChange={(e) => onChange({ hotRadius: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </label>
          <p className="text-[11px] text-[var(--app-muted)]">
            El líder debe hacer click dentro del círculo rojo para acertar.
          </p>
        </>
      )}
    </div>
  );
}

