import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateMentorshipInput } from '@/features/mentorias/service';
import { createMentorship, listMentorships } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listMentorships(client, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'query_mentorships',
          entityTable: 'app_mentoring.mentorship_sessions',
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list mentorship sessions');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateMentorshipInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createMentorship(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_mentorship',
          entityTable: 'app_mentoring.mentorship_sessions',
          entityId: result.sessionId,
          changeSummary: { sessionType: result.sessionType, status: result.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create mentorship session');
  }
}
