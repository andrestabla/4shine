import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { analyzeIncident, type IncidentRecord } from '@/features/incidencias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../_utils';

type Body = Pick<IncidentRecord, 'type' | 'title' | 'summary' | 'evidence' | 'checklist'>;

/** Lectura del caso por el asistente. Devuelve null si no hay IA configurada. */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<Body>(request);
  if (!body || typeof body.type !== 'string' || !Array.isArray(body.evidence)) {
    return NextResponse.json({ ok: false, error: 'Incidencia inválida' }, { status: 400 });
  }

  try {
    const analysis = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        analyzeIncident(client, identity, {
          type: body.type,
          title: body.title ?? '',
          summary: body.summary ?? '',
          evidence: body.evidence ?? [],
          checklist: body.checklist ?? [],
        }),
      ),
    );
    return NextResponse.json({ ok: true, data: { analysis } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to analyze incident');
  }
}
