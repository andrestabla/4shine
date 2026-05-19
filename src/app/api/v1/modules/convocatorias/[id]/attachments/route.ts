import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { addAttachment } from '@/features/convocatorias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ fileUrl: string; fileName: string }>(request);
  if (!body?.fileUrl || !body?.fileName) {
    return NextResponse.json({ ok: false, error: 'fileUrl and fileName are required' }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        addAttachment(client, identity, id, body.fileUrl, body.fileName),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to add attachment');
  }
}
