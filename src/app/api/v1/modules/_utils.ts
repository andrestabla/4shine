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

  // Los servicios lanzan Error con mensajes escritos para el usuario ("Solo
  // admin y gestor pueden enviar invitaciones"), y esos sí deben llegar. Lo que
  // NO puede salir es un error de PostgreSQL: revela nombres de tablas,
  // columnas y restricciones, y confirma la existencia de registros.
  const isDatabaseError = isPostgresError(error);
  if (isDatabaseError) {
    console.error(`[api] ${fallbackMessage}:`, error);
  }

  const detail = isDatabaseError
    ? undefined
    : error instanceof Error
      ? error.message
      : undefined;

  return NextResponse.json(
    {
      ok: false,
      error: fallbackMessage,
      ...(detail ? { detail } : {}),
    },
    { status: 500 },
  );
}

/**
 * Los errores de `pg` traen un SQLSTATE de 5 caracteres y campos propios del
 * motor. Sirve para separarlos de los Error que lanzan los servicios a
 * propósito para que el usuario los lea.
 */
function isPostgresError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; severity?: unknown; routine?: unknown; schema?: unknown };
  const hasSqlState = typeof candidate.code === 'string' && /^[0-9A-Z]{5}$/.test(candidate.code);
  return hasSqlState && (candidate.severity !== undefined || candidate.routine !== undefined || candidate.schema !== undefined);
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
