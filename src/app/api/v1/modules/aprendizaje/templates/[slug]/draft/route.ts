import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { updateWorkbookTemplateDraft, type UpdateTemplateDraftInput } from '@/features/aprendizaje/template-service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface Context {
    params: Promise<{ slug: string }>;
}

export async function PATCH(request: Request, context: Context) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();
    const { slug } = await context.params;

    const body = await parseJsonBody<UpdateTemplateDraftInput>(request);
    if (!body) {
        return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () => {
                const result = await updateWorkbookTemplateDraft(client, identity, slug, body);
                await logModuleAudit(client, request, identity, {
                    moduleCode: 'aprendizaje',
                    action: 'update_workbook_template_draft',
                    entityTable: 'app_learning.workbook_templates',
                    entityId: result.templateId,
                    changeSummary: {
                        slug,
                        hasDraftContent: !!body.content,
                        hasDraftCover: !!body.coverImageUrl,
                    },
                });
                return result;
            }),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo guardar el borrador de la plantilla');
    }
}
