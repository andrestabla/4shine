import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { getViewerAccessState } from '@/features/access/service';
import { getMyProfile } from '@/features/perfil/service';
import { getMyDashboard } from '@/features/dashboard/service';
import { listProgramEntitlements } from '@/features/mentorias/service';
import { listConvocatorias } from '@/features/convocatorias/service';
import { listWorkshops } from '@/features/workshops/service';
import { listWorkbooks } from '@/features/aprendizaje/service';
import { listConnections } from '@/features/networking/service';
import { listPublicAdvisors } from '@/features/advisors/service';
import { subscriptionStatus, formatExpiry } from '@/features/usuarios/subscription-status';
import { formatDate } from '@/lib/format-date';
import type {
  AdminConversation,
  ChatbotAnalytics,
  ChatbotFaq,
  ChatbotPublic,
  ChatbotSettings,
  ChatbotSuggestion,
  ChatMessage,
  CreateFaqInput,
  SendMessageResult,
  UpdateChatbotSettingsInput,
  UpdateFaqInput,
} from './types';

// ─── Org ────────────────────────────────────────────────────────────────────

async function resolveOrgId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (rows[0]?.organization_id) return rows[0].organization_id;
  const { rows: fb } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.organizations ORDER BY created_at ASC LIMIT 1`,
  );
  if (fb[0]?.organization_id) return fb[0].organization_id;
  throw new Error('Organization not found');
}

// ─── Settings ─────────────────────────────────────────────────────────────────

interface SettingsRow {
  organization_id: string;
  is_enabled: boolean;
  model: string;
  persona: string;
  avatar_url: string;
  system_prompt: string;
  welcome_message: string;
  max_context_messages: number;
  updated_at: string;
}

const SETTINGS_SELECT = `
  organization_id::text, is_enabled, model, persona, avatar_url, system_prompt,
  welcome_message, max_context_messages, updated_at::text
`;

function toSettings(row: SettingsRow): ChatbotSettings {
  return {
    organizationId: row.organization_id,
    isEnabled: row.is_enabled,
    model: row.model,
    persona: row.persona,
    avatarUrl: row.avatar_url,
    systemPrompt: row.system_prompt,
    welcomeMessage: row.welcome_message,
    maxContextMessages: row.max_context_messages,
    updatedAt: row.updated_at,
  };
}

async function loadSettings(client: PoolClient, orgId: string): Promise<SettingsRow> {
  const { rows } = await client.query<SettingsRow>(
    `SELECT ${SETTINGS_SELECT} FROM app_admin.chatbot_settings WHERE organization_id = $1 LIMIT 1`,
    [orgId],
  );
  if (rows[0]) return rows[0];
  const { rows: created } = await client.query<SettingsRow>(
    `INSERT INTO app_admin.chatbot_settings (organization_id)
     VALUES ($1)
     ON CONFLICT (organization_id) DO UPDATE SET organization_id = EXCLUDED.organization_id
     RETURNING ${SETTINGS_SELECT}`,
    [orgId],
  );
  return created[0];
}

export async function getSettings(client: PoolClient, actor: AuthUser): Promise<ChatbotSettings> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  return toSettings(await loadSettings(client, orgId));
}

export async function updateSettings(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateChatbotSettingsInput,
): Promise<ChatbotSettings> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await loadSettings(client, orgId);

  const setClauses: string[] = ['updated_by = $2'];
  const params: unknown[] = [orgId, actor.userId];
  let idx = 3;
  const push = (col: string, val: unknown) => {
    setClauses.push(`${col} = $${idx++}`);
    params.push(val);
  };
  if (input.isEnabled !== undefined) push('is_enabled', input.isEnabled);
  if (input.model !== undefined) push('model', input.model.trim());
  if (input.persona !== undefined) push('persona', input.persona.trim());
  if (input.avatarUrl !== undefined) push('avatar_url', input.avatarUrl.trim());
  if (input.systemPrompt !== undefined) push('system_prompt', input.systemPrompt);
  if (input.welcomeMessage !== undefined) push('welcome_message', input.welcomeMessage.trim());
  if (input.maxContextMessages !== undefined) {
    push('max_context_messages', Math.min(50, Math.max(1, Math.floor(input.maxContextMessages))));
  }

  const { rows } = await client.query<SettingsRow>(
    `UPDATE app_admin.chatbot_settings SET ${setClauses.join(', ')}
     WHERE organization_id = $1 RETURNING ${SETTINGS_SELECT}`,
    params,
  );
  return toSettings(rows[0]);
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

interface FaqRow {
  faq_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}
const FAQ_SELECT = `faq_id::text, question, answer, sort_order, is_active`;
function toFaq(row: FaqRow): ChatbotFaq {
  return {
    faqId: row.faq_id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function listFaqs(client: PoolClient, actor: AuthUser): Promise<ChatbotFaq[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<FaqRow>(
    `SELECT ${FAQ_SELECT} FROM app_admin.chatbot_faqs WHERE organization_id = $1 ORDER BY sort_order, created_at`,
    [orgId],
  );
  return rows.map(toFaq);
}

export async function createFaq(client: PoolClient, actor: AuthUser, input: CreateFaqInput): Promise<ChatbotFaq> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows: maxRows } = await client.query<{ next: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM app_admin.chatbot_faqs WHERE organization_id = $1`,
    [orgId],
  );
  const { rows } = await client.query<FaqRow>(
    `INSERT INTO app_admin.chatbot_faqs (organization_id, question, answer, sort_order, is_active, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING ${FAQ_SELECT}`,
    [orgId, input.question.trim(), input.answer.trim(), input.sortOrder ?? maxRows[0]?.next ?? 1, input.isActive ?? true, actor.userId],
  );
  return toFaq(rows[0]);
}

export async function updateFaq(
  client: PoolClient,
  actor: AuthUser,
  faqId: string,
  input: UpdateFaqInput,
): Promise<ChatbotFaq> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const setClauses: string[] = ['updated_by = $3'];
  const params: unknown[] = [orgId, faqId, actor.userId];
  let idx = 4;
  const push = (col: string, val: unknown) => {
    setClauses.push(`${col} = $${idx++}`);
    params.push(val);
  };
  if (input.question !== undefined) push('question', input.question.trim());
  if (input.answer !== undefined) push('answer', input.answer.trim());
  if (input.sortOrder !== undefined) push('sort_order', input.sortOrder);
  if (input.isActive !== undefined) push('is_active', input.isActive);
  const { rows } = await client.query<FaqRow>(
    `UPDATE app_admin.chatbot_faqs SET ${setClauses.join(', ')}
     WHERE organization_id = $1 AND faq_id = $2 RETURNING ${FAQ_SELECT}`,
    params,
  );
  if (!rows[0]) throw new Error('FAQ no encontrada');
  return toFaq(rows[0]);
}

export async function deleteFaq(client: PoolClient, actor: AuthUser, faqId: string): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await client.query(`DELETE FROM app_admin.chatbot_faqs WHERE organization_id = $1 AND faq_id = $2`, [orgId, faqId]);
}

// ─── Admin: conversaciones + analítica ──────────────────────────────────────

export async function listConversations(client: PoolClient, actor: AuthUser): Promise<AdminConversation[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<{
    conversation_id: string;
    user_id: string;
    user_name: string;
    title: string;
    updated_at: string;
    message_count: number;
    last_message: string | null;
  }>(
    `SELECT c.conversation_id::text, c.user_id::text, u.display_name AS user_name, c.title, c.updated_at::text,
            (SELECT count(*)::int FROM app_core.chatbot_messages m WHERE m.conversation_id = c.conversation_id) AS message_count,
            (SELECT m.content FROM app_core.chatbot_messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM app_core.chatbot_conversations c
     JOIN app_core.users u ON u.user_id = c.user_id
     WHERE c.organization_id = $1
     ORDER BY c.updated_at DESC
     LIMIT 200`,
    [orgId],
  );
  return rows.map((r) => ({
    conversationId: r.conversation_id,
    userId: r.user_id,
    userName: r.user_name,
    title: r.title,
    lastMessage: r.last_message,
    messageCount: r.message_count,
    updatedAt: r.updated_at,
  }));
}

export async function getConversationMessages(
  client: PoolClient,
  actor: AuthUser,
  conversationId: string,
  asAdmin: boolean,
): Promise<ChatMessage[]> {
  if (asAdmin) await requireModulePermission(client, 'usuarios', 'manage');
  // RLS garantiza que un usuario solo lea su conversación; admin/gestor leen todas.
  const { rows } = await client.query<{ message_id: string; role: 'user' | 'assistant'; content: string; created_at: string }>(
    `SELECT message_id::text, role, content, created_at::text
     FROM app_core.chatbot_messages WHERE conversation_id = $1 ORDER BY created_at`,
    [conversationId],
  );
  return rows.map((r) => ({ messageId: r.message_id, role: r.role, content: r.content, createdAt: r.created_at }));
}

export async function getAnalytics(client: PoolClient, actor: AuthUser): Promise<ChatbotAnalytics> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<{ conversations: number; messages: number; active_users: number }>(
    `SELECT
       (SELECT count(*)::int FROM app_core.chatbot_conversations WHERE organization_id = $1) AS conversations,
       (SELECT count(*)::int FROM app_core.chatbot_messages WHERE organization_id = $1) AS messages,
       (SELECT count(DISTINCT user_id)::int FROM app_core.chatbot_conversations WHERE organization_id = $1) AS active_users`,
    [orgId],
  );
  return {
    conversations: rows[0]?.conversations ?? 0,
    messages: rows[0]?.messages ?? 0,
    activeUsers: rows[0]?.active_users ?? 0,
  };
}

// ─── Usuario: abrir widget + enviar mensaje ─────────────────────────────────

export async function getMyChatbot(client: PoolClient, actor: AuthUser): Promise<ChatbotPublic> {
  const orgId = await resolveOrgId(client, actor.userId);
  const settings = await loadSettings(client, orgId);

  let conversationId: string | null = null;
  let messages: ChatMessage[] = [];
  let briefing: string | null = null;
  let suggestions: ChatbotSuggestion[] = [];
  if (settings.is_enabled) {
    const { rows: convRows } = await client.query<{ conversation_id: string }>(
      `SELECT conversation_id::text FROM app_core.chatbot_conversations
       WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [actor.userId],
    );
    if (convRows[0]) {
      conversationId = convRows[0].conversation_id;
      messages = await getConversationMessages(client, actor, conversationId, false);
    }
    const proactive = await buildProactiveBriefing(client, actor).catch(() => ({ briefing: null, suggestions: [] }));
    briefing = proactive.briefing;
    suggestions = proactive.suggestions;
  }

  return {
    enabled: settings.is_enabled,
    welcomeMessage: settings.welcome_message,
    persona: settings.persona,
    avatarUrl: settings.avatar_url,
    conversationId,
    messages,
    briefing,
    suggestions,
  };
}

/**
 * Briefing proactivo: detecta lo más accionable del usuario (con datos reales)
 * y produce un resumen de 1-2 líneas + chips de preguntas sugeridas. No ejecuta
 * nada; solo orienta. Cada bloque se omite si el módulo no aplica.
 */
async function buildProactiveBriefing(
  client: PoolClient,
  actor: AuthUser,
): Promise<{ briefing: string | null; suggestions: ChatbotSuggestion[] }> {
  const [entitlements, connections, convocatorias, workbooks, workshops, profile] = await Promise.all([
    listProgramEntitlements(client, actor.userId).catch(() => []),
    listConnections(client, actor, 200).catch(() => []),
    listConvocatorias(client, actor, 100).catch(() => []),
    listWorkbooks(client, actor).catch(() => []),
    listWorkshops(client, actor, 100).catch(() => []),
    getMyProfile(client, actor).catch(() => null),
  ]);

  const highlights: string[] = [];
  const suggestions: ChatbotSuggestion[] = [];
  const now = Date.now();

  // Networking: solicitudes recibidas por responder.
  const incomingPending = connections.filter(
    (c) => c.status === 'pending' && c.requesterUserId !== actor.userId,
  ).length;
  if (incomingPending > 0) {
    highlights.push(`tienes ${incomingPending} solicitud(es) de conexión por responder`);
    suggestions.push({ label: `Solicitudes de conexión (${incomingPending})`, prompt: '¿Quién me envió solicitudes de conexión y cómo las respondo?' });
  }

  // Mentorías: disponible ahora o próxima fecha de habilitación.
  if (entitlements.length > 0) {
    const sorted = [...entitlements].sort((a, b) => a.sequenceNo - b.sequenceNo);
    const availableNow = sorted.find((e) => e.status === 'available');
    const blocker = sorted
      .filter((e) => e.status === 'scheduled' && e.scheduledStartsAt && new Date(e.scheduledStartsAt).getTime() + TEN_DAYS_MS > now)
      .sort((a, b) => a.sequenceNo - b.sequenceNo)[0];
    if (availableNow) {
      highlights.push(`puedes agendar tu Mentoría ${String(availableNow.sequenceNo).padStart(2, '0')}`);
      suggestions.push({ label: 'Agendar mi próxima mentoría', prompt: '¿Cómo agendo mi próxima mentoría 1:1 incluida?' });
    } else if (blocker?.scheduledStartsAt) {
      const unlock = fmtDate(new Date(new Date(blocker.scheduledStartsAt).getTime() + TEN_DAYS_MS).toISOString());
      highlights.push(`tu próxima mentoría 1:1 se habilita el ${unlock}`);
      suggestions.push({ label: '¿Cuándo se habilita mi próxima mentoría?', prompt: '¿Por qué no puedo agendar mi siguiente mentoría 1:1 y cuándo se habilita?' });
    }
  }

  // Convocatorias abiertas a las que aún no aplica.
  const openNotApplied = convocatorias.filter((c) => c.status === 'open' && !c.hasApplied);
  if (openNotApplied.length > 0) {
    highlights.push(`hay ${openNotApplied.length} convocatoria(s) abierta(s) sin aplicar`);
    suggestions.push({ label: `Convocatorias abiertas (${openNotApplied.length})`, prompt: '¿Qué convocatorias abiertas hay para mí y cómo aplico?' });
  }

  // Aprendizaje: próximo workbook pendiente.
  const nextWorkbook = [...workbooks]
    .sort((a, b) => a.sequenceNo - b.sequenceNo)
    .find((w) => w.completionPercent < 100 && w.accessState === 'active');
  if (nextWorkbook) {
    highlights.push(`puedes continuar tu workbook ${nextWorkbook.templateCode} (${Math.round(nextWorkbook.completionPercent)}%)`);
    suggestions.push({ label: `Continuar ${nextWorkbook.templateCode}`, prompt: `¿Cómo continúo mi workbook ${nextWorkbook.templateCode}?` });
  }

  // Workshops próximos en los que está inscrito.
  const upcomingRegistered = workshops.filter(
    (w) => w.status === 'upcoming' && (w.myAttendanceStatus === 'registered' || w.myAttendanceStatus === 'attended'),
  );
  if (upcomingRegistered[0]) {
    highlights.push(`tienes el workshop «${upcomingRegistered[0].title}» próximamente`);
    suggestions.push({ label: 'Mis workshops próximos', prompt: '¿A qué workshops estoy inscrito y cuándo son?' });
  }

  // Suscripción por vencer.
  const expiresAt = profile?.subscriptionExpiresAt ?? null;
  if (expiresAt) {
    const st = subscriptionStatus(expiresAt);
    if (st.daysUntil != null && st.daysUntil >= 0 && st.daysUntil <= 15) {
      highlights.push(`tu suscripción vence en ${st.daysUntil} día(s)`);
      suggestions.push({ label: 'Renovar suscripción', prompt: '¿Cuántos días me quedan de suscripción y cómo la renuevo?' });
    }
  }

  const name = (profile?.displayName ?? actor.name ?? '').split(' ')[0] || '';
  let briefing: string | null = null;
  if (highlights.length > 0) {
    const top = highlights.slice(0, 3);
    const joined = top.length === 1 ? top[0] : `${top.slice(0, -1).join(', ')} y ${top[top.length - 1]}`;
    briefing = `${name ? `${name}, ` : ''}al día de hoy ${joined}. ¿En qué te ayudo?`;
  }

  return { briefing, suggestions: suggestions.slice(0, 5) };
}

function sanitizeBaseUrl(value: string | undefined): string {
  const raw = (value || '').trim().replace(/\/+$/, '');
  return raw || 'https://api.openai.com/v1';
}

function enabledModulesText(access: Awaited<ReturnType<typeof getViewerAccessState>>): string {
  const map: Array<[boolean, string]> = [
    [access.canAccessTrayectoria, 'Trayectoria'],
    [access.canAccessDescubrimiento, 'Descubrimiento'],
    [access.canAccessAprendizajeCursos, 'Aprendizaje (cursos)'],
    [access.canAccessProgramWorkbooks, 'Workbooks'],
    [access.canAccessMentoring1on1, 'Mentorías 1:1'],
    [access.canAccessMentoringGroup, 'Mentorías grupales'],
    [access.canAccessNetworking, 'Networking'],
    [access.canAccessMensajes, 'Mensajes'],
    [access.canAccessConvocatorias, 'Convocatorias'],
    [access.canAccessWorkshops, 'Workshops'],
  ];
  const enabled = map.filter(([ok]) => ok).map(([, label]) => label);
  return enabled.length > 0 ? enabled.join(', ') : 'Solo acceso básico';
}

// Número de la asesora humana (Tatiana) para handoff por WhatsApp. Se toma de la
// config del asistente público (customizable en /administracion/asistente-ia);
// fallback al número por defecto si no está configurado.
async function buildHumanHandoffLine(
  client: PoolClient,
  role: string,
  displayName: string,
): Promise<string | null> {
  const { rows } = await client
    .query<{ whatsapp_number: string }>(
      `SELECT whatsapp_number FROM app_admin.public_assistant_settings
       WHERE whatsapp_number <> '' ORDER BY updated_at DESC LIMIT 1`,
    )
    .catch(() => ({ rows: [] as { whatsapp_number: string }[] }));
  const digits = (rows[0]?.whatsapp_number || '+573204876832').replace(/[^\d]/g, '');
  if (!digits) return null;
  const roleLabel =
    ({ lider: 'Líder', mentor: 'Advisor', gestor: 'Gestor', admin: 'Administrador', invitado: 'Invitado' } as Record<string, string>)[
      role
    ] ?? role;
  const text = encodeURIComponent(
    `Hola Tatiana, soy ${displayName} (${roleLabel}) desde la plataforma 4Shine y me gustaría hablar contigo.`,
  );
  return `- CONTACTO HUMANO (asesora Tatiana): si el usuario pide hablar con una persona / un asesor humano / con Tatiana, o necesita ayuda humana, entrégale ESTE enlace de WhatsApp (markdown) para chatear con la asesora humana: https://wa.me/${digits}?text=${text}`;
}

async function buildUserContext(client: PoolClient, actor: AuthUser): Promise<string> {
  const [access, profile, dashboard] = await Promise.all([
    getViewerAccessState(client, { userId: actor.userId, role: actor.role }, { includeCatalog: false }).catch(() => null),
    getMyProfile(client, actor).catch(() => null),
    getMyDashboard(client, actor).catch(() => null),
  ]);

  const lines: string[] = ['CONTEXTO DEL USUARIO (úsalo para personalizar; no lo recites literalmente):'];
  lines.push(`- Nombre: ${profile?.displayName ?? actor.name}`);
  lines.push(`- Rol: ${actor.role}`);

  const planName = profile?.subscriptionPlanName ?? access?.activePlan?.name ?? null;
  lines.push(`- Plan: ${planName ?? 'sin plan'}`);

  const expiresAt = profile?.subscriptionExpiresAt ?? null;
  if (expiresAt) {
    const st = subscriptionStatus(expiresAt);
    const days = st.daysUntil != null ? ` (${st.daysUntil} días)` : '';
    lines.push(`- Suscripción: ${st.label}${days}, vence ${formatExpiry(expiresAt)}`);
  } else {
    lines.push('- Suscripción: sin fecha de vencimiento registrada');
  }

  const handoffLine = await buildHumanHandoffLine(client, actor.role, profile?.displayName ?? actor.name);
  if (handoffLine) lines.push(handoffLine);

  if (access) lines.push(`- Accesos según su plan: ${enabledModulesText(access)}`);
  if (typeof access?.mentorshipSessionCredits === 'number') {
    lines.push(
      `- Créditos de mentorías 1:1 ADICIONALES (compradas aparte, NO son las incluidas en el plan): ${access.mentorshipSessionCredits}`,
    );
  }
  if (dashboard) {
    lines.push(
      `- Progreso de ruta: ${dashboard.routePercent}% · Diagnóstico: ${dashboard.discovery.done ? 'completado' : `${dashboard.discovery.completionPercent}%`} · Mentorías completadas: ${dashboard.mentorias.completed}, agendadas: ${dashboard.mentorias.scheduled} · Conexiones: ${dashboard.networking.connected}`,
    );
  }

  const mentoringBlock = await buildMentoringBlock(client, actor);
  if (mentoringBlock) lines.push(mentoringBlock);

  const convocatoriasBlock = await buildConvocatoriasBlock(client, actor);
  if (convocatoriasBlock) lines.push(convocatoriasBlock);

  const workshopsBlock = await buildWorkshopsBlock(client, actor);
  if (workshopsBlock) lines.push(workshopsBlock);

  const learningBlock = await buildLearningBlock(client, actor);
  if (learningBlock) lines.push(learningBlock);

  const networkingBlock = await buildNetworkingBlock(client, actor);
  if (networkingBlock) lines.push(networkingBlock);

  const advisorsBlock = await buildAdvisorsBlock(client);
  if (advisorsBlock) lines.push(advisorsBlock);

  return lines.join('\n');
}

/**
 * Advisors (mentores) de 4Shine. Es información pública (también en /advisors),
 * así que el asistente debe poder describir quiénes son y sus especialidades.
 */
async function buildAdvisorsBlock(client: PoolClient): Promise<string | null> {
  const advisors = await listPublicAdvisors(client, 60).catch(() => []);
  if (advisors.length === 0) return null;

  const out: string[] = [
    `ADVISERS (MENTORES) DE 4SHINE — información pública (también visible en /advisors). Hay ${advisors.length}. Cuando pregunten por los advisors, descríbelos con estos datos (nombre, profesión/rol, industria, experiencia, temas) y, si quieren a alguien en particular, ofrécele ver el perfil público en /advisors o agendar en /dashboard/mentorias:`,
  ];
  for (const a of advisors.slice(0, 25)) {
    const parts = [a.profession || a.jobRole, a.industry, a.yearsExperience].filter(Boolean).join(' · ');
    const temas = a.topics.length > 0 ? ` · temas: ${a.topics.slice(0, 6).join(', ')}` : '';
    const lugar = a.location || a.country ? ` · ${[a.location, a.country].filter(Boolean).join(', ')}` : '';
    out.push(`- ${a.name}${parts ? ` (${parts})` : ''}${lugar}${temas}`);
  }
  out.push('Perfiles públicos completos: /advisors');
  return out.join('\n');
}

/**
 * Estado real de convocatorias para que el asistente responda específico:
 * cuáles están abiertas, a cuáles ya aplicó el usuario y el enlace directo a
 * cada una (no la sección genérica).
 */
async function buildConvocatoriasBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const all = await listConvocatorias(client, actor, 100).catch(() => []);
  if (all.length === 0) return null;

  const visible = all.filter((c) => c.status !== 'draft');
  if (visible.length === 0) return null;

  const applied = visible.filter((c) => c.hasApplied);
  const open = visible.filter((c) => c.status === 'open');

  const statusLabel: Record<string, string> = {
    open: 'abierta',
    closed: 'cerrada',
    suspended: 'suspendida',
    draft: 'borrador',
  };

  const out: string[] = [
    'ESTADO REAL DE CONVOCATORIAS (usa estos datos y enlaza la convocatoria ESPECÍFICA, no solo la sección):',
    `Resumen: abiertas ${open.length} · ya aplicó a ${applied.length}.`,
    'Cada convocatoria tiene su propia página: /dashboard/convocatorias/<id>. Cuando el usuario mencione una por nombre, identifícala abajo y entrégale ese enlace directo. Si YA aplicó, díselo (puede retirar su aplicación desde esa página); si está cerrada, indícalo y no le pidas postularse.',
    'Listado:',
  ];
  for (const c of visible.slice(0, 30)) {
    const estado = statusLabel[c.status] ?? c.status;
    const aplicado = c.hasApplied ? ' · YA APLICÓ (puede retirar su aplicación)' : '';
    const lugar = c.location ? ` · ${c.location}` : '';
    out.push(`- «${c.title}» (${estado}${lugar})${aplicado} → /dashboard/convocatorias/${c.convocatoriaId}`);
  }
  return out.join('\n');
}

/** Estado real de workshops: inscritos, próximos y enlace directo a cada uno. */
async function buildWorkshopsBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const all = await listWorkshops(client, actor, 100).catch(() => []);
  if (all.length === 0) return null;

  const isRegistered = (s: string | null) => s === 'registered' || s === 'attended';
  const upcoming = all.filter((w) => w.status === 'upcoming');
  const registered = all.filter((w) => isRegistered(w.myAttendanceStatus));
  const statusLabel: Record<string, string> = { upcoming: 'próximo', completed: 'realizado', cancelled: 'cancelado' };

  const out: string[] = [
    'ESTADO REAL DE WORKSHOPS (enlaza el workshop ESPECÍFICO, no solo la sección):',
    `Resumen: próximos ${upcoming.length} · inscrito en ${registered.length}.`,
    'Cada workshop tiene su página /dashboard/workshops/<id>. Si el usuario ya está inscrito, díselo (y puede cancelar su inscripción ahí); si está cancelado o ya se realizó, indícalo.',
    'Listado:',
  ];
  for (const w of all.slice(0, 25)) {
    const estado = statusLabel[w.status] ?? w.status;
    const inscrito = isRegistered(w.myAttendanceStatus) ? ' · YA INSCRITO' : '';
    const cuando = w.startsAt ? ` · ${fmtDate(w.startsAt)}` : '';
    const lugar = w.locationName ? ` · ${w.locationName}` : '';
    out.push(`- «${w.title}» (${estado}${cuando}${lugar})${inscrito} → /dashboard/workshops/${w.workshopId}`);
  }
  return out.join('\n');
}

/** Estado real de aprendizaje: workbooks y su avance, próximo pendiente. */
async function buildLearningBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const workbooks = await listWorkbooks(client, actor).catch(() => []);
  if (workbooks.length === 0) return null;

  const sorted = [...workbooks].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const completed = sorted.filter((w) => w.completionPercent >= 100).length;
  const nextPending = sorted.find((w) => w.completionPercent < 100 && w.accessState === 'active');

  const out: string[] = [
    'ESTADO REAL DE APRENDIZAJE / WORKBOOKS (usa estos datos; el módulo está en /dashboard/aprendizaje):',
    `Resumen: ${sorted.length} workbooks · completados ${completed}.`,
  ];
  if (nextPending) {
    out.push(
      `Siguiente pendiente sugerido: ${nextPending.templateCode} «${nextPending.title}» (${Math.round(nextPending.completionPercent)}%). Invítalo a continuarlo en /dashboard/aprendizaje.`,
    );
  } else if (completed === sorted.length) {
    out.push('Tiene todos sus workbooks completados.');
  }
  out.push('Detalle:');
  for (const w of sorted.slice(0, 15)) {
    out.push(`- ${w.templateCode} «${w.title}»: ${Math.round(w.completionPercent)}%${w.accessState !== 'active' ? ' (no disponible aún)' : ''}.`);
  }
  return out.join('\n');
}

/** Estado real de networking: conexiones y solicitudes pendientes por responder. */
async function buildNetworkingBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const connections = await listConnections(client, actor, 200).catch(() => []);
  if (connections.length === 0) return null;

  const connected = connections.filter((c) => c.status === 'connected').length;
  // Pendientes que le llegaron a él (no las que él envió) = requieren su acción.
  const incomingPending = connections.filter((c) => c.status === 'pending' && c.requesterUserId !== actor.userId).length;
  const sentPending = connections.filter((c) => c.status === 'pending' && c.requesterUserId === actor.userId).length;

  const out: string[] = [
    'ESTADO REAL DE NETWORKING (módulo en /dashboard/networking):',
    `Conexiones activas: ${connected} · solicitudes recibidas por responder: ${incomingPending} · solicitudes enviadas pendientes: ${sentPending}.`,
  ];
  if (incomingPending > 0) {
    out.push(`Tiene ${incomingPending} solicitud(es) de conexión esperando su respuesta; sugiérele revisarlas en /dashboard/networking.`);
  }
  return out.join('\n');
}

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDate(iso, { timeZone: 'America/Bogota' });
}

/**
 * Estado real del programa de mentorías 1:1 + la regla de cadencia, para que el
 * asistente NO invente (p. ej. "0 créditos") y explique por qué se bloquean.
 */
async function buildMentoringBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const entitlements = await listProgramEntitlements(client, actor.userId).catch(() => []);

  // Agenda REAL: todas las sesiones 1:1 próximas del usuario (incluye adicionales,
  // que no están ligadas a una mentoría incluida del programa).
  const { rows: upcomingRows } = await client.query<{
    title: string;
    starts_at: string;
    session_origin: string | null;
    mentor_name: string | null;
  }>(
    `SELECT ms.title, ms.starts_at::text, ms.session_origin, u.display_name AS mentor_name
     FROM app_mentoring.session_participants sp
     JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = sp.session_id
     LEFT JOIN app_core.users u ON u.user_id = ms.mentor_user_id
     WHERE sp.user_id = $1::uuid
       AND sp.participant_role = 'mentee'
       AND ms.session_type = 'individual'
       AND ms.status = 'scheduled'
       AND ms.starts_at >= now()
     ORDER BY ms.starts_at
     LIMIT 20`,
    [actor.userId],
  ).catch(() => ({ rows: [] as { title: string; starts_at: string; session_origin: string | null; mentor_name: string | null }[] }));

  if (entitlements.length === 0 && upcomingRows.length === 0) return null;

  const sorted = [...entitlements].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const included = sorted.length;
  const completed = sorted.filter((e) => e.status === 'completed').length;
  const scheduled = sorted.filter((e) => e.status === 'scheduled').length;
  const availableNow = sorted.filter((e) => e.status === 'available');
  const now = Date.now();

  // La sesión agendada que aún bloquea a las siguientes (su inicio + 10 días no ha pasado).
  const blocker = sorted
    .filter((e) => e.status === 'scheduled' && e.scheduledStartsAt && new Date(e.scheduledStartsAt).getTime() + TEN_DAYS_MS > now)
    .sort((a, b) => a.sequenceNo - b.sequenceNo)[0];
  const nextUnlockDate = blocker?.scheduledStartsAt
    ? fmtDate(new Date(new Date(blocker.scheduledStartsAt).getTime() + TEN_DAYS_MS).toISOString())
    : null;

  const out: string[] = [];

  // ── Agenda REAL (fuente de verdad de "qué tengo agendado") ──
  if (upcomingRows.length > 0) {
    out.push(
      'AGENDA REAL — TODAS tus próximas sesiones 1:1 agendadas (incluye las incluidas del programa Y las adicionales). Esta es la fuente de verdad de "qué tienes agendado"; NO te limites a las del programa:',
    );
    for (const s of upcomingRows) {
      const tipo = s.session_origin === 'program_included' ? 'incluida del programa' : 'adicional';
      const con = s.mentor_name ? ` con ${s.mentor_name}` : '';
      out.push(`- «${s.title}»: ${fmtDate(s.starts_at)}${con} (${tipo}).`);
    }
  }

  // ── Programa (las 10 incluidas + regla de cadencia) ──
  if (entitlements.length > 0) {
    out.push(
      'ESTADO DE LAS MENTORÍAS 1:1 INCLUIDAS DEL PROGRAMA (usa estos datos; NO inventes créditos ni límites):',
      'Regla de cadencia (directiva del programa): las mentorías 1:1 incluidas se habilitan EN ORDEN y de a una. La SIGUIENTE solo se habilita 10 días DESPUÉS de la fecha de inicio de la sesión anterior ya agendada. Vienen INCLUIDAS en el plan y NO requieren "créditos"; los créditos adicionales son solo para mentorías extra compradas aparte. Tener 0 créditos adicionales NO impide agendar las incluidas: lo que las habilita/bloquea es el orden y la cadencia de 10 días.',
      `Resumen del programa: incluidas ${included} · completadas ${completed} · agendadas ${scheduled} · disponibles para agendar ahora ${availableNow.length}. (Nota: las sesiones ADICIONALES no cuentan aquí; mira la AGENDA REAL de arriba.)`,
    );
    if (availableNow[0]) {
      out.push(`Puede agendar AHORA (incluida): Mentoría ${String(availableNow[0].sequenceNo).padStart(2, '0')} «${availableNow[0].title}».`);
    } else if (nextUnlockDate) {
      out.push(`No hay ninguna INCLUIDA disponible ahora; la siguiente se habilita el ${nextUnlockDate} (10 días después de la sesión agendada que está en curso).`);
    }
    out.push('Detalle por mentoría incluida:');
    for (const e of sorted) {
      const code = `M${String(e.sequenceNo).padStart(2, '0')}`;
      if (e.status === 'completed') {
        out.push(`- ${code} «${e.title}»: completada.`);
      } else if (e.status === 'scheduled') {
        const blocks = blocker && e.sequenceNo === blocker.sequenceNo ? ` → bloquea las siguientes hasta el ${nextUnlockDate}` : '';
        out.push(`- ${code} «${e.title}»: agendada para ${fmtDate(e.scheduledStartsAt)}${blocks}.`);
      } else if (e.status === 'available') {
        out.push(`- ${code} «${e.title}»: disponible para agendar ahora.`);
      } else {
        const when = blocker && e.sequenceNo === (blocker.sequenceNo + 1) && nextUnlockDate ? ` (se habilita el ${nextUnlockDate})` : ' (pendiente de que se liberen las anteriores)';
        out.push(`- ${code} «${e.title}»: bloqueada${when}.`);
      }
    }
    if (nextUnlockDate) {
      out.push(
        `INSTRUCCIÓN: si preguntan por una INCLUIDA bloqueada o por qué no puede agendar la siguiente incluida, indica la fecha exacta de habilitación (${nextUnlockDate}) y la cadencia de 10 días. Pero si preguntan "qué tengo agendado", responde con la AGENDA REAL (incluye adicionales), no solo las incluidas.`,
      );
    }
  }
  return out.join('\n');
}

const ROUTE_MAP = `RUTAS INTERNAS (entrégalas como enlaces markdown cuando el usuario quiera hacer algo; NO ejecutes la acción tú).
IMPORTANTE: usa SIEMPRE la ruta RELATIVA tal cual (empieza con "/"). NUNCA antepongas un dominio; en particular NUNCA escribas "4shine.com" (ese es otro sitio). El dominio correcto es 4shine.co, pero basta con la ruta relativa.
- Perfil, editar datos, foto, cambiar contraseña, eliminar cuenta: /dashboard/perfil
- Suscripción, plan, días restantes: /dashboard/suscripcion
- Workshops (inscribirse): /dashboard/workshops
- Mentorías (agendar/comprar): /dashboard/mentorias
- Advisors / mentores (perfiles PÚBLICOS de quienes acompañan): /advisors
- Líderes (panel de los LÍDERES/clientes del programa y su progreso; solo para advisor/mentor, gestor o admin): /dashboard/lideres
- Formación de advisors (cursos para mentores): /dashboard/formacion-mentores
- Aprendizaje, cursos, workbooks: /dashboard/aprendizaje
- Descubrimiento / diagnóstico: /dashboard/descubrimiento
- Networking, contactos, comunidades: /dashboard/networking
- Mensajes: /dashboard/mensajes
- Trayectoria: /dashboard/trayectoria`;

const GLOSSARY = `GLOSARIO DE 4SHINE — NO confundas estos términos:
- "Líderes": son los participantes/clientes del programa (rol "lider"). Quien los gestiona (advisor/mentor, gestor o admin) ve el panel de líderes con su progreso en /dashboard/lideres. Si el usuario pregunta "dónde veo los líderes", se refiere a ESTE panel (NO a /advisors), siempre que su rol lo permita.
- "Advisors" o "Mentores" (rol "mentor"): son quienes ACOMPAÑAN a los líderes. Sus perfiles públicos están en /advisors y se agenda con ellos en /dashboard/mentorias.
Por tanto: "líderes" ≠ "advisors/mentores". Usa el rol del usuario (en el contexto) para decidir: a un mentor/gestor/admin que pregunta por "los líderes" envíalo a /dashboard/lideres; si pregunta por mentores/advisors, a /advisors.`;

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de soporte 360 de 4Shine, una plataforma de liderazgo. Respondes en español, con tono cercano, profesional, claro y conciso, y SIEMPRE diriges al usuario por su nombre.

DIRECTIVA PRINCIPAL — Conoce muy bien el ROL y el PLAN del usuario y orienta cada respuesta a partir de ellos:
- Adapta la respuesta al rol (líder, advisor/mentor, gestor, admin, invitado): un líder pregunta por su proceso; un advisor por sus mentorías y agenda; un gestor/admin por administración.
- Razona con el plan del usuario y los accesos que ese plan habilita. Si pregunta por algo que su plan no incluye, díselo con claridad y ofrécele la ruta para cambiar de plan.

NO INVENTES datos. Usa exclusivamente el CONTEXTO DEL USUARIO provisto (plan, accesos, días de suscripción, progreso, estado real de mentorías). Si un dato no está en tu contexto, dilo con honestidad en vez de suponer cifras, créditos o límites.

MENTORÍAS 1:1: las incluidas en el plan NO son "créditos". No digas que "faltan créditos" para las incluidas. Si el usuario no puede agendar, explícale la regla real: se habilitan en orden, de a una, y la siguiente se habilita 10 días después de la fecha de inicio de la sesión anterior agendada; indícale, con los datos del contexto, cuál es la próxima y cuándo se habilita.

NO EJECUTAS acciones ni cambios en la plataforma. Cuando el usuario quiera hacer algo (actualizar perfil, cambiar contraseña, eliminar cuenta, agendar/comprar mentorías, inscribirse a un workshop, etc.) explícale brevemente cómo y entrégale el enlace interno correcto como enlace markdown.

HANDOFF A HUMANO: Si el usuario pide hablar con una persona / un humano / un asesor real / con Tatiana, o expresa que necesita ayuda humana o que el bot no le resuelve, entrégale el enlace de WhatsApp de la asesora humana Tatiana que aparece en el CONTEXTO DEL USUARIO (línea "CONTACTO HUMANO"), como enlace markdown (p. ej. "[Hablar con Tatiana por WhatsApp](enlace)"), e invítalo con calidez a escribirle por ahí. NUNCA inventes el número: usa exactamente el enlace del contexto. Primero intenta resolver tú; ofrece el handoff cuando lo pidan o cuando claramente necesiten atención humana.

Personaliza la atención: sé empático, anticipa el siguiente paso útil según el estado del usuario y ofrece el enlace o la acción concreta. Usa Markdown y enlaces.`;

async function callOpenAi(
  client: PoolClient,
  actor: AuthUser,
  settingsModel: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string | null> {
  const cfg = await getIntegrationConfigForActor(client, actor.userId, 'openai');
  if (!cfg || !cfg.enabled) {
    console.error('[chatbot] OpenAI sin config/deshabilitado', { hasCfg: !!cfg, enabled: cfg?.enabled });
    return null;
  }
  const apiKey = (cfg.wizardData.apiKey || cfg.secretValue || '').trim();
  if (!apiKey) {
    console.error('[chatbot] OpenAI sin apiKey');
    return null;
  }

  const baseUrl = sanitizeBaseUrl(cfg.wizardData.baseUrl);
  const model = (settingsModel.trim() || cfg.wizardData.model?.trim() || 'gpt-4.1').trim();
  const timeoutMs = Number(cfg.wizardData.timeoutMs) > 0 ? Number(cfg.wizardData.timeoutMs) : 20000;

  // Hasta 3 intentos: reintenta en timeouts/red y en 429/5xx (transitorios).
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0.4, max_tokens: 900, messages }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = json.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) return content.trim();
        console.error('[chatbot] OpenAI respuesta sin contenido', { model });
        return null;
      }
      const body = await res.text().catch(() => '');
      console.error('[chatbot] OpenAI respuesta no-OK', {
        status: res.status,
        model,
        baseUrl,
        attempt,
        body: body.replace(/sk-[A-Za-z0-9_-]+/g, 'sk-REDACTED').slice(0, 400),
      });
      // 4xx (401/400/404...) no son recuperables con reintento.
      if (res.status !== 429 && res.status < 500) return null;
    } catch (error) {
      console.error('[chatbot] OpenAI fetch lanzó excepción', {
        attempt,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    // Backoff antes del siguiente intento.
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return null;
}

const FALLBACK_REPLY =
  'Por ahora no puedo conectar con la IA. Mientras tanto, puedes gestionar todo desde el menú: tu **perfil** en [/dashboard/perfil](/dashboard/perfil), tu **suscripción** en [/dashboard/suscripcion](/dashboard/suscripcion), **workshops** en [/dashboard/workshops](/dashboard/workshops) y **mentorías** en [/dashboard/mentorias](/dashboard/mentorias).';

export async function sendMessage(
  client: PoolClient,
  actor: AuthUser,
  input: { conversationId?: string | null; text: string },
): Promise<SendMessageResult> {
  const text = input.text.trim();
  if (!text) throw new Error('El mensaje está vacío.');
  const orgId = await resolveOrgId(client, actor.userId);
  const settings = await loadSettings(client, orgId);
  if (!settings.is_enabled) throw new Error('El asistente no está disponible en este momento.');

  // Conversación (validada por RLS: solo la del propio usuario).
  let conversationId = input.conversationId ?? null;
  if (conversationId) {
    const { rows } = await client.query<{ conversation_id: string }>(
      `SELECT conversation_id::text FROM app_core.chatbot_conversations WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
      [conversationId, actor.userId],
    );
    if (!rows[0]) conversationId = null;
  }
  if (!conversationId) {
    const { rows } = await client.query<{ conversation_id: string }>(
      `INSERT INTO app_core.chatbot_conversations (user_id, organization_id, title)
       VALUES ($1, $2, $3) RETURNING conversation_id::text`,
      [actor.userId, orgId, text.slice(0, 60)],
    );
    conversationId = rows[0].conversation_id;
  }

  await client.query(
    `INSERT INTO app_core.chatbot_messages (conversation_id, user_id, organization_id, role, content)
     VALUES ($1, $2, $3, 'user', $4)`,
    [conversationId, actor.userId, orgId, text],
  );

  // Contexto + FAQs + system prompt.
  const [contextText, { rows: faqRows }] = await Promise.all([
    buildUserContext(client, actor),
    client.query<{ question: string; answer: string }>(
      `SELECT question, answer FROM app_admin.chatbot_faqs WHERE organization_id = $1 AND is_active = true ORDER BY sort_order LIMIT 50`,
      [orgId],
    ),
  ]);
  const faqsText =
    faqRows.length > 0
      ? `BASE DE CONOCIMIENTO (responde con base en esto cuando aplique):\n${faqRows.map((f) => `P: ${f.question}\nR: ${f.answer}`).join('\n\n')}`
      : '';

  const systemContent = [
    settings.persona ? `Eres "${settings.persona}".` : '',
    settings.system_prompt.trim() || DEFAULT_SYSTEM_PROMPT,
    GLOSSARY,
    ROUTE_MAP,
    contextText,
    faqsText,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Historial reciente (incluye el mensaje recién insertado).
  const { rows: recent } = await client.query<{ role: 'user' | 'assistant'; content: string }>(
    `SELECT role, content FROM app_core.chatbot_messages
     WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [conversationId, settings.max_context_messages],
  );
  const history = recent.reverse().map((m) => ({ role: m.role, content: m.content }));

  const reply =
    (await callOpenAi(client, actor, settings.model, [{ role: 'system', content: systemContent }, ...history])) ??
    FALLBACK_REPLY;

  await client.query(
    `INSERT INTO app_core.chatbot_messages (conversation_id, user_id, organization_id, role, content)
     VALUES ($1, $2, $3, 'assistant', $4)`,
    [conversationId, actor.userId, orgId, reply],
  );
  await client.query(`UPDATE app_core.chatbot_conversations SET updated_at = now() WHERE conversation_id = $1`, [
    conversationId,
  ]);

  return { conversationId, reply };
}
