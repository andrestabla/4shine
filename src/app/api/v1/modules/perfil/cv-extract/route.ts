import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { extractProfileFromCv, type ExtractProfileFromCvInput } from '@/features/perfil/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<ExtractProfileFromCvInput>(request);
  if (!body?.fileUrl?.trim()) {
    return NextResponse.json({ ok: false, error: 'fileUrl is required' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await extractProfileFromCv(client, identity, { fileUrl: body.fileUrl.trim() });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'perfil',
          action: 'extract_profile_from_cv',
          entityTable: 'app_core.user_profiles',
          entityId: identity.userId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to extract profile from cv');
  }
}
