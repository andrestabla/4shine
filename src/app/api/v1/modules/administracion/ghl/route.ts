import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getGhlDashboard, retryGhlEvent, updateGhlProgram } from '@/features/ghl/service';
import type { UpdateGhlProgramInput } from '@/features/ghl/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Reporte de webhooks recibidos + mapeo de productos GHL → planes. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const limit = Number(url.searchParams.get('limit') ?? 100);

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getGhlDashboard(client, identity, {
          status,
          search,
          limit: Number.isFinite(limit) ? limit : 100,
        }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load GHL dashboard');
  }
}

/** Actualiza el mapeo de un producto GHL (plan destino, vigencia, estado). */
export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateGhlProgramInput>(request);
  if (!body || typeof body !== 'object' || !body.programId) {
    return NextResponse.json({ ok: false, error: 'programId es requerido' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateGhlProgram(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_ghl_program_map',
          entityTable: 'app_billing.ghl_program_map',
          changeSummary: { programId: body.programId, planId: body.planId ?? null },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update GHL program map');
  }
}

/** Reprocesa un evento fallido con el payload almacenado. */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ eventId?: string }>(request);
  if (!body?.eventId) {
    return NextResponse.json({ ok: false, error: 'eventId es requerido' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await retryGhlEvent(client, identity, body.eventId!);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'retry_ghl_webhook_event',
          entityTable: 'app_billing.ghl_webhook_events',
          changeSummary: { eventId: body.eventId, status: result.status },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to retry GHL event');
  }
}
