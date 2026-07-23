import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  bulkAssignPlan,
  bulkExtendSubscription,
  bulkForcePasswordChange,
  bulkRevokeSessions,
  bulkSendMessage,
  bulkSetOrganization,
  type BulkActionResult,
} from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

type BulkAction =
  | 'extend_subscription'
  | 'send_message'
  | 'logout'
  | 'force_password_change'
  | 'set_organization'
  | 'assign_plan';

interface BulkBody {
  action: BulkAction;
  userIds: string[];
  params?: {
    days?: number;
    title?: string;
    body?: string;
    channels?: Array<'in_app' | 'email'>;
    organizationId?: string;
    planId?: string;
  };
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<BulkBody>(request);
  if (!body || !body.action || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        let result: BulkActionResult;
        switch (body.action) {
          case 'extend_subscription':
            result = await bulkExtendSubscription(client, identity, body.userIds, body.params?.days ?? 0);
            break;
          case 'send_message':
            result = await bulkSendMessage(client, identity, body.userIds, {
              title: body.params?.title ?? '',
              body: body.params?.body ?? '',
              channels: body.params?.channels ?? ['in_app'],
            });
            break;
          case 'logout':
            result = await bulkRevokeSessions(client, identity, body.userIds);
            break;
          case 'force_password_change':
            result = await bulkForcePasswordChange(client, identity, body.userIds);
            break;
          case 'set_organization':
            if (!body.params?.organizationId) {
              throw new Error('organizationId es obligatorio.');
            }
            result = await bulkSetOrganization(client, identity, body.userIds, body.params.organizationId);
            break;
          case 'assign_plan':
            if (!body.params?.planId) {
              throw new Error('planId es obligatorio.');
            }
            result = await bulkAssignPlan(client, identity, body.userIds, body.params.planId);
            break;
          default:
            throw new Error('Acción no soportada');
        }

        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: `bulk_${body.action}`,
          entityTable: 'app_core.users',
          changeSummary: {
            action: body.action,
            count: body.userIds.length,
            userIds: body.userIds.slice(0, 200),
            affected: result.affected,
          },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo ejecutar la acción masiva');
  }
}
