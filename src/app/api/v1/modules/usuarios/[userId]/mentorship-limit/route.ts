import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { setUserMentorshipLimit } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

interface MentorshipLimitBody {
  /** Cupo de sesiones 1:1 del programa (0..50). null = sin límite manual. */
  limit?: number | null;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<MentorshipLimitBody>(request);
  if (!body || (body.limit !== null && typeof body.limit !== 'number')) {
    return NextResponse.json({ ok: false, error: 'limit debe ser un número o null' }, { status: 400 });
  }

  const { userId } = await context.params;
  const limit = body.limit ?? null;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await setUserMentorshipLimit(client, identity, userId, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'set_user_mentorship_limit',
          entityTable: 'app_core.user_profiles',
          entityId: userId,
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update mentorship limit');
  }
}
