import { requestApi } from '@/lib/api-client';
import type {
  NotificationTemplateRecord,
  NotificationEventConfigRecord,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpdateEventConfigInput,
  NotificationGlobalSettings,
} from './types';

export type {
  NotificationTemplateRecord,
  NotificationEventConfigRecord,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpdateEventConfigInput,
  NotificationGlobalSettings,
} from './types';

// Safe response envelope (requestApi throws on error; we catch and wrap)
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

const BASE = '/api/v1/modules/administracion/notificaciones';

// ─── Templates ────────────────────────────────────────────────────────────────

export function listTemplates() {
  return safe(() => requestApi<NotificationTemplateRecord[]>(`${BASE}/templates`));
}

export function getTemplate(templateId: string) {
  return safe(() => requestApi<NotificationTemplateRecord>(`${BASE}/templates/${templateId}`));
}

export function createTemplate(input: CreateTemplateInput) {
  return safe(() =>
    requestApi<NotificationTemplateRecord>(`${BASE}/templates`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  return safe(() =>
    requestApi<NotificationTemplateRecord>(`${BASE}/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export function deleteTemplate(templateId: string) {
  return safe(() =>
    requestApi<{ deleted: true }>(`${BASE}/templates/${templateId}`, { method: 'DELETE' }),
  );
}

export function sendTestTemplate(templateId: string, toEmail: string) {
  return safe(() =>
    requestApi<{ sent: true }>(`${BASE}/templates/${templateId}/test`, {
      method: 'POST',
      body: JSON.stringify({ toEmail }),
    }),
  );
}

export function previewTemplate(templateId: string, sampleVars: Record<string, string>) {
  return safe(() =>
    requestApi<{
      subject: string;
      bodyHtml: string;
      bodyText: string;
      inAppTitle: string;
      inAppBody: string;
    }>(`${BASE}/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify({ sampleVars }),
    }),
  );
}

// ─── Global Settings ──────────────────────────────────────────────────────────

export function getNotificationSettings() {
  return safe(() => requestApi<NotificationGlobalSettings>(`${BASE}/settings`));
}

export function updateNotificationSettings(input: NotificationGlobalSettings) {
  return safe(() =>
    requestApi<NotificationGlobalSettings>(`${BASE}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

// ─── Event Configurations ─────────────────────────────────────────────────────

export function listEventConfigs() {
  return safe(() => requestApi<NotificationEventConfigRecord[]>(`${BASE}/events`));
}

export function updateEventConfig(
  eventKey: string,
  moduleCode: string,
  input: UpdateEventConfigInput,
) {
  return safe(() =>
    requestApi<NotificationEventConfigRecord>(`${BASE}/events`, {
      method: 'PATCH',
      body: JSON.stringify({ eventKey, moduleCode, ...input }),
    }),
  );
}

// ─── User notifications ───────────────────────────────────────────────────────

export function markNotificationRead(notificationId: string) {
  return safe(() =>
    requestApi<{ ok: true }>(`/api/v1/modules/notificaciones/${notificationId}/read`, {
      method: 'POST',
    }),
  );
}
