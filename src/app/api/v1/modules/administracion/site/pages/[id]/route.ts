import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  SiteBuilderError,
  deleteSitePage,
  getSitePageById,
  resolveOrganizationId,
  updateSitePage,
} from '@/features/site-builder/service';
import type { UpdateSitePageInput } from '@/features/site-builder/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function siteBuilderErrorResponse(error: unknown, fallback: string) {
  if (error instanceof SiteBuilderError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.statusCode });
  }
  return errorResponse(error, fallback);
}

export async function GET(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') return unauthorizedResponse();
  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        return getSitePageById(client, organizationId, id);
      }),
    );
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Página no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return siteBuilderErrorResponse(error, 'Error al cargar la página');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') return unauthorizedResponse();
  const { id } = await context.params;

  const body = await parseJsonBody<UpdateSitePageInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        const page = await updateSitePage(client, organizationId, identity.userId, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_site_page',
          entityTable: 'app_admin.site_pages',
          entityId: id,
          changeSummary: {
            title: page.title,
            slug: page.slug,
            isVisible: page.isVisible,
            useBuilder: page.useBuilder,
            sectionsCount: page.sections.length,
          },
        });
        return page;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return siteBuilderErrorResponse(error, 'Error al actualizar la página');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') return unauthorizedResponse();
  const { id } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        await deleteSitePage(client, organizationId, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_site_page',
          entityTable: 'app_admin.site_pages',
          entityId: id,
        });
      }),
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return siteBuilderErrorResponse(error, 'Error al eliminar la página');
  }
}
