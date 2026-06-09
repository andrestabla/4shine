import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  deleteAssignment,
  getAssignmentForContent,
  upsertAssignment,
} from '@/features/aprendizaje/assignments/service';
import type { UpsertAssignmentInput } from '@/features/aprendizaje/assignments/types';
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
        getAssignmentForContent(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load assignment');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id: contentId } = await params;
  const body = await parseJsonBody<UpsertAssignmentInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        upsertAssignment(client, identity, { ...body, contentId }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to save assignment');
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
        deleteAssignment(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete assignment');
  }
}
