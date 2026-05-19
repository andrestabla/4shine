import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getNotificationInterest, setNotificationInterest } from '@/features/convocatorias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getNotificationInterest(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data: { interested: data } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to get notification interest');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ interested: boolean }>(request);
  if (body?.interested === undefined) return NextResponse.json({ ok: false, error: 'interested is required' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        setNotificationInterest(client, identity, body.interested),
      ),
    );
    return NextResponse.json({ ok: true, data: { interested: data } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to set notification interest');
  }
}
