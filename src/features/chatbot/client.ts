import { requestApi } from '@/lib/api-client';
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

export type {
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

interface SafeResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<SafeResponse<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

const ADMIN = '/api/v1/modules/administracion/chatbot';
const ME = '/api/v1/me/chatbot';

// ─── Admin: settings ──────────────────────────────────────────────────────────

export function getSettings() {
  return safe(() => requestApi<ChatbotSettings>(`${ADMIN}/settings`));
}

export function updateSettings(input: UpdateChatbotSettingsInput) {
  return safe(() =>
    requestApi<ChatbotSettings>(`${ADMIN}/settings`, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}

// ─── Admin: FAQs ──────────────────────────────────────────────────────────────

export function listFaqs() {
  return safe(() => requestApi<ChatbotFaq[]>(`${ADMIN}/faqs`));
}

export function createFaq(input: CreateFaqInput) {
  return safe(() => requestApi<ChatbotFaq>(`${ADMIN}/faqs`, { method: 'POST', body: JSON.stringify(input) }));
}

export function updateFaq(faqId: string, input: UpdateFaqInput) {
  return safe(() =>
    requestApi<ChatbotFaq>(`${ADMIN}/faqs/${faqId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}

export function deleteFaq(faqId: string) {
  return safe(() => requestApi<{ ok: true }>(`${ADMIN}/faqs/${faqId}`, { method: 'DELETE' }));
}

// ─── Admin: conversaciones + analítica ──────────────────────────────────────

export function listConversations() {
  return safe(() => requestApi<AdminConversation[]>(`${ADMIN}/conversations`));
}

export function getConversationMessages(conversationId: string) {
  return safe(() => requestApi<ChatMessage[]>(`${ADMIN}/conversations/${conversationId}`));
}

export function getAnalytics() {
  return safe(() => requestApi<ChatbotAnalytics>(`${ADMIN}/analytics`));
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export function getMyChatbot() {
  return safe(() => requestApi<ChatbotPublic>(ME));
}

export function sendChatMessage(input: { conversationId?: string | null; text: string }) {
  return safe(() =>
    requestApi<SendMessageResult>(`${ME}/message`, { method: 'POST', body: JSON.stringify(input) }),
  );
}
