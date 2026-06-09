import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { bulkDeleteMentorAvailability } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface BulkDeleteBody {
  mentorUserId?: string;
  startsAtList?: string[];
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<BulkDeleteBody>(request);
  if (!body?.mentorUserId || !Array.isArray(body?.startsAtList)) {
    return NextResponse.json(
      { ok: false, error: 'mentorUserId y startsAtList son obligatorios.' },
      { status: 400 },
    );
  }
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await bulkDeleteMentorAvailability(
          client,
          identity,
          body.mentorUserId!,
          body.startsAtList!,
        );
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'bulk_delete_mentor_availability',
          entityTable: 'app_mentoring.mentor_availability',
          changeSummary: {
            mentorUserId: body.mentorUserId,
            requested: body.startsAtList!.length,
            deleted: result.deleted,
            skippedBooked: result.skippedBooked,
          },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo eliminar la disponibilidad en lote.');
  }
}
