import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';
import type { ModulePermissions } from '@/lib/permissions';

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
  }
}
