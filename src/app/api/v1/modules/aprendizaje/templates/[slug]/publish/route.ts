import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { publishWorkbookTemplateVersion } from '@/features/aprendizaje/template-service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface Context {
    params: Promise<{ slug: string }>;
}

interface PublishBody {
    notes?: string | null;
}

export async function POST(request: Request, context: Context) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();
    const { slug } = await context.params;

    const body = (await parseJsonBody<PublishBody>(request)) ?? {};

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await publishWorkbookTemplateVersion(client, identity, slug, body.notes ?? null);
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'aprendizaje',
                    action: 'publish_workbook_template_version',
                    entityTable: 'app_learning.workbook_templates',
                    entityId: result.templateId,
                    changeSummary: {
                        slug,
                        publishedVersionNo: result.publishedVersionNo,
                    },
                });
                return result;
            }),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo publicar la versión de la plantilla');
    }
}
