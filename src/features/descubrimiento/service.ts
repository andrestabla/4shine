import type { PoolClient } from "pg";
import { requireModulePermission } from "@/server/auth/module-permissions";
import type { AuthUser } from "@/server/auth/types";
import {
  DISCOVERY_TOTAL_ITEMS,
  calculateDiscoveryCompletionPercent,
  scoreDiscoveryAnswers,
  toDiscoveryScoreRows,
} from "./reporting";
import type {
  DiscoveryAnswers,
  DiscoverySessionRecord,
  DiscoveryStep,
  UpdateDiscoverySessionInput,
} from "./types";

interface DiscoverySessionRow {
  session_id: string;
  attempt_id: string;
  user_id: string;
  name_snapshot: string;
  status: DiscoveryStep;
  answers: DiscoveryAnswers | null;
  current_idx: number;
  completion_percent: number;
  public_id: string | null;
  shared_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const DISCOVERY_TEST_CODE = "diagnostico_4shine";

function normalizeAnswers(input: unknown): DiscoveryAnswers {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const output: DiscoveryAnswers = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number") {
      output[key] = value;
    }
  }
  return output;
}

function clampCurrentIdx(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(DISCOVERY_TOTAL_ITEMS - 1, Math.floor(value ?? 0)));
}

function mapDiscoverySessionRow(
  row: DiscoverySessionRow,
): DiscoverySessionRecord {
  return {
    sessionId: row.session_id,
    attemptId: row.attempt_id,
    userId: row.user_id,
    nameSnapshot: row.name_snapshot,
    status: row.status,
    answers: normalizeAnswers(row.answers),
    currentIdx: Number(row.current_idx ?? 0),
    completionPercent: Number(row.completion_percent ?? 0),
    publicId: row.public_id,
    sharedAt: row.shared_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveDiscoveryTestId(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ test_id: string }>(
    `
      SELECT test_id::text
      FROM app_assessment.tests
      WHERE test_code = $1
      LIMIT 1
    `,
    [DISCOVERY_TEST_CODE],
  );

  if (!rows[0]) {
    throw new Error("Discovery diagnostic test is not configured");
  }

  return rows[0].test_id;
}

async function readDiscoverySession(
  client: PoolClient,
  userId: string,
): Promise<DiscoverySessionRecord | null> {
  const { rows } = await client.query<DiscoverySessionRow>(
    `
      SELECT
        ds.session_id::text,
        ds.attempt_id::text,
        ds.user_id::text,
        ds.name_snapshot,
        ds.status,
        ds.answers,
        ds.current_idx,
        ds.completion_percent,
        ds.public_id,
        ds.shared_at::text,
        ds.completed_at::text,
        ds.created_at::text,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      WHERE ds.user_id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ? mapDiscoverySessionRow(rows[0]) : null;
}

async function createDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoverySessionRecord> {
  const testId = await resolveDiscoveryTestId(client);
  const { rows: attemptRows } = await client.query<{ attempt_id: string }>(
    `
      INSERT INTO app_assessment.test_attempts (
        test_id,
        user_id,
        status,
        started_at
      )
      VALUES ($1::uuid, $2::uuid, 'in_progress', now())
      RETURNING attempt_id::text
    `,
    [testId, actor.userId],
  );

  const attemptId = attemptRows[0]?.attempt_id;
  if (!attemptId) {
    throw new Error("Failed to create discovery attempt");
  }

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      INSERT INTO app_assessment.discovery_sessions (
        attempt_id,
        user_id,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        'intro',
        '{}'::jsonb,
        0,
        0
      )
      RETURNING
        session_id::text,
        attempt_id::text,
        user_id::text,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent,
        public_id,
        shared_at::text,
        completed_at::text,
        created_at::text,
        updated_at::text
    `,
    [attemptId, actor.userId, actor.name],
  );

  if (!rows[0]) {
    throw new Error("Failed to create discovery session");
  }

  return mapDiscoverySessionRow(rows[0]);
}

async function syncCompletedScores(
  client: PoolClient,
  session: DiscoverySessionRecord,
): Promise<void> {
  const scores = scoreDiscoveryAnswers(session.answers);

  await client.query(
    `
      UPDATE app_assessment.test_attempts
      SET status = 'completed',
          completed_at = now(),
          overall_score = $2
      WHERE attempt_id = $1::uuid
    `,
    [session.attemptId, scores.globalIndex],
  );

  for (const scoreRow of toDiscoveryScoreRows(scores)) {
    await client.query(
      `
        INSERT INTO app_assessment.test_attempt_scores (
          attempt_id,
          pillar_code,
          score
        )
        VALUES ($1::uuid, $2, $3)
        ON CONFLICT (attempt_id, pillar_code) DO UPDATE
        SET score = EXCLUDED.score
      `,
      [session.attemptId, scoreRow.pillarCode, scoreRow.score],
    );
  }
}

function buildNextState(
  current: DiscoverySessionRecord,
  actor: AuthUser,
  input: UpdateDiscoverySessionInput,
) {
  const nextAnswers = input.answers
    ? normalizeAnswers(input.answers)
    : current.answers;
  const completionPercent =
    input.completionPercent ?? calculateDiscoveryCompletionPercent(nextAnswers);
  const nextStatus = input.status ?? current.status;
  const currentIdx =
    input.currentIdx !== undefined
      ? clampCurrentIdx(input.currentIdx)
      : current.currentIdx;
  const shouldMarkCompleted =
    input.markCompleted === true || (nextStatus === "results" && completionPercent >= 100);

  return {
    nameSnapshot: actor.name,
    status: nextStatus,
    answers: nextAnswers,
    currentIdx,
    completionPercent,
    completedAt: shouldMarkCompleted ? new Date().toISOString() : null,
    shouldMarkCompleted,
  };
}

export async function getOrCreateDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoverySessionRecord> {
  await requireModulePermission(client, "descubrimiento", "view");

  const current = await readDiscoverySession(client, actor.userId);
  if (!current) {
    return createDiscoverySession(client, actor);
  }

  if (current.nameSnapshot !== actor.name) {
    const { rows } = await client.query<DiscoverySessionRow>(
      `
        UPDATE app_assessment.discovery_sessions
        SET name_snapshot = $2,
            updated_at = now()
        WHERE session_id = $1::uuid
        RETURNING
          session_id::text,
          attempt_id::text,
          user_id::text,
          name_snapshot,
          status,
          answers,
          current_idx,
          completion_percent,
          public_id,
          shared_at::text,
          completed_at::text,
          created_at::text,
          updated_at::text
      `,
      [current.sessionId, actor.name],
    );

    if (rows[0]) {
      return mapDiscoverySessionRow(rows[0]);
    }
  }

  return current;
}

export async function updateDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateDiscoverySessionInput,
): Promise<DiscoverySessionRecord> {
  await requireModulePermission(client, "descubrimiento", "update");

  const current = await getOrCreateDiscoverySession(client, actor);
  const next = buildNextState(current, actor, input);

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      UPDATE app_assessment.discovery_sessions
      SET name_snapshot = $2,
          status = $3,
          answers = $4::jsonb,
          current_idx = $5,
          completion_percent = $6,
          completed_at = $7::timestamptz,
          updated_at = now()
      WHERE session_id = $1::uuid
      RETURNING
        session_id::text,
        attempt_id::text,
        user_id::text,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent,
        public_id,
        shared_at::text,
        completed_at::text,
        created_at::text,
        updated_at::text
    `,
    [
      current.sessionId,
      next.nameSnapshot,
      next.status,
      JSON.stringify(next.answers),
      next.currentIdx,
      next.completionPercent,
      next.completedAt,
    ],
  );

  if (!rows[0]) {
    throw new Error("Failed to update discovery session");
  }

  const session = mapDiscoverySessionRow(rows[0]);

  if (next.shouldMarkCompleted) {
    await syncCompletedScores(client, session);
  } else {
    await client.query(
      `
        UPDATE app_assessment.test_attempts
        SET status = 'in_progress',
            completed_at = NULL,
            overall_score = NULL
        WHERE attempt_id = $1::uuid
      `,
      [session.attemptId],
    );
    await client.query(
      `
        DELETE FROM app_assessment.test_attempt_scores
        WHERE attempt_id = $1::uuid
      `,
      [session.attemptId],
    );
  }

  return session;
}

export async function resetDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoverySessionRecord> {
  await requireModulePermission(client, "descubrimiento", "update");

  const current = await getOrCreateDiscoverySession(client, actor);

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      UPDATE app_assessment.discovery_sessions
      SET name_snapshot = $2,
          status = 'intro',
          answers = '{}'::jsonb,
          current_idx = 0,
          completion_percent = 0,
          public_id = NULL,
          shared_at = NULL,
          completed_at = NULL,
          updated_at = now()
      WHERE session_id = $1::uuid
      RETURNING
        session_id::text,
        attempt_id::text,
        user_id::text,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent,
        public_id,
        shared_at::text,
        completed_at::text,
        created_at::text,
        updated_at::text
    `,
    [current.sessionId, actor.name],
  );

  await client.query(
    `
      UPDATE app_assessment.test_attempts
      SET status = 'in_progress',
          started_at = now(),
          completed_at = NULL,
          overall_score = NULL
      WHERE attempt_id = $1::uuid
    `,
    [current.attemptId],
  );
  await client.query(
    `
      DELETE FROM app_assessment.test_attempt_scores
      WHERE attempt_id = $1::uuid
    `,
    [current.attemptId],
  );

  if (!rows[0]) {
    throw new Error("Failed to reset discovery session");
  }

  return mapDiscoverySessionRow(rows[0]);
}

function canReadOtherDiscoverySession(actor: AuthUser): boolean {
  return actor.role === "admin" || actor.role === "gestor";
}

export async function getDiscoverySessionByPublicId(
  client: PoolClient,
  publicId: string,
): Promise<DiscoverySessionRecord | null> {
  const { rows } = await client.query<DiscoverySessionRow>(
    `
      SELECT
        ds.session_id::text,
        ds.attempt_id::text,
        ds.user_id::text,
        ds.name_snapshot,
        ds.status,
        ds.answers,
        ds.current_idx,
        ds.completion_percent,
        ds.public_id,
        ds.shared_at::text,
        ds.completed_at::text,
        ds.created_at::text,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      WHERE ds.public_id = $1
        AND ds.shared_at IS NOT NULL
      LIMIT 1
    `,
    [publicId],
  );

  return rows[0] ? mapDiscoverySessionRow(rows[0]) : null;
}

export async function shareDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateDiscoverySessionInput = {},
): Promise<DiscoverySessionRecord> {
  await requireModulePermission(client, "descubrimiento", "view");

  const session = await updateDiscoverySession(client, actor, {
    ...input,
    status: "results",
    markCompleted: true,
  });

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      UPDATE app_assessment.discovery_sessions
      SET public_id = COALESCE(
            public_id,
            lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
          ),
          shared_at = now(),
          updated_at = now()
      WHERE session_id = $1::uuid
      RETURNING
        session_id::text,
        attempt_id::text,
        user_id::text,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent,
        public_id,
        shared_at::text,
        completed_at::text,
        created_at::text,
        updated_at::text
    `,
    [session.sessionId],
  );

  if (!rows[0]) {
    throw new Error("Failed to share discovery session");
  }

  return mapDiscoverySessionRow(rows[0]);
}

export async function getDiscoverySessionForActor(
  client: PoolClient,
  actor: AuthUser,
  userId?: string,
): Promise<DiscoverySessionRecord> {
  if (userId && userId !== actor.userId && !canReadOtherDiscoverySession(actor)) {
    throw new Error("You cannot read this discovery session");
  }

  if (userId && userId !== actor.userId) {
    await requireModulePermission(client, "descubrimiento", "view");
    const session = await readDiscoverySession(client, userId);
    if (!session) {
      throw new Error("Discovery session not found");
    }
    return session;
  }

  return getOrCreateDiscoverySession(client, actor);
}
