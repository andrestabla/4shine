import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listNotificationHistory } from '@/features/notificaciones/bulk-service';
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationHistoryFilter,
} from '@/features/notificaciones/types';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const filter: NotificationHistoryFilter = {
    channel: (url.searchParams.get('channel') as NotificationChannel) || undefined,
    source: (url.searchParams.get('source') as 'manual' | 'automatic' | 'all') || undefined,
    status:
      (url.searchParams.get('status') as NotificationDeliveryStatus) || undefined,
    recipientSearch: url.searchParams.get('q') || undefined,
    senderUserId: url.searchParams.get('sender') || undefined,
    fromDate: url.searchParams.get('from') || undefined,
    toDate: url.searchParams.get('to') || undefined,
    limit: Number(url.searchParams.get('limit') ?? 50),
    offset: Number(url.searchParams.get('offset') ?? 0),
  };

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listNotificationHistory(client, identity, filter),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo cargar el historial.');
  }
}
