import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';
import type { ModulePermissions } from '@/lib/permissions';

interface PermissionRow {
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
            m.module_code,
            m.module_name,
            COALESCE(p.can_view, false) AS can_view,
            COALESCE(p.can_create, false) AS can_create,
            COALESCE(p.can_update, false) AS can_update,
            COALESCE(p.can_delete, false) AS can_delete,
            COALESCE(p.can_approve, false) AS can_approve,
            COALESCE(p.can_moderate, false) AS can_moderate,
            COALESCE(p.can_manage, false) AS can_manage
          FROM app_auth.modules m
          LEFT JOIN app_auth.role_module_permissions p
            ON p.module_code = m.module_code
           AND p.role_code = $1
          ORDER BY m.module_code
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
