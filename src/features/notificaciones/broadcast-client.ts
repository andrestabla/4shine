import { requestApi } from '@/lib/api-client';
import type {
  BulkAudienceFilter,
  BulkAudiencePreview,
  BulkSendInput,
  BulkSendResult,
  NotificationHistoryFilter,
  NotificationHistoryPage,
} from './types';

export async function previewAudience(
  filter: BulkAudienceFilter,
): Promise<BulkAudiencePreview> {
  return requestApi<BulkAudiencePreview>(
    '/api/v1/modules/administracion/notificaciones/broadcast/audience',
    {
      method: 'POST',
      body: JSON.stringify({ filter }),
    },
  );
}

export async function sendBroadcast(input: BulkSendInput): Promise<BulkSendResult> {
  return requestApi<BulkSendResult>(
    '/api/v1/modules/administracion/notificaciones/broadcast/send',
    {
      method: 'POST',
      body: JSON.stringify(input),
      timeoutMs: 180_000,
    },
  );
}

export async function listHistory(
  filter: NotificationHistoryFilter = {},
): Promise<NotificationHistoryPage> {
  const params = new URLSearchParams();
  if (filter.channel) params.set('channel', filter.channel);
  if (filter.source) params.set('source', filter.source);
  if (filter.status) params.set('status', filter.status);
  if (filter.recipientSearch) params.set('q', filter.recipientSearch);
  if (filter.senderUserId) params.set('sender', filter.senderUserId);
  if (filter.fromDate) params.set('from', filter.fromDate);
  if (filter.toDate) params.set('to', filter.toDate);
  if (filter.limit !== undefined) params.set('limit', String(filter.limit));
  if (filter.offset !== undefined) params.set('offset', String(filter.offset));

  const qs = params.toString();
  return requestApi<NotificationHistoryPage>(
    `/api/v1/modules/administracion/notificaciones/history${qs ? `?${qs}` : ''}`,
  );
}
