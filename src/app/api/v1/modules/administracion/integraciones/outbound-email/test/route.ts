import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { queueOutboundEmailTest } from '@/features/administracion/service';
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

interface OutboundEmailTestInput {
  recipient?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<OutboundEmailTestInput>(request);

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await queueOutboundEmailTest(client, identity, body?.recipient);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'test_outbound_email',
          entityTable: 'app_admin.outbound_email_configs',
          changeSummary: {
            provider: result.provider,
            recipient: result.recipient,
            queuedAt: result.queuedAt,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to queue outbound email test');
  }
}
