import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { getViewerAccessState } from '@/features/access/service';
import { getMyProfile } from '@/features/perfil/service';
import { getMyDashboard } from '@/features/dashboard/service';
import { subscriptionStatus, formatExpiry } from '@/features/usuarios/subscription-status';
import type {
  AdminConversation,
  ChatbotAnalytics,
  ChatbotFaq,
  ChatbotPublic,
  ChatbotSettings,
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
  system_prompt: string;
  welcome_message: string;
  max_context_messages: number;
  updated_at: string;
}

const SETTINGS_SELECT = `
  organization_id::text, is_enabled, model, persona, system_prompt,
  welcome_message, max_context_messages, updated_at::text
`;

function toSettings(row: SettingsRow): ChatbotSettings {
  return {
    organizationId: row.organization_id,
    isEnabled: row.is_enabled,
    model: row.model,
    persona: row.persona,
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
  }

  return {
    enabled: settings.is_enabled,
    welcomeMessage: settings.welcome_message,
    persona: settings.persona,
    conversationId,
    messages,
  };
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

  if (access) lines.push(`- Accesos según su plan: ${enabledModulesText(access)}`);
  if (typeof access?.mentorshipSessionCredits === 'number') {
    lines.push(`- Créditos de mentoría 1:1: ${access.mentorshipSessionCredits}`);
  }
  if (dashboard) {
    lines.push(
      `- Progreso de ruta: ${dashboard.routePercent}% · Diagnóstico: ${dashboard.discovery.done ? 'completado' : `${dashboard.discovery.completionPercent}%`} · Mentorías completadas: ${dashboard.mentorias.completed}, agendadas: ${dashboard.mentorias.scheduled} · Conexiones: ${dashboard.networking.connected}`,
    );
  }
  return lines.join('\n');
}

const ROUTE_MAP = `RUTAS INTERNAS (entrégalas como enlaces markdown cuando el usuario quiera hacer algo; NO ejecutes la acción tú):
- Perfil, editar datos, foto, eliminar cuenta: /dashboard/perfil
- Suscripción, plan, días restantes: /dashboard/suscripcion
- Workshops (inscribirse): /dashboard/workshops
- Mentorías (agendar/comprar): /dashboard/mentorias
- Aprendizaje, cursos, workbooks: /dashboard/aprendizaje
- Descubrimiento / diagnóstico: /dashboard/descubrimiento
- Networking, contactos, comunidades: /dashboard/networking
- Mensajes: /dashboard/mensajes
- Trayectoria: /dashboard/trayectoria`;

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de soporte 360 de 4Shine, una plataforma de liderazgo. Respondes en español, con tono cercano, profesional, claro y conciso. Conoces al usuario por el contexto provisto y lo usas para responder con precisión (acceso según su plan, días de suscripción, progreso, mentorías, etc.). IMPORTANTE: NO ejecutas acciones ni cambios en la plataforma; cuando el usuario quiera hacer algo (actualizar perfil, eliminar cuenta, inscribirse a un workshop, etc.) explícale brevemente cómo y entrégale el enlace interno correcto. Si algo no está en tu información, dilo con honestidad. Usa Markdown y enlaces.`;

async function callOpenAi(
  client: PoolClient,
  actor: AuthUser,
  settingsModel: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string | null> {
  const cfg = await getIntegrationConfigForActor(client, actor.userId, 'openai');
  if (!cfg || !cfg.enabled) return null;
  const apiKey = (cfg.wizardData.apiKey || cfg.secretValue || '').trim();
  if (!apiKey) return null;

  const baseUrl = sanitizeBaseUrl(cfg.wizardData.baseUrl);
  const model = (settingsModel.trim() || cfg.wizardData.model?.trim() || 'gpt-4.1').trim();

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.4, max_tokens: 900, messages }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
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
