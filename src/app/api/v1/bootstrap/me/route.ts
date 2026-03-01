import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { getBootstrapPayloadForIdentity } from '@/server/bootstrap/service';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getBootstrapPayloadForIdentity(identity.userId, identity.role);

    try {
      await recordAuditEvent(
        {
          action: 'bootstrap_me_load',
          moduleCode: 'dashboard',
          entityTable: 'app_core.users',
          entityId: identity.userId,
          changeSummary: buildRequestSummary(request, { role: identity.role }),
        },
        identity,
      );
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: identity.userId,
          email: identity.email,
          name: identity.name,
          role: identity.role,
        },
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to build bootstrap payload',
        detail,
      },
      { status: 500 },
    );
  }
}
