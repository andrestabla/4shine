import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { removeAttachment } from '@/features/convocatorias/service';
import { errorResponse, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ id: string; attachmentId: string }>;
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id, attachmentId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        removeAttachment(client, identity, id, attachmentId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to remove attachment');
  }
}
