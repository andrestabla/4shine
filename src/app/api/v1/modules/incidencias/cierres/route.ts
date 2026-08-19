import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  closeIncident,
  listClosedIncidents,
  reopenIncident,
  type IncidentResolution,
} from '@/features/incidencias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface CloseBody {
  incidentId?: string;
  type?: string;
  title?: string;
  resolution?: IncidentResolution;
  note?: string | null;
  userIds?: string[];
}

/** Casos ya cerrados (resueltos o descartados), para consultarlos o reabrirlos. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const userId = new URL(request.url).searchParams.get('userId') || undefined;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listClosedIncidents(client, { userId }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list closed incidents');
  }
}

/** Cierra un caso: deja de aparecer en el panel. */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CloseBody>(request);
  if (!body?.incidentId || (body.resolution !== 'resuelto' && body.resolution !== 'descartado')) {
    return NextResponse.json({ ok: false, error: 'Caso inválido' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await closeIncident(client, identity, {
          incidentId: body.incidentId!,
          type: body.type ?? 'desconocido',
          title: body.title ?? body.incidentId!,
          resolution: body.resolution!,
          note: body.note ?? null,
          userIds: Array.isArray(body.userIds) ? body.userIds : [],
        });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'close_incident',
          entityTable: 'app_admin.incident_dismissals',
          entityId: body.incidentId,
          changeSummary: { resolution: body.resolution, type: body.type },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to close incident');
  }
}

/** Reabre un caso cerrado. */
export async function DELETE(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const incidentId = new URL(request.url).searchParams.get('incidentId');
  if (!incidentId) {
    return NextResponse.json({ ok: false, error: 'Falta el caso a reabrir' }, { status: 400 });
  }

  try {
    const reopened = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await reopenIncident(client, incidentId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'reopen_incident',
          entityTable: 'app_admin.incident_dismissals',
          entityId: incidentId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data: { reopened } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to reopen incident');
  }
}
