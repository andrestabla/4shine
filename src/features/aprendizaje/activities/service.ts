import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type {
  ActivityForLearner,
  ActivityQuestion,
  ActivityRecord,
  ActivityAggregateStats,
  ActivityUserResult,
  AttemptSummary,
  ChoiceOption,
  FillBlankPayload,
  MultipleChoicePayload,
  NumericPayload,
  OrderingPayload,
  QuestionType,
  SingleChoicePayload,
  SubmitAnswerInput,
  SubmitAttemptResult,
  TrueFalsePayload,
  UpsertActivityInput,
} from './types';

const MANAGE_ROLES = new Set(['admin', 'gestor', 'mentor']);

function assertCanManage(actor: AuthUser): void {
  if (!MANAGE_ROLES.has(actor.role)) {
    throw new Error('Solo Admin, Gestor o Adviser pueden gestionar actividades.');
  }
}

function normalizeAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function compareFillBlank(answer: string, payload: FillBlankPayload): boolean {
  const candidate = answer.trim();
  if (!candidate) return false;
  const accepted = payload.acceptedAnswers ?? [];
  for (const raw of accepted) {
    let a = String(raw).trim();
    let b = candidate;
    if (payload.caseInsensitive) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    if (payload.accentInsensitive) {
      a = normalizeAccents(a);
      b = normalizeAccents(b);
    }
    if (a === b) return true;
  }
  return false;
}

function gradeSingle(answer: unknown, payload: SingleChoicePayload): boolean {
  const selected = (answer as { optionId?: string } | null)?.optionId;
  if (!selected) return false;
  return payload.options.some((o) => o.id === selected && o.isCorrect);
}

function gradeMultiple(answer: unknown, payload: MultipleChoicePayload): { correct: boolean; ratio: number } {
  const selected: string[] = Array.isArray((answer as { optionIds?: string[] } | null)?.optionIds)
    ? ((answer as { optionIds: string[] }).optionIds)
    : [];
  const selectedSet = new Set(selected);
  const correctIds = payload.options.filter((o) => o.isCorrect).map((o) => o.id);
  const correctSet = new Set(correctIds);
  if (correctSet.size === 0) return { correct: false, ratio: 0 };

  let hits = 0;
  for (const id of selectedSet) if (correctSet.has(id)) hits++;
  let extras = 0;
  for (const id of selectedSet) if (!correctSet.has(id)) extras++;

  const exact = selectedSet.size === correctSet.size && hits === correctSet.size;
  if (payload.strictAll) return { correct: exact, ratio: exact ? 1 : 0 };

  // Puntaje parcial: hits / totalCorrectos, penalizando extras
  const positive = hits / correctSet.size;
  const penalty = extras / Math.max(1, payload.options.length - correctSet.size);
  const ratio = Math.max(0, positive - penalty * 0.5);
  return { correct: exact, ratio };
}

function gradeTrueFalse(answer: unknown, payload: TrueFalsePayload): boolean {
  const val = (answer as { value?: boolean } | null)?.value;
  return typeof val === 'boolean' && val === payload.correctAnswer;
}

function gradeNumeric(answer: unknown, payload: NumericPayload): boolean {
  const val = Number((answer as { value?: number | string } | null)?.value);
  if (!Number.isFinite(val)) return false;
  return Math.abs(val - payload.correctValue) <= Math.abs(payload.tolerance);
}

function gradeOrdering(answer: unknown, payload: OrderingPayload): { correct: boolean; ratio: number } {
  const order: string[] = Array.isArray((answer as { order?: string[] } | null)?.order)
    ? ((answer as { order: string[] }).order)
    : [];
  const correct = payload.correctOrder;
  if (order.length !== correct.length) return { correct: false, ratio: 0 };
  let exactMatches = 0;
  for (let i = 0; i < correct.length; i++) {
    if (order[i] === correct[i]) exactMatches++;
  }
  return { correct: exactMatches === correct.length, ratio: exactMatches / correct.length };
}

function sanitizePayloadForLearner(type: QuestionType, payload: unknown): unknown {
  if (type === 'single_choice' || type === 'multiple_choice') {
    const p = payload as { options?: ChoiceOption[]; strictAll?: boolean };
    return {
      options: (p?.options ?? []).map((o) => ({ id: o.id, text: o.text })),
      ...(typeof p?.strictAll === 'boolean' ? { strictAll: p.strictAll } : {}),
    };
  }
  if (type === 'ordering') {
    const p = payload as OrderingPayload;
    // Mostrar items en orden mezclado (presented order = sorted by id) para que el user los ordene.
    const items = [...(p?.items ?? [])];
    return { items };
  }
  if (type === 'fill_blank') {
    // No exponer acceptedAnswers
    return {};
  }
  if (type === 'numeric') {
    // No exponer correctValue / tolerance
    return {};
  }
  if (type === 'true_false') {
    // No exponer correctAnswer
    return {};
  }
  return {};
}

function ensureQuestionId(questionId?: string): string {
  return (questionId && questionId.trim().length > 0) ? questionId : randomUUID();
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function upsertActivity(
  client: PoolClient,
  actor: AuthUser,
  input: UpsertActivityInput,
): Promise<ActivityRecord> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'update');

  // Verify content exists
  const { rows: contentRows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM app_learning.content_items WHERE content_id = $1::uuid) AS exists`,
    [input.contentId],
  );
  if (!contentRows[0]?.exists) {
    throw new Error('Contenido no encontrado.');
  }

  const passingScore = Math.max(0, Math.min(100, Math.round(input.passingScore ?? 70)));
  const maxAttempts = Math.max(0, Math.round(input.maxAttempts ?? 0));

  const { rows: actRows } = await client.query<{ activity_id: string }>(
    `
      INSERT INTO app_learning.content_activities (
        content_id, title, instructions, passing_score, max_attempts, is_active, created_by
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid)
      ON CONFLICT (content_id) DO UPDATE SET
        title = EXCLUDED.title,
        instructions = EXCLUDED.instructions,
        passing_score = EXCLUDED.passing_score,
        max_attempts = EXCLUDED.max_attempts,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING activity_id::text
    `,
    [
      input.contentId,
      input.title.trim(),
      input.instructions?.trim() || null,
      passingScore,
      maxAttempts,
      input.isActive ?? true,
      actor.userId,
    ],
  );
  const activityId = actRows[0].activity_id;

  // Reemplazar preguntas: por simplicidad delete-all + insert
  await client.query(
    `DELETE FROM app_learning.activity_questions WHERE activity_id = $1::uuid`,
    [activityId],
  );

  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    const questionId = ensureQuestionId(q.questionId);
    await client.query(
      `
        INSERT INTO app_learning.activity_questions
          (question_id, activity_id, sort_order, question_type, prompt, explanation, points, payload)
        VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb)
      `,
      [
        questionId,
        activityId,
        i,
        q.type,
        q.prompt.trim(),
        q.explanation?.trim() || null,
        Math.max(1, Math.round(q.points ?? 1)),
        JSON.stringify(q.payload),
      ],
    );
  }

  const result = await getActivityById(client, activityId);
  if (!result) throw new Error('No se pudo cargar la actividad luego de guardar.');
  return result;
}

interface ActivityRow {
  activity_id: string;
  content_id: string;
  title: string;
  instructions: string | null;
  passing_score: number;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuestionRow {
  question_id: string;
  sort_order: number;
  question_type: QuestionType;
  prompt: string;
  explanation: string | null;
  points: number;
  payload: unknown;
}

async function getActivityById(client: PoolClient, activityId: string): Promise<ActivityRecord | null> {
  const { rows } = await client.query<ActivityRow>(
    `
      SELECT
        activity_id::text, content_id::text, title, instructions,
        passing_score, max_attempts, is_active,
        created_at::text, updated_at::text
      FROM app_learning.content_activities
      WHERE activity_id = $1::uuid
      LIMIT 1
    `,
    [activityId],
  );
  const row = rows[0];
  if (!row) return null;
  const { rows: qrows } = await client.query<QuestionRow>(
    `
      SELECT question_id::text, sort_order, question_type, prompt, explanation, points, payload
      FROM app_learning.activity_questions
      WHERE activity_id = $1::uuid
      ORDER BY sort_order, created_at
    `,
    [activityId],
  );
  return {
    activityId: row.activity_id,
    contentId: row.content_id,
    title: row.title,
    instructions: row.instructions,
    passingScore: row.passing_score,
    maxAttempts: row.max_attempts,
    isActive: row.is_active,
    questions: qrows.map((q) => ({
      questionId: q.question_id,
      sortOrder: q.sort_order,
      type: q.question_type,
      prompt: q.prompt,
      explanation: q.explanation,
      points: q.points,
      payload: q.payload as ActivityQuestion['payload'],
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActivityForContent(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<ActivityRecord | null> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<{ activity_id: string }>(
    `SELECT activity_id::text FROM app_learning.content_activities WHERE content_id = $1::uuid LIMIT 1`,
    [contentId],
  );
  if (!rows[0]) return null;
  return getActivityById(client, rows[0].activity_id);
}

export async function deleteActivity(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<void> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'delete');
  await client.query(
    `DELETE FROM app_learning.content_activities WHERE content_id = $1::uuid`,
    [contentId],
  );
}

// ─── Líder: jugar la actividad ───────────────────────────────────────────────

export async function getActivityForLearner(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<ActivityForLearner | null> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<{ activity_id: string }>(
    `
      SELECT activity_id::text
      FROM app_learning.content_activities
      WHERE content_id = $1::uuid AND is_active = true
      LIMIT 1
    `,
    [contentId],
  );
  if (!rows[0]) return null;
  const activity = await getActivityById(client, rows[0].activity_id);
  if (!activity) return null;
  const attempts = await listAttemptsForUser(client, activity.activityId, actor.userId);
  return {
    activityId: activity.activityId,
    contentId: activity.contentId,
    title: activity.title,
    instructions: activity.instructions,
    passingScore: activity.passingScore,
    maxAttempts: activity.maxAttempts,
    questions: activity.questions.map((q) => ({
      questionId: q.questionId,
      sortOrder: q.sortOrder,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      payload: sanitizePayloadForLearner(q.type, q.payload),
    })),
    userAttempts: attempts,
  };
}

export async function startAttempt(
  client: PoolClient,
  actor: AuthUser,
  activityId: string,
): Promise<{ attemptId: string }> {
  await requireModulePermission(client, 'aprendizaje', 'update');
  // Verificar tope de intentos
  const { rows: actRows } = await client.query<{ max_attempts: number; is_active: boolean }>(
    `SELECT max_attempts, is_active FROM app_learning.content_activities WHERE activity_id = $1::uuid`,
    [activityId],
  );
  const act = actRows[0];
  if (!act || !act.is_active) throw new Error('Actividad no disponible.');
  if (act.max_attempts > 0) {
    const { rows: countRows } = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM app_learning.activity_attempts WHERE activity_id = $1::uuid AND user_id = $2::uuid AND status = 'submitted'`,
      [activityId, actor.userId],
    );
    if (Number(countRows[0]?.c ?? 0) >= act.max_attempts) {
      throw new Error('Has alcanzado el máximo de intentos.');
    }
  }
  const { rows } = await client.query<{ attempt_id: string }>(
    `
      INSERT INTO app_learning.activity_attempts (activity_id, user_id)
      VALUES ($1::uuid, $2::uuid)
      RETURNING attempt_id::text
    `,
    [activityId, actor.userId],
  );
  return { attemptId: rows[0].attempt_id };
}

export async function submitAttempt(
  client: PoolClient,
  actor: AuthUser,
  attemptId: string,
  answers: SubmitAnswerInput[],
): Promise<SubmitAttemptResult> {
  await requireModulePermission(client, 'aprendizaje', 'update');
  // Validar dueño del attempt
  const { rows: attRows } = await client.query<{
    activity_id: string;
    user_id: string;
    status: string;
  }>(
    `SELECT activity_id::text, user_id::text, status
     FROM app_learning.activity_attempts
     WHERE attempt_id = $1::uuid LIMIT 1`,
    [attemptId],
  );
  const att = attRows[0];
  if (!att) throw new Error('Intento no encontrado.');
  if (att.user_id !== actor.userId) throw new Error('Sin permiso para este intento.');
  if (att.status === 'submitted') throw new Error('Este intento ya fue enviado.');

  const { rows: qrows } = await client.query<QuestionRow>(
    `SELECT question_id::text, sort_order, question_type, prompt, explanation, points, payload
     FROM app_learning.activity_questions
     WHERE activity_id = $1::uuid
     ORDER BY sort_order`,
    [att.activity_id],
  );

  const answerById = new Map<string, unknown>();
  for (const a of answers) answerById.set(a.questionId, a.answer);

  let pointsEarned = 0;
  let pointsPossible = 0;
  const perQuestion: SubmitAttemptResult['perQuestion'] = [];

  for (const q of qrows) {
    pointsPossible += q.points;
    const userAnswer = answerById.get(q.question_id) ?? null;
    let isCorrect = false;
    let earned = 0;
    switch (q.question_type) {
      case 'single_choice':
        isCorrect = gradeSingle(userAnswer, q.payload as SingleChoicePayload);
        earned = isCorrect ? q.points : 0;
        break;
      case 'multiple_choice': {
        const r = gradeMultiple(userAnswer, q.payload as MultipleChoicePayload);
        isCorrect = r.correct;
        earned = Math.round(q.points * r.ratio);
        break;
      }
      case 'true_false':
        isCorrect = gradeTrueFalse(userAnswer, q.payload as TrueFalsePayload);
        earned = isCorrect ? q.points : 0;
        break;
      case 'fill_blank': {
        const text = String((userAnswer as { text?: unknown } | null)?.text ?? '');
        isCorrect = compareFillBlank(text, q.payload as FillBlankPayload);
        earned = isCorrect ? q.points : 0;
        break;
      }
      case 'numeric':
        isCorrect = gradeNumeric(userAnswer, q.payload as NumericPayload);
        earned = isCorrect ? q.points : 0;
        break;
      case 'ordering': {
        const r = gradeOrdering(userAnswer, q.payload as OrderingPayload);
        isCorrect = r.correct;
        earned = Math.round(q.points * r.ratio);
        break;
      }
    }
    pointsEarned += earned;

    await client.query(
      `
        INSERT INTO app_learning.question_responses
          (attempt_id, question_id, answer, is_correct, points_earned)
        VALUES ($1::uuid, $2::uuid, $3::jsonb, $4, $5)
        ON CONFLICT (attempt_id, question_id) DO UPDATE SET
          answer = EXCLUDED.answer,
          is_correct = EXCLUDED.is_correct,
          points_earned = EXCLUDED.points_earned
      `,
      [attemptId, q.question_id, JSON.stringify(userAnswer ?? {}), isCorrect, earned],
    );

    perQuestion.push({
      questionId: q.question_id,
      isCorrect,
      pointsEarned: earned,
      pointsPossible: q.points,
      explanation: q.explanation,
    });
  }

  const scorePercent = pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0;
  const { rows: passingRows } = await client.query<{ passing_score: number }>(
    `SELECT passing_score FROM app_learning.content_activities WHERE activity_id = $1::uuid`,
    [att.activity_id],
  );
  const passingScore = passingRows[0]?.passing_score ?? 70;
  const passed = scorePercent >= passingScore;

  await client.query(
    `
      UPDATE app_learning.activity_attempts
      SET status = 'submitted',
          score_percent = $2,
          points_earned = $3,
          points_possible = $4,
          passed = $5,
          submitted_at = now()
      WHERE attempt_id = $1::uuid
    `,
    [attemptId, scorePercent, pointsEarned, pointsPossible, passed],
  );

  return { attemptId, scorePercent, pointsEarned, pointsPossible, passed, perQuestion };
}

async function listAttemptsForUser(
  client: PoolClient,
  activityId: string,
  userId: string,
): Promise<AttemptSummary[]> {
  const { rows } = await client.query<{
    attempt_id: string;
    status: 'in_progress' | 'submitted' | 'abandoned';
    score_percent: number | null;
    points_earned: number;
    points_possible: number;
    passed: boolean | null;
    started_at: string;
    submitted_at: string | null;
  }>(
    `
      SELECT
        attempt_id::text, status, score_percent, points_earned, points_possible, passed,
        started_at::text, submitted_at::text
      FROM app_learning.activity_attempts
      WHERE activity_id = $1::uuid AND user_id = $2::uuid
      ORDER BY started_at DESC
      LIMIT 25
    `,
    [activityId, userId],
  );
  return rows.map((r) => ({
    attemptId: r.attempt_id,
    status: r.status,
    scorePercent: r.score_percent,
    pointsEarned: r.points_earned,
    pointsPossible: r.points_possible,
    passed: r.passed,
    startedAt: r.started_at,
    submittedAt: r.submitted_at,
  }));
}

// ─── Analytics para admin/gestor/adviser ─────────────────────────────────────

export async function getActivityAggregateStats(
  client: PoolClient,
  actor: AuthUser,
  activityId: string,
): Promise<ActivityAggregateStats> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows: head } = await client.query<{
    total: string;
    unique_users: string;
    avg_score: string | null;
    pass_count: string;
  }>(
    `
      SELECT
        count(*)::text AS total,
        count(DISTINCT user_id)::text AS unique_users,
        avg(score_percent)::text AS avg_score,
        count(*) FILTER (WHERE passed)::text AS pass_count
      FROM app_learning.activity_attempts
      WHERE activity_id = $1::uuid AND status = 'submitted'
    `,
    [activityId],
  );
  const h = head[0];
  const total = Number(h?.total ?? 0);
  const { rows: qstats } = await client.query<{
    question_id: string;
    prompt: string;
    correct_count: string;
    total_answers: string;
    avg_points: string | null;
  }>(
    `
      SELECT
        q.question_id::text,
        q.prompt,
        count(r.response_id) FILTER (WHERE r.is_correct = true)::text AS correct_count,
        count(r.response_id)::text AS total_answers,
        avg(r.points_earned)::text AS avg_points
      FROM app_learning.activity_questions q
      LEFT JOIN app_learning.question_responses r ON r.question_id = q.question_id
      LEFT JOIN app_learning.activity_attempts a ON a.attempt_id = r.attempt_id AND a.status = 'submitted'
      WHERE q.activity_id = $1::uuid
      GROUP BY q.question_id, q.prompt, q.sort_order
      ORDER BY q.sort_order
    `,
    [activityId],
  );
  return {
    activityId,
    totalAttempts: total,
    uniqueUsers: Number(h?.unique_users ?? 0),
    avgScore: h?.avg_score ? Number(h.avg_score) : null,
    passRate: total > 0 ? Number(h?.pass_count ?? 0) / total : null,
    questionStats: qstats.map((q) => {
      const ta = Number(q.total_answers ?? 0);
      return {
        questionId: q.question_id,
        prompt: q.prompt,
        correctRate: ta > 0 ? Number(q.correct_count ?? 0) / ta : null,
        avgPoints: q.avg_points ? Number(q.avg_points) : null,
        totalAnswers: ta,
      };
    }),
  };
}

export async function listActivityUserResults(
  client: PoolClient,
  actor: AuthUser,
  activityId: string,
): Promise<ActivityUserResult[]> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<{
    user_id: string;
    user_name: string;
    user_email: string;
    attempts: string;
    best_score: number | null;
    last_score: number | null;
    last_submitted_at: string | null;
    any_passed: boolean | null;
  }>(
    `
      SELECT
        u.user_id::text,
        u.display_name AS user_name,
        u.email::text AS user_email,
        count(*)::text AS attempts,
        max(a.score_percent) AS best_score,
        (array_agg(a.score_percent ORDER BY a.submitted_at DESC NULLS LAST))[1] AS last_score,
        max(a.submitted_at)::text AS last_submitted_at,
        bool_or(a.passed) AS any_passed
      FROM app_learning.activity_attempts a
      JOIN app_core.users u ON u.user_id = a.user_id
      WHERE a.activity_id = $1::uuid AND a.status = 'submitted'
      GROUP BY u.user_id, u.display_name, u.email
      ORDER BY last_submitted_at DESC NULLS LAST
      LIMIT 500
    `,
    [activityId],
  );
  return rows.map((r) => ({
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    attempts: Number(r.attempts),
    bestScore: r.best_score,
    lastScore: r.last_score,
    lastSubmittedAt: r.last_submitted_at,
    passed: r.any_passed ?? false,
  }));
}
