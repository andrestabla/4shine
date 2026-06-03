import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { previewBulkAudience } from '@/features/notificaciones/bulk-service';
import type { BulkAudienceFilter } from '@/features/notificaciones/types';
import {
  errorResponse,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ filter?: BulkAudienceFilter }>(request);
  const filter = body?.filter ?? {};

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        previewBulkAudience(client, identity, filter),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo calcular la audiencia.');
  }
}
