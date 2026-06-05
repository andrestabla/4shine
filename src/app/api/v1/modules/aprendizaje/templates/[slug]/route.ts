import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getWorkbookTemplate } from '@/features/aprendizaje/template-service';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

interface Context {
    params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: Context) {
    const identity = await authenticateRequest(request);
    if (!identity) return unauthorizedResponse();
    const { slug } = await context.params;

    try {
        const data = await withClient((client) =>
            withRoleContext(client, identity.userId, identity.role, async () =>
                getWorkbookTemplate(client, identity, slug),
            ),
        );
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (error) {
        return errorResponse(error, 'No se pudo cargar la plantilla del workbook');
    }
}
