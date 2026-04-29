import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import type { PoolClient } from "pg";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { requireDiscoveryAccess } from "@/features/access/service";
import { withRoleContext } from "@/server/db/pool";
import { getIntegrationConfigForActor } from "@/server/integrations/config";
import { requireModulePermission } from "@/server/auth/module-permissions";
import { hashPassword } from "@/server/auth/password";
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
  DiscoveryAiReports,
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
  DiscoveryOverviewDetailPayload,
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
  gender: string | null;
  years_experience: number | string | null;
  feedback_survey?: unknown;
  ai_reports?: unknown;
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

const INVITATION_PROVISION_SYSTEM_USER_ID =
  process.env.INVITATION_PROVISION_SYSTEM_USER_ID || "00000000-0000-0000-0000-000000000001";
const CURRENT_DISCOVERY_AI_REPORT_VERSION = 5;
const DISCOVERY_ANALYSIS_BATCH_CONCURRENCY = 4;

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

interface OpenAiIntegrationRow {
  enabled: boolean;
  secret_value: string | null;
  wizard_data: Record<string, unknown> | null;
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

Reglas editoriales: No uses lenguaje tipico de IA ni frases de relleno. No uses mayusculas para enfatizar. Usa markdown claro y accionable. No menciones nombres de cursos, libros o autores, aunque existan como fuentes de contexto.

Cuando el analisis sea por pilar (within, out, up o beyond), profundiza en prosa narrativa sobre las fortalezas del pilar, los puntos criticos de atencion, las consecuencias sistemicas y la intervencion tactica concreta. Nunca uses listas ni viñetas; escribe siempre en parrafos narrativos densos.

Genera feedback ejecutivo accionable, con tono claro, humano y profesional. Evita sonar como un asistente virtual; habla como un mentor experto en liderazgo 4Shine.
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

function coerceNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

  const gender = (typeof input?.gender === "string" ? input.gender.trim() : (fallback?.gender ?? "")) as any;
  const yearsValue = coerceNumeric(input?.yearsExperience ?? fallback?.yearsExperience ?? null);

  const yearsExperience = yearsValue !== null
    ? Math.max(0, Math.min(80, Math.floor(Number(yearsValue))))
    : null;

  return {
    firstName,
    lastName,
    country,
    jobRole: normalizedRole as any,
    gender: gender as DiscoveryParticipantProfile["gender"],
    yearsExperience,
  };

}

function isProfileCompleted(profile: DiscoveryParticipantProfile): boolean {
  return Boolean(
    profile.firstName &&
      profile.lastName &&
      profile.country &&
      profile.jobRole &&
      profile.gender &&
      Number.isFinite(profile.yearsExperience),
  );
}

async function syncDiscoveryProfileToUserProfile(
  client: PoolClient,
  userId: string,
  profile: DiscoveryParticipantProfile,
): Promise<void> {
  if (!isProfileCompleted(profile)) {
    return;
  }

  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const displayName = `${firstName} ${lastName}`.trim();
  const country = profile.country.trim();
  const normalizedJobRole = profile.jobRole;
  const gender = profile.gender;
  const yearsExperience = Number.isFinite(profile.yearsExperience)
    ? Math.max(0, Math.min(80, Math.floor(Number(profile.yearsExperience))))
    : null;

  const hasNameData = firstName.length > 0 && lastName.length > 0;
  const hasCountryData = country.length > 0;
  const hasJobRoleData = Boolean(normalizedJobRole);
  const hasGenderData = Boolean(gender);
  const hasYearsExperienceData = yearsExperience !== null;

  if (hasNameData) {
    await client.query(
      `
        UPDATE app_core.users
        SET
          first_name = $2,
          last_name = $3,
          display_name = $4,
          avatar_initial = UPPER(LEFT($4, 1)),
          updated_at = now()
        WHERE user_id = $1::uuid
      `,
      [userId, firstName, lastName, displayName],
    );
  }

  if (!hasCountryData || !hasJobRoleData || !hasGenderData || !hasYearsExperienceData) {
    return;
  }

  await client.query(
    `
      INSERT INTO app_core.user_profiles (user_id, country, job_role, gender, years_experience)
      VALUES ($1::uuid, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET
        country = CASE
          WHEN $6::boolean THEN EXCLUDED.country
          ELSE app_core.user_profiles.country
        END,
        job_role = CASE
          WHEN $7::boolean THEN EXCLUDED.job_role
          ELSE app_core.user_profiles.job_role
        END,
        gender = CASE
          WHEN $8::boolean THEN EXCLUDED.gender
          ELSE app_core.user_profiles.gender
        END,
        years_experience = CASE
          WHEN $9::boolean THEN EXCLUDED.years_experience
          ELSE app_core.user_profiles.years_experience
        END,
        updated_at = now()
    `,
    [
      userId,
      hasCountryData ? country : null,
      hasJobRoleData ? normalizedJobRole : null,
      hasGenderData ? gender : null,
      yearsExperience,
      hasCountryData,
      hasJobRoleData,
      hasGenderData,
      hasYearsExperienceData,
    ],
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
    gender: (row.gender as any) ?? "",
    yearsExperience: coerceNumeric(row.years_experience),
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
    gender: profile.gender,
    yearsExperience: profile.yearsExperience,
    profileCompleted: isProfileCompleted(profile),
    experienceSurvey: parseExperienceSurvey(row.feedback_survey),
    aiReports: parseDiscoveryAiReports(row.ai_reports),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseDiscoveryAiReports(input: unknown): DiscoveryAiReports {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const record = input as Record<string, unknown>;
  if (Number(record._version ?? 0) !== CURRENT_DISCOVERY_AI_REPORT_VERSION) {
    return {};
  }
  return {
    all: typeof record.all === "string" ? record.all : undefined,
    within: typeof record.within === "string" ? record.within : undefined,
    out: typeof record.out === "string" ? record.out : undefined,
    up: typeof record.up === "string" ? record.up : undefined,
    beyond: typeof record.beyond === "string" ? record.beyond : undefined,
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
    completionPercent: 0,
  };
}

function parseInvitationExternalSurvey(meta: unknown): DiscoveryExperienceSurvey | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const record = meta as Record<string, unknown>;
  return parseExperienceSurvey(record.external_survey);
}

function buildUserStateFromSession(
  session: DiscoverySessionRecord,
): DiscoveryUserState {
  return {
    name: session.nameSnapshot,
    answers: session.answers,
    currentIdx: session.currentIdx,
    status: session.status,
    profile: {
      firstName: session.firstName,
      lastName: session.lastName,
      country: session.country,
      jobRole: session.jobRole,
      gender: session.gender as DiscoveryParticipantProfile["gender"],
      yearsExperience: session.yearsExperience,
    },
    profileCompleted: session.profileCompleted,
    completionPercent: session.completionPercent,
    experienceSurvey: session.experienceSurvey,
  };
}

function buildFallbackInvitationState(
  invitationEmail: string,
): DiscoveryUserState {
  const profile = normalizeProfile({
    firstName: "",
    lastName: "",
    country: "",
    jobRole: "",
    gender: "",
    yearsExperience: null,
  });

  return {
    name: invitationEmail,
    answers: {},
    currentIdx: 0,
    status: "intro",
    profile,
    profileCompleted: false,
    completionPercent: 0,
  };
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

function normalizeStringRecord(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    output[key] = String(value).trim();
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
        ds.gender,
        ds.years_experience,
        ds.feedback_survey,
        ds.ai_reports,
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

async function readDiscoverySessionBySessionId(
  client: PoolClient,
  sessionId: string,
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
        ds.gender,
        ds.years_experience,
        ds.feedback_survey,
        ds.ai_reports,
        ds.created_at::text,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      WHERE ds.session_id = $1::uuid
      LIMIT 1
    `,
    [sessionId],
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
        gender,
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
        gender,
        years_experience,
        feedback_survey,
        ai_reports,
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
    gender: current.gender as any,
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
        gender,
        years_experience,
        feedback_survey,
        ai_reports,
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
        gender,
        years_experience,
        feedback_survey,
        ai_reports,
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

async function resolveOrganizationIdFromSessionUser(
  client: PoolClient,
  sessionUserId: string,
): Promise<string | null> {
  const { rows } = await client.query<{ organization_id: string | null }>(
    `
      SELECT u.organization_id::text
      FROM app_core.users u
      WHERE u.user_id = $1::uuid
      LIMIT 1
    `,
    [sessionUserId],
  );
  return rows[0]?.organization_id ?? null;
}

async function resolveFallbackOrganizationId(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `
      SELECT organization_id::text
      FROM app_core.organizations
      ORDER BY created_at
      LIMIT 1
    `,
  );
  const organizationId = rows[0]?.organization_id;
  if (!organizationId) {
    throw new Error("No organization available for discovery analysis.");
  }
  return organizationId;
}

async function resolveOpenAiConfigByOrganization(
  client: PoolClient,
  organizationId: string,
): Promise<{ enabled: boolean; secretValue: string; wizardData: Record<string, string> } | null> {
  const { rows } = await client.query<OpenAiIntegrationRow>(
    `
      SELECT
        enabled,
        secret_value,
        wizard_data
      FROM app_admin.integration_configs
      WHERE organization_id = $1::uuid
        AND integration_key = 'openai'
      LIMIT 1
    `,
    [organizationId],
  );

  const row = rows[0];
  if (!row) return null;
  return {
    enabled: row.enabled,
    secretValue: row.secret_value?.trim() ?? "",
    wizardData: normalizeStringRecord(row.wizard_data),
  };
}

async function getFeedbackSettingsByOrganizationOrDefault(
  client: PoolClient,
  organizationId: string,
): Promise<DiscoveryFeedbackSettingsRecord> {
  const { rows } = await client.query<DiscoveryFeedbackSettingsRow>(
    `
      SELECT
        settings_id::text,
        organization_id::text,
        ai_feedback_instructions,
        context_documents,
        invite_email_subject,
        invite_email_html,
        invite_email_text,
        updated_at::text
      FROM app_assessment.discovery_feedback_settings
      WHERE organization_id = $1::uuid
      LIMIT 1
    `,
    [organizationId],
  );
  if (rows[0]) {
    return mapFeedbackSettingsRow(rows[0]);
  }

  const branding = await getBrandingForOrganization(client, organizationId);
  return {
    settingsId: null,
    organizationId,
    aiFeedbackInstructions: DEFAULT_AI_FEEDBACK_INSTRUCTIONS,
    contextDocuments: [],
    inviteEmailSubject: "Diagnostico 4Shine: acceso personalizado",
    inviteEmailHtml: defaultInviteEmailHtml(
      branding.platform_name,
      branding.primary_color,
      branding.accent_color,
    ),
    inviteEmailText: defaultInviteEmailText(branding.platform_name),
    updatedAt: null,
  };
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
          gender,
          years_experience,
          feedback_survey,
          ai_reports,
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
          gender = $12,
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
        gender,
        years_experience,
        feedback_survey,
        ai_reports,
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
      next.profile.gender,
      next.profile.yearsExperience,
      next.experienceSurvey ? JSON.stringify(next.experienceSurvey) : null,
    ],
  );

  if (!rows[0]) {
    throw new Error("Failed to update discovery session");
  }

  const session = mapDiscoverySessionRow(rows[0]);

  await syncDiscoveryProfileToUserProfile(client, actor.userId, next.profile);

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
          gender = NULL,
          years_experience = NULL,
          feedback_survey = NULL,
          ai_reports = NULL,
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
        gender,
        years_experience,
        feedback_survey,
        ai_reports,
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
        ds.gender,
        ds.years_experience,
        ds.feedback_survey,
        ds.ai_reports,
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
): Promise<{ inviteToken: string; invitedEmailMasked: string; openedAt: string | null; externalProgressStatus: string | null } | null> {
  const { rows } = await client.query<
    Pick<DiscoveryInvitationRow, "invite_token" | "invited_email" | "opened_at"> & { progress_status: string | null }
  >(
    `
      SELECT
        invite_token,
        invited_email,
        opened_at::text,
        meta->'external_progress'->>'status' AS progress_status
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
    externalProgressStatus: row.progress_status,
  };
}

export async function verifyDiscoveryInvitationAccess(
  client: PoolClient,
  inviteToken: string,
  accessCode: string,
): Promise<DiscoveryInvitationAccessPayload> {
  const normalizedCode = accessCode.trim().toUpperCase();
  const row = await resolveDiscoveryInvitationByToken(client, inviteToken);

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

  // Heal missing global_index for already-completed sessions
  if (
    session &&
    session.attemptId &&
    (session.status === "results" || session.completionPercent >= 100)
  ) {
    const { rows: taRows } = await client.query<{ overall_score: number | null }>(
      `SELECT overall_score FROM app_assessment.test_attempts WHERE attempt_id = $1::uuid`,
      [session.attemptId],
    );
    if (taRows[0] && taRows[0].overall_score === null) {
      await syncCompletedScores(client, session);
    }
  }

  return {
    invitation: {
      invitationId: row.invitation_id,
      inviteToken: row.invite_token,
      invitedEmailMasked: maskEmail(row.invited_email),
      openedAt: row.opened_at,
      meta: row.meta,
    },
    accessMode:
      session?.status === "results" || (session?.completionPercent ?? 0) >= 100
        ? "results"
        : "diagnostic",
    session,
    externalProgress,
    alreadyCompleted,
    externalSurvey,
  };
}

function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function titleCaseWord(word: string): string {
  if (!word) return word;
  return `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
}

function deriveNameFromEmail(email: string): { firstName: string; lastName: string; displayName: string } {
  const local = email.split("@")[0] ?? "invitado";
  const cleaned = local.replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim();
  const parts = cleaned
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(titleCaseWord);

  const firstName = parts[0] ?? "Invitado";
  const lastName = parts.slice(1).join(" ") || "4Shine";
  const displayName = `${firstName} ${lastName}`.trim();
  return { firstName, lastName, displayName };
}

async function resolveInvitationOrganizationId(
  client: PoolClient,
  invitation: DiscoveryInvitationRow & { session_payload: DiscoverySessionRow | null },
): Promise<string | null> {
  if (invitation.session_payload?.user_id) {
    const { rows } = await client.query<{ organization_id: string | null }>(
      `
        SELECT organization_id::text
        FROM app_core.users
        WHERE user_id = $1::uuid
        LIMIT 1
      `,
      [invitation.session_payload.user_id],
    );
    if (rows[0]?.organization_id) return rows[0].organization_id;
  }
  return resolveFallbackOrganizationId(client);
}

async function provisionInvitedUserAccount(
  client: PoolClient,
  invitation: DiscoveryInvitationRow & { session_payload: DiscoverySessionRow | null },
  verified: DiscoveryInvitationAccessPayload,
  plainAccessCode: string,
): Promise<AuthUser> {
  const email = normalizeInvitationEmail(invitation.invited_email);
  const passwordHash = await hashPassword(plainAccessCode.trim().toUpperCase());
  const externalProfile = verified.externalProgress?.profile;
  const fallbackName = deriveNameFromEmail(email);
  const firstName = (externalProfile?.firstName?.trim() || fallbackName.firstName).slice(0, 120);
  const lastName = (externalProfile?.lastName?.trim() || fallbackName.lastName).slice(0, 120);
  const displayName = `${firstName} ${lastName}`.trim().slice(0, 160) || "Invitado 4Shine";
  const normalizedProfile = normalizeProfile(
    {
      country: externalProfile?.country ?? "",
      jobRole: externalProfile?.jobRole ?? "",
      gender: externalProfile?.gender ?? "",
      yearsExperience: externalProfile?.yearsExperience ?? null,
    },
    {
      country: "No definido",
      jobRole: "Especialista sin personal a cargo",
      gender: "Prefiero no decirlo",
      yearsExperience: 0,
    },
  );
  const organizationId = await resolveInvitationOrganizationId(client, invitation);

  const { rows: existingRows } = await client.query<{
    user_id: string;
    primary_role: string;
    display_name: string;
    is_active: boolean;
  }>(
    `
      SELECT user_id::text, primary_role, display_name, is_active
      FROM app_core.users
      WHERE email = $1::citext
      LIMIT 1
    `,
    [email],
  );

  let userId: string;
  let userName = displayName;
  const existing = existingRows[0];
  if (existing) {
    if (existing.primary_role !== "invitado") {
      return {
        userId: existing.user_id,
        email,
        name: existing.display_name || displayName,
        role: existing.primary_role as AuthUser["role"],
      };
    }
    userId = existing.user_id;
    userName = existing.display_name || displayName;
    await client.query(
      `
        UPDATE app_core.users
        SET
          first_name = $2,
          last_name = $3,
          display_name = $4,
          primary_role = 'invitado',
          is_active = true,
          organization_id = COALESCE($5::uuid, organization_id),
          updated_at = now()
        WHERE user_id = $1::uuid
      `,
      [userId, firstName, lastName, displayName, organizationId],
    );
  } else {
    const { rows: insertedRows } = await client.query<{ user_id: string }>(
      `
        INSERT INTO app_core.users (
          email,
          first_name,
          last_name,
          display_name,
          avatar_initial,
          timezone,
          primary_role,
          is_active,
          organization_id
        )
        VALUES (
          $1::citext,
          $2,
          $3,
          $4,
          UPPER(LEFT($4, 1)),
          'America/Bogota',
          'invitado',
          true,
          $5::uuid
        )
        RETURNING user_id::text
      `,
      [email, firstName, lastName, displayName, organizationId],
    );
    userId = insertedRows[0]?.user_id;
    if (!userId) {
      throw new Error("No se pudo crear la cuenta invitada.");
    }
  }

  await client.query(
    `
      UPDATE app_auth.user_roles
      SET is_default = false
      WHERE user_id = $1::uuid
        AND role_code <> 'invitado'
    `,
    [userId],
  );

  await client.query(
    `
      INSERT INTO app_auth.user_roles (user_id, role_code, is_default, assigned_by)
      VALUES ($1::uuid, 'invitado', true, NULL)
      ON CONFLICT (user_id, role_code) DO UPDATE
      SET is_default = true, assigned_by = NULL, assigned_at = now()
    `,
    [userId],
  );

  await client.query(
    `
      INSERT INTO app_auth.user_credentials (user_id, password_hash, failed_attempts, locked_until)
      VALUES ($1::uuid, $2, 0, NULL)
      ON CONFLICT (user_id) DO UPDATE
      SET
        password_hash = EXCLUDED.password_hash,
        failed_attempts = 0,
        locked_until = NULL,
        password_updated_at = now(),
        updated_at = now()
    `,
    [userId, passwordHash],
  );

  await client.query(
    `
      INSERT INTO app_core.user_profiles (
        user_id,
        country,
        job_role,
        gender,
        years_experience
      )
      VALUES ($1::uuid, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET
        country = COALESCE(NULLIF(BTRIM(app_core.user_profiles.country), ''), EXCLUDED.country),
        job_role = COALESCE(app_core.user_profiles.job_role, EXCLUDED.job_role),
        gender = COALESCE(app_core.user_profiles.gender, EXCLUDED.gender),
        years_experience = COALESCE(app_core.user_profiles.years_experience, EXCLUDED.years_experience),
        updated_at = now()
    `,
    [
      userId,
      normalizedProfile.country || "No definido",
      normalizedProfile.jobRole || "Especialista sin personal a cargo",
      normalizedProfile.gender || "No definido",
      Number.isFinite(normalizedProfile.yearsExperience) ? normalizedProfile.yearsExperience : 0,
    ],
  );

  return {
    userId,
    email,
    name: userName,
    role: "invitado",
  };
}

export async function verifyDiscoveryInvitationAccessAndProvisionInvitedUser(
  client: PoolClient,
  inviteToken: string,
  accessCode: string,
): Promise<{ access: DiscoveryInvitationAccessPayload; authUser: AuthUser }> {
  const access = await verifyDiscoveryInvitationAccess(client, inviteToken, accessCode);
  const invitation = await resolveDiscoveryInvitationByToken(client, inviteToken);
  if (access.accessMode !== "diagnostic") {
    const candidateUserId = access.session?.userId ?? invitation.session_payload?.user_id ?? null;
    const normalizedEmail = normalizeInvitationEmail(invitation.invited_email);
    const existingAuthUser = await withRoleContext(
      client,
      INVITATION_PROVISION_SYSTEM_USER_ID,
      "admin",
      async (): Promise<AuthUser | null> => {
        if (candidateUserId) {
          const { rows } = await client.query<{
            user_id: string;
            email: string;
            display_name: string;
            primary_role: string;
            is_active: boolean;
          }>(
            `
              SELECT user_id::text, email::text, display_name, primary_role, is_active
              FROM app_core.users
              WHERE user_id = $1::uuid
              LIMIT 1
            `,
            [candidateUserId],
          );
          const existing = rows[0];
          if (existing?.is_active) {
            return {
              userId: existing.user_id,
              email: existing.email,
              name: existing.display_name || access.session?.nameSnapshot || "Invitado 4Shine",
              role: existing.primary_role as AuthUser["role"],
            };
          }
        }

        const { rows } = await client.query<{
          user_id: string;
          email: string;
          display_name: string;
          primary_role: string;
          is_active: boolean;
        }>(
          `
            SELECT user_id::text, email::text, display_name, primary_role, is_active
            FROM app_core.users
            WHERE email = $1::citext
            LIMIT 1
          `,
          [normalizedEmail],
        );
        const existing = rows[0];
        if (existing?.is_active) {
          return {
            userId: existing.user_id,
            email: existing.email,
            name: existing.display_name || access.session?.nameSnapshot || "Invitado 4Shine",
            role: existing.primary_role as AuthUser["role"],
          };
        }

        return null;
      },
    );
    if (existingAuthUser) {
      return { access, authUser: existingAuthUser };
    }

    throw new Error("La invitación ya está asociada a una cuenta existente.");
  }
  const authUser = await withRoleContext(
    client,
    INVITATION_PROVISION_SYSTEM_USER_ID,
    "admin",
    async () => provisionInvitedUserAccount(client, invitation, access, accessCode),
  );
  return { access, authUser };
}

async function resolveDiscoveryInvitationByToken(
  client: PoolClient,
  inviteToken: string,
): Promise<DiscoveryInvitationRow & { session_payload: DiscoverySessionRow | null }> {
  const normalizedToken = inviteToken.trim().toLowerCase();
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
  return row;
}

export async function getDiscoverySession(
  client: PoolClient,
  sessionId: string,
): Promise<DiscoverySessionRecord | null> {
  const result = await client.query(
    `
      SELECT ds.*, u.name as participant_name, u.email as user_email
      FROM app_assessment.discovery_sessions ds
      LEFT JOIN app_public.users u ON ds.user_id = u.user_id
      WHERE ds.session_id = $1::uuid
    `,
    [sessionId],
  );

  if (result.rowCount === 0) return null;
  return mapDiscoverySessionRow(result.rows[0]);
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

  // Survey can be saved in results mode (diagnostic already complete)
  if (verified.accessMode !== "diagnostic") {
    if (input.survey) {
      const surveyPayload = parseExperienceSurvey(input.survey);
      const metaUpdate = {
        external_survey: surveyPayload,
      };
      await client.query(
        `UPDATE app_assessment.discovery_invitations SET meta = COALESCE(meta, '{}'::jsonb) || $2::jsonb, updated_at = now() WHERE invitation_id = $1::uuid`,
        [verified.invitation.invitationId, JSON.stringify(metaUpdate)],
      );
      const invRow = await resolveDiscoveryInvitationByToken(client, input.inviteToken);
      if (invRow.session_id) {
        await client.query(
          `UPDATE app_assessment.discovery_sessions SET feedback_survey = $2::jsonb, updated_at = now() WHERE session_id = $1::uuid`,
          [invRow.session_id, JSON.stringify(surveyPayload)],
        );
      }
      return { ...verified, externalSurvey: surveyPayload };
    }
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
    completionPercent,
  };

  const completionDate =
    status === "results" || completionPercent >= 100
      ? new Date().toISOString()
      : null;

  const surveyPayload = input.survey ? parseExperienceSurvey(input.survey) : null;
  const progressPayload = {
    ...normalizedState,
    completionPercent,
    globalIndex,
    completedAt: completionDate,
  };

  const metaUpdate: Record<string, any> = {
    external_progress: progressPayload,
  };
  if (surveyPayload) {
    metaUpdate.external_survey = surveyPayload;
  }

  console.log(`[Diagnostic] Saving progress for invitation ${verified.invitation.invitationId}:`, {
    status: normalizedState.status,
    percent: completionPercent,
    profileCompleted: normalizedState.profileCompleted
  });

  await client.query(
    `
      UPDATE app_assessment.discovery_invitations
      SET
        meta = COALESCE(meta, '{}'::jsonb) || $2::jsonb,
        updated_at = now()
      WHERE invitation_id = $1::uuid
    `,
    [verified.invitation.invitationId, JSON.stringify(metaUpdate)],
  );

  // Sync the discovery_sessions record so the admin dashboard reflects real progress
  const invRow = await resolveDiscoveryInvitationByToken(client, input.inviteToken);
  if (invRow.session_id) {
    const markCompleted = Boolean(completionDate);
    await client.query(
      `
        UPDATE app_assessment.discovery_sessions
        SET
          name_snapshot    = $2,
          status           = $3,
          answers          = $4::jsonb,
          current_idx      = $5,
          completion_percent = $6,
          completed_at     = $7::timestamptz,
          first_name       = $8,
          last_name        = $9,
          country          = $10,
          job_role         = $11,
          gender           = $12,
          years_experience = $13,
          feedback_survey  = COALESCE($14::jsonb, feedback_survey),
          updated_at       = now()
        WHERE session_id = $1::uuid
      `,
      [
        invRow.session_id,
        normalizedState.name,
        normalizedState.status,
        JSON.stringify(normalizedState.answers),
        normalizedState.currentIdx,
        completionPercent,
        markCompleted ? completionDate : null,
        profile.firstName,
        profile.lastName,
        profile.country,
        profile.jobRole || null,
        profile.gender,
        profile.yearsExperience,
        surveyPayload ? JSON.stringify(surveyPayload) : null,
      ],
    );

    // Sync global_index into test_attempts when diagnostic completes
    if (markCompleted) {
      const sessionForScoring = await getDiscoverySession(client, invRow.session_id);
      if (sessionForScoring) await syncCompletedScores(client, sessionForScoring);
    }
  }

  const updatedSession = invRow.session_id
    ? await getDiscoverySession(client, invRow.session_id)
    : verified.session;

  return {
    ...verified,
    session: updatedSession,
    externalProgress: normalizedState,
    alreadyCompleted: Boolean(completionDate),
    externalSurvey: surveyPayload ?? verified.externalSurvey,
  };
}

export async function saveDiscoveryInvitationSurvey(
  client: PoolClient,
  input: {
    inviteToken: string;
    accessCode: string;
    survey: DiscoveryExperienceSurvey;
  },
): Promise<{ ok: true; survey: DiscoveryExperienceSurvey }> {
  const row = await resolveDiscoveryInvitationByToken(client, input.inviteToken);
  const normalizedCode = input.accessCode.trim().toUpperCase();
  if (!compareAccessCode(normalizedCode, row.access_code_hash)) {
    throw new Error("Codigo de acceso invalido.");
  }

  const surveyPayload = parseExperienceSurvey(input.survey);
  if (!surveyPayload) {
    throw new Error("Datos de encuesta invalidos o incompletos.");
  }

  const metaUpdate = {
    external_survey: surveyPayload,
  };

  await client.query(
    `UPDATE app_assessment.discovery_invitations SET meta = COALESCE(meta, '{}'::jsonb) || $2::jsonb, updated_at = now() WHERE invitation_id = $1::uuid`,
    [row.invitation_id, JSON.stringify(metaUpdate)],
  );

  if (row.session_id) {
    await client.query(
      `UPDATE app_assessment.discovery_sessions SET feedback_survey = $2::jsonb, updated_at = now() WHERE session_id = $1::uuid`,
      [row.session_id, JSON.stringify(surveyPayload)],
    );

    // Retroactively sync global_index if the session is complete but score is missing
    const { rows: scoreCheck } = await client.query<{ overall_score: number | null }>(
      `SELECT ta.overall_score
       FROM app_assessment.discovery_sessions ds
       LEFT JOIN app_assessment.test_attempts ta ON ta.attempt_id = ds.attempt_id
       WHERE ds.session_id = $1::uuid`,
      [row.session_id],
    );
    if (scoreCheck[0] && scoreCheck[0].overall_score === null) {
      const sessionForScore = await getDiscoverySession(client, row.session_id);
      if (sessionForScore?.attemptId) {
        await syncCompletedScores(client, sessionForScore);
      }
    }
  }

  return { ok: true, survey: surveyPayload };
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

  const gender = filters.gender?.trim();
  if (gender) {
    where.push(`ds.gender = $${params.length + 1}`);
    params.push(gender);
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
    primary_role: string;
    user_email: string;
    country: string | null;
    job_role: string | null;
    gender: string | null;
    years_experience: number | null;
    completion_percent: number;
    global_index: number | null;
    answers: DiscoveryAnswers | null;
    feedback_survey?: unknown;
    updated_at: string;
    invitation_id: string | null;
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
        u.primary_role,
        u.email::text AS user_email,
        ds.country,
        ds.job_role,
        ds.gender,
        ds.years_experience,
        ds.completion_percent,
        ta.overall_score AS global_index,
        ds.answers,
        ds.feedback_survey,
        ds.updated_at::text,
        di.invitation_id::text AS invitation_id
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      LEFT JOIN app_assessment.test_attempts ta ON ta.attempt_id = ds.attempt_id
      LEFT JOIN app_assessment.discovery_invitations di ON di.session_id = ds.session_id
      ${whereClause ? `${whereClause} AND u.primary_role IN ('lider', 'invitado')` : "WHERE u.primary_role IN ('lider', 'invitado')"}
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
    // Use stored index; fall back to computed score when test_attempts hasn't been synced yet
    const globalIndex =
      row.global_index !== null
        ? Number(row.global_index)
        : (score?.globalIndex ?? null);
    const isCompleted = globalIndex !== null;
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
      invitationId: row.invitation_id ?? null,
      participantName: row.participant_name || "Sin nombre",
      sourceType: row.primary_role === "invitado" ? ("invited" as const) : ("platform" as const),
      invitedEmail: row.primary_role === "invitado" ? row.user_email : "",
      country: row.country ?? "",
      jobRole: row.job_role ?? "",
      gender: row.gender ?? "",
      yearsExperience: coerceNumeric(row.years_experience),
      completionPercent: Number(row.completion_percent ?? 0),
      globalIndex,
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
        invitationId: invitation.invitation_id,
        participantName,
        sourceType: "invited" as const,
        invitedEmail: invitation.invited_email,
        country: profile?.country ?? "",
        jobRole: profile?.jobRole ?? "",
        gender: profile?.gender ?? "",
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
      if (gender && row.gender !== gender) return false;
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
      WHERE u.primary_role IN ('lider', 'invitado')
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
        AND u.primary_role IN ('lider', 'invitado')
      ORDER BY ds.country
    `,
  );

  const rolesResult = await client.query<{ job_role: string }>(
    `
      SELECT DISTINCT ds.job_role
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.job_role IS NOT NULL
        AND u.primary_role IN ('lider', 'invitado')
      ORDER BY ds.job_role
    `,
  );

  const gendersResult = await client.query<{ gender: string }>(
    `
      SELECT DISTINCT ds.gender
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.gender IS NOT NULL
        AND trim(ds.gender) <> ''
        AND u.primary_role IN ('lider', 'invitado')
      ORDER BY ds.gender
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
      )
        .filter((v): v is string => typeof v === "string")
        .sort((a, b) => a.localeCompare(b, "es")),
      jobRoles: Array.from(
        new Set([
          ...rolesResult.rows.map((row) => row.job_role),
          ...invitedRoles,
          ...invitedRolesFromRows,
        ]),
      )
        .filter((v): v is string => typeof v === "string")
        .sort((a, b) => a.localeCompare(b, "es")),
      genders: Array.from(
        new Set([
          ...gendersResult.rows.map((row) => row.gender),
          ...invitationResult.rows
            .map((inv) => parseInvitationExternalProgress(inv.meta)?.profile?.gender)
            .filter((g): g is NonNullable<typeof g> => typeof g === "string" && g.length > 0),
          ...invitedRows.map((row) => row.gender).filter((g): g is NonNullable<typeof g> => typeof g === "string" && g.length > 0),
        ]),
      )
        .filter((v): v is string => typeof v === "string")
        .sort((a, b) => a.localeCompare(b, "es")),
    },
  };

}

export async function getDiscoveryOverviewDetail(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
): Promise<DiscoveryOverviewDetailPayload> {
  await requireModulePermission(client, "descubrimiento", "view");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden ver detalle de resultados en Descubrimiento.");
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    throw new Error("sessionId es requerido.");
  }

  if (normalizedSessionId.startsWith("inv-")) {
    const invitationId = normalizedSessionId.slice(4);
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
        WHERE invitation_id = $1::uuid
        LIMIT 1
      `,
      [invitationId],
    );

    const invitation = rows[0];
    if (!invitation) {
      throw new Error("Resultado invitado no encontrado.");
    }

    const state =
      parseInvitationExternalProgress(invitation.meta) ??
      buildFallbackInvitationState(invitation.invited_email);
    const experienceSurvey = parseInvitationExternalSurvey(invitation.meta);

    return {
      state: {
        ...state,
        experienceSurvey,
      },
      scoring: scoreDiscoveryAnswers(state.answers),
      experienceSurvey,
      aiReports: parseInvitationStoredReports(invitation.meta),
    };
  }

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
        ds.gender,
        ds.years_experience,
        ds.feedback_survey,
        ds.ai_reports,
        ds.created_at::text,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.session_id = $1::uuid
        AND u.primary_role IN ('lider', 'invitado')
      LIMIT 1
    `,
    [normalizedSessionId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Detalle del diagnostico no encontrado.");
  }

  const session = mapDiscoverySessionRow(row);
  return {
    state: buildUserStateFromSession(session),
    scoring: scoreDiscoveryAnswers(session.answers),
    experienceSurvey: session.experienceSurvey,
    aiReports: session.aiReports,
  };
}

export async function resetDiscoveryOverviewAttemptByManager(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
): Promise<{ sessionId: string }> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden reiniciar resultados en Descubrimiento.");
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    throw new Error("sessionId es requerido.");
  }

  if (normalizedSessionId.startsWith("inv-")) {
    const invitationId = normalizedSessionId.slice(4);
    const result = await client.query<{ invitation_id: string }>(
      `
        UPDATE app_assessment.discovery_invitations
        SET
          meta = (COALESCE(meta, '{}'::jsonb) - 'external_progress' - 'external_survey' - 'ai_reports'),
          updated_at = now()
        WHERE invitation_id = $1::uuid
        RETURNING invitation_id::text
      `,
      [invitationId],
    );

    if (!result.rows[0]) {
      throw new Error("No se encontró la invitación a reiniciar.");
    }

    return { sessionId: normalizedSessionId };
  }

  const currentResult = await client.query<DiscoverySessionRow>(
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
        ds.gender,
        ds.years_experience,
        ds.feedback_survey,
        ds.created_at::text,
        ds.updated_at::text
      FROM app_assessment.discovery_sessions ds
      JOIN app_core.users u ON u.user_id = ds.user_id
      WHERE ds.session_id = $1::uuid
        AND u.primary_role IN ('lider', 'invitado')
      LIMIT 1
    `,
    [normalizedSessionId],
  );

  const current = currentResult.rows[0];
  if (!current) {
    throw new Error("Diagnóstico no encontrado para reinicio.");
  }

  const nameParts = normalizeNameParts(current.name_snapshot);
  const updatedResult = await client.query<DiscoverySessionRow>(
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
          gender = NULL,
          years_experience = NULL,
          feedback_survey = NULL,
          ai_reports = NULL,
          updated_at = now()
      WHERE session_id = $1::uuid
      RETURNING session_id::text
    `,
    [normalizedSessionId, current.name_snapshot, nameParts.firstName, nameParts.lastName],
  );

  if (!updatedResult.rows[0]) {
    throw new Error("No se pudo reiniciar el diagnóstico.");
  }

  await client.query(
    `
      UPDATE app_assessment.test_attempts
      SET status = 'in_progress',
          started_at = now(),
          completed_at = NULL,
          overall_score = NULL
      WHERE attempt_id = $1::uuid
    `,
    [current.attempt_id],
  );
  await client.query(
    `
      DELETE FROM app_assessment.test_attempt_scores
      WHERE attempt_id = $1::uuid
    `,
    [current.attempt_id],
  );
  await client.query(
    `
      DELETE FROM app_assessment.discovery_invitations
      WHERE session_id = $1::uuid
    `,
    [normalizedSessionId],
  );

  return { sessionId: normalizedSessionId };
}

export async function regenerateDiscoveryReportByManager(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
): Promise<{ sessionId: string }> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden regenerar informes en Descubrimiento.");
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    throw new Error("sessionId es requerido.");
  }

  if (normalizedSessionId.startsWith("inv-")) {
    const invitationId = normalizedSessionId.slice(4);
    await client.query(
      `
        UPDATE app_assessment.discovery_invitations
        SET
          meta = (COALESCE(meta, '{}'::jsonb) - 'ai_reports'),
          updated_at = now()
        WHERE invitation_id = $1::uuid
      `,
      [invitationId],
    );
  } else {
    await client.query(
      `
        UPDATE app_assessment.discovery_sessions
        SET
          ai_reports = NULL,
          updated_at = now()
        WHERE session_id = $1::uuid
      `,
      [normalizedSessionId],
    );
  }

  return { sessionId: normalizedSessionId };
}

export async function bulkRegenerateDiscoveryReportsByManager(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
): Promise<{ reports: DiscoveryAiReports; sessionId: string }> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden regenerar informes en Descubrimiento.");
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) throw new Error("sessionId es requerido.");

  const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, "openai");
  if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) {
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getDiscoveryFeedbackSettingsForAnalysis(client, actor);
  const analysisContext: DiscoveryAnalysisContext = {
    openAiConfig: {
      secretValue: openAiIntegration.secretValue,
      wizardData: normalizeStringRecord(openAiIntegration.wizardData),
    },
    feedbackSettings,
  };

  const isInvitation = normalizedSessionId.startsWith("inv-");
  const reports: DiscoveryAiReports = {};

  if (isInvitation) {
    const invitationId = normalizedSessionId.slice(4);
    await client.query(
      `UPDATE app_assessment.discovery_invitations
         SET meta = (COALESCE(meta, '{}'::jsonb) - 'ai_reports'), updated_at = now()
         WHERE invitation_id = $1::uuid`,
      [invitationId],
    );
    const { rows } = await client.query(
      `SELECT meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
      [invitationId],
    );
    const row = rows[0];
    if (!row) throw new Error("Invitación no encontrada.");
    const state = parseInvitationExternalProgress(row.meta) ?? buildFallbackInvitationState("");
    const scores = scoreDiscoveryAnswers(state.answers);
    const username =
      ((row.meta as Record<string, unknown>)?.participant_name as string | undefined) ||
      [state.profile?.firstName, state.profile?.lastName].filter(Boolean).join(" ") ||
      "Líder";
    const role = state.profile?.jobRole || "Líder";

    for (const pillar of DISCOVERY_REPORT_BATCH_FILTERS) {
      const result = await runContractStyleAnalysis(client, analysisContext, {
        username,
        role,
        scores,
        pillar,
        fastMode: false,
      });
      if (result.report.trim()) {
        reports[pillar] = result.report.trim();
        await persistDiscoveryInvitationAiReport(client, invitationId, pillar, result.report.trim());
      }
    }
  } else {
    await client.query(
      `UPDATE app_assessment.discovery_sessions
         SET ai_reports = NULL, updated_at = now()
         WHERE session_id = $1::uuid`,
      [normalizedSessionId],
    );
    const session = await readDiscoverySessionBySessionId(client, normalizedSessionId);
    if (!session) throw new Error("Sesión no encontrada.");
    const username =
      [session.firstName, session.lastName].filter(Boolean).join(" ").trim() ||
      session.nameSnapshot ||
      "Líder";
    const role = session.jobRole || "Líder";
    const scores = scoreDiscoveryAnswers(session.answers);

    for (const pillar of DISCOVERY_REPORT_BATCH_FILTERS) {
      const result = await runContractStyleAnalysis(client, analysisContext, {
        username,
        role,
        scores,
        pillar,
        fastMode: false,
      });
      if (result.report.trim()) {
        reports[pillar] = result.report.trim();
        await persistDiscoverySessionAiReport(client, normalizedSessionId, pillar, result.report.trim());
      }
    }
  }

  return { reports, sessionId: normalizedSessionId };
}

export async function sendDiscoveryReportEmail(
  client: PoolClient,
  actor: AuthUser,
  sessionId: string,
): Promise<{ ok: true }> {
  await requireModulePermission(client, "descubrimiento", "view");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden enviar informes por correo.");
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    throw new Error("sessionId es requerido.");
  }

  let email = "";
  let name = "";
  let publicId = "";
  let actualSessionId: string | null = null;

  if (normalizedSessionId.startsWith("inv-")) {
    const invitationId = normalizedSessionId.slice(4);
    const { rows } = await client.query(
      `SELECT invited_email, meta, session_id::text FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
      [invitationId],
    );
    const row = rows[0];
    if (!row) throw new Error("No se encontró la invitación.");
    email = row.invited_email;
    const meta = row.meta || {};
    name = (meta as any).participant_name || "Líder";
    actualSessionId = row.session_id;
  } else {
    actualSessionId = normalizedSessionId;
  }

  if (actualSessionId) {
    const session = await ensureSessionShared(client, actualSessionId);
    publicId = session.publicId || "";
    if (!email) {
      const userRow = await client.query(`SELECT email, first_name, last_name FROM app_core.users WHERE user_id = $1::uuid`, [session.userId]);
      email = userRow.rows[0]?.email || "";
      if (!name) {
        name = userRow.rows[0]?.first_name ? `${userRow.rows[0].first_name} ${userRow.rows[0].last_name}` : (session.nameSnapshot || "Líder");
      }
    }
  }

  if (!publicId) {
    throw new Error("No se pudo generar un identificador público para el informe.");
  }

  if (!email) {
    throw new Error("No se encontró un correo electrónico para enviar el informe.");
  }

  const organizationId = await resolveOrganizationIdForActor(client, actor.userId);
  const outbound = await resolveOutboundConfig(client, organizationId);
  if (!outbound?.enabled) {
    throw new Error("El servicio de correo no está configurado para esta organización.");
  }

  const baseUrl = resolveAppBaseUrl();
  const reportUrl = `${baseUrl}/descubrimiento/pdf/${publicId}`;

  const subject = "¡Ha sido generado un nuevo informe diagnóstico 4Shine! Revísalo aquí.";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1a202c;">
      <div style="background-color: #311f44; padding: 30px; text-align: center;">
        <img src="${baseUrl}/workbooks-v2/diamond.svg" alt="4Shine" style="width: 50px; margin-bottom: 10px;" />
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Lectura de Liderazgo</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #311f44; margin-top: 0;">Hola, ${name}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">
          Tu diagnóstico de liderazgo 4Shine ha sido procesado con éxito. Hemos generado un análisis profundo de tu perfil, tus impulsos actuales y tu plan de aceleración.
        </p>
        <div style="margin: 35px 0; text-align: center;">
          <a href="${reportUrl}" style="background-color: #6C55CC; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(108, 85, 204, 0.2);">
            Ver mi Informe Completo
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.5; color: #718096; border-top: 1px solid #edf2f7; padding-top: 20px;">
          Este enlace te permitirá acceder directamente a tu lectura ejecutiva interactiva y descargar la versión en PDF para tu trayectoria profesional.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
        © ${new Date().getFullYear()} 4Shine Platform. Todos los derechos reservados.
      </div>
    </div>
  `;

  await sendOutboundEmail(outbound, {
    to: email,
    subject,
    html,
    text: `Hola ${name},\n\nTu informe de liderazgo 4Shine ha sido generado. Puedes revisarlo en el siguiente enlace:\n${reportUrl}\n\nSaludos,\nEquipo 4Shine`,
  });

  return { ok: true };
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
  force?: boolean;
}

interface DiscoveryAnalysisContext {
  openAiConfig: {
    secretValue: string;
    wizardData: Record<string, string>;
  };
  feedbackSettings: DiscoveryFeedbackSettingsRecord;
}

async function requestOpenAiReport(
  context: DiscoveryAnalysisContext,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; model?: string; timeoutMs?: number; maxTokens?: number },
): Promise<string> {
  const endpoint = `${sanitizeOpenAiBaseUrl(context.openAiConfig.wizardData.baseUrl)}/chat/completions`;
  const model = options?.model?.trim() || context.openAiConfig.wizardData.model?.trim() || "gpt-4.1";
  const timeoutMs = options?.timeoutMs ?? 20000;
  const body = JSON.stringify({
    model,
    temperature: options?.temperature ?? 0.55,
    max_tokens: options?.maxTokens ?? 1800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // Retry on transient gateway errors (502, 503, 504, 529) with exponential backoff.
  const RETRYABLE = new Set([502, 503, 504, 529]);
  const MAX_ATTEMPTS = 3;
  let lastError: Error = new Error("OpenAI request failed after retries.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.openAiConfig.secretValue}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      // AbortError or network failure — retry if attempts remain
      lastError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
      if (attempt < MAX_ATTEMPTS) {
        await new Promise<void>((r) => setTimeout(r, attempt * 4000));
        continue;
      }
      throw lastError;
    }
    clearTimeout(timer);

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "error" in payload
          ? JSON.stringify((payload as { error?: unknown }).error)
          : `status ${response.status}`;
      lastError = new Error(`OpenAI request failed: ${detail}`);

      if (RETRYABLE.has(response.status) && attempt < MAX_ATTEMPTS) {
        await new Promise<void>((r) => setTimeout(r, attempt * 5000));
        continue;
      }
      throw lastError;
    }

    const report = parseOpenAiContent(payload);
    if (!report) throw new Error("OpenAI returned empty content.");
    return report;
  }

  throw lastError;
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

function countWords(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeHeadingForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const REQUIRED_SECTION_GROUPS: Array<{ name: string; alts: string[] }> = [
  { name: "perfil", alts: ["perfil"] },
  { name: "impulso", alts: ["impuls", "motiva", "fortale"] },
  { name: "plan", alts: ["plan", "aceler", "30 dia"] },
  { name: "atencion", alts: ["atencion", "critico", "lectura", "riesgo"] },
  { name: "tactica", alts: ["tactic", "interven", "accion concreta"] },
];

function getReportRejectionReason(report: string, pillar: DiscoveryReportFilter): string | null {
  const minWords = pillar === "all" ? 900 : 550;
  const wordCount = countWords(report);
  const percentMentions = (report.match(/\b\d{1,3}(?:[.,]\d+)?%/g) ?? []).length;
  const minPercentMentions = pillar === "all" ? 6 : 4;

  const normalized = normalizeHeadingForMatch(report);
  const missing = REQUIRED_SECTION_GROUPS
    .filter(({ alts }) => !alts.some((kw) => normalized.includes(kw)))
    .map(({ name }) => name);

  if (missing.length > 0) return `Faltan secciones obligatorias: ${missing.join(", ")}`;
  if (wordCount < minWords) return `Extensión insuficiente (${wordCount}/${minWords} palabras)`;
  if (percentMentions < minPercentMentions) return `Faltan menciones de porcentajes (${percentMentions}/${minPercentMentions})`;
  if (looksGenericReport(report)) return "El contenido parece genérico";
  if (hasAnyLists(report)) return "Contiene listas o viñetas prohibidas";

  return null;
}

function hasAnyLists(report: string): boolean {
  const lines = report.split("\n");
  for (const line of lines) {
    const trimmed = line.replace(/^[\s  - ​﻿]+/, "");
    if (!trimmed) continue;
    // Bullet or numbered list at start of line
    if (/^([-*•‣◦■□–—●▪]|\d+[.):]|[a-z][.)]\s)/.test(trimmed)) return true;
    // Bold-bullet at start of line: **Text**: ...
    if (/^\*\*[A-ZÀ-ÿ]/.test(trimmed) && trimmed.includes("**:")) return true;
    // Inline list: ≥2 bullet chars on the same line ("• item • item")
    if ((line.match(/[•‣◦●▪]/g) ?? []).length >= 2) return true;
    // Inline numbered list: ≥2 "N. " patterns on the same line
    if ((line.match(/\d+\.\s/g) ?? []).length >= 2) return true;
    // Inline bold-colon list: ≥2 "**label**:" on the same line
    if ((trimmed.match(/\*\*[^*\n]+\*\*\s*:/g) ?? []).length >= 2) return true;
  }
  return false;
}
function isDeepEnoughReport(report: string, pillar: DiscoveryReportFilter): boolean {
  return getReportRejectionReason(report, pillar) === null;
}

function looksGenericReport(report: string): boolean {
  const normalized = normalizeHeadingForMatch(report);
  const genericSignals = [
    "capacidad real de avance",
    "todavia con frentes que requieren metodo y consistencia",
    "competencia clave del modelo 4shine",
    "conexion profunda con el para que",
    "uso preciso del lenguaje para coordinar acciones",
    "esta combinacion explica por que",
    "motores de estabilidad y avance",
    "el punto clave ahora es",
    "si mantienes constancia semanal",
    "la regla de oro es",
    "en ambos casos",
    "capacidad instalada",
    "friccion entre intencion y ejecucion",
    "sostener conversaciones de calidad",
    "mover coordinacion con intencion",
    "traccion en algunos contextos y friccion en otros",
    "puede mejorar de forma visible en un ciclo corto",
    "no es mover todo a la vez",
    "no es hacerlo perfecto, sino hacerlo repetible",
    "el dato no deja mucho margen",
    "esa distancia es la foto del caso",
    "no partes de cero",
    "el mensaje es simple",
    "si no lo corriges",
    "el error seria",
    "la senal buena no es",
    "primer bloque (semanas 1 y 2)",
    "segundo bloque (semana 3)",
    "tercer bloque (semana 4)",
    "la regla de oro es mantener ritmo, no perfeccion",
    "mas practica aplicada y menos reflexion abstracta",
    "si la brecha es amplia, el foco debe estar",
    "si la brecha es menor, el reto pasa por sostener consistencia",
    "sin intervencion, estos frentes tienden a producir decisiones parciales",
    "con intervencion tactica semanal, el impacto esperado es",
    "define una accion semanal explicita para la brecha principal",
    "agrega una conversacion de retroalimentacion aplicada a mitad de semana",
    "usa una fortaleza alta como palanca para sostener el frente debil",
    "el objetivo del ciclo no es hacerlo perfecto, sino hacerlo repetible",
    "en 2 a 4 semanas, espera ver",
    "evidencia contextual usada",
  ];
  const signalMatches = genericSignals.filter((signal) => normalized.includes(signal)).length;

  const paragraphs = report
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith("## "));
  const shortParagraphs = paragraphs.filter((item) => countWords(item) < 24).length;

  return signalMatches >= 2 || (paragraphs.length > 0 && shortParagraphs / paragraphs.length > 0.5);
}

function listInlineSpanish(items: string[]): string {
  if (items.length === 0) return "sin datos suficientes";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function selectContextEvidence(
  contextChunks: string[],
  keywords: string[],
  maxItems = 10,
): string[] {
  const normalizedKeywords = keywords
    .map((item) => normalizeHeadingForMatch(item))
    .filter((item) => item.length >= 3);

  const lines: string[] = [];
  for (const chunk of contextChunks) {
    const parts = chunk
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    lines.push(...parts);
  }

  const ranked = lines
    .map((line) => {
      const normalizedLine = normalizeHeadingForMatch(line);
      const keywordHits = normalizedKeywords.reduce(
        (acc, keyword) => (normalizedLine.includes(keyword) ? acc + 1 : acc),
        0,
      );
      const lengthScore = line.length >= 45 && line.length <= 280 ? 1 : 0;
      return { line, score: keywordHits * 3 + lengthScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const output: string[] = [];
  const seen = new Set<string>();
  for (const item of ranked) {
    if (output.length >= maxItems) break;
    const key = item.line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item.line);
  }
  return output;
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

interface GlossaryItem {
  term: string;
  definition: string;
}

let exportsGlossaryCache: Map<string, string> | null = null;

function normalizeLookupKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveLikelyExportsDirectory(): string {
  const configured = process.env.DISCOVERY_EXPORTS_DIR?.trim();
  if (configured) return configured;
  return "/Users/andrestabla/Documents/4Shine/exports";
}

async function readExportsGlossaryMap(): Promise<Map<string, string>> {
  if (exportsGlossaryCache) return exportsGlossaryCache;

  const glossary = new Map<string, string>();
  for (const [term, definition] of Object.entries(COMP_DEFINITIONS)) {
    glossary.set(normalizeLookupKey(term), definition);
  }

  const exportsDir = resolveLikelyExportsDirectory();
  try {
    const entries = await fs.readdir(exportsDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /\.(json|csv|txt|md)$/i.test(name));

    for (const fileName of files) {
      const absolutePath = path.join(exportsDir, fileName);
      let content = "";
      try {
        content = await fs.readFile(absolutePath, "utf8");
      } catch {
        continue;
      }
      if (!content.trim()) continue;

      if (/\.json$/i.test(fileName)) {
        try {
          const parsed = JSON.parse(content) as unknown;
          const rows = Array.isArray(parsed) ? parsed : [];
          for (const row of rows) {
            if (!row || typeof row !== "object") continue;
            const current = row as Record<string, unknown>;
            const term = typeof current.term === "string" ? current.term : "";
            const definition =
              typeof current.definition === "string"
                ? current.definition
                : typeof current.meaning === "string"
                  ? current.meaning
                  : "";
            if (!term.trim() || !definition.trim()) continue;
            glossary.set(normalizeLookupKey(term), definition.trim());
          }
        } catch {
          continue;
        }
      } else if (/\.csv$/i.test(fileName)) {
        const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        for (const line of lines.slice(1)) {
          const [rawTerm, ...rest] = line.split(",");
          const term = (rawTerm ?? "").trim().replace(/^"|"$/g, "");
          const definition = rest.join(",").trim().replace(/^"|"$/g, "");
          if (!term || !definition) continue;
          glossary.set(normalizeLookupKey(term), definition);
        }
      } else {
        const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        for (const line of lines) {
          const separator = line.includes(":") ? ":" : line.includes(" - ") ? " - " : "";
          if (!separator) continue;
          const [left, ...rest] = line.split(separator);
          const term = left.trim();
          const definition = rest.join(separator).trim();
          if (!term || !definition) continue;
          glossary.set(normalizeLookupKey(term), definition);
        }
      }
    }
  } catch {
    // If exports folder does not exist, fallback to COMP_DEFINITIONS only.
  }

  exportsGlossaryCache = glossary;
  return glossary;
}

async function resolveGlossaryTermsExact(
  targetGapNames: string[],
): Promise<GlossaryItem[]> {
  const glossary = await readExportsGlossaryMap();
  const resolved: GlossaryItem[] = [];
  for (const term of targetGapNames) {
    const definition = glossary.get(normalizeLookupKey(term));
    if (!definition) continue;
    resolved.push({ term, definition });
  }
  return resolved;
}

async function resolveResourcesRuleBased(
  client: PoolClient,
  targetGapNames: string[],
  pillar: DiscoveryReportFilter,
): Promise<DiscoveryRecommendedResource[]> {
  const normalized = targetGapNames.map((item) => item.trim().toLowerCase()).filter(Boolean);
  const pillarVariants = mapPillarMetadataVariants(pillar);

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
          lower(COALESCE(ci.competency_metadata->>'competency', '')) = ANY($1::text[])
          OR (
            cardinality($2::text[]) > 0
            AND lower(COALESCE(ci.competency_metadata->>'pillar', '')) = ANY($2::text[])
          )
        )
      ORDER BY ci.is_recommended DESC, ci.published_at DESC NULLS LAST, ci.created_at DESC
      LIMIT 4
    `,
    [normalized, pillarVariants],
  );

  return rows.map((row) => ({
    title: row.title,
    contentType: row.content_type,
    category: row.category,
    competency: row.competency_metadata?.competency ?? row.competency_metadata?.component ?? null,
    pillar: row.competency_metadata?.pillar ?? null,
  }));
}

function normalizeTextDocumentSnippet(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4800);
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xA;/g, "\n");
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|td|th)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

async function extractDocxText(input: Uint8Array): Promise<string | null> {
  try {
    const zip = await JSZip.loadAsync(input);
    const documentXml = await zip.file("word/document.xml")?.async("text");
    if (!documentXml) return null;

    const withBreaks = documentXml
      .replace(/<w:br\s*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n");
    const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
    const decoded = decodeXmlEntities(withoutTags);
    const normalized = normalizeTextDocumentSnippet(decoded);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function extractSpreadsheetText(input: Uint8Array): string | null {
  try {
    const workbook = XLSX.read(input, { type: "array", cellDates: false });
    const chunks: string[] = [];
    for (const sheetName of workbook.SheetNames.slice(0, 4)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
      });
      const normalizedRows = rows
        .slice(0, 120)
        .map((row) =>
          row
            .map((cell) => (cell === null || cell === undefined ? "" : String(cell).trim()))
            .filter(Boolean)
            .join(" | "),
        )
        .filter(Boolean);
      if (normalizedRows.length > 0) {
        chunks.push(`Hoja: ${sheetName}\n${normalizedRows.join("\n")}`);
      }
    }

    if (chunks.length === 0) return null;
    const normalized = normalizeTextDocumentSnippet(chunks.join("\n\n"));
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

function parseContentType(value: string | null): string {
  if (!value) return "";
  return value.split(";")[0]?.trim().toLowerCase() || "";
}

function fileExtensionFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const dot = path.lastIndexOf(".");
    if (dot < 0) return "";
    return path.slice(dot + 1);
  } catch {
    return "";
  }
}

async function extractContextTextFromResponse(response: Response, sourceUrl: string): Promise<string | null> {
  const raw = new Uint8Array(await response.arrayBuffer());
  if (raw.length === 0) return null;

  const contentType = parseContentType(response.headers.get("content-type"));
  const extension = fileExtensionFromUrl(sourceUrl);
  const textDecoder = new TextDecoder("utf-8");

  const textLikeByType =
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("csv") ||
    contentType.includes("html") ||
    contentType.includes("markdown");
  const textLikeByExt = ["txt", "md", "markdown", "csv", "json", "xml", "html", "htm"].includes(
    extension,
  );

  if (
    contentType.includes("wordprocessingml.document") ||
    contentType.includes("application/msword") ||
    extension === "docx" ||
    extension === "doc"
  ) {
    return extractDocxText(raw);
  }

  if (
    contentType.includes("spreadsheetml.sheet") ||
    contentType.includes("application/vnd.ms-excel") ||
    extension === "xls" ||
    extension === "xlsx" ||
    extension === "csv"
  ) {
    return extractSpreadsheetText(raw);
  }

  if (textLikeByType || textLikeByExt) {
    const rawText = textDecoder.decode(raw);
    const cleaned = contentType.includes("html") || extension === "html" || extension === "htm"
      ? stripHtml(rawText)
      : rawText;
    const decoded = decodeXmlEntities(cleaned);
    const snippet = normalizeTextDocumentSnippet(decoded);
    return snippet.length > 0 ? snippet : null;
  }

  return null;
}

async function fetchContextDocumentSnippet(
  url: string,
  options?: { timeoutMs?: number },
): Promise<string | null> {
  const timeoutMs = Math.max(1200, options?.timeoutMs ?? 5500);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    return extractContextTextFromResponse(response, url);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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

async function runDiscoveryAnalysisWithContext(
  client: PoolClient,
  input: DiscoveryAnalysisInput,
  context: DiscoveryAnalysisContext,
): Promise<{ report: string; source: "ai" | "fallback" }> {
  const fallback = input.fallbackReport?.trim() || "";
  const scores = input.scores;
  if (!scores?.pillarMetrics) {
    throw new Error("Invalid scores payload");
  }

  const feedbackSettings = context.feedbackSettings;
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

  const evidenceKeywords = [
    ...targetGapNames,
    ...(pillar === "all" ? globalStrengths : targetStrengths).map((item) => item.name),
    toPillarDisplayName(pillar),
    "liderazgo",
    "comportamiento",
    "equipo",
    "cultura",
    "estrategia",
  ];
  const contextEvidence = selectContextEvidence(contextChunks, evidenceKeywords, 12);

  const contextBlock = [
    "Contexto metodológico de competencias (base 4Shine):",
    glossaryLines.join("\n") || "- Sin glosario específico para estas brechas.",
    "",
    "Conceptos de recursos internos recomendados (no citar nombres de recursos):",
    resourceLines.join("\n") || "- Sin recursos publicados específicos para estas brechas.",
    "",
    "Fragmentos recuperados de documentos cargados por el administrador:",
    contextChunks.join("\n\n") || "- No se pudo extraer texto de los documentos en esta ejecución.",
    "",
    "Evidencia contextual priorizada para sustentar inferencias:",
    contextEvidence.map((line) => `- ${line}`).join("\n") || "- Sin evidencia contextual priorizada.",
    unresolvedContextNames.length
      ? `Documentos sin extracción de texto: ${unresolvedContextNames.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const editorialBlock = [
    "Instrucciones editoriales obligatorias:",
    "- Escribe en español con lenguaje cercano, simple y directo. Que suene a una conversación honesta, no a un informe corporativo.",
    "- Evita tecnicismos, jerga académica y frases hechas típicas de inteligencia artificial.",
    "- PROHIBICIÓN DE CIFRAS EN EL TEXTO: No cites porcentajes ni puntuaciones. Los datos son insumo para tu análisis; escribe lo que significan para el liderazgo de esta persona, no los números. Usa adjetivos cualitativos: marcado, amplio, sólido, moderado, incipiente.",
    "- Evita frases que revelan que lees una tabla: 'tu índice de X%', 'alcanzas un Y% en', 'la brecha de Z puntos'. Describe el fenómeno, no la métrica.",
    "- Habla siempre en segunda persona del singular ('tú', 'tu', 'te'). Conecta directamente con la persona.",
    "- No inventes datos. Fundamenta cada conclusión en los resultados del caso.",
    "- Entrega análisis concreto, accionable y específico para esta persona.",
    "- Usa títulos markdown de nivel 2 (##) con los nombres exactos solicitados.",
    `- La primera frase del informe debe iniciar exactamente con: "${input.username}, tu perfil de liderazgo".`,
  ].join("\n");

  const commonUserContext = [
    `Líder: ${input.username} (${input.role || "rol no especificado"})`,
    `Tratamiento directo obligatorio: empieza el informe con "${input.username}, tu perfil de liderazgo".`,
    `Vista solicitada: ${toPillarDisplayName(pillar)}`,
    `Índice global: ${scores.globalIndex}%`,
    "Resultados por pilar (0-100):",
    `- Within: ${scores.pillarMetrics.within.total}% (Likert ${scores.pillarMetrics.within.likert}%, SJT ${scores.pillarMetrics.within.sjt}%)`,
    `- Out: ${scores.pillarMetrics.out.total}% (Likert ${scores.pillarMetrics.out.likert}%, SJT ${scores.pillarMetrics.out.sjt}%)`,
    `- Up: ${scores.pillarMetrics.up.total}% (Likert ${scores.pillarMetrics.up.likert}%, SJT ${scores.pillarMetrics.up.sjt}%)`,
    `- Beyond: ${scores.pillarMetrics.beyond.total}% (Likert ${scores.pillarMetrics.beyond.likert}%, SJT ${scores.pillarMetrics.beyond.sjt}%)`,
    "",
    `Fortalezas observables: ${listInlineSpanish((pillar === "all" ? globalStrengths : targetStrengths).map((item) => item.name))}`,
    `Brechas prioritarias: ${listInlineSpanish(targetGapNames)}`,
    "",
    "Evidencia numérica por competencias objetivo (escala 1 a 5):",
    ...targetGaps.map((item, index) => {
      const mapped = Math.round(((item.score - 1) / 4) * 100);
      return `- Brecha ${index + 1}: ${item.name} (${item.score}/5, equivalente ${mapped}%)`;
    }),
    ...targetStrengths.slice(0, 3).map((item, index) => {
      const mapped = Math.round(((item.score - 1) / 4) * 100);
      return `- Fortaleza ${index + 1}: ${item.name} (${item.score}/5, equivalente ${mapped}%)`;
    }),
    "",
    "Brecha de percepción por pilar (autopercepción - juicio situacional):",
    `- Within: ${scores.pillarMetrics.within.likert - scores.pillarMetrics.within.sjt} puntos`,
    `- Out: ${scores.pillarMetrics.out.likert - scores.pillarMetrics.out.sjt} puntos`,
    `- Up: ${scores.pillarMetrics.up.likert - scores.pillarMetrics.up.sjt} puntos`,
    `- Beyond: ${scores.pillarMetrics.beyond.likert - scores.pillarMetrics.beyond.sjt} puntos`,
  ].join("\n");

  const globalPrompt = [
    feedbackSettings.aiFeedbackInstructions.trim(),
    "",
    editorialBlock,
    "",
    "Reglas anti-genérico obligatorias:",
    "- No escribas definiciones sueltas tipo 'Competencia: descripción corta'.",
    "- Cada sección debe tener mínimo 100 palabras en prosa continua.",
    "- Prohibido usar viñetas (bullet points) o listas numeradas. Usa exclusivamente párrafos narrativos.",
    "- Conecta cada fortaleza o brecha con un impacto real y concreto en la forma de liderar de esta persona.",
    "- No uses cifras en el texto; interpreta los datos internamente y escribe lo que significan, no los números.",
    "- Debes inferir causas y consecuencias específicas para este caso, no frases universales.",
    "",
    "Objetivo:",
    "Genera una lectura profunda y organizada para la vista global. Conecta fortalezas, brechas y tensiones reales del liderazgo con lenguaje cercano, simple y retador. Habla directamente con la persona.",
    "",
    "Estructura obligatoria:",
    "## Tu perfil estratégico",
    "Describe cómo lidera esta persona hoy: qué la caracteriza, qué tensiones carga y qué distancia hay entre cómo se ve a sí misma y cómo actúa bajo presión. Mínimo 200 palabras en prosa pura.",
    "## Lo que hoy te impulsa",
    "Conecta con las fortalezas reales: en qué situaciones concretas se expresan, por qué funcionan y qué hace que sean sostenibles. Mínimo 150 palabras en prosa pura.",
    "## Plan de aceleración de 30 días",
    "Propón 3 acciones concretas y ligadas a este caso. Describe el cómo y el para qué de cada una con precisión. Mínimo 150 palabras en prosa pura.",
    "## Lectura del pilar",
    "Explica cómo se relacionan los cuatro pilares entre sí en este caso y qué revela esa combinación. Mínimo 100 palabras.",
    "## Puntos críticos de atención",
    "Describe qué pasa si no se interviene: consecuencias concretas para el equipo y para el propio líder. Mínimo 100 palabras en prosa pura.",
    "## Intervención táctica",
    "Propón micro-hábitos y conversaciones específicas ligadas a las brechas de este caso. Mínimo 100 palabras en prosa pura.",
    "## Señal de progreso",
    "Cierra describiendo qué cambiaría en el día a día cuando las intervenciones funcionen. Mínimo 80 palabras.",
    "",
    contextBlock,
  ].join("\n");

  const pillarPrompt = [
    feedbackSettings.aiFeedbackInstructions.trim(),
    "",
    editorialBlock,
    "",
    "Reglas anti-genérico obligatorias:",
    "- No escribas definiciones sueltas tipo 'Competencia: descripción corta'.",
    "- Cada sección debe tener mínimo 80 palabras en prosa continua.",
    "- No uses cifras en el texto; interpreta los datos internamente y escribe lo que significan, no los números.",
    "- Debes inferir causas y consecuencias específicas para este caso y este pilar, no frases universales.",
    "",
    `Objetivo: generar un diagnóstico profundo del pilar ${toPillarDisplayName(pillar)} con lenguaje cercano, directo y concreto. Que la persona sienta que esto fue escrito para ella.`,
    "",
    "Estructura obligatoria:",
    "## Tu perfil estratégico",
    "Describe cómo este pilar condiciona su liderazgo general y qué tensión específica revela en este caso.",
    "## Lo que hoy te impulsa",
    "Conecta con las fortalezas del pilar: en qué situaciones aparecen y por qué funcionan para esta persona.",
    "## Plan de aceleración de 30 días",
    "Propón 2 o 3 acciones concretas ligadas a las brechas de este pilar y este caso.",
    "## Lectura del pilar",
    "Explica qué revela la distancia entre cómo se percibe y cómo actúa en este pilar, y qué consecuencias tiene.",
    "## Puntos críticos de atención",
    "Describe las consecuencias concretas si no se interviene: qué pasa en el equipo y en el propio líder.",
    "## Intervención táctica",
    "Propón acciones semanales específicas y ligadas a las brechas concretas de este caso.",
    "## Señal de progreso",
    "Describe qué cambiaría en el día a día cuando la intervención funcione.",
    "",
    contextBlock,
  ].join("\n");

  const systemPrompt = pillar === "all" ? globalPrompt : pillarPrompt;

  const userPrompt = [
    commonUserContext,
    "",
    pillar === "all"
      ? "Solicito una lectura global profunda de liderazgo, en prosa clara y organizada."
      : `Solicito un diagnóstico profundo del pilar ${toPillarDisplayName(pillar)} con foco práctico.`,
  ].join("\n");

  try {
    let report = await requestOpenAiReport(context, systemPrompt, userPrompt, {
      temperature: 0.58,
      timeoutMs: pillar === "all" ? 45000 : 30000,
      maxTokens: pillar === "all" ? 1300 : 1000,
    });
    let attempts = 1;
    while (!isDeepEnoughReport(report, pillar) && attempts < 4) {
      const refinementPrompt = [
        `Iteración de mejora ${attempts}. El borrador sigue insuficiente en profundidad analítica o incumple las reglas de estilo.`,
        "REQUISITOS CRÍTICOS:",
        "- NO USES VIÑETAS O LISTAS en Perfil, Impulso, Plan, Atención o Táctica. Usa párrafos narrativos extensos.",
        "- Aumenta la profundidad del análisis. Conecta los datos con el impacto en el negocio.",
        "- Asegura que el informe sea extenso (mínimo 850 palabras para global, 500 para pilar).",
        "",
        "Borrador actual a superar:",
        report,
      ].join("\n");
      report = await requestOpenAiReport(context, systemPrompt, refinementPrompt, {
        temperature: 0.65 + (attempts * 0.05), // Increase temperature on each retry
        timeoutMs: pillar === "all" ? 50000 : 35000,
        maxTokens: pillar === "all" ? 1800 : 1200,
      });
      attempts += 1;
    }

    return { report, source: "ai" };
  } catch {
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("No se pudo generar el análisis con IA y no existe fallback.");
  }
}

interface DiscoveryAnalyzeContractInput {
  sessionId?: string;
  username: string;
  role: string;
  scores: DiscoveryScoreResult;
  pillar: DiscoveryReportFilter;
  fallbackReport?: string;
  fastMode?: boolean;
  force?: boolean;
}

const DISCOVERY_REPORT_BATCH_FILTERS: DiscoveryReportFilter[] = [
  "all",
  "within",
  "out",
  "up",
  "beyond",
];

async function withDiscoveryAdvisoryLock<T>(
  client: PoolClient,
  scope: "session" | "invitation",
  entityId: string,
  task: () => Promise<T>,
): Promise<T> {
  await client.query(
    `SELECT pg_advisory_lock(hashtext($1), hashtext($2))`,
    [`discovery-ai-${scope}`, entityId],
  );
  try {
    return await task();
  } finally {
    await client.query(
      `SELECT pg_advisory_unlock(hashtext($1), hashtext($2))`,
      [`discovery-ai-${scope}`, entityId],
    );
  }
}

async function persistDiscoverySessionAiReport(
  client: PoolClient,
  sessionId: string,
  pillar: DiscoveryReportFilter,
  report: string,
): Promise<void> {
  await client.query(
    `
      UPDATE app_assessment.discovery_sessions
      SET
        ai_reports = (
          CASE
            WHEN COALESCE(ai_reports->>'_version', '0') = $2::text THEN COALESCE(ai_reports, '{}'::jsonb)
            ELSE '{}'::jsonb
          END
        ) || jsonb_build_object('_version', $2::int, $3::text, $4::text),
        updated_at = now()
      WHERE session_id = $1::uuid
    `,
    [sessionId, CURRENT_DISCOVERY_AI_REPORT_VERSION, pillar, report],
  );
}

async function persistDiscoveryInvitationAiReport(
  client: PoolClient,
  invitationId: string,
  pillar: DiscoveryReportFilter,
  report: string,
): Promise<void> {
  await client.query(
    `
      UPDATE app_assessment.discovery_invitations
      SET
        meta = jsonb_set(
          COALESCE(meta, '{}'::jsonb),
          '{ai_reports}',
          (
            CASE
              WHEN COALESCE(meta->'ai_reports'->>'_version', '0') = $2::text THEN COALESCE(meta->'ai_reports', '{}'::jsonb)
              ELSE '{}'::jsonb
            END
          ) || jsonb_build_object('_version', $2::int, $3::text, $4::text),
          true
        ),
        updated_at = now()
      WHERE invitation_id = $1::uuid
    `,
    [invitationId, CURRENT_DISCOVERY_AI_REPORT_VERSION, pillar, report],
  );
}

interface InvitationStoredReports {
  all?: string;
  within?: string;
  out?: string;
  up?: string;
  beyond?: string;
}

function parseInvitationStoredReports(meta: unknown): InvitationStoredReports {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const record = meta as Record<string, unknown>;
  const raw = record.ai_reports;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const data = raw as Record<string, unknown>;
  if (Number(data._version ?? 0) !== CURRENT_DISCOVERY_AI_REPORT_VERSION) {
    return {};
  }
  return {
    all: typeof data.all === "string" ? data.all : undefined,
    within: typeof data.within === "string" ? data.within : undefined,
    out: typeof data.out === "string" ? data.out : undefined,
    up: typeof data.up === "string" ? data.up : undefined,
    beyond: typeof data.beyond === "string" ? data.beyond : undefined,
  };
}

function toPillarFriendlyLabel(pillar: DiscoveryReportFilter): string {
  const mapping: Record<DiscoveryReportFilter, string> = {
    all: "Visión general",
    within: "Shine within (autoliderazgo)",
    out: "Shine out (influencia y relaciones)",
    up: "Shine up (estrategia y negocio)",
    beyond: "Shine beyond (cultura y legado)",
  };
  return mapping[pillar];
}

function buildContractPrompts(input: {
  username: string;
  role: string;
  pillar: DiscoveryReportFilter;
  scores: DiscoveryScoreResult;
  targetGaps: Array<{ name: string; score: number }>;
  targetStrengths: Array<{ name: string; score: number }>;
  glossary: GlossaryItem[];
  resources: DiscoveryRecommendedResource[];
  feedbackInstructions: string;
  contextChunks: string[];
  contextEvidence: string[];
  unresolvedContextNames: string[];
}): { systemPrompt: string; userPrompt: string } {
  const {
    username,
    role,
    pillar,
    scores,
    targetGaps,
    targetStrengths,
    glossary,
    resources,
    feedbackInstructions,
    contextChunks,
    contextEvidence,
    unresolvedContextNames,
  } = input;

  const glossaryString = glossary.length
    ? glossary.map((item) => `- **${item.term}**: ${item.definition}`).join("\n")
    : "- Sin coincidencias exactas en glosario para estas brechas.";

  const resourceString = resources.length
    ? resources
      .map(
        (item) =>
          `- ${item.title} (${item.contentType}) [Enfocado en: ${item.competency ?? "General"} / Pilar: ${item.pillar ?? "General"}]`,
      )
      .join("\n")
    : "- Sin recursos publicados específicos para estas brechas.";

  const globalContextBlock = [
    "Contexto metodológico recuperado para este caso:",
    "### Glosario objetivo",
    glossaryString,
    "",
    "### Recursos recomendados (usar ideas, no nombres)",
    resourceString,
    "",
    "### Fragmentos de documentos cargados en configuración RAG",
    contextChunks.join("\n\n") || "- No se pudo extraer texto de los documentos cargados en esta ejecución.",
    "",
    "### Evidencia priorizada para sostener inferencias",
    contextEvidence.map((line) => `- ${line}`).join("\n") || "- Sin evidencia documental priorizada.",
    unresolvedContextNames.length
      ? `Documentos sin extracción de texto: ${unresolvedContextNames.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const pillarContextBlock = [
    "Contexto metodológico recuperado para este caso:",
    "### Glosario objetivo",
    glossaryString,
    "",
    "### Evidencia priorizada para sostener inferencias",
    contextEvidence.map((line) => `- ${line}`).join("\n") || "- Sin evidencia documental priorizada.",
  ]
    .filter(Boolean)
    .join("\n");
  const metric = pillar === "all" ? null : scores.pillarMetrics[pillar];

  const globalUserContext = [
    `Líder: ${username} (${role})`,
    `Tratamiento directo obligatorio: empieza el informe con "${username}, tu perfil de liderazgo".`,
    `Vista solicitada: ${toPillarFriendlyLabel(pillar)}`,
    `Firma única del caso: G${scores.globalIndex}-W${scores.pillarMetrics.within.total}-O${scores.pillarMetrics.out.total}-U${scores.pillarMetrics.up.total}-B${scores.pillarMetrics.beyond.total} | Brechas ${targetGaps.map((item) => item.name).join(" / ")} | Fortalezas ${targetStrengths.map((item) => item.name).join(" / ")}`,
    `Índice de madurez global: ${scores.globalIndex}%`,
    "Resultados por pilar (0-100):",
    `- Within: ${scores.pillarMetrics.within.total}% (Likert ${scores.pillarMetrics.within.likert}%, SJT ${scores.pillarMetrics.within.sjt}%)`,
    `- Out: ${scores.pillarMetrics.out.total}% (Likert ${scores.pillarMetrics.out.likert}%, SJT ${scores.pillarMetrics.out.sjt}%)`,
    `- Up: ${scores.pillarMetrics.up.total}% (Likert ${scores.pillarMetrics.up.likert}%, SJT ${scores.pillarMetrics.up.sjt}%)`,
    `- Beyond: ${scores.pillarMetrics.beyond.total}% (Likert ${scores.pillarMetrics.beyond.likert}%, SJT ${scores.pillarMetrics.beyond.sjt}%)`,
    "",
    "Brechas críticas (escala 1-5):",
    ...targetGaps.map((item, index) => {
      const mapped = Math.round(((item.score - 1) / 4) * 100);
      return `- Brecha ${index + 1}: ${item.name} (${item.score}/5, equivalente ${mapped}%)`;
    }),
    "",
    "Fortalezas observables (escala 1-5):",
    ...targetStrengths.map((item, index) => {
      const mapped = Math.round(((item.score - 1) / 4) * 100);
      return `- Fortaleza ${index + 1}: ${item.name} (${item.score}/5, equivalente ${mapped}%)`;
    }),
    "",
    "Brecha de percepción por pilar (autopercepción - juicio situacional):",
    `- Within: ${scores.pillarMetrics.within.likert - scores.pillarMetrics.within.sjt} puntos`,
    `- Out: ${scores.pillarMetrics.out.likert - scores.pillarMetrics.out.sjt} puntos`,
    `- Up: ${scores.pillarMetrics.up.likert - scores.pillarMetrics.up.sjt} puntos`,
    `- Beyond: ${scores.pillarMetrics.beyond.likert - scores.pillarMetrics.beyond.sjt} puntos`,
  ].join("\n");

  const pillarUserContext = [
    `Líder: ${username} (${role})`,
    `Tratamiento directo obligatorio: empieza el informe con "${username}, tu perfil de liderazgo".`,
    `Vista solicitada: ${toPillarFriendlyLabel(pillar)}`,
    `Firma única del caso: G${scores.globalIndex}-W${scores.pillarMetrics.within.total}-O${scores.pillarMetrics.out.total}-U${scores.pillarMetrics.up.total}-B${scores.pillarMetrics.beyond.total} | Brechas ${targetGaps.map((item) => item.name).join(" / ")} | Fortalezas ${targetStrengths.map((item) => item.name).join(" / ")}`,
    `Panorama global: Within ${scores.pillarMetrics.within.total}%, Out ${scores.pillarMetrics.out.total}%, Up ${scores.pillarMetrics.up.total}%, Beyond ${scores.pillarMetrics.beyond.total}%, índice global ${scores.globalIndex}%.`,
    `Resultado del pilar solicitado: ${metric?.total ?? 0}%`,
    `Desglose del pilar: autopercepción ${metric?.likert ?? 0}%, juicio situacional ${metric?.sjt ?? 0}%, brecha ${(metric?.likert ?? 0) - (metric?.sjt ?? 0)} puntos.`,
    "Fortalezas dominantes del pilar:",
    ...targetStrengths.map((item, index) => `- Fortaleza ${index + 1}: ${item.name} (${item.score}/5)`),
    "Brechas dominantes del pilar:",
    ...targetGaps.map((item, index) => `- Brecha ${index + 1}: ${item.name} (${item.score}/5)`),
  ].join("\n");

  const editorialRules = [
    "Reglas anti-genérico obligatorias:",
    "- Escribe en prosa natural, cercana y formal.",
    "- Mantén un tono propositivo, positivo, útil y con tacto.",
    "- Formula el mensaje desde lo que la persona puede activar, consolidar y convertir en hábito.",
    "- Evita negaciones repetidas y evita construir el párrafo desde el contraste 'tienes algo bueno, pero...'.",
    "- Evita frases de plantilla, frases hechas, mensajes de cajón y definiciones sueltas.",
    "- No uses lenguaje técnico innecesario ni tono académico.",
    "- Sé claro, concreto y profundo sin sonar agresivo.",
    "- No inventes información; usa solo datos del caso y contexto recuperado.",
    "- Cada sección debe incluir competencias concretas y cifras del caso.",
    "- Debes explicar causa probable, consecuencia observable y acción sugerida.",
    "- No nombres autores ni títulos de recursos, solo ideas aplicables.",
    "- Si una frase podría servirle igual a otro usuario, reescríbela hasta que quede específica para esta combinación de datos.",
    "- Evita expresiones vacías como 'apalancar', 'potencial por desbloquear', 'liderazgo en evolución', 'sostener conversaciones de calidad' o equivalentes.",
    "- También están prohibidas fórmulas como 'esta combinación explica por qué', 'el punto clave ahora es', 'motores de estabilidad y avance', 'la regla de oro es', 'en ambos casos' y cualquier otra frase que suene a plantilla.",
    "- También están prohibidas fórmulas como 'el dato no deja mucho margen', 'esa distancia es la foto del caso', 'no partes de cero', 'el mensaje es simple', 'si no lo corriges', 'el error sería' y equivalentes.",
    "- También están prohibidas fórmulas como 'primer bloque', 'segundo bloque', 'tercer bloque', 'más práctica aplicada y menos reflexión abstracta', 'si la brecha es amplia', 'si la brecha es menor' y cualquier secuencia didáctica repetible.",
    "- Evita marcas morfosintácticas típicas de texto IA: paralelismos rígidos, cierre sentencioso repetido y estructuras demasiado simétricas entre secciones.",
    "- Habla como si le estuvieras diciendo la verdad útil a la persona, no como si redactaras un informe corporativo genérico.",
    "- No incluyas bloques de evidencia, listados de fuentes, anexos metodológicos ni texto tipo 'Evidencia contextual usada'.",
    "- PROHIBICIÓN DE CIFRAS EN EL TEXTO: No cites porcentajes ni puntuaciones en el texto final. Los datos son insumo para tu análisis; lo que escribes debe ser la interpretación, no los números. Evita frases como 'tu índice de X%', 'alcanzas un Y% en', 'la brecha de Z puntos'. Usa adjetivos cualitativos: marcado, amplio, sólido, moderado, incipiente.",
    "- El lenguaje debe ser simple, cercano y directo. Que se sienta como una conversación honesta con la persona, no como un dictamen técnico.",
    "- PROHIBICIÓN ABSOLUTA DE FORMATO LISTA: Está terminantemente prohibido el uso de cualquier elemento de lista. Esto incluye:",
    "  * Guiones al inicio de línea: '- texto'",
    "  * Asteriscos al inicio de línea: '* texto'",
    "  * Numeración al inicio: '1. texto', '2. texto'",
    "  * Patrón de definición en negrita: '**Competencia**: definición corta.'",
    "  El único formato permitido son PÁRRAFOS NARRATIVOS CONTINUOS con mínimo 3-4 oraciones cada uno.",
    "- EJEMPLO DE LO QUE ESTÁ PROHIBIDO: '- **Autoconciencia emocional**: Reconocimiento en tiempo real...'",
    "- EJEMPLO DE LO QUE ES CORRECTO: 'Tu autoconciencia emocional muestra una distancia importante entre cómo te ves y cómo reaccionas bajo presión. Esa brecha se nota cuando...'",
    `- La primera frase del informe debe iniciar exactamente con: "${username}, tu perfil de liderazgo".`,
  ].join("\n");

  if (pillar === "all") {
    const systemPrompt = `
${feedbackInstructions.trim()}

${editorialRules}

Restricciones de profundidad (ESTRICTAS):
- Cada sección debe tener mínimo 130 palabras de análisis denso.
- El informe total debe superar las 900 palabras.
- PROHIBIDO USAR LISTAS O VIÑETAS. Usa solo párrafos narrativos continuos.

TÍTULOS DE SECCIÓN EXACTOS — copia estos títulos exactamente, sin cambiar ni un carácter, ni mayúsculas, ni acentos:
## Tu perfil estratégico
## Lo que hoy te impulsa
## Plan de aceleración de 30 días
## Lectura del pilar
## Puntos críticos de atención
## Intervención táctica
## Señal de progreso

${globalContextBlock}
`.trim();

    const userPrompt = `
${globalUserContext}

	Solicitud puntual:
	- Quiero un análisis profundo y organizado, con lenguaje cercano, directo y sin adornos.
	- Prioriza las brechas más bajas y explícame su efecto real en liderazgo.
	- Propón acciones de 30 días con señales observables de avance.
	- No uses frases hechas ni formulaciones que podrían repetirse en otro caso.
	- Quiero sentir que esto fue escrito para esta persona exacta y no para un perfil genérico.
	- Mantén un tono formal y cercano, muy propositivo y positivo, con tacto para dar feedback.
	- Evita redactar desde la negación; formula oportunidades, palancas y próximos pasos.
	`.trim();

    return { systemPrompt, userPrompt };
  }

  const systemPrompt = `
${feedbackInstructions.trim()}

${editorialRules}

Restricciones de profundidad (ESTRICTAS):
- Cada sección debe tener mínimo 85 palabras de análisis denso.
- El informe total debe superar las 550 palabras.
- PROHIBIDO USAR LISTAS O VIÑETAS. Usa solo párrafos narrativos continuos.

TÍTULOS DE SECCIÓN EXACTOS — copia estos títulos exactamente, sin cambiar ni un carácter, ni mayúsculas, ni acentos:
## Tu perfil estratégico
## Lo que hoy te impulsa
## Plan de aceleración de 30 días
## Lectura del pilar
## Puntos críticos de atención
## Intervención táctica
## Señal de progreso

${pillarContextBlock}
`.trim();

  const userPrompt = `
${pillarUserContext}

	Solicitud puntual:
	- Diagnóstico profundo del pilar ${toPillarFriendlyLabel(pillar)}.
	- Causas probables, riesgos sistémicos e intervención táctica semanal.
	- Lenguaje humano, claro, directo y específico para este caso.
	- No uses frases hechas ni lenguaje corporativo genérico.
	- Quiero sentir que este texto no podría reutilizarse para otro usuario.
	- Mantén un tono formal y cercano, muy propositivo y positivo, con tacto para dar feedback.
	- Evita redactar desde la negación; formula oportunidades, palancas y próximos pasos.
	- No escribas un plan por bloques repetidos; quiero acciones concretas ligadas a este caso.
	- No cierres con anexos, evidencia contextual ni listas metodológicas.
	- Explica cómo estas fortalezas concretas pueden ayudar a mover estas brechas concretas en situaciones reales.
	`.trim();

  return { systemPrompt, userPrompt };
}

async function runContractStyleAnalysis(
  client: PoolClient,
  context: DiscoveryAnalysisContext,
  input: DiscoveryAnalyzeContractInput,
): Promise<{ report: string; source: "ai" | "fallback" }> {
  if (!input.scores?.pillarMetrics) {
    throw new Error("Invalid scores payload");
  }

  const compList = [...(input.scores.compList ?? [])];
  const pillar = input.pillar ?? "all";
  const fastMode = Boolean(input.fastMode);
  const sourcePool = pillar === "all" ? compList : compList.filter((item) => item.pillar === pillar);
  const sorted = [...sourcePool].sort((a, b) => a.score - b.score);

  const targetGaps = sorted.slice(0, 3).map((item) => ({ name: item.name, score: item.score }));
  const targetStrengths = [...sorted]
    .slice(-3)
    .reverse()
    .map((item) => ({ name: item.name, score: item.score }));
  const targetGapNames = targetGaps.map((item) => item.name);
  const docs = context.feedbackSettings.contextDocuments.slice(0, fastMode ? 0 : 6);

  const glossary = await resolveGlossaryTermsExact(targetGapNames);
  const resources = fastMode
    ? []
    : await resolveResourcesRuleBased(client, targetGapNames, pillar);
  const contextChunks: string[] = [];
  const unresolvedContextNames: string[] = [];
  if (docs.length > 0) {
    const fetched = await Promise.all(
      docs.map(async (doc) => {
        const snippet = await fetchContextDocumentSnippet(doc.url, {
          timeoutMs: fastMode ? 2200 : 5500,
        });
        return { doc, snippet };
      }),
    );
    for (const item of fetched) {
      if (item.snippet) {
        contextChunks.push(`### Documento: ${item.doc.name}\n${item.snippet}`);
      } else {
        unresolvedContextNames.push(item.doc.name);
      }
    }
  }
  const contextEvidence = selectContextEvidence(
    contextChunks,
    [
      ...targetGapNames,
      ...targetStrengths.map((item) => item.name),
      "liderazgo",
      "equipo",
      "conducta",
      "cultura",
      "estrategia",
      toPillarDisplayName(pillar),
    ],
    12,
  );
  const { systemPrompt, userPrompt } = buildContractPrompts({
    username: input.username,
    role: input.role,
    pillar,
    scores: input.scores,
    targetGaps,
    targetStrengths,
    glossary,
    resources,
    feedbackInstructions: context.feedbackSettings.aiFeedbackInstructions,
    contextChunks,
    contextEvidence,
    unresolvedContextNames,
  });

  try {
    const isGlobal = pillar === "all";
    const primaryModel = "gpt-4.1"; 
    const refinementModel = "gpt-4.1";
    const maxAttempts = 6; 

    let report = await requestOpenAiReport(context, systemPrompt, userPrompt, {
      model: primaryModel,
      temperature: isGlobal ? 0.68 : 0.65, 
      timeoutMs: isGlobal ? 110000 : 90000,
      maxTokens: isGlobal ? 4500 : 3000,
    });
    let attempts = 1;
    while (!isDeepEnoughReport(report, pillar) && attempts < maxAttempts) {
      const refinementPrompt = [
        `Iteración de mejora ${attempts}. EL REPORTE NO CUMPLE EL ESTÁNDAR DE CALIDAD.`,
        `Palabras actuales: ${countWords(report)} (mínimo requerido: ${isGlobal ? 900 : 550}).`,
        "",
        "INSTRUCCIONES DE REESCRITURA OBLIGATORIA:",
        "1. ELIMINA CUALQUIER LISTA, VIÑETA O NUMERACIÓN. Usa exclusivamente párrafos narrativos continuos.",
        "2. EXPANDE EL ANÁLISIS: describe con mucho más detalle las situaciones de liderazgo, el impacto en el equipo y las recomendaciones tácticas.",
        "3. Sé mucho más prolijo y descriptivo. No resumas; analiza en profundidad cada punto.",
        "4. USA EXACTAMENTE ESTOS TÍTULOS DE SECCIÓN (cópialos sin modificar ni un carácter):",
        "   ## Tu perfil estratégico",
        "   ## Lo que hoy te impulsa",
        "   ## Plan de aceleración de 30 días",
        "   ## Lectura del pilar",
        "   ## Puntos críticos de atención",
        "   ## Intervención táctica",
        "   ## Señal de progreso",
        "",
        "Borrador a mejorar radicalmente:",
        report,
      ].join("\n");
      report = await requestOpenAiReport(context, systemPrompt, refinementPrompt, {
        model: refinementModel,
        temperature: 0.7 + (attempts * 0.03), 
        timeoutMs: isGlobal ? 120000 : 100000,
        maxTokens: isGlobal ? 4500 : 3000,
      });
      attempts += 1;
    }
    if (!isDeepEnoughReport(report, pillar)) {
      const reason = getReportRejectionReason(report, pillar);
      console.warn(`[Discovery] Report quality check failed after ${attempts} attempts: ${reason}`);
      const wordCount = countWords(report);
      const noBullets = !hasAnyLists(report);
      // Accept if prose-only and long enough — sections are best-effort after max attempts
      if (noBullets && wordCount >= (isGlobal ? 500 : 300)) {
        return { report, source: "ai" };
      }
      throw new Error(`Calidad insuficiente: ${reason}`);
    }
    return { report, source: "ai" };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(`Error de análisis IA: ${String(error)}`);
  }
}

export async function generateDiscoveryAnalysisContract(
  client: PoolClient,
  actor: AuthUser,
  input: DiscoveryAnalyzeContractInput,
): Promise<{ report: string; source: "ai" | "fallback" }> {
  await requireModulePermission(client, "descubrimiento", "view");
  await requireDiscoveryAccess(client, actor);
  const fallback = input.fallbackReport?.trim() || "";

  const pillar = input.pillar ?? "all";
  const targetSessionId = input.sessionId || actor.userId;
  const isInvitationId = targetSessionId.startsWith("inv-");
  
  // If invitation, we need to read from invitations table or join
  let cached: string | undefined;
  let sessionRecordId: string | null = null;

  if (isInvitationId) {
    const invId = targetSessionId.slice(4);
    const { rows } = await client.query(
      `SELECT session_id::text, meta FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
      [invId]
    );
    cached = (rows[0]?.meta as any)?.ai_reports?.[pillar];
    sessionRecordId = rows[0]?.session_id;
  } else if (input.sessionId) {
    // Admin-provided session UUID: look up by session_id, not by user_id
    const session = await readDiscoverySessionBySessionId(client, targetSessionId);
    cached = session?.aiReports?.[pillar];
    sessionRecordId = session?.sessionId || null;
  } else {
    // Own session: look up by actor's user_id
    const session = await readDiscoverySession(client, actor.userId);
    cached = session?.aiReports?.[pillar];
    sessionRecordId = session?.sessionId || null;
  }

  if (cached && cached.trim().length > 0) {
    const isRegeneration = Boolean(input.force || input.fallbackReport);
    if (!isRegeneration) {
      return { report: cached.trim(), source: "ai" };
    }
  }
  const openAiIntegration = await getIntegrationConfigForActor(client, actor.userId, "openai");
  if (!openAiIntegration?.enabled || !openAiIntegration.secretValue) {
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getDiscoveryFeedbackSettingsForAnalysis(client, actor);
  const analysisContext: DiscoveryAnalysisContext = {
    openAiConfig: {
      secretValue: openAiIntegration.secretValue,
      wizardData: normalizeStringRecord(openAiIntegration.wizardData),
    },
    feedbackSettings,
  };

  const result = await runContractStyleAnalysis(client, analysisContext, {
    ...input,
    fastMode: pillar !== "all",
  });

  if (result.report.trim().length > 0) {
    if (isInvitationId) {
      await persistDiscoveryInvitationAiReport(client, targetSessionId.slice(4), pillar, result.report.trim());
    } else if (sessionRecordId) {
      await persistDiscoverySessionAiReport(client, sessionRecordId, pillar, result.report.trim());
    }
  }

  return result;
}

export async function generateDiscoveryAnalysisBundleContract(
  client: PoolClient,
  actor: AuthUser,
  input: Omit<DiscoveryAnalyzeContractInput, "pillar" | "fallbackReport">,
): Promise<{ reports: DiscoveryAiReports }> {
  await requireModulePermission(client, "descubrimiento", "view");
  await requireDiscoveryAccess(client, actor);

  const session = await readDiscoverySession(client, actor.userId);
  const reports: DiscoveryAiReports = {
    ...(session?.aiReports ?? {}),
  };
  const missingFilters = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !reports[pillar]?.trim());
  if (missingFilters.length === 0 || !session?.sessionId) {
    return { reports };
  }

  return withDiscoveryAdvisoryLock(client, "session", session.sessionId, async () => {
    const refreshed = await readDiscoverySession(client, actor.userId);
    const nextReports: DiscoveryAiReports = {
      ...(refreshed?.aiReports ?? reports),
    };
    const stillMissing = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !nextReports[pillar]?.trim());
    if (stillMissing.length === 0) {
      return { reports: nextReports };
    }

    const orderedFilters = ([
      "all",
      "within",
      "out",
      "up",
      "beyond",
    ] as const).filter((pillar) => stillMissing.includes(pillar));

    if (orderedFilters.includes("all")) {
      const result = await generateDiscoveryAnalysisContract(client, actor, {
        ...input,
        pillar: "all",
      });
      const report = result.report.trim();
      if (report) {
        nextReports.all = report;
        await persistDiscoverySessionAiReport(client, session.sessionId, "all", report);
      }
    }

    const pillarFilters = orderedFilters.filter((pillar) => pillar !== "all");
    for (let index = 0; index < pillarFilters.length; index += DISCOVERY_ANALYSIS_BATCH_CONCURRENCY) {
      const chunk = pillarFilters.slice(index, index + DISCOVERY_ANALYSIS_BATCH_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (pillar) => {
          const result = await generateDiscoveryAnalysisContract(client, actor, {
            ...input,
            pillar,
            fastMode: false,
          });
          return { pillar, report: result.report.trim() };
        }),
      );
      for (const { pillar, report } of chunkResults) {
        if (!report) continue;
        nextReports[pillar] = report;
        await persistDiscoverySessionAiReport(client, session.sessionId, pillar, report);
      }
    }

    return { reports: nextReports };
  });
}

export async function generateDiscoveryInvitationAnalysisContract(
  client: PoolClient,
  input: DiscoveryAnalyzeContractInput & { inviteToken: string; accessCode: string },
): Promise<{ report: string; source: "ai" | "fallback" }> {
  const verified = await verifyDiscoveryInvitationAccess(client, input.inviteToken, input.accessCode);

  const invitationRowResult = await client.query<{ meta: unknown }>(
    `
      SELECT meta
      FROM app_assessment.discovery_invitations
      WHERE invitation_id = $1::uuid
      LIMIT 1
    `,
    [verified.invitation.invitationId],
  );
  const storedReports = parseInvitationStoredReports(invitationRowResult.rows[0]?.meta);
  const cached = storedReports[input.pillar ?? "all"];
  const isRegeneration = Boolean(input.fallbackReport);

  if (!isRegeneration && cached && cached.trim().length > 0) {
    return { report: cached.trim(), source: "ai" };
  }

  const fallback = input.fallbackReport?.trim() || "";
  let organizationId: string | null = null;
  if (verified.session?.userId) {
    organizationId = await resolveOrganizationIdFromSessionUser(client, verified.session.userId);
  }
  if (!organizationId) {
    organizationId = await resolveFallbackOrganizationId(client);
  }

  const openAiConfig = await resolveOpenAiConfigByOrganization(client, organizationId);
  if (!openAiConfig?.enabled || !openAiConfig.secretValue) {
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getFeedbackSettingsByOrganizationOrDefault(client, organizationId);
  const analysisContext: DiscoveryAnalysisContext = {
    openAiConfig: {
      secretValue: openAiConfig.secretValue,
      wizardData: openAiConfig.wizardData,
    },
    feedbackSettings,
  };

  const pillar = input.pillar ?? "all";
  const result = await runContractStyleAnalysis(client, analysisContext, {
    ...input,
    fastMode: false,
  });

  if (result.report.trim().length > 0) {
    await persistDiscoveryInvitationAiReport(
      client,
      verified.invitation.invitationId,
      pillar,
      result.report.trim(),
    );
  }

  return result;
}

export async function generateDiscoveryInvitationAnalysisBundleContract(
  client: PoolClient,
  input: Omit<
    DiscoveryAnalyzeContractInput & { inviteToken: string; accessCode: string },
    "pillar" | "fallbackReport"
  >,
): Promise<{ reports: DiscoveryAiReports }> {
  const verified = await verifyDiscoveryInvitationAccess(client, input.inviteToken, input.accessCode);
  const invitationRowResult = await client.query<{ meta: unknown }>(
    `
      SELECT meta
      FROM app_assessment.discovery_invitations
      WHERE invitation_id = $1::uuid
      LIMIT 1
    `,
    [verified.invitation.invitationId],
  );
  const reports: DiscoveryAiReports = {
    ...parseInvitationStoredReports(invitationRowResult.rows[0]?.meta),
  };
  const missingFilters = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !reports[pillar]?.trim());
  if (missingFilters.length === 0) {
    return { reports };
  }

  return withDiscoveryAdvisoryLock(
    client,
    "invitation",
    verified.invitation.invitationId,
    async () => {
      const refreshedMetaResult = await client.query<{ meta: unknown }>(
        `
          SELECT meta
          FROM app_assessment.discovery_invitations
          WHERE invitation_id = $1::uuid
          LIMIT 1
        `,
        [verified.invitation.invitationId],
      );
      const nextReports: DiscoveryAiReports = {
        ...parseInvitationStoredReports(refreshedMetaResult.rows[0]?.meta),
      };
      const stillMissing = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !nextReports[pillar]?.trim());
      if (stillMissing.length === 0) {
        return { reports: nextReports };
      }

      let organizationId: string | null = null;
      if (verified.session?.userId) {
        organizationId = await resolveOrganizationIdFromSessionUser(client, verified.session.userId);
      }
      if (!organizationId) {
        organizationId = await resolveFallbackOrganizationId(client);
      }
      const orderedFilters = ([
        "all",
        "within",
        "out",
        "up",
        "beyond",
      ] as const).filter((pillar) => stillMissing.includes(pillar));

      if (orderedFilters.includes("all")) {
        const result = await generateDiscoveryInvitationAnalysisContract(client, {
          ...input,
          pillar: "all",
        });
        const report = result.report.trim();
        if (report) {
          nextReports.all = report;
          await persistDiscoveryInvitationAiReport(
            client,
            verified.invitation.invitationId,
            "all",
            report,
          );
        }
      }

      const pillarFilters = orderedFilters.filter((pillar) => pillar !== "all");
      for (let index = 0; index < pillarFilters.length; index += DISCOVERY_ANALYSIS_BATCH_CONCURRENCY) {
        const chunk = pillarFilters.slice(index, index + DISCOVERY_ANALYSIS_BATCH_CONCURRENCY);
        const chunkResults = await Promise.all(
          chunk.map(async (pillar) => {
            const result = await generateDiscoveryInvitationAnalysisContract(client, {
              ...input,
              pillar,
            });
            return { pillar, report: result.report.trim() };
          }),
        );
        for (const { pillar, report } of chunkResults) {
          if (!report) continue;
          nextReports[pillar] = report;
          await persistDiscoveryInvitationAiReport(
            client,
            verified.invitation.invitationId,
            pillar,
            report,
          );
        }
      }

      return { reports: nextReports };
    },
  );
}

export async function generateDiscoveryGuestSessionAnalysisContract(
  client: PoolClient,
  input: DiscoveryAnalyzeContractInput & { inviteToken: string },
): Promise<{ report: string; source: "ai" | "fallback" }> {
  const row = await resolveDiscoveryInvitationByToken(client, input.inviteToken);

  const invitationRowResult = await client.query<{ meta: unknown }>(
    `
      SELECT meta
      FROM app_assessment.discovery_invitations
      WHERE invitation_id = $1::uuid
      LIMIT 1
    `,
    [row.invitation_id],
  );
  const storedReports = parseInvitationStoredReports(invitationRowResult.rows[0]?.meta);
  const pillar = input.pillar ?? "all";
  const cached = storedReports[pillar];
  if (cached && cached.trim().length > 0) {
    const isRegeneration = Boolean(input.force || input.fallbackReport);
    if (!isRegeneration) {
      return { report: cached.trim(), source: "ai" };
    }
  }

  let organizationId: string | null = null;
  if (row.session_id) {
    const { rows } = await client.query<{ user_id: string }>(
      `SELECT user_id::text FROM app_assessment.discovery_sessions WHERE session_id = $1::uuid LIMIT 1`,
      [row.session_id],
    );
    if (rows[0]?.user_id) {
      organizationId = await resolveOrganizationIdFromSessionUser(client, rows[0].user_id);
    }
  }
  if (!organizationId) {
    organizationId = await resolveFallbackOrganizationId(client);
  }

  const openAiConfig = await resolveOpenAiConfigByOrganization(client, organizationId);
  if (!openAiConfig?.enabled || !openAiConfig.secretValue) {
    const fallback = input.fallbackReport?.trim() || "";
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getFeedbackSettingsByOrganizationOrDefault(client, organizationId);
  const analysisContext: DiscoveryAnalysisContext = {
    openAiConfig: {
      secretValue: openAiConfig.secretValue,
      wizardData: openAiConfig.wizardData,
    },
    feedbackSettings,
  };

  const result = await runContractStyleAnalysis(client, analysisContext, {
    ...input,
    fastMode: pillar !== "all",
  });

  if (result.report.trim().length > 0) {
    await persistDiscoveryInvitationAiReport(client, row.invitation_id, pillar, result.report.trim());
  }

  return result;
}

export async function generateDiscoveryGuestSessionAnalysisBundleContract(
  client: PoolClient,
  input: Omit<DiscoveryAnalyzeContractInput & { inviteToken: string }, "pillar" | "fallbackReport">,
): Promise<{ reports: DiscoveryAiReports }> {
  const row = await resolveDiscoveryInvitationByToken(client, input.inviteToken);
  const invitationRowResult = await client.query<{ meta: unknown }>(
    `
      SELECT meta
      FROM app_assessment.discovery_invitations
      WHERE invitation_id = $1::uuid
      LIMIT 1
    `,
    [row.invitation_id],
  );
  const reports: DiscoveryAiReports = {
    ...parseInvitationStoredReports(invitationRowResult.rows[0]?.meta),
  };
  const missingFilters = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !reports[pillar]?.trim());
  if (missingFilters.length === 0) {
    return { reports };
  }

  return withDiscoveryAdvisoryLock(client, "invitation", row.invitation_id, async () => {
    const refreshedMetaResult = await client.query<{ meta: unknown }>(
      `
        SELECT meta
        FROM app_assessment.discovery_invitations
        WHERE invitation_id = $1::uuid
        LIMIT 1
      `,
      [row.invitation_id],
    );
    const nextReports: DiscoveryAiReports = {
      ...parseInvitationStoredReports(refreshedMetaResult.rows[0]?.meta),
    };
    const stillMissing = DISCOVERY_REPORT_BATCH_FILTERS.filter((pillar) => !nextReports[pillar]?.trim());
    if (stillMissing.length === 0) {
      return { reports: nextReports };
    }

    let organizationId: string | null = null;
    if (row.session_id) {
      const { rows } = await client.query<{ user_id: string }>(
        `SELECT user_id::text FROM app_assessment.discovery_sessions WHERE session_id = $1::uuid LIMIT 1`,
        [row.session_id],
      );
      if (rows[0]?.user_id) {
        organizationId = await resolveOrganizationIdFromSessionUser(client, rows[0].user_id);
      }
    }
    if (!organizationId) {
      organizationId = await resolveFallbackOrganizationId(client);
    }
    const orderedFilters = ([
      "all",
      "within",
      "out",
      "up",
      "beyond",
    ] as const).filter((pillar) => stillMissing.includes(pillar));

    if (orderedFilters.includes("all")) {
      const result = await generateDiscoveryGuestSessionAnalysisContract(client, {
        ...input,
        pillar: "all",
      });
      const report = result.report.trim();
      if (report) {
        nextReports.all = report;
        await persistDiscoveryInvitationAiReport(client, row.invitation_id, "all", report);
      }
    }

    const pillarFilters = orderedFilters.filter((pillar) => pillar !== "all");
    for (let index = 0; index < pillarFilters.length; index += DISCOVERY_ANALYSIS_BATCH_CONCURRENCY) {
      const chunk = pillarFilters.slice(index, index + DISCOVERY_ANALYSIS_BATCH_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (pillar) => {
          const result = await generateDiscoveryGuestSessionAnalysisContract(client, {
            ...input,
            pillar,
          });
          return { pillar, report: result.report.trim() };
        }),
      );
      for (const { pillar, report } of chunkResults) {
        if (!report) continue;
        nextReports[pillar] = report;
        await persistDiscoveryInvitationAiReport(client, row.invitation_id, pillar, report);
      }
    }

    return { reports: nextReports };
  });
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
  return runDiscoveryAnalysisWithContext(client, input, {
    openAiConfig: {
      secretValue: openAiIntegration.secretValue,
      wizardData: openAiIntegration.wizardData,
    },
    feedbackSettings,
  });
}

export async function generateDiscoveryInvitationAnalysis(
  client: PoolClient,
  input: DiscoveryAnalysisInput & { inviteToken: string; accessCode: string },
): Promise<{ report: string; source: "ai" | "fallback" }> {
  const verified = await verifyDiscoveryInvitationAccess(client, input.inviteToken, input.accessCode);

  const fallback = input.fallbackReport?.trim() || "";
  let organizationId: string | null = null;
  if (verified.session?.userId) {
    organizationId = await resolveOrganizationIdFromSessionUser(client, verified.session.userId);
  }
  if (!organizationId) {
    organizationId = await resolveFallbackOrganizationId(client);
  }

  const openAiConfig = await resolveOpenAiConfigByOrganization(client, organizationId);
  if (!openAiConfig?.enabled || !openAiConfig.secretValue) {
    if (fallback) return { report: fallback, source: "fallback" };
    throw new Error("OpenAI integration is not configured for this organization.");
  }

  const feedbackSettings = await getFeedbackSettingsByOrganizationOrDefault(client, organizationId);
  return runDiscoveryAnalysisWithContext(client, input, {
    openAiConfig: {
      secretValue: openAiConfig.secretValue,
      wizardData: openAiConfig.wizardData,
    },
    feedbackSettings,
  });
}

export async function sendDiscoveryResultsEmailViaAdmin(
  client: PoolClient,
  publicId: string,
  emails: string[],
): Promise<void> {
  const session = await getDiscoverySessionByPublicId(client, publicId);
  if (!session) {
    throw new Error("No se pudo encontrar la sesión para enviar el correo.");
  }

  let organizationId: string | null = null;
  if (session.userId) {
    organizationId = await resolveOrganizationIdFromSessionUser(client, session.userId);
  }
  if (!organizationId) {
    organizationId = await resolveFallbackOrganizationId(client);
  }

  const outboundConfig = await resolveOutboundConfig(client, organizationId);
  if (!outboundConfig) {
    throw new Error("No hay configuracion de correo saliente habilitada para enviar los resultados.");
  }

  const baseUrl = resolveAppBaseUrl();
  const link = `${baseUrl}/descubrimiento/share/${publicId}`;

  const subject = "Resultados diagnóstico 4Shine";
  const html = `
    <div style="font-family: sans-serif; color: #2e284c; max-width: 600px; margin: 0 auto;">
      <p>Hola,</p>
      <p>Te comparto mi lectura ejecutiva del diagnóstico 4Shine en el siguiente enlace:</p>
      <p><a href="${link}" style="color: #6C55CC; font-weight: bold; text-decoration: none;">Ver resultados completos</a></p>
      <br/>
      <p>Saludos.</p>
    </div>
  `;
  const text = `Hola,\n\nTe comparto mi lectura ejecutiva del diagnóstico 4Shine:\n${link}\n\nSaludos.`;

  for (const to of emails) {
    await sendViaSmtp(outboundConfig, {
      to,
      subject,
      text,
      html,
    });
  }
}

export async function resendDiscoveryInvitation(
  client: PoolClient,
  actor: AuthUser,
  invitationId: string,
): Promise<DiscoveryInvitationWithCode> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden reenviar invitaciones.");
  }

  const { rows: invRows } = await client.query<
    DiscoveryInvitationRow & { session_payload: DiscoverySessionRow | null }
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
        to_json(ds.*) AS session_payload
      FROM app_assessment.discovery_invitations di
      LEFT JOIN app_assessment.discovery_sessions ds ON ds.session_id = di.session_id
      WHERE di.invitation_id = $1::uuid
      LIMIT 1
    `,
    [invitationId],
  );

  const invRow = invRows[0];
  if (!invRow) throw new Error("Invitación no encontrada.");

  const organizationId = await resolveOrganizationIdForActor(client, actor.userId);
  const settings = await ensureFeedbackSettings(client, actor);
  const branding = await getBrandingForOrganization(client, organizationId);

  const htmlTemplate =
    sanitizeText(settings.inviteEmailHtml, "", 20000) ||
    defaultInviteEmailHtml(branding.platform_name, branding.primary_color, branding.accent_color);
  const htmlTemplateWithLogo = ensureInviteTemplateHasLogo(htmlTemplate);
  const textTemplate =
    sanitizeText(settings.inviteEmailText, "", 10000) ||
    defaultInviteEmailText(branding.platform_name);
  const subjectTemplate =
    sanitizeText(settings.inviteEmailSubject, "", 240) ||
    "Diagnostico 4Shine: acceso personalizado";

  const outboundConfig = await resolveOutboundConfig(client, organizationId);
  if (!outboundConfig) {
    throw new Error("No hay configuracion de correo saliente habilitada para enviar invitaciones.");
  }

  const newAccessCode = createAccessCode();
  const newInviteToken = createInviteToken();

  const { rows: updRows } = await client.query<DiscoveryInvitationRow>(
    `
      UPDATE app_assessment.discovery_invitations
      SET invite_token = $2,
          access_code_hash = $3,
          access_code_last4 = $4,
          access_code_sent_at = now(),
          updated_at = now()
      WHERE invitation_id = $1::uuid
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
    [invitationId, newInviteToken, hashAccessCode(newAccessCode), newAccessCode.slice(-4)],
  );

  if (!updRows[0]) throw new Error("No se pudo actualizar la invitación.");

  const session = invRow.session_payload ? mapDiscoverySessionRow(invRow.session_payload) : null;
  const baseUrl = resolveAppBaseUrl();
  const inviteUrl = `${baseUrl}/descubrimiento/invitacion/${newInviteToken}`;
  const platformLogoUrl = branding.logo_url?.trim() || `${baseUrl}/workbooks-v2/diamond.svg`;

  const params = {
    recipient_email: invRow.invited_email,
    access_code: newAccessCode,
    invite_url: inviteUrl,
    diagnostic_id: session?.diagnosticIdentifier ?? "N/A",
    participant_name: session
      ? `${session.firstName} ${session.lastName}`.trim()
      : "Participante invitado",
    platform_logo_url: platformLogoUrl,
  };

  await sendOutboundEmail(outboundConfig, {
    to: invRow.invited_email,
    subject: fillTemplate(subjectTemplate, params),
    html: fillTemplate(htmlTemplateWithLogo, params),
    text: fillTemplate(textTemplate, params),
  });

  return {
    ...mapInvitationRow(updRows[0]),
    accessCode: newAccessCode,
  };
}

export async function deleteDiscoveryInvitation(
  client: PoolClient,
  actor: AuthUser,
  invitationId: string,
): Promise<void> {
  await requireModulePermission(client, "descubrimiento", "update");
  if (!isAllowedManager(actor)) {
    throw new Error("Solo admin y gestor pueden eliminar invitaciones.");
  }

  const { rowCount } = await client.query(
    `DELETE FROM app_assessment.discovery_invitations WHERE invitation_id = $1::uuid`,
    [invitationId],
  );

  if (!rowCount) throw new Error("Invitación no encontrada.");
}
// Deployment poke Mon Apr 27 22:05:23 -05 2026
