import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listAudience } from '@/features/notificaciones/bulk-service';
import type { BulkAudienceFilter } from '@/features/notificaciones/types';
import {
  errorResponse,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{
    filter?: BulkAudienceFilter;
    limit?: number;
    offset?: number;
  }>(request);
  const filter = body?.filter ?? {};

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listAudience(client, identity, filter, {
          limit: body?.limit,
          offset: body?.offset,
        }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo cargar la audiencia.');
  }
}
