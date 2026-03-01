import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateJobPostInput } from '@/features/convocatorias/service';
import { deleteJobPost, updateJobPost } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ jobPostId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateJobPostInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { jobPostId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateJobPost(client, jobPostId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'update_job_post',
          entityTable: 'app_networking.job_posts',
          entityId: jobPostId,
          changeSummary: { isActive: result.isActive },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update job post');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { jobPostId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteJobPost(client, jobPostId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'delete_job_post',
          entityTable: 'app_networking.job_posts',
          entityId: jobPostId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete job post');
  }
}
