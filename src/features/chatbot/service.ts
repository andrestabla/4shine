import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { getIntegrationConfigForActor } from '@/server/integrations/config';
import { getViewerAccessState } from '@/features/access/service';
import { getMyProfile } from '@/features/perfil/service';
import { getMyDashboard } from '@/features/dashboard/service';
import { listProgramEntitlements } from '@/features/mentorias/service';
import { listConvocatorias } from '@/features/convocatorias/service';
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
    avatarUrl: settings.avatar_url,
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

  return lines.join('\n');
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

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });
}

/**
 * Estado real del programa de mentorías 1:1 + la regla de cadencia, para que el
 * asistente NO invente (p. ej. "0 créditos") y explique por qué se bloquean.
 */
async function buildMentoringBlock(client: PoolClient, actor: AuthUser): Promise<string | null> {
  const entitlements = await listProgramEntitlements(client, actor.userId).catch(() => []);
  if (entitlements.length === 0) return null;

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

  const out: string[] = [
    'ESTADO REAL DE LAS MENTORÍAS 1:1 DEL PROGRAMA (usa estos datos; NO inventes créditos ni límites):',
    'Regla de cadencia (directiva del programa): las mentorías 1:1 incluidas se habilitan EN ORDEN y de a una. La SIGUIENTE solo se habilita 10 días DESPUÉS de la fecha de inicio de la sesión anterior ya agendada. Vienen INCLUIDAS en el plan y NO requieren "créditos"; los créditos adicionales son solo para mentorías extra compradas aparte. Tener 0 créditos adicionales NO impide agendar las incluidas: lo que las habilita/bloquea es el orden y la cadencia de 10 días.',
    `Resumen: incluidas en el plan ${included} · completadas ${completed} · agendadas ${scheduled} · disponibles para agendar ahora ${availableNow.length}.`,
  ];
  if (availableNow[0]) {
    out.push(`Puede agendar AHORA: Mentoría ${String(availableNow[0].sequenceNo).padStart(2, '0')} «${availableNow[0].title}».`);
  } else if (nextUnlockDate) {
    out.push(`No hay ninguna disponible ahora; la siguiente se habilita el ${nextUnlockDate} (10 días después de la sesión agendada que está en curso).`);
  }
  out.push('Detalle por sesión:');
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
      `INSTRUCCIÓN OBLIGATORIA: si el usuario pregunta por qué no puede agendar, o por una mentoría bloqueada, indícale SIEMPRE de forma explícita la fecha exacta en que se habilita la próxima (${nextUnlockDate}) y por qué (cadencia de 10 días tras la sesión anterior agendada). No respondas en términos vagos ni menciones "créditos".`,
    );
  } else if (availableNow[0]) {
    out.push(
      `INSTRUCCIÓN OBLIGATORIA: hay una mentoría disponible para agendar ahora (Mentoría ${String(availableNow[0].sequenceNo).padStart(2, '0')}); indícale que puede agendarla ya y entrégale el enlace a /dashboard/mentorias. No menciones "créditos".`,
    );
  }
  return out.join('\n');
}

const ROUTE_MAP = `RUTAS INTERNAS (entrégalas como enlaces markdown cuando el usuario quiera hacer algo; NO ejecutes la acción tú):
- Perfil, editar datos, foto, cambiar contraseña, eliminar cuenta: /dashboard/perfil
- Suscripción, plan, días restantes: /dashboard/suscripcion
- Workshops (inscribirse): /dashboard/workshops
- Mentorías (agendar/comprar): /dashboard/mentorias
- Aprendizaje, cursos, workbooks: /dashboard/aprendizaje
- Descubrimiento / diagnóstico: /dashboard/descubrimiento
- Networking, contactos, comunidades: /dashboard/networking
- Mensajes: /dashboard/mensajes
- Trayectoria: /dashboard/trayectoria`;

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de soporte 360 de 4Shine, una plataforma de liderazgo. Respondes en español, con tono cercano, profesional, claro y conciso, y SIEMPRE diriges al usuario por su nombre.

DIRECTIVA PRINCIPAL — Conoce muy bien el ROL y el PLAN del usuario y orienta cada respuesta a partir de ellos:
- Adapta la respuesta al rol (líder, adviser/mentor, gestor, admin, invitado): un líder pregunta por su proceso; un adviser por sus mentorías y agenda; un gestor/admin por administración.
- Razona con el plan del usuario y los accesos que ese plan habilita. Si pregunta por algo que su plan no incluye, díselo con claridad y ofrécele la ruta para cambiar de plan.

NO INVENTES datos. Usa exclusivamente el CONTEXTO DEL USUARIO provisto (plan, accesos, días de suscripción, progreso, estado real de mentorías). Si un dato no está en tu contexto, dilo con honestidad en vez de suponer cifras, créditos o límites.

MENTORÍAS 1:1: las incluidas en el plan NO son "créditos". No digas que "faltan créditos" para las incluidas. Si el usuario no puede agendar, explícale la regla real: se habilitan en orden, de a una, y la siguiente se habilita 10 días después de la fecha de inicio de la sesión anterior agendada; indícale, con los datos del contexto, cuál es la próxima y cuándo se habilita.

NO EJECUTAS acciones ni cambios en la plataforma. Cuando el usuario quiera hacer algo (actualizar perfil, cambiar contraseña, eliminar cuenta, agendar/comprar mentorías, inscribirse a un workshop, etc.) explícale brevemente cómo y entrégale el enlace interno correcto como enlace markdown.

Personaliza la atención: sé empático, anticipa el siguiente paso útil según el estado del usuario y ofrece el enlace o la acción concreta. Usa Markdown y enlaces.`;

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
