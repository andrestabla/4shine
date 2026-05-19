import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createForumPost, listForumPosts } from '@/features/convocatorias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listForumPosts(client, identity, id),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list forum posts');
  }
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ body: string; isPinned?: boolean }>(request);
  if (!body?.body) return NextResponse.json({ ok: false, error: 'body is required' }, { status: 400 });

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        createForumPost(client, identity, id, body.body, body.isPinned ?? false),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create forum post');
  }
}
