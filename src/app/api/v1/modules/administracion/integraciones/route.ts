import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateIntegrationsInput } from '@/features/administracion/service';
import {
  getIntegrationsSettings,
  updateIntegrationsSettings,
} from '@/features/administracion/service';
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getIntegrationsSettings(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'query_integration_settings',
          entityTable: 'app_admin.integration_configs',
          changeSummary: {
            integrations: result.integrations.length,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load integration settings');
  }
}

export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateIntegrationsInput>(request);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateIntegrationsSettings(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_integration_settings',
          entityTable: 'app_admin.integration_configs',
          changeSummary: {
            integrationsUpdated: body.integrations?.length ?? 0,
            outboundUpdated: !!body.outboundEmail,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update integration settings');
  }
}
