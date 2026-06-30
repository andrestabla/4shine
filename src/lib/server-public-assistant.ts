import { withClient } from '@/server/db/pool';
import { getPublicAssistant } from '@/features/chatbot/public-assistant-service';
import type { PublicAssistantConfig } from '@/features/chatbot/types';

const DISABLED: PublicAssistantConfig = {
  enabled: false,
  assistantName: 'Tatiana',
  avatarUrl: '',
  greeting: '',
  intro: '',
  whatsappNumber: '',
  whatsappIntro: '',
  options: [],
};

/** Carga la config del asistente del sitio público para el MarketingShell. */
export async function loadPublicAssistant(): Promise<PublicAssistantConfig> {
  try {
    return await withClient((client) => getPublicAssistant(client));
  } catch {
    return DISABLED;
  }
}
