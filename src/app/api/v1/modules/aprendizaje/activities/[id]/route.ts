import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  deleteActivity,
  getActivityForContent,
  upsertActivity,
} from '@/features/aprendizaje/activities/service';
import type { UpsertActivityInput } from '@/features/aprendizaje/activities/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id: contentId } = await params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        getActivityForContent(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load activity');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id: contentId } = await params;
  const body = await parseJsonBody<UpsertActivityInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        upsertActivity(client, identity, { ...body, contentId }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to save activity');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id: contentId } = await params;
  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        deleteActivity(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete activity');
  }
}
