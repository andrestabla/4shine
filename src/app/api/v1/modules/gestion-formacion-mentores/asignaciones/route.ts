import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  assignMentorCourse,
  unassignMentorCourse,
  type AssignCourseInput,
  type UnassignCourseInput,
} from '@/features/formacion-mentores/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Asigna un curso de formación a uno o varios advisors. */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<AssignCourseInput>(request);
  if (!body?.contentId || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Indica el curso y al menos un advisor' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await assignMentorCourse(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'gestion_formacion_mentores',
          action: 'assign_course',
          entityTable: 'app_learning.content_assignments',
          entityId: body.contentId,
          changeSummary: { userIds: body.userIds, assigned: result.assigned },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to assign course');
  }
}

/** Quita la asignación (el avance del advisor se conserva). */
export async function DELETE(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UnassignCourseInput>(request);
  if (!body?.contentId || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Indica el curso y al menos un advisor' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await unassignMentorCourse(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'gestion_formacion_mentores',
          action: 'unassign_course',
          entityTable: 'app_learning.content_assignments',
          entityId: body.contentId,
          changeSummary: { userIds: body.userIds, removed: result.removed },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to unassign course');
  }
}
