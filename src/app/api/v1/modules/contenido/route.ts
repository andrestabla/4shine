import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateContentInput, ContentScope } from '@/features/content/service';
import { createContent, listContent } from '@/features/content/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') as ContentScope | null) ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listContent(client, { scope, limit });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'contenido',
          action: 'query_content',
          entityTable: 'app_learning.content_items',
          changeSummary: { scope: scope ?? 'all', limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list content');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateContentInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createContent(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'contenido',
          action: 'create_content',
          entityTable: 'app_learning.content_items',
          entityId: result.contentId,
          changeSummary: { scope: result.scope, status: result.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create content');
  }
}
