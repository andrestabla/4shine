import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { revertBrandingRevision } from '@/features/administracion/service';
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

interface RevertBody {
  revisionId?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<RevertBody>(request);
  const revisionId = body?.revisionId?.trim() ?? '';
  if (!revisionId) {
    return NextResponse.json({ ok: false, error: 'revisionId is required' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await revertBrandingRevision(client, identity, revisionId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'revert_branding_settings',
          entityTable: 'app_admin.branding_revisions',
          entityId: revisionId,
          changeSummary: {
            sourceRevisionId: revisionId,
            newRevisionId: result.revisionId,
            changedFields: result.changedFields,
            changes: result.changes,
          },
        });
        return result.settings;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to revert branding revision');
  }
}
