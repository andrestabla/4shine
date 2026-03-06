import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { resetUserPassword } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await resetUserPassword(client, identity, userId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'reset_user_password',
          entityTable: 'app_auth.user_credentials',
          entityId: userId,
          changeSummary: {
            recipient: result.recipient,
            messageId: result.messageId,
            passwordUpdatedAt: result.passwordUpdatedAt,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to reset user password');
  }
}
