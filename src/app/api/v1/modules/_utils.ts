import { NextResponse } from 'next/server';
import { ForbiddenError } from '@/server/auth/module-permissions';
import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import type { ModuleCode } from '@/lib/permissions';
import { buildRequestSummary, writeAuditLog } from '@/server/audit/service';

export function unauthorizedResponse() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: error.statusCode },
    );
  }

  const detail = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json(
    {
      ok: false,
      error: fallbackMessage,
      detail,
    },
    { status: 500 },
  );
}

interface ModuleAuditInput {
  moduleCode: ModuleCode;
  action: string;
  entityTable: string;
  entityId?: string | null;
  changeSummary?: Record<string, unknown>;
}

export async function logModuleAudit(
  client: PoolClient,
  request: Request,
  actor: AuthUser,
  input: ModuleAuditInput,
) {
  await writeAuditLog(client, {
    actorUserId: actor.userId,
    action: input.action,
    moduleCode: input.moduleCode,
    entityTable: input.entityTable,
    entityId: input.entityId ?? null,
    changeSummary: buildRequestSummary(request, input.changeSummary),
  });
}
