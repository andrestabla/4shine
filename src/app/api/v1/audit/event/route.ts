import { NextResponse } from 'next/server';
import type { ModuleCode } from '@/lib/permissions';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { buildRequestSummary, writeAuditLog } from '@/server/audit/service';

interface AuditEventBody {
  action?: string;
  moduleCode?: ModuleCode;
  entityTable?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

const DEFAULT_ACTION = 'ui_event';
const DEFAULT_ENTITY_TABLE = 'ui.events';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: AuditEventBody = {};
  try {
    body = (await request.json()) as AuditEventBody;
  } catch {
    body = {};
  }

  const action = (body.action ?? DEFAULT_ACTION).trim().slice(0, 120) || DEFAULT_ACTION;
  const entityTable = (body.entityTable ?? DEFAULT_ENTITY_TABLE).trim().slice(0, 120) || DEFAULT_ENTITY_TABLE;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        writeAuditLog(client, {
          actorUserId: identity.userId,
          action,
          moduleCode: body.moduleCode ?? null,
          entityTable,
          entityId: body.entityId ?? null,
          changeSummary: buildRequestSummary(request, body.metadata),
        }),
      ),
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to record audit event',
        detail,
      },
      { status: 500 },
    );
  }
}
