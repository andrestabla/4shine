import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { finishTour, recordStepView } from '@/features/tour/service';
import type { FinishTourInput, RecordStepInput } from '@/features/tour/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../modules/_utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<RecordStepInput>(request);
  if (!body || typeof body.stepKey !== 'string') {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        recordStepView(client, identity, {
          stepKey: body.stepKey,
          stepIndex: Number(body.stepIndex) || 0,
          totalSteps: Number(body.totalSteps) || 1,
        }),
      ),
    );
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to record tour step');
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<FinishTourInput>(request);
  if (!body || (body.status !== 'completed' && body.status !== 'dismissed')) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        finishTour(client, identity, body),
      ),
    );
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to finish tour');
  }
}
