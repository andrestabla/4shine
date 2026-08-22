import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createAdvisorCategory, listAdvisorCategories } from '@/features/advisors/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Opciones de la lista desplegable de categoría. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) => listAdvisorCategories(client));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list advisor categories');
  }
}

/** Agrega una opción nueva. Solo gestor y admin. */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ label?: string }>(request);
  if (!body?.label?.trim()) {
    return NextResponse.json({ ok: false, error: 'Falta el nombre de la categoría' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        createAdvisorCategory(client, identity, body.label!),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to create advisor category');
  }
}
