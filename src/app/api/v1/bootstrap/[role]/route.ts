import { NextResponse } from 'next/server';
import { getBootstrapPayload } from '@/server/bootstrap/service';
import type { Role } from '@/server/bootstrap/types';
import { authenticateRequest } from '@/server/auth/request-auth';

const VALID_ROLES: Role[] = ['lider', 'mentor', 'gestor', 'admin'];

function isRole(value: string): value is Role {
  return VALID_ROLES.includes(value as Role);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ role: string }> },
) {
  try {
    const identity = await authenticateRequest(request);
    if (!identity) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await context.params;

    if (!isRole(role)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid role. Must be one of: lider, mentor, gestor, admin',
        },
        { status: 400 },
      );
    }

    if (identity.role !== 'admin' && identity.role !== role) {
      return NextResponse.json({ ok: false, error: 'Forbidden for requested role' }, { status: 403 });
    }

    const payload = await getBootstrapPayload(role);

    return NextResponse.json({ ok: true, role, data: payload }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to build bootstrap payload',
        detail: message,
      },
      { status: 500 },
    );
  }
}
