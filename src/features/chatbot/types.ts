export interface ChatbotSettings {
  organizationId: string;
  isEnabled: boolean;
  model: string;
  persona: string;
  systemPrompt: string;
  welcomeMessage: string;
  maxContextMessages: number;
  updatedAt: string;
}

export interface UpdateChatbotSettingsInput {
  isEnabled?: boolean;
  model?: string;
  persona?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
  maxContextMessages?: number;
}

export interface ChatbotFaq {
  faqId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateFaqInput = Partial<CreateFaqInput>;

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  messageId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/** Lo que el widget recibe al abrir. */
export interface ChatbotPublic {
  enabled: boolean;
  welcomeMessage: string;
  persona: string;
  conversationId: string | null;
  messages: ChatMessage[];
}

export interface SendMessageResult {
  conversationId: string;
  reply: string;
}

export interface AdminConversation {
  conversationId: string;
  userId: string;
  userName: string;
  title: string;
  lastMessage: string | null;
  messageCount: number;
  updatedAt: string;
}

export interface ChatbotAnalytics {
  conversations: number;
  messages: number;
  activeUsers: number;
}
