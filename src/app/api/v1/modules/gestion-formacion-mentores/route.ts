import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getMentorTrainingOverview } from '@/features/formacion-mentores/service';
import { errorResponse, unauthorizedResponse } from '../_utils';

/** Panorama de la formación de advisors: cursos, filas advisor×curso y stats. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const contentId = url.searchParams.get('contentId');

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getMentorTrainingOverview(client, identity, { contentId }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load mentor training overview');
  }
}
