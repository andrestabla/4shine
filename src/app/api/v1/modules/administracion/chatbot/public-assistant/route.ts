import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  getPublicAssistantSettings,
  updatePublicAssistantSettings,
} from '@/features/chatbot/public-assistant-service';
import type { UpdatePublicAssistantInput } from '@/features/chatbot/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getPublicAssistantSettings(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load public assistant settings');
  }
}

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdatePublicAssistantInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updatePublicAssistantSettings(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_public_assistant',
          entityTable: 'app_admin.public_assistant_settings',
          changeSummary: { fields: Object.keys(body) },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update public assistant settings');
  }
}
