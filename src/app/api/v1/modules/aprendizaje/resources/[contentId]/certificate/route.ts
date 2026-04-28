import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getCourseCertificateData } from '@/features/aprendizaje/service';
import { errorResponse, unauthorizedResponse } from '../../../../_utils';

export const runtime = 'nodejs';

interface ContextParams {
  params: Promise<{ contentId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { contentId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getCourseCertificateData(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to get course certificate data');
  }
}
