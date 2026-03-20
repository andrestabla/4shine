import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateJobPostInput } from '@/features/convocatorias/service';
import { createJobPost, listJobPosts } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listJobPosts(client, identity, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'query_job_posts',
          entityTable: 'app_networking.job_posts',
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list job posts');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateJobPostInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createJobPost(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'create_job_post',
          entityTable: 'app_networking.job_posts',
          entityId: result.jobPostId,
          changeSummary: { workMode: result.workMode, isActive: result.isActive },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create job post');
  }
}
