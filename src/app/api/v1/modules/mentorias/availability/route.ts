import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  upsertMentorAvailabilitySlot,
  deleteAvailabilitySlot,
  listMentorAvailabilityFull,
  type UpsertMentorAvailabilityInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const url = new URL(request.url);
  const mentorUserId = url.searchParams.get('mentorUserId')?.trim();
  if (!mentorUserId) {
    return NextResponse.json({ ok: false, error: 'mentorUserId requerido.' }, { status: 400 });
  }
  // Default window: today → 90 days ahead. Override with from/to (ISO).
  const now = new Date();
  const defaultTo = new Date(now);
  defaultTo.setDate(defaultTo.getDate() + 90);
  const fromIso = url.searchParams.get('from')?.trim() || now.toISOString();
  const toIso = url.searchParams.get('to')?.trim() || defaultTo.toISOString();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        listMentorAvailabilityFull(client, identity, mentorUserId, fromIso, toIso),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list mentor availability');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<UpsertMentorAvailabilityInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await upsertMentorAvailabilitySlot(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'upsert_mentor_availability_slot',
          entityTable: 'app_mentoring.mentor_availability',
          changeSummary: { mentorUserId: body.mentorUserId, startsAt: body.startsAt, endsAt: body.endsAt },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to upsert mentor availability');
  }
}

export async function DELETE(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<{ mentorUserId: string; startsAt: string }>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        deleteAvailabilitySlot(client, identity, body),
      ),
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete availability slot');
  }
}
