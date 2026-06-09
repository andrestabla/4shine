import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { upsertMySubmission } from '@/features/aprendizaje/assignments/service';
import type { UpsertSubmissionInput } from '@/features/aprendizaje/assignments/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id: assignmentId } = await params;
  const body = await parseJsonBody<UpsertSubmissionInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        upsertMySubmission(client, identity, assignmentId, body),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to save submission');
  }
}
