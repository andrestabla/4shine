import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { bulkImportUsers, type BulkImportRow } from '@/features/usuarios/bulk-import';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface BulkImportBody {
  rows: BulkImportRow[];
  dryRun?: boolean;
  sendWelcomeEmail?: boolean;
}

/**
 * Importación masiva de usuarios desde un archivo (el cliente ya lo parseó a
 * filas). Con dryRun=true valida sin crear; con dryRun=false crea las filas
 * válidas y devuelve el reporte por fila.
 */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<BulkImportBody>(request);
  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ ok: false, error: 'Se esperaba un arreglo de filas.' }, { status: 400 });
  }

  const dryRun = body.dryRun !== false; // por seguridad, valida salvo que se pida explícitamente crear
  const sendWelcomeEmail = body.sendWelcomeEmail !== false;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await bulkImportUsers(client, identity, body.rows, { dryRun, sendWelcomeEmail });
        // Solo se audita la creación real, no las validaciones.
        if (!dryRun) {
          await logModuleAudit(client, request, identity, {
            moduleCode: 'usuarios',
            action: 'bulk_import_users',
            entityTable: 'app_core.users',
            changeSummary: { total: result.total, creados: result.creados, errores: result.errores, omitidos: result.omitidos },
          });
        }
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to import users');
  }
}
