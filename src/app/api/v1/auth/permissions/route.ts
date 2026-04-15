import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';
import { MODULE_CODES, type ModulePermissions } from '@/lib/permissions';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';

interface PermissionRow {
  role_code: string;
  module_code: ModulePermissions['moduleCode'];
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_moderate: boolean;
  can_manage: boolean;
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);

  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (identity.guestScope === 'descubrimiento') {
    const permissions: ModulePermissions[] = MODULE_CODES.map((moduleCode) => {
      const allowDiscovery = moduleCode === 'descubrimiento';
      return {
        moduleCode,
        moduleName: moduleCode,
        canView: allowDiscovery,
        canCreate: allowDiscovery,
        canUpdate: allowDiscovery,
        canDelete: false,
        canApprove: false,
        canModerate: false,
        canManage: false,
      };
    });
    return NextResponse.json(
      {
        ok: true,
        role: identity.role,
        guestScope: identity.guestScope,
        permissions,
      },
      { status: 200 },
    );
  }

  try {
    const permissions = await withClient(async (client) => {
      const { rows } = await client.query<PermissionRow>(
        `
          SELECT
            role_code,
            module_code,
            module_name,
            can_view,
            can_create,
            can_update,
            can_delete,
            can_approve,
            can_moderate,
            can_manage
          FROM app_auth.v_role_permission_matrix
          WHERE role_code = $1
          ORDER BY module_code
        `,
        [identity.role],
      );

      return rows.map((row) => ({
        moduleCode: row.module_code,
        moduleName: row.module_name,
        canView: row.can_view,
        canCreate: row.can_create,
        canUpdate: row.can_update,
        canDelete: row.can_delete,
        canApprove: row.can_approve,
        canModerate: row.can_moderate,
        canManage: row.can_manage,
      }));
    });

    return NextResponse.json(
      {
        ok: true,
        role: identity.role,
        permissions,
      },
      { status: 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch permissions',
        detail,
      },
      { status: 500 },
    );
  } finally {
    try {
      await recordAuditEvent(
        {
          action: 'auth_permissions_query',
          moduleCode: 'usuarios',
          entityTable: 'app_auth.v_role_permission_matrix',
          changeSummary: buildRequestSummary(request, { role: identity.role }),
        },
        identity,
      );
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }
  }
}
