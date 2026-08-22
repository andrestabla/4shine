import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  getAdvisorProfileRecord,
  updateAdvisorProfileRecord,
  type UpdateAdvisorProfileInput,
} from '@/features/advisors/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

/** Ficha de advisor. La ve el propio advisor, el gestor y el admin. */
export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getAdvisorProfileRecord(client, identity, userId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load advisor profile');
  }
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateAdvisorProfileInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateAdvisorProfileRecord(client, identity, userId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'perfil',
          action: 'update_advisor_profile',
          entityTable: 'app_core.user_profiles',
          entityId: userId,
          changeSummary: { campos: Object.keys(body) },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update advisor profile');
  }
}
