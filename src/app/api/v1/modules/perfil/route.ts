import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateMyProfileInput } from '@/features/perfil/service';
import { getMyProfile, updateMyProfile } from '@/features/perfil/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getMyProfile(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'perfil',
          action: 'query_my_profile',
          entityTable: 'app_core.user_profiles',
          entityId: identity.userId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load profile');
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateMyProfileInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateMyProfile(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'perfil',
          action: 'update_my_profile',
          entityTable: 'app_core.user_profiles',
          entityId: identity.userId,
          changeSummary: {
            updatedFields: Object.keys(body),
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update profile');
  }
}
