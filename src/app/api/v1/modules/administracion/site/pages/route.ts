import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  SiteBuilderError,
  createSitePage,
  listSitePages,
  resolveOrganizationId,
} from '@/features/site-builder/service';
import type { CreateSitePageInput } from '@/features/site-builder/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

function siteBuilderErrorResponse(error: unknown, fallback: string) {
  if (error instanceof SiteBuilderError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.statusCode });
  }
  return errorResponse(error, fallback);
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        return listSitePages(client, organizationId);
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return siteBuilderErrorResponse(error, 'Error al cargar las páginas del sitio');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') return unauthorizedResponse();

  const body = await parseJsonBody<CreateSitePageInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        const page = await createSitePage(client, organizationId, identity.userId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_site_page',
          entityTable: 'app_admin.site_pages',
          entityId: page.pageId,
          changeSummary: { title: page.title, slug: page.slug },
        });
        return page;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return siteBuilderErrorResponse(error, 'Error al crear la página');
  }
}
