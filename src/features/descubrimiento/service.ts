import crypto from "node:crypto";
import nodemailer from "nodemailer";
import type { PoolClient } from "pg";
import { requireDiscoveryAccess } from "@/features/access/service";
import { getIntegrationConfigForActor } from "@/server/integrations/config";
import { requireModulePermission } from "@/server/auth/module-permissions";
import { resolveOrganizationIdForActor } from "@/server/integrations/config";
import type { AuthUser } from "@/server/auth/types";
import { COMP_DEFINITIONS } from "./DiagnosticsData";
import {
  DISCOVERY_TOTAL_ITEMS,
  calculateDiscoveryCompletionPercent,
  scoreDiscoveryAnswers,
  toDiscoveryScoreRows,
} from "./reporting";
import type {
  DiscoveryAnswers,
  DiscoveryContextDocument,
  DiscoveryExperienceSurvey,
  DiscoveryFeedbackSettingsRecord,
  DiscoveryInvitationAccessPayload,
  DiscoveryInvitationBatchResult,
  DiscoveryInvitationRecord,
  DiscoveryInvitationRequest,
  DiscoveryInvitationWithCode,
  DiscoveryJobRole,
  DiscoveryOverviewFilters,
  DiscoveryOverviewPayload,
  DiscoveryOverviewRow,
  DiscoveryParticipantProfile,
  DiscoveryReportFilter,
  DiscoveryScoreResult,
  DiscoverySessionRecord,
  DiscoveryStep,
  DiscoveryUserState,
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
  diagnostic_identifier: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  job_role: DiscoveryJobRole | null;
  age: number | null;
  years_experience: number | null;
  feedback_survey?: unknown;
  created_at: string;
  updated_at: string;
}

interface DiscoveryInvitationRow {
  invitation_id: string;
  session_id: string | null;
  invited_email: string;
  invite_token: string;
  access_code_hash: string;
  access_code_last4: string;
  access_code_sent_at: string;
  opened_at: string | null;
  meta: unknown;
  created_at: string;
  updated_at: string;
}

interface DiscoveryFeedbackSettingsRow {
  settings_id: string;
  organization_id: string;
  ai_feedback_instructions: string;
  context_documents: unknown;
  invite_email_subject: string;
  invite_email_html: string;
  invite_email_text: string;
  updated_at: string;
}

interface OutboundConfigRow {
  organization_id: string;
  enabled: boolean;
  provider: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  api_key: string;
}

interface BrandingRow {
  platform_name: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
}

const DISCOVERY_TEST_CODE = "diagnostico_4shine";
const DISCOVERY_INVITED_FILTER_PREFIX = "inv:";
const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DISCOVERY_SURVEY_QUESTIONS = [
  "¿Te resultó fácil responder el diagnóstico?",
  "¿Entendiste bien las preguntas del diagnóstico?",
  "¿Sentiste que el diagnóstico reflejó tu realidad?",
  "¿Te gustó la experiencia de hacer el diagnóstico?",
  "¿El diagnóstico te ayudó a conocerte mejor como líder?",
] as const;
const DEFAULT_AI_FEEDBACK_INSTRUCTIONS = `
Eres un analista experto en la metodologia 4Shine.
Tu objetivo es analizar el perfil de liderazgo del usuario usando el contexto metodologico cargado por el admin en RAG.
Usa un tono directo, humano y profesional. Habla en segunda persona del singular.

Reglas editoriales:
- No uses lenguaje tipico de IA ni frases de relleno.
- No uses mayusculas para enfatizar.
- Usa markdown claro y accionable.
- No menciones nombres de cursos, libros o autores, aunque existan como fuentes de contexto.

Estructura esperada:
## 1. Tu perfil estrategico
Integra fortalezas y brechas prioritarias con el indice global actual.

## 2. Analisis de riesgos
Explica 2 tensiones de liderazgo conectadas con el glosario/contexto.

## 3. Plan de aceleracion
Entrega 3 acciones tacticas concretas para los proximos 30 dias.

Cuando el analisis sea por pilar (within, out, up o beyond), profundiza en:
- fortalezas del pilar,
- puntos criticos de atencion,
- consecuencias sistemicas,
- intervencion tactica.

Genera feedback ejecutivo accionable, con tono claro, respetuoso y orientado a priorizar el siguiente paso de desarrollo en liderazgo.
`.trim();

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

function normalizeNameParts(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { firstName: "Usuario", lastName: "4Shine" };
  }

  const [firstName, ...rest] = trimmed.split(" ");
  return {
    firstName: firstName || "Usuario",
    lastName: rest.join(" ") || firstName || "4Shine",
  };
}

function normalizeProfile(
  input: Partial<DiscoveryParticipantProfile> | null | undefined,
  fallback?: Partial<DiscoveryParticipantProfile>,
): DiscoveryParticipantProfile {
  const firstName =
    typeof input?.firstName === "string"
      ? input.firstName.trim().slice(0, 120)
      : (fallback?.firstName ?? "").trim().slice(0, 120);
  const lastName =
    typeof input?.lastName === "string"
      ? input.lastName.trim().slice(0, 120)
      : (fallback?.lastName ?? "").trim().slice(0, 120);
  const country =
    typeof input?.country === "string"
      ? input.country.trim().slice(0, 120)
      : (fallback?.country ?? "").trim().slice(0, 120);

  const incomingRole =
    typeof input?.jobRole === "string" ? input.jobRole.trim() : fallback?.jobRole ?? "";
  const normalizedRole =
    incomingRole === "Gerente/Mand medio" ? "Gerente/Mando medio" : incomingRole;

  const ageValue = input?.age ?? fallback?.age ?? null;
  const yearsValue = input?.yearsExperience ?? fallback?.yearsExperience ?? null;

  const age = Number.isFinite(ageValue)
    ? Math.max(16, Math.min(100, Math.floor(Number(ageValue))))
    : null;

  const yearsExperience = Number.isFinite(yearsValue)
    ? Math.max(0, Math.min(80, Number(Number(yearsValue).toFixed(1))))
    : null;

  return {
    firstName,
    lastName,
    country,
    jobRole: normalizedRole as DiscoveryJobRole | "",
    age,
    yearsExperience,
  };
}

function isProfileCompleted(profile: DiscoveryParticipantProfile): boolean {
  return Boolean(
    profile.firstName &&
      profile.lastName &&
      profile.country &&
      profile.jobRole &&
      Number.isFinite(profile.age) &&
      Number.isFinite(profile.yearsExperience),
  );
}

function buildDiagnosticIdentifier(sessionId: string): string {
  return `DX-${sessionId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function mapDiscoverySessionRow(row: DiscoverySessionRow): DiscoverySessionRecord {
  const profile = normalizeProfile({
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    country: row.country ?? "",
    jobRole: row.job_role ?? "",
    age: row.age,
    yearsExperience: row.years_experience,
  });

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
    diagnosticIdentifier: row.diagnostic_identifier ?? buildDiagnosticIdentifier(row.session_id),
    firstName: profile.firstName,
    lastName: profile.lastName,
    country: profile.country,
    jobRole: profile.jobRole,
    age: profile.age,
    yearsExperience: profile.yearsExperience,
    profileCompleted: isProfileCompleted(profile),
    experienceSurvey: parseExperienceSurvey(row.feedback_survey),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvitationRow(row: DiscoveryInvitationRow): DiscoveryInvitationRecord {
  return {
    invitationId: row.invitation_id,
    sessionId: row.session_id,
    invitedEmail: row.invited_email,
    inviteToken: row.invite_token,
    accessCodeLast4: row.access_code_last4,
    accessCodeSentAt: row.access_code_sent_at,
    openedAt: row.opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseExperienceSurvey(input: unknown): DiscoveryExperienceSurvey | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const payload = input as Record<string, unknown>;
  const answersRaw = payload.answers;
  if (!answersRaw || typeof answersRaw !== "object" || Array.isArray(answersRaw)) return null;
  const answers: Record<string, number> = {};
  for (const [key, value] of Object.entries(answersRaw as Record<string, unknown>)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) continue;
    answers[key] = Math.max(1, Math.min(5, Math.round(numeric)));
  }
  if (Object.keys(answers).length === 0) return null;
  const submittedAt =
    typeof payload.submittedAt === "string" && payload.submittedAt.trim()
      ? payload.submittedAt
      : new Date().toISOString();
  const average =
    typeof payload.average === "number" && Number.isFinite(payload.average)
      ? Number(payload.average.toFixed(2))
      : Number(
          (
            Object.values(answers).reduce((acc, value) => acc + value, 0) /
            Math.max(1, Object.keys(answers).length)
          ).toFixed(2),
        );
  return { answers, submittedAt, average };
}

function parseInvitationExternalProgress(meta: unknown): DiscoveryUserState | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const record = meta as Record<string, unknown>;
  const external = record.external_progress;
  if (!external || typeof external !== "object" || Array.isArray(external)) return null;
  const payload = external as Record<string, unknown>;
  const profile = normalizeProfile(
    (payload.profile as Partial<DiscoveryParticipantProfile> | undefined) ?? {},
  );
  return {
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 160)
        : `${profile.firstName} ${profile.lastName}`.trim() || "Invitado",
    answers: normalizeAnswers(payload.answers),
    currentIdx: clampCurrentIdx(
      typeof payload.currentIdx === "number" && Number.isFinite(payload.currentIdx)
        ? payload.currentIdx
        : undefined,
    ),
    status:
      payload.status === "intro" ||
      payload.status === "instructions" ||
      payload.status === "quiz" ||
      payload.status === "results"
        ? payload.status
        : "intro",
    profile,
    profileCompleted: isProfileCompleted(profile),
  };
}

function parseInvitationExternalSurvey(meta: unknown): DiscoveryExperienceSurvey | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const record = meta as Record<string, unknown>;
  return parseExperienceSurvey(record.external_survey);
}

function normalizeContextDocuments(input: unknown): DiscoveryContextDocument[] {
  if (!Array.isArray(input)) return [];

  const output: DiscoveryContextDocument[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const url = typeof row.url === "string" ? row.url.trim() : "";
    const uploadedAt =
      typeof row.uploadedAt === "string" && row.uploadedAt.trim()
        ? row.uploadedAt.trim()
        : new Date().toISOString();

    if (!id || !name || !url) continue;
    output.push({ id, name: name.slice(0, 200), url: url.slice(0, 2000), uploadedAt });
  }

  return output;
}

function mapFeedbackSettingsRow(
  row: DiscoveryFeedbackSettingsRow,
): DiscoveryFeedbackSettingsRecord {
  return {
    settingsId: row.settings_id,
    organizationId: row.organization_id,
    aiFeedbackInstructions: row.ai_feedback_instructions,
    contextDocuments: normalizeContextDocuments(row.context_documents),
    inviteEmailSubject: row.invite_email_subject,
    inviteEmailHtml: row.invite_email_html,
    inviteEmailText: row.invite_email_text,
    updatedAt: row.updated_at,
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";

  const safeLocal = local || "***";
  const visible = safeLocal.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(3, safeLocal.length - 2))}@${domain}`;
}

function isAllowedManager(actor: AuthUser): boolean {
  return actor.role === "admin" || actor.role === "gestor";
}

function normalizeEmailList(input: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const email of input) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) continue;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function randomString(length: number, alphabet: string): string {
  const bytes = crypto.randomBytes(length * 2);
  let out = "";
  for (const value of bytes) {
    out += alphabet[value % alphabet.length];
    if (out.length >= length) break;
  }
  return out;
}

function createAccessCode(): string {
  return randomString(8, ACCESS_CODE_ALPHABET);
}

function createInviteToken(): string {
  return randomString(28, "abcdefghijklmnopqrstuvwxyz0123456789");
}

function hashAccessCode(accessCode: string): string {
  const digest = crypto.createHash("sha256");
  digest.update(accessCode);
  return digest.digest("hex");
}

function compareAccessCode(accessCode: string, expectedHash: string): boolean {
  const provided = Buffer.from(hashAccessCode(accessCode), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

function sanitizeText(value: unknown, fallback = "", maxLength = 20000): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength);
}

function defaultInviteEmailText(platformName: string): string {
  return [
    `Tu diagnostico de liderazgo en ${platformName} ya esta listo.`,
    "",
    "Usa este codigo unico para entrar:",
    "{{access_code}}",
    "",
    "Abrir diagnostico:",
    "{{invite_url}}",
    "",
    "Identificador del diagnostico: {{diagnostic_id}}",
  ].join("\n");
}

function defaultInviteEmailHtml(
  platformName: string,
  primaryColor: string,
  accentColor: string,
): string {
  return [
    `<div style=\"font-family:Inter,Segoe UI,Arial,sans-serif;background:#f8fafc;padding:28px;color:#0f172a;\">`,
    `<div style=\"max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;\">`,
    `<div style=\"background:${primaryColor};padding:20px 24px;color:#ffffff;\">`,
    `<p style=\"margin:0 0 10px 0;\"><img src=\"{{platform_logo_url}}\" alt=\"${platformName}\" style=\"display:block;height:36px;max-width:180px;object-fit:contain;\" /></p>`,
    `<h1 style=\"margin:0;font-size:22px;line-height:1.2;\">Diagnostico 4Shine</h1>`,
    `<p style=\"margin:8px 0 0 0;opacity:.9;\">Acceso personalizado a tu lectura ejecutiva</p>`,
    `</div>`,
    `<div style=\"padding:24px;\">`,
    `<p style=\"margin:0 0 12px 0;\">Hola,</p>`,
    `<p style=\"margin:0 0 16px 0;\">Ya puedes ingresar a tu diagnostico. Este acceso esta vinculado a <strong>{{recipient_email}}</strong>.</p>`,
    `<div style=\"margin:20px 0;padding:16px;border:1px dashed ${accentColor};border-radius:12px;background:#fff7ed;\">`,
    `<p style=\"margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;\">Codigo unico</p>`,
    `<p style=\"margin:0;font-size:32px;font-weight:800;letter-spacing:.18em;color:${primaryColor};\">{{access_code}}</p>`,
    `</div>`,
    `<p style=\"margin:0 0 14px 0;\">Haz clic para abrir tu diagnostico:</p>`,
    `<p style=\"margin:0 0 18px 0;\"><a href=\"{{invite_url}}\" style=\"display:inline-block;background:${primaryColor};color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;\">Abrir diagnostico</a></p>`,
    `<p style=\"margin:0;color:#475569;font-size:13px;\">Identificador: <strong>{{diagnostic_id}}</strong></p>`,
    `<p style=\"margin:16px 0 0 0;color:#475569;font-size:13px;\">${platformName}</p>`,
    `</div>`,
    `</div>`,
    `</div>`,
  ].join("");
}

function ensureInviteTemplateHasLogo(template: string): string {
  if (template.includes("{{platform_logo_url}}")) return template;
  if (!template.includes("<h1")) return template;
  return template.replace(
    "<h1",
    `<p style="margin:0 0 10px 0;"><img src="{{platform_logo_url}}" alt="4Shine Platform" style="display:block;height:36px;max-width:180px;object-fit:contain;" /></p><h1`,
  );
}

function fillTemplate(template: string, params: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

function resolveAppBaseUrl(): string {
  const candidates = [
    process.env.APP_BASE_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : "",
    process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : "",
    "https://www.4shine.co",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (
        process.env.NODE_ENV === "production" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      ) {
        continue;
      }
      return candidate.replace(/\/$/, "");
    } catch {
      continue;
    }
  }

  return "https://www.4shine.co";
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
        ds.diagnostic_identifier,
        ds.first_name,
        ds.last_name,
        ds.country,
        ds.job_role,
        ds.age,
        ds.years_experience,
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

  const nameParts = normalizeNameParts(actor.name);

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      INSERT INTO app_assessment.discovery_sessions (
        attempt_id,
        user_id,
        name_snapshot,
        status,
        answers,
        current_idx,
        completion_percent,
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        'intro',
        '{}'::jsonb,
        0,
        0,
        $4,
        $5,
        $6,
        '',
        NULL,
        NULL,
        NULL
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
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience,
        feedback_survey,
        created_at::text,
        updated_at::text
    `,
    [
      attemptId,
      actor.userId,
      actor.name,
      `DX-${attemptId.replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      nameParts.firstName,
      nameParts.lastName,
    ],
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
  const nextAnswers = input.answers ? normalizeAnswers(input.answers) : current.answers;
  const completionPercent =
    input.completionPercent ?? calculateDiscoveryCompletionPercent(nextAnswers);
  const nextStatus = input.status ?? current.status;
  const currentIdx =
    input.currentIdx !== undefined ? clampCurrentIdx(input.currentIdx) : current.currentIdx;

  const nextProfile = normalizeProfile(input.profile, {
    firstName: current.firstName,
    lastName: current.lastName,
    country: current.country,
    jobRole: current.jobRole,
    age: current.age,
    yearsExperience: current.yearsExperience,
  });

  const profileCompleted = isProfileCompleted(nextProfile);
  if ((nextStatus === "quiz" || nextStatus === "results") && !profileCompleted) {
    throw new Error("Completa tu perfil antes de iniciar el diagnostico.");
  }

  const shouldMarkCompleted =
    input.markCompleted === true || (nextStatus === "results" && completionPercent >= 100);
  const nextSurvey =
    input.experienceSurvey === undefined
      ? current.experienceSurvey
      : parseExperienceSurvey(input.experienceSurvey);

  return {
    nameSnapshot: actor.name,
    status: nextStatus,
    answers: nextAnswers,
    currentIdx,
    completionPercent,
    completedAt: shouldMarkCompleted ? new Date().toISOString() : null,
    shouldMarkCompleted,
    profile: nextProfile,
    profileCompleted,
    experienceSurvey: nextSurvey,
  };
}

async function ensureSessionShared(
  client: PoolClient,
  sessionId: string,
): Promise<DiscoverySessionRecord> {
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
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience,
        feedback_survey,
        created_at::text,
        updated_at::text
    `,
    [sessionId],
  );

  if (!rows[0]) {
    throw new Error("Failed to share discovery session");
  }

  return mapDiscoverySessionRow(rows[0]);
}

async function finalizeSessionForSharing(
  client: PoolClient,
  session: DiscoverySessionRecord,
): Promise<DiscoverySessionRecord> {
  const completionPercent = calculateDiscoveryCompletionPercent(session.answers);
  const shouldMarkCompleted = completionPercent >= 100;

  const { rows } = await client.query<DiscoverySessionRow>(
    `
      UPDATE app_assessment.discovery_sessions
      SET status = 'results',
          completion_percent = $2,
          completed_at = CASE WHEN $3::boolean THEN now() ELSE completed_at END,
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
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience,
        feedback_survey,
        created_at::text,
        updated_at::text
    `,
    [session.sessionId, completionPercent, shouldMarkCompleted],
  );

  if (!rows[0]) {
    throw new Error("No se pudo finalizar el diagnostico objetivo.");
  }

  const finalized = mapDiscoverySessionRow(rows[0]);
  if (shouldMarkCompleted) {
    await syncCompletedScores(client, finalized);
  }

  return finalized;
}

async function resolveOutboundConfig(
  client: PoolClient,
  organizationId: string,
): Promise<OutboundConfigRow | null> {
  const { rows } = await client.query<OutboundConfigRow>(
    `
      SELECT
        organization_id::text,
        enabled,
        provider,
        from_name,
        from_email,
        reply_to,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        api_key
      FROM app_admin.outbound_email_configs
      WHERE organization_id = $1::uuid
      LIMIT 1
    `,
    [organizationId],
  );

  const config = rows[0];
  if (!config?.enabled) return null;
  if (!config.from_email?.trim()) return null;
  return config;
}

function buildFromHeader(config: OutboundConfigRow): string {
  const fromName = config.from_name.trim();
  const fromEmail = config.from_email.trim();
  if (!fromName) return fromEmail;
  const escaped = fromName.replace(/"/g, '\\"');
  return `"${escaped}" <${fromEmail}>`;
}

function buildReplyTo(config: OutboundConfigRow): string | undefined {
  const value = config.reply_to.trim();
  return value.length > 0 ? value : undefined;
}

async function sendViaSmtp(
  config: OutboundConfigRow,
  payload: { to: string; subject: string; text: string; html: string },
): Promise<string | null> {
  const smtpHost = config.smtp_host.trim();
  const smtpUser = config.smtp_user.trim();
  const smtpPassword = config.smtp_password.trim();
  const smtpPort = Number(config.smtp_port);

  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new Error("SMTP configuration is incomplete");
  }

  const secure = smtpPort === 465 ? true : config.smtp_secure && smtpPort !== 587;
  const requireTLS = smtpPort === 587 || !secure;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const result = await transporter.sendMail({
    from: buildFromHeader(config),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: buildReplyTo(config),
  });

  return typeof result.messageId === "string" ? result.messageId : null;
}

async function sendViaSendgrid(
  config: OutboundConfigRow,
  payload: { to: string; subject: string; text: string; html: string },
): Promise<string | null> {
  const apiKey = config.api_key.trim();
  if (!apiKey) {
    throw new Error("SendGrid API key is missing");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { email: config.from_email.trim(), name: config.from_name.trim() || undefined },
      personalizations: [{ to: [{ email: payload.to }] }],
      subject: payload.subject,
      content: [
        { type: "text/plain", value: payload.text },
        { type: "text/html", value: payload.html },
      ],
      ...(config.reply_to.trim() ? { reply_to: { email: config.reply_to.trim() } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return response.headers.get("x-message-id");
}

async function sendViaResend(
  config: OutboundConfigRow,
  payload: { to: string; subject: string; text: string; html: string },
): Promise<string | null> {
  const apiKey = config.api_key.trim();
  if (!apiKey) {
    throw new Error("Resend API key is missing");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: buildFromHeader(config),
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(config.reply_to.trim() ? { reply_to: config.reply_to.trim() } : {}),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body?.message === "string" ? body.message : JSON.stringify(body);
    throw new Error(`Resend rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return typeof body?.id === "string" ? body.id : null;
}

async function sendOutboundEmail(
  config: OutboundConfigRow,
  payload: { to: string; subject: string; text: string; html: string },
): Promise<string | null> {
  if (config.provider === "sendgrid") {
    return sendViaSendgrid(config, payload);
  }

  if (config.provider === "resend") {
    return sendViaResend(config, payload);
  }

  return sendViaSmtp(config, payload);
}

async function getBrandingForOrganization(
  client: PoolClient,
  organizationId: string,
): Promise<BrandingRow> {
  const { rows } = await client.query<BrandingRow>(
    `
      SELECT
        platform_name,
        primary_color,
        accent_color,
        logo_url
      FROM app_admin.branding_settings
      WHERE organization_id = $1::uuid
      LIMIT 1
    `,
    [organizationId],
  );

  return (
    rows[0] ?? {
      platform_name: "4Shine",
      primary_color: "#311f44",
      accent_color: "#f59e0b",
      logo_url: null,
    }
  );
}

async function ensureFeedbackSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoveryFeedbackSettingsRecord> {
  const organizationId = await resolveOrganizationIdForActor(client, actor.userId);
  const branding = await getBrandingForOrganization(client, organizationId);

  const { rows } = await client.query<DiscoveryFeedbackSettingsRow>(
    `
      INSERT INTO app_assessment.discovery_feedback_settings (
        organization_id,
        ai_feedback_instructions,
        context_documents,
        invite_email_subject,
        invite_email_html,
        invite_email_text,
        created_by,
        updated_by
      )
      VALUES (
        $1::uuid,
        $2,
        '[]'::jsonb,
        $3,
        $4,
        $5,
        $6::uuid,
        $6::uuid
      )
      ON CONFLICT (organization_id) DO UPDATE
      SET updated_at = app_assessment.discovery_feedback_settings.updated_at
      RETURNING
        settings_id::text,
        organization_id::text,
        ai_feedback_instructions,
        context_documents,
        invite_email_subject,
        invite_email_html,
        invite_email_text,
        updated_at::text
    `,
    [
      organizationId,
      DEFAULT_AI_FEEDBACK_INSTRUCTIONS,
      "Diagnostico 4Shine: acceso personalizado",
      defaultInviteEmailHtml(
        branding.platform_name,
        branding.primary_color,
        branding.accent_color,
      ),
      defaultInviteEmailText(branding.platform_name),
      actor.userId,
    ],
  );

  if (!rows[0]) {
    throw new Error("No se pudo resolver la configuracion de Descubrimiento.");
  }

  return mapFeedbackSettingsRow(rows[0]);
}

export async function getDiscoveryFeedbackSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoveryFeedbackSettingsRecord> {
  await requireModulePermission(client, "descubrimiento", "view");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden gestionar configuracion de Descubrimiento.");
  }

  return ensureFeedbackSettings(client, actor);
}

export async function updateDiscoveryFeedbackSettings(
  client: PoolClient,
  actor: AuthUser,
  input: Partial<{
    aiFeedbackInstructions: string;
    contextDocuments: DiscoveryContextDocument[];
    inviteEmailSubject: string;
    inviteEmailHtml: string;
    inviteEmailText: string;
  }>,
): Promise<DiscoveryFeedbackSettingsRecord> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden gestionar configuracion de Descubrimiento.");
  }

  const current = await ensureFeedbackSettings(client, actor);

  const aiFeedbackInstructions = sanitizeText(
    input.aiFeedbackInstructions,
    current.aiFeedbackInstructions,
    12000,
  );

  const contextDocuments = input.contextDocuments
    ? normalizeContextDocuments(input.contextDocuments)
    : current.contextDocuments;

  const inviteEmailSubject = sanitizeText(
    input.inviteEmailSubject,
    current.inviteEmailSubject,
    240,
  );
  const inviteEmailHtml = sanitizeText(
    input.inviteEmailHtml,
    current.inviteEmailHtml,
    20000,
  );
  const inviteEmailText = sanitizeText(
    input.inviteEmailText,
    current.inviteEmailText,
    10000,
  );

  const { rows } = await client.query<DiscoveryFeedbackSettingsRow>(
    `
      UPDATE app_assessment.discovery_feedback_settings
      SET ai_feedback_instructions = $2,
          context_documents = $3::jsonb,
          invite_email_subject = $4,
          invite_email_html = $5,
          invite_email_text = $6,
          updated_by = $7::uuid,
          updated_at = now()
      WHERE organization_id = $1::uuid
      RETURNING
        settings_id::text,
        organization_id::text,
        ai_feedback_instructions,
        context_documents,
        invite_email_subject,
        invite_email_html,
        invite_email_text,
        updated_at::text
    `,
    [
      current.organizationId,
      aiFeedbackInstructions,
      JSON.stringify(contextDocuments),
      inviteEmailSubject,
      inviteEmailHtml,
      inviteEmailText,
      actor.userId,
    ],
  );

  if (!rows[0]) {
    throw new Error("No se pudo actualizar la configuracion de Descubrimiento.");
  }

  return mapFeedbackSettingsRow(rows[0]);
}

export async function getOrCreateDiscoverySession(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoverySessionRecord> {
  await requireModulePermission(client, "descubrimiento", "view");
  await requireDiscoveryAccess(client, actor);

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
          diagnostic_identifier,
          first_name,
          last_name,
          country,
          job_role,
          age,
          years_experience,
          feedback_survey,
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
  await requireDiscoveryAccess(client, actor);

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
          first_name = $8,
          last_name = $9,
          country = $10,
          job_role = $11,
          age = $12,
          years_experience = $13,
          feedback_survey = $14::jsonb,
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
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience,
        feedback_survey,
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
      next.profile.firstName,
      next.profile.lastName,
      next.profile.country,
      next.profile.jobRole || null,
      next.profile.age,
      next.profile.yearsExperience,
      next.experienceSurvey ? JSON.stringify(next.experienceSurvey) : null,
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
  await requireDiscoveryAccess(client, actor);

  const current = await getOrCreateDiscoverySession(client, actor);

  const nameParts = normalizeNameParts(actor.name);
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
          first_name = $3,
          last_name = $4,
          country = '',
          job_role = NULL,
          age = NULL,
          years_experience = NULL,
          feedback_survey = NULL,
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
        diagnostic_identifier,
        first_name,
        last_name,
        country,
        job_role,
        age,
        years_experience,
        feedback_survey,
        created_at::text,
        updated_at::text
    `,
    [current.sessionId, actor.name, nameParts.firstName, nameParts.lastName],
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

  await client.query(
    `
      DELETE FROM app_assessment.discovery_invitations
      WHERE session_id = $1::uuid
    `,
    [current.sessionId],
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
        ds.diagnostic_identifier,
        ds.first_name,
        ds.last_name,
        ds.country,
        ds.job_role,
        ds.age,
        ds.years_experience,
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
  await requireDiscoveryAccess(client, actor);

  const session = await updateDiscoverySession(client, actor, {
    ...input,
    status: "results",
    markCompleted: true,
  });

  return ensureSessionShared(client, session.sessionId);
}

export async function getDiscoverySessionForActor(
  client: PoolClient,
  actor: AuthUser,
  userId?: string,
): Promise<DiscoverySessionRecord> {
  if (isAllowedManager(actor)) {
    if (!userId) {
      throw new Error("Admin/Gestor debe seleccionar un participante para previsualizar.");
    }
    if (userId === actor.userId) {
      throw new Error("Admin/Gestor no puede consultar su propio diagnostico.");
    }
  }

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

export async function listDiscoveryInvitationsForSession(
  client: PoolClient,
  actor: AuthUser,
  sessionId?: string | null,
): Promise<DiscoveryInvitationRecord[]> {
  await requireModulePermission(client, "descubrimiento", "view");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden ver invitaciones.");
  }

  const { rows } = await client.query<DiscoveryInvitationRow>(
    `
      SELECT
        invitation_id::text,
        session_id::text,
        invited_email,
        invite_token,
        access_code_hash,
        access_code_last4,
        access_code_sent_at::text,
        opened_at::text,
        meta,
        created_at::text,
        updated_at::text
      FROM app_assessment.discovery_invitations
      WHERE ($1::uuid IS NULL OR session_id = $1::uuid)
      ORDER BY created_at DESC
      LIMIT 500
    `,
    [sessionId ?? null],
  );

  return rows.map(mapInvitationRow);
}

export async function createDiscoveryInvitations(
  client: PoolClient,
  actor: AuthUser,
  input: DiscoveryInvitationRequest,
): Promise<DiscoveryInvitationBatchResult> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden enviar invitaciones.");
  }

  const emails = normalizeEmailList(input.emails);
  if (emails.length === 0) {
    throw new Error("Debes indicar al menos un correo valido.");
  }

  let sharedSession: DiscoverySessionRecord | null = null;
  if (input.userId) {
    const targetSession = await getDiscoverySessionForActor(client, actor, input.userId);

    const { rows: targetUserRows } = await client.query<{ primary_role: string }>(
      `
        SELECT primary_role
        FROM app_core.users
        WHERE user_id = $1::uuid
        LIMIT 1
      `,
      [targetSession.userId],
    );
    const targetRole = targetUserRows[0]?.primary_role ?? "";
    if (targetRole !== "lider") {
      throw new Error("Solo se pueden enviar invitaciones a participantes lider.");
    }

    if (!targetSession.profileCompleted) {
      throw new Error("Completa el perfil del participante antes de enviar invitaciones.");
    }

    const finalizedSession = await finalizeSessionForSharing(client, targetSession);
    sharedSession = await ensureSessionShared(client, finalizedSession.sessionId);
  }
  const organizationId = await resolveOrganizationIdForActor(client, actor.userId);
  const settings = await ensureFeedbackSettings(client, actor);
  const branding = await getBrandingForOrganization(client, organizationId);

  const subjectTemplate =
    sanitizeText(input.emailSubject, settings.inviteEmailSubject, 240) ||
    "Diagnostico 4Shine: acceso personalizado";

  const htmlTemplate =
    sanitizeText(input.emailHtml, settings.inviteEmailHtml, 20000) ||
    defaultInviteEmailHtml(branding.platform_name, branding.primary_color, branding.accent_color);
  const htmlTemplateWithLogo = ensureInviteTemplateHasLogo(htmlTemplate);

  const textTemplate =
    sanitizeText(input.emailText, settings.inviteEmailText, 10000) ||
    defaultInviteEmailText(branding.platform_name);

  const baseUrl = resolveAppBaseUrl();
  const outboundConfig = await resolveOutboundConfig(client, organizationId);
  if (!outboundConfig) {
    throw new Error(
      "No hay configuracion de correo saliente habilitada para enviar invitaciones.",
    );
  }

  const invitationsWithCode: DiscoveryInvitationWithCode[] = [];

  for (const email of emails) {
    const accessCode = createAccessCode();
    const inviteToken = createInviteToken();

    const { rows } = await client.query<DiscoveryInvitationRow>(
      `
        INSERT INTO app_assessment.discovery_invitations (
          session_id,
          invited_email,
          invite_token,
          access_code_hash,
          access_code_last4,
          access_code_sent_at,
          invited_by_user_id,
          meta
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          now(),
          $6::uuid,
          '{}'::jsonb
        )
        ON CONFLICT (session_id, invited_email) DO UPDATE
        SET invite_token = EXCLUDED.invite_token,
            access_code_hash = EXCLUDED.access_code_hash,
            access_code_last4 = EXCLUDED.access_code_last4,
            access_code_sent_at = now(),
            invited_by_user_id = EXCLUDED.invited_by_user_id,
            updated_at = now()
        RETURNING
          invitation_id::text,
          session_id::text,
          invited_email,
          invite_token,
          access_code_hash,
          access_code_last4,
          access_code_sent_at::text,
          opened_at::text,
          meta,
          created_at::text,
          updated_at::text
      `,
      [
        sharedSession?.sessionId ?? null,
        email,
        inviteToken,
        hashAccessCode(accessCode),
        accessCode.slice(-4),
        actor.userId,
      ],
    );

    if (!rows[0]) continue;

    const mapped = mapInvitationRow(rows[0]);
    invitationsWithCode.push({
      ...mapped,
      accessCode,
    });

    const inviteUrl = `${baseUrl}/descubrimiento/invitacion/${inviteToken}`;
    const platformLogoUrl =
      branding.logo_url?.trim() ||
      `${baseUrl}/workbooks-v2/diamond.svg`;
    const params = {
      recipient_email: email,
      access_code: accessCode,
      invite_url: inviteUrl,
      diagnostic_id: sharedSession?.diagnosticIdentifier ?? "N/A",
      participant_name: sharedSession
        ? `${sharedSession.firstName} ${sharedSession.lastName}`.trim()
        : "Participante invitado",
      platform_logo_url: platformLogoUrl,
    };

    await sendOutboundEmail(outboundConfig, {
      to: email,
      subject: fillTemplate(subjectTemplate, params),
      html: fillTemplate(htmlTemplateWithLogo, params),
      text: fillTemplate(textTemplate, params),
    });
  }

  return {
    session: sharedSession,
    invitations: invitationsWithCode,
    sentCount: invitationsWithCode.length,
  };
}

export async function getDiscoveryInvitationPublicInfo(
  client: PoolClient,
  inviteToken: string,
): Promise<{ inviteToken: string; invitedEmailMasked: string; openedAt: string | null } | null> {
  const { rows } = await client.query<
    Pick<DiscoveryInvitationRow, "invite_token" | "invited_email" | "opened_at">
  >(
    `
      SELECT
        invite_token,
        invited_email,
        opened_at::text
      FROM app_assessment.discovery_invitations
      WHERE invite_token = $1
      LIMIT 1
    `,
    [inviteToken.trim().toLowerCase()],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    inviteToken: row.invite_token,
    invitedEmailMasked: maskEmail(row.invited_email),
    openedAt: row.opened_at,
  };
}

export async function verifyDiscoveryInvitationAccess(
  client: PoolClient,
  inviteToken: string,
  accessCode: string,
): Promise<DiscoveryInvitationAccessPayload> {
  const normalizedToken = inviteToken.trim().toLowerCase();
  const normalizedCode = accessCode.trim().toUpperCase();

  const { rows } = await client.query<
    DiscoveryInvitationRow & {
      session_payload: DiscoverySessionRow | null;
    }
  >(
    `
      SELECT
        di.invitation_id::text,
        di.session_id::text,
        di.invited_email,
        di.invite_token,
        di.access_code_hash,
        di.access_code_last4,
        di.access_code_sent_at::text,
        di.opened_at::text,
        di.meta,
        di.created_at::text,
        di.updated_at::text,
        row_to_json(ds)::jsonb AS session_payload
      FROM app_assessment.discovery_invitations di
      LEFT JOIN app_assessment.discovery_sessions ds ON ds.session_id = di.session_id
      WHERE di.invite_token = $1
      LIMIT 1
    `,
    [normalizedToken],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Invitacion no encontrada.");
  }

  if (!compareAccessCode(normalizedCode, row.access_code_hash)) {
    throw new Error("Codigo de acceso invalido.");
  }

  await client.query(
    `
      UPDATE app_assessment.discovery_invitations
      SET opened_at = COALESCE(opened_at, now()),
          updated_at = now()
      WHERE invitation_id = $1::uuid
    `,
    [row.invitation_id],
  );

  const session = row.session_payload ? mapDiscoverySessionRow(row.session_payload) : null;
  const externalProgress = parseInvitationExternalProgress(row.meta);
  const externalSurvey = parseInvitationExternalSurvey(row.meta);
  const alreadyCompleted =
    externalProgress?.status === "results" &&
    calculateDiscoveryCompletionPercent(externalProgress.answers) >= 100;

  return {
    invitation: {
      invitationId: row.invitation_id,
      inviteToken: row.invite_token,
      invitedEmailMasked: maskEmail(row.invited_email),
      openedAt: row.opened_at,
    },
    accessMode: session ? "results" : "diagnostic",
    session,
    externalProgress,
    alreadyCompleted,
    externalSurvey,
  };
}

export async function saveDiscoveryInvitationProgress(
  client: PoolClient,
  input: {
    inviteToken: string;
    accessCode: string;
    state: DiscoveryUserState;
    survey?: DiscoveryExperienceSurvey | null;
  },
): Promise<DiscoveryInvitationAccessPayload> {
  const verified = await verifyDiscoveryInvitationAccess(
    client,
    input.inviteToken,
    input.accessCode,
  );

  if (verified.accessMode !== "diagnostic") {
    return verified;
  }

  const profile = normalizeProfile(input.state.profile);
  const status: DiscoveryStep =
    input.state.status === "intro" ||
    input.state.status === "instructions" ||
    input.state.status === "quiz" ||
    input.state.status === "results"
      ? input.state.status
      : "intro";
  const answers = normalizeAnswers(input.state.answers);
  const completionPercent = calculateDiscoveryCompletionPercent(answers);
  const globalIndex = scoreDiscoveryAnswers(answers).globalIndex;
  const normalizedState: DiscoveryUserState = {
    name:
      typeof input.state.name === "string" && input.state.name.trim().length > 0
        ? input.state.name.trim().slice(0, 160)
        : `${profile.firstName} ${profile.lastName}`.trim() || "Invitado",
    answers,
    currentIdx: clampCurrentIdx(input.state.currentIdx),
    status,
    profile,
    profileCompleted: isProfileCompleted(profile),
  };

  const completionDate =
    status === "results" || completionPercent >= 100
      ? new Date().toISOString()
      : null;

  const surveyPayload = input.survey ? parseExperienceSurvey(input.survey) : null;
  await client.query(
    `
      UPDATE app_assessment.discovery_invitations
      SET
        meta = jsonb_set(
          jsonb_set(
            COALESCE(meta, '{}'::jsonb),
            '{external_progress}',
            $2::jsonb,
            true
          ),
          '{external_survey}',
          COALESCE($3::jsonb, (COALESCE(meta, '{}'::jsonb)->'external_survey'), 'null'::jsonb),
          true
        ),
        updated_at = now()
      WHERE invitation_id = $1::uuid
    `,
    [
      verified.invitation.invitationId,
      JSON.stringify({
        ...normalizedState,
        completionPercent,
        globalIndex,
        completedAt: completionDate,
      }),
      surveyPayload ? JSON.stringify(surveyPayload) : null,
    ],
  );

  return {
    ...verified,
    externalProgress: normalizedState,
    alreadyCompleted: Boolean(completionDate),
    externalSurvey: surveyPayload ?? verified.externalSurvey,
  };
}

export async function getDiscoveryOverview(
  client: PoolClient,
  actor: AuthUser,
  filters: DiscoveryOverviewFilters = {},
): Promise<DiscoveryOverviewPayload> {
  await requireModulePermission(client, "descubrimiento", "view");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden ver analitica global de Descubrimiento.");
  }

  const params: Array<string | number> = [];
  const where: string[] = [];
  const rawUserFilter = filters.userId?.trim() || "";
  const invitedUserFilterId = rawUserFilter.startsWith(DISCOVERY_INVITED_FILTER_PREFIX)
    ? rawUserFilter.slice(DISCOVERY_INVITED_FILTER_PREFIX.length).toLowerCase()
    : "";
  const platformUserFilterId = rawUserFilter && !invitedUserFilterId ? rawUserFilter : "";

  if (platformUserFilterId) {
    params.push(platformUserFilterId);
    where.push(`ds.user_id = $${params.length}::uuid`);
  }

  if (filters.country) {
    params.push(filters.country.trim().toLowerCase());
    where.push(`lower(ds.country) = $${params.length}`);
  }

  if (filters.jobRole) {
    params.push(filters.jobRole.trim());
    where.push(`ds.job_role = $${params.length}`);
  }

  if (Number.isFinite(filters.ageMin)) {
    params.push(Number(filters.ageMin));
    where.push(`ds.age >= $${params.length}`);
  }

  if (Number.isFinite(filters.ageMax)) {
    params.push(Number(filters.ageMax));
    where.push(`ds.age <= $${params.length}`);
  }

  if (Number.isFinite(filters.yearsExperienceMin)) {
    params.push(Number(filters.yearsExperienceMin));
    where.push(`ds.years_experience >= $${params.length}`);
  }

  if (Number.isFinite(filters.yearsExperienceMax)) {
    params.push(Number(filters.yearsExperienceMax));
    where.push(`ds.years_experience <= $${params.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  interface DiscoveryOverviewDbRow {
    session_id: string;
    diagnostic_identifier: string;
    user_id: string;
    participant_name: string;
    country: string | null;
    job_role: string | null;
    age: number | null;
    years_experience: number | null;
    completion_percent: number;
    global_index: number | null;
    answers: DiscoveryAnswers | null;
    feedback_survey?: unknown;
    updated_at: string;
  }

  interface DiscoveryInvitationOverviewRow {
    invitation_id: string;
    invited_email: string;
    meta: unknown;
    updated_at: string;
  }

  interface OverviewAnalyticsEntry {
    score: ReturnType<typeof scoreDiscoveryAnswers> | null;
    survey: DiscoveryExperienceSurvey | null;
    completed: boolean;
  }

  const pillarLabels: Record<"within" | "out" | "up" | "beyond", string> = {
    within: "Shine Within",
    out: "Shine Out",
    up: "Shine Up",
    beyond: "Shine Beyond",
  };

  const buildAnalyticsBundle = (
    entries: OverviewAnalyticsEntry[],
    totalRows: number,
  ): DiscoveryOverviewPayload["analytics"] => {
    const scoreEntries = entries.filter((entry) => entry.score !== null);
    const completedCount = entries.filter((entry) => entry.completed).length;
    const inProgressCount = Math.max(0, totalRows - completedCount);

    const pillars = (["within", "out", "up", "beyond"] as const).map((pillar) => {
      const values = scoreEntries.map((entry) => entry.score!.pillarMetrics[pillar].total);
      const average =
        values.length > 0
          ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length)
          : 0;
      return {
        pillar,
        label: pillarLabels[pillar],
        average,
      };
    });

    const componentMap = new Map<string, { pillar: "within" | "out" | "up" | "beyond"; values: number[] }>();
    for (const entry of scoreEntries) {
      for (const component of entry.score!.compList) {
        const record = componentMap.get(component.name) ?? {
          pillar: component.pillar,
          values: [],
        };
        record.values.push(Math.round(((component.score - 1) / 4) * 100));
        componentMap.set(component.name, record);
      }
    }
    const components = Array.from(componentMap.entries())
      .map(([component, record]) => ({
        component,
        pillar: record.pillar,
        average:
          record.values.length > 0
            ? Math.round(record.values.reduce((acc, value) => acc + value, 0) / record.values.length)
            : 0,
        count: record.values.length,
      }))
      .sort((a, b) => b.average - a.average);
    const componentsTop = components
      .filter((item) => item.average >= 75)
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
    const componentsWeak = components
      .filter((item) => item.average <= 50)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5);

    const surveyEntries = entries
      .map((entry) => entry.survey)
      .filter((value): value is DiscoveryExperienceSurvey => Boolean(value));
    const surveyQuestionStats = DISCOVERY_SURVEY_QUESTIONS.map((question) => {
      const values = surveyEntries
        .map((survey) => survey.answers[question])
        .filter((value): value is number => Number.isFinite(value));
      return {
        question,
        average:
          values.length > 0
            ? Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2))
            : 0,
        count: values.length,
      };
    });
    const surveyValues = surveyEntries.map((survey) => survey.average).filter(Number.isFinite);
    const surveyAverage =
      surveyValues.length > 0
        ? Number((surveyValues.reduce((acc, value) => acc + value, 0) / surveyValues.length).toFixed(2))
        : 0;
    const pillarAverages = pillars.map((pillar) => pillar.average);
    const generalAverage =
      pillarAverages.length > 0
        ? Math.round(
            pillarAverages.reduce((acc, value) => acc + value, 0) / pillarAverages.length,
          )
        : 0;
    const completionRate =
      totalRows > 0
        ? Number(((completedCount / totalRows) * 100).toFixed(1))
        : 0;

    return {
      completion: {
        eligible: totalRows,
        completed: completedCount,
        rate: completionRate,
      },
      generalAverage,
      general: [
        { label: "Completados", value: completedCount },
        { label: "En progreso", value: inProgressCount },
      ],
      pillars,
      components,
      componentsTop,
      componentsWeak,
      satisfaction: {
        responses: surveyEntries.length,
        average: surveyAverage,
        questions: surveyQuestionStats,
      },
    };
  };

  const rowsResult = await client.query<DiscoveryOverviewDbRow>(
    `
      SELECT
        ds.session_id::text,
        ds.diagnostic_identifier,
        ds.user_id::text,
        trim(concat_ws(' ', ds.first_name, ds.last_name)) AS participant_name,
        ds.country,
        ds.job_role,
        ds.age,
        ds.years_experience,
        ds.completion_percent,
        ta.overall_score AS global_index,
        ds.answers,
        ds.feedback_survey,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      LEFT JOIN app_assessment.test_attempts ta ON ta.attempt_id = ds.attempt_id
      ${whereClause ? `${whereClause} AND u.primary_role = 'lider'` : "WHERE u.primary_role = 'lider'"}
      ORDER BY ds.updated_at DESC
      LIMIT 500
    `,
    params,
  );

  const platformRows: DiscoveryOverviewRow[] = rowsResult.rows.map((row) => {
    const normalizedAnswers = normalizeAnswers(row.answers);
    const hasAnswers = Object.keys(normalizedAnswers).length > 0;
    const score = hasAnswers ? scoreDiscoveryAnswers(normalizedAnswers) : null;
    const survey = parseExperienceSurvey(row.feedback_survey);
    const isCompleted = row.global_index !== null;
    const analytics = buildAnalyticsBundle(
      [
        {
          score,
          survey,
          completed: isCompleted,
        },
      ],
      1,
    );

    return {
      sessionId: row.session_id,
      diagnosticIdentifier: row.diagnostic_identifier,
      userId: row.user_id,
      participantName: row.participant_name || "Sin nombre",
      sourceType: "platform" as const,
      invitedEmail: "",
      country: row.country ?? "",
      jobRole: row.job_role ?? "",
      age: row.age,
      yearsExperience: row.years_experience,
      completionPercent: Number(row.completion_percent ?? 0),
      globalIndex: row.global_index !== null ? Number(row.global_index) : null,
      updatedAt: row.updated_at,
      analytics,
    };
  });

  const invitationResult = await client.query<DiscoveryInvitationOverviewRow>(
    `
      SELECT
        invitation_id::text,
        invited_email,
        meta,
        updated_at::text
      FROM app_assessment.discovery_invitations
      WHERE session_id IS NULL
      ORDER BY updated_at DESC
      LIMIT 500
    `,
  );

  const invitedRows: DiscoveryOverviewRow[] = invitationResult.rows
    .map((invitation) => {
      const externalProgress = parseInvitationExternalProgress(invitation.meta);
      const answers = externalProgress?.answers ?? {};
      const completionPercent = calculateDiscoveryCompletionPercent(answers);
      const hasAnswers = Object.keys(answers).length > 0;
      const score = hasAnswers ? scoreDiscoveryAnswers(answers) : null;
      const externalSurvey = parseInvitationExternalSurvey(invitation.meta);
      const profile = externalProgress?.profile;
      const participantName =
        externalProgress?.name ||
        `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
        invitation.invited_email;
      const isCompleted =
        externalProgress?.status === "results" || completionPercent >= 100;
      const analytics = buildAnalyticsBundle(
        [
          {
            score,
            survey: externalSurvey,
            completed: isCompleted,
          },
        ],
        1,
      );

      return {
        sessionId: `inv-${invitation.invitation_id}`,
        diagnosticIdentifier: `DX-INV-${invitation.invitation_id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
        userId: `${DISCOVERY_INVITED_FILTER_PREFIX}${invitation.invitation_id}`,
        participantName,
        sourceType: "invited" as const,
        invitedEmail: invitation.invited_email,
        country: profile?.country ?? "",
        jobRole: profile?.jobRole ?? "",
        age: profile?.age ?? null,
        yearsExperience: profile?.yearsExperience ?? null,
        completionPercent,
        globalIndex:
          isCompleted && score
            ? score.globalIndex
            : null,
        updatedAt: invitation.updated_at,
        analytics,
      };
    })
    .filter((row) => {
      if (rawUserFilter) {
        if (!invitedUserFilterId) return false;
        if (row.userId !== `${DISCOVERY_INVITED_FILTER_PREFIX}${invitedUserFilterId}`) {
          return false;
        }
      }
      if (filters.country && row.country.toLowerCase() !== filters.country.trim().toLowerCase()) {
        return false;
      }
      if (filters.jobRole && row.jobRole !== filters.jobRole.trim()) return false;
      if (Number.isFinite(filters.ageMin) && (row.age ?? -1) < Number(filters.ageMin)) return false;
      if (Number.isFinite(filters.ageMax) && (row.age ?? 999) > Number(filters.ageMax)) return false;
      if (
        Number.isFinite(filters.yearsExperienceMin) &&
        (row.yearsExperience ?? -1) < Number(filters.yearsExperienceMin)
      ) {
        return false;
      }
      if (
        Number.isFinite(filters.yearsExperienceMax) &&
        (row.yearsExperience ?? 999) > Number(filters.yearsExperienceMax)
      ) {
        return false;
      }
      return true;
    });

  const rows = [...platformRows, ...invitedRows]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 500);

  const completedRows = rows.filter((row) => row.globalIndex !== null);
  const averageGlobalIndex =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce((acc, row) => acc + (row.globalIndex ?? 0), 0) /
            completedRows.length,
        )
      : 0;

  const usersResult = await client.query<{ user_id: string; name: string }>(
    `
      SELECT
        ds.user_id::text,
        trim(concat_ws(' ', ds.first_name, ds.last_name)) AS name
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE u.primary_role = 'lider'
      ORDER BY name
    `,
  );

  const countriesResult = await client.query<{ country: string }>(
    `
      SELECT DISTINCT ds.country
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.country IS NOT NULL
        AND trim(ds.country) <> ''
        AND u.primary_role = 'lider'
      ORDER BY ds.country
    `,
  );

  const rolesResult = await client.query<{ job_role: string }>(
    `
      SELECT DISTINCT ds.job_role
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.job_role IS NOT NULL
        AND u.primary_role = 'lider'
      ORDER BY ds.job_role
    `,
  );

  const invitedCountries = invitationResult.rows
    .map((invitation) => parseInvitationExternalProgress(invitation.meta)?.profile?.country?.trim() ?? "")
    .filter(Boolean);
  const invitedRoles = invitationResult.rows
    .map((invitation) => parseInvitationExternalProgress(invitation.meta)?.profile?.jobRole?.trim() ?? "")
    .filter(Boolean);
  const invitedUsers = invitationResult.rows.map((invitation) => {
    const externalProgress = parseInvitationExternalProgress(invitation.meta);
    const profile = externalProgress?.profile;
    const participantName =
      externalProgress?.name ||
      `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
      invitation.invited_email;
    return {
      userId: `${DISCOVERY_INVITED_FILTER_PREFIX}${invitation.invitation_id}`,
      name: `${participantName} (Invitado)`,
    };
  });

  const analytics = buildAnalyticsBundle(
    rows.map((row) => ({
      score:
        row.analytics.pillars.length > 0 || row.analytics.components.length > 0
          ? {
              pillarMetrics: {
                within: { total: row.analytics.pillars.find((item) => item.pillar === "within")?.average ?? 0, likert: 0, sjt: 0 },
                out: { total: row.analytics.pillars.find((item) => item.pillar === "out")?.average ?? 0, likert: 0, sjt: 0 },
                up: { total: row.analytics.pillars.find((item) => item.pillar === "up")?.average ?? 0, likert: 0, sjt: 0 },
                beyond: { total: row.analytics.pillars.find((item) => item.pillar === "beyond")?.average ?? 0, likert: 0, sjt: 0 },
              },
              globalIndex: row.globalIndex ?? 0,
              compList: row.analytics.components.map((component) => ({
                pillar: component.pillar,
                name: component.component,
                score: (component.average / 100) * 4 + 1,
              })),
            }
          : null,
      survey:
        row.analytics.satisfaction.responses > 0
          ? {
              answers: Object.fromEntries(
                row.analytics.satisfaction.questions.map((question) => [question.question, question.average]),
              ),
              submittedAt: row.updatedAt,
              average: row.analytics.satisfaction.average,
            }
          : null,
      completed: row.globalIndex !== null,
    })),
    rows.length,
  );

  const platformFilterUsers = usersResult.rows.map((row) => ({ userId: row.user_id, name: row.name }));
  const uniqueFilterUsers = new Map<string, { userId: string; name: string }>();
  for (const user of [...platformFilterUsers, ...invitedUsers]) {
    if (!user.userId || !user.name) continue;
    uniqueFilterUsers.set(user.userId, user);
  }

  const invitedCountriesFromRows = invitedRows
    .map((row) => row.country.trim())
    .filter(Boolean);
  const invitedRolesFromRows = invitedRows
    .map((row) => row.jobRole.trim())
    .filter(Boolean);

  return {
    stats: {
      totalDiagnostics: rows.length,
      completedDiagnostics: completedRows.length,
      averageGlobalIndex,
    },
    rows,
    analytics,
    availableFilters: {
      users: Array.from(uniqueFilterUsers.values()).sort((left, right) =>
        left.name.localeCompare(right.name, "es"),
      ),
      countries: Array.from(
        new Set([
          ...countriesResult.rows.map((row) => row.country),
          ...invitedCountries,
          ...invitedCountriesFromRows,
        ]),
      ).sort((a, b) => a.localeCompare(b, "es")),
      jobRoles: Array.from(
        new Set([
          ...rolesResult.rows.map((row) => row.job_role),
          ...invitedRoles,
          ...invitedRolesFromRows,
        ]),
      ).sort((a, b) => a.localeCompare(b, "es")),
    },
  };
}

interface DiscoveryRecommendedResource {
  title: string;
  contentType: string;
  category: string;
  competency: string | null;
  pillar: string | null;
}

interface DiscoveryAnalysisInput {
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
  pillar: DiscoveryReportFilter;
  fallbackReport?: string;
}

function sanitizeOpenAiBaseUrl(value: string | null | undefined): string {
  const candidate = (value ?? "").trim();
  if (!candidate) return "https://api.openai.com/v1";
  return candidate.replace(/\/+$/, "");
}

function parseOpenAiContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = item as { type?: string; text?: string };
        if (row.type === "text" && typeof row.text === "string") return row.text;
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

function listInlineSpanish(items: string[]): string {
  if (items.length === 0) return "sin datos suficientes";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function toPillarDisplayName(pillar: DiscoveryReportFilter): string {
  if (pillar === "all") return "visión general";
  const map: Record<Exclude<DiscoveryReportFilter, "all">, string> = {
    within: "Shine within (autoliderazgo)",
    out: "Shine out (influencia y relaciones)",
    up: "Shine up (estrategia y negocio)",
    beyond: "Shine beyond (cultura y legado)",
  };
  return map[pillar];
}

function mapPillarMetadataVariants(pillar: DiscoveryReportFilter): string[] {
  if (pillar === "all") return [];
  const variants: Record<Exclude<DiscoveryReportFilter, "all">, string[]> = {
    within: ["within", "shine_within", "shine within"],
    out: ["out", "shine_out", "shine out"],
    up: ["up", "shine_up", "shine up"],
    beyond: ["beyond", "shine_beyond", "shine beyond"],
  };
  return variants[pillar];
}

function normalizeTextDocumentSnippet(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2200);
}

async function fetchContextDocumentSnippet(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const isTextLike =
      contentType.includes("text/") ||
      contentType.includes("json") ||
      contentType.includes("xml") ||
      contentType.includes("csv");
    if (!isTextLike) return null;
    const text = await response.text();
    const snippet = normalizeTextDocumentSnippet(text);
    return snippet.length > 0 ? snippet : null;
  } catch {
    return null;
  }
}

async function resolveRecommendedResources(
  client: PoolClient,
  targetGapNames: string[],
  pillar: DiscoveryReportFilter,
): Promise<DiscoveryRecommendedResource[]> {
  const normalizedGaps = targetGapNames.map((item) => item.trim().toLowerCase()).filter(Boolean);
  const pillarVariants = mapPillarMetadataVariants(pillar);
  const ilikePatterns = normalizedGaps.map((item) => `%${item}%`);

  const { rows } = await client.query<{
    title: string;
    content_type: string;
    category: string;
    competency_metadata: Record<string, string> | null;
  }>(
    `
      SELECT
        ci.title,
        ci.content_type,
        ci.category,
        ci.competency_metadata
      FROM app_learning.content_items ci
      WHERE ci.status = 'published'
        AND (
          cardinality($1::text[]) = 0
          OR lower(COALESCE(ci.competency_metadata->>'competency', '')) = ANY($1::text[])
          OR lower(COALESCE(ci.competency_metadata->>'component', '')) = ANY($1::text[])
          OR lower(COALESCE(ci.title, '')) LIKE ANY($3::text[])
          OR (
            cardinality($2::text[]) > 0
            AND lower(COALESCE(ci.competency_metadata->>'pillar', '')) = ANY($2::text[])
          )
        )
      ORDER BY ci.is_recommended DESC, ci.published_at DESC NULLS LAST, ci.created_at DESC
      LIMIT 6
    `,
    [normalizedGaps, pillarVariants, ilikePatterns],
  );

  return rows.map((row) => ({
    title: row.title,
    contentType: row.content_type,
    category: row.category,
    competency: row.competency_metadata?.competency ?? row.competency_metadata?.component ?? null,
    pillar: row.competency_metadata?.pillar ?? null,
  }));
}

export async function getDiscoveryFeedbackSettingsForAnalysis(
  client: PoolClient,
  actor: AuthUser,
): Promise<DiscoveryFeedbackSettingsRecord> {
  await requireModulePermission(client, "descubrimiento", "view");
  await requireDiscoveryAccess(client, actor);
  return ensureFeedbackSettings(client, actor);
}

export async function generateDiscoveryAnalysis(
  client: PoolClient,
  actor: AuthUser,
  input: DiscoveryAnalysisInput,
): Promise<{ report: string; source: "ai" | "fallback" }> {
  await requireModulePermission(client, "descubrimiento", "view");
  await requireDiscoveryAccess(client, actor);

  const fallback = input.fallbackReport?.trim() || "";
  const scores = input.scores;
  if (!scores?.pillarMetrics) {
    throw new Error("Invalid scores payload");
  }

  const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, "openai");
  if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) {
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getDiscoveryFeedbackSettingsForAnalysis(client, actor);
  const allSorted = [...(scores.compList ?? [])].sort((a, b) => a.score - b.score);
  const globalStrengths = [...allSorted].slice(-4).reverse();
  const pillar = input.pillar ?? "all";
  const targetPool =
    pillar === "all" ? allSorted : allSorted.filter((item) => item.pillar === pillar);
  const targetGaps = targetPool.slice(0, 4);
  const targetStrengths = [...targetPool].slice(-4).reverse();
  const targetGapNames = targetGaps.map((item) => item.name);

  const glossaryLines = targetGapNames.map((name) => {
    const definition = COMP_DEFINITIONS[name] ?? "Competencia clave del modelo 4Shine.";
    return `- ${name}: ${definition}`;
  });

  const recommendations = await resolveRecommendedResources(client, targetGapNames, pillar);
  const resourceLines = recommendations.map(
    (item) =>
      `- ${item.title} (${item.contentType}) | foco: ${item.competency ?? "general"} | pilar: ${item.pillar ?? "general"}`,
  );

  const docs = feedbackSettings.contextDocuments.slice(0, 5);
  const contextChunks: string[] = [];
  const unresolvedContextNames: string[] = [];
  for (const doc of docs) {
    const snippet = await fetchContextDocumentSnippet(doc.url);
    if (snippet) {
      contextChunks.push(`### Documento: ${doc.name}\n${snippet}`);
    } else {
      unresolvedContextNames.push(doc.name);
    }
  }

  const systemPrompt = [
    feedbackSettings.aiFeedbackInstructions.trim(),
    "",
    "Reglas de salida obligatorias:",
    "- Escribe en español claro y profesional.",
    "- No inventes datos que no estén en las entradas ni en el contexto.",
    "- Prioriza precisión metodológica por encima de frases genéricas.",
    "- Entrega secciones con títulos markdown de nivel 2 (##).",
    "- Concluye con la sección '## Señal de progreso'.",
    "",
    "Contexto metodológico de competencias (base 4Shine):",
    glossaryLines.join("\n") || "- Sin glosario específico para estas brechas.",
    "",
    "Recursos internos recomendados (usar conceptos, no citar títulos literalmente):",
    resourceLines.join("\n") || "- Sin recursos publicados específicos para estas brechas.",
    "",
    "Fragmentos recuperados de documentos de contexto cargados por el administrador:",
    contextChunks.join("\n\n") || "- No se pudo extraer texto de los documentos en esta ejecución.",
    unresolvedContextNames.length
      ? `Documentos sin extracción de texto (se consideran como referencia nominal): ${unresolvedContextNames.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = [
    `Líder: ${input.username} (${input.role || "rol no especificado"})`,
    `Vista solicitada: ${toPillarDisplayName(pillar)}`,
    `Índice global: ${scores.globalIndex}%`,
    "Resultados por pilar (0-100):",
    `- Within: ${scores.pillarMetrics.within.total}% (Likert ${scores.pillarMetrics.within.likert}%, SJT ${scores.pillarMetrics.within.sjt}%)`,
    `- Out: ${scores.pillarMetrics.out.total}% (Likert ${scores.pillarMetrics.out.likert}%, SJT ${scores.pillarMetrics.out.sjt}%)`,
    `- Up: ${scores.pillarMetrics.up.total}% (Likert ${scores.pillarMetrics.up.likert}%, SJT ${scores.pillarMetrics.up.sjt}%)`,
    `- Beyond: ${scores.pillarMetrics.beyond.total}% (Likert ${scores.pillarMetrics.beyond.likert}%, SJT ${scores.pillarMetrics.beyond.sjt}%)`,
    "",
    `Fortalezas principales: ${listInlineSpanish((pillar === "all" ? globalStrengths : targetStrengths).map((item) => item.name))}`,
    `Brechas principales: ${listInlineSpanish(targetGapNames)}`,
    "",
    "Estructura mínima requerida:",
    "- ## Tu perfil estratégico",
    "- ## Lo que hoy te impulsa",
    "- ## Plan de aceleración de 30 días",
    "- ## Lectura del pilar",
    "- ## Puntos críticos de atención",
    "- ## Intervención táctica",
    "- ## Señal de progreso",
    "",
    "Si la vista es global, integra los 4 pilares. Si es por pilar, profundiza solo en ese pilar con consecuencias sistémicas.",
  ].join("\n");

  try {
    const endpoint = `${sanitizeOpenAiBaseUrl(openAiIntegration.wizardData.baseUrl)}/chat/completions`;
    const model = openAiIntegration.wizardData.model?.trim() || "gpt-4.1-mini";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiIntegration.secretValue}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.45,
        max_tokens: 2200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "error" in payload
          ? JSON.stringify((payload as { error?: unknown }).error)
          : `status ${response.status}`;
      throw new Error(`OpenAI request failed: ${detail}`);
    }

    const report = parseOpenAiContent(payload);
    if (!report) {
      throw new Error("OpenAI returned empty content.");
    }

    return { report, source: "ai" };
  } catch {
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("No se pudo generar el análisis con IA y no existe fallback.");
  }
}
