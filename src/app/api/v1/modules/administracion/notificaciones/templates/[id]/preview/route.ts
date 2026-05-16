import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getTemplate } from '@/features/notificaciones/service';
import { renderTemplatePreview } from '@/features/notificaciones/engine';
import type { VariableKey } from '@/features/notificaciones/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../../_utils';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody<{ sampleVars: Record<string, string> }>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const tmpl = await getTemplate(client, identity, id);
        if (!tmpl) throw new Error('Template not found');

        return renderTemplatePreview(
          tmpl.subjectTemplate,
          tmpl.bodyHtmlTemplate,
          tmpl.bodyTextTemplate,
          tmpl.inAppTitleTemplate,
          tmpl.inAppBodyTemplate,
          body.sampleVars as Partial<Record<VariableKey, string>>,
        );
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to preview notification template');
  }
}
