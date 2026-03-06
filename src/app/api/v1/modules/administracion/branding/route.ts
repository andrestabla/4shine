import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { BrandingSettings } from '@/features/administracion/types';
import {
  getBrandingSettings,
  updateBrandingSettings,
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
        const result = await getBrandingSettings(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'query_branding_settings',
          entityTable: 'app_admin.branding_settings',
          entityId: result.brandingId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load branding settings');
  }
}

export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<Partial<BrandingSettings>>(request);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateBrandingSettings(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_branding_settings',
          entityTable: 'app_admin.branding_settings',
          entityId: result.brandingId,
          changeSummary: {
            updatedFields: Object.keys(body),
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update branding settings');
  }
}
