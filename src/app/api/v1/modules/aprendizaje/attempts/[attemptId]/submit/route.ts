import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { submitAttempt } from '@/features/aprendizaje/activities/service';
import type { SubmitAnswerInput } from '@/features/aprendizaje/activities/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface SubmitBody {
  answers?: SubmitAnswerInput[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { attemptId } = await params;
  const body = await parseJsonBody<SubmitBody>(request);
  if (!body || !Array.isArray(body.answers)) {
    return NextResponse.json({ ok: false, error: 'answers requerido' }, { status: 400 });
  }
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        submitAttempt(client, identity, attemptId, body.answers!),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to submit attempt');
  }
}
