import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getTemplate, getNotificationSettingsByOrg } from '@/features/notificaciones/service';
import { renderTemplatePreview, sendEmailToAddress } from '@/features/notificaciones/engine';
import { EVENTS_BY_KEY, VARIABLE_DEFS } from '@/features/notificaciones/events-catalog';
import type { VariableKey } from '@/features/notificaciones/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../../_utils';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody<{ toEmail: string }>(request);
  if (!body?.toEmail?.trim()) {
    return NextResponse.json({ ok: false, error: 'toEmail is required' }, { status: 400 });
  }

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const tmpl = await getTemplate(client, identity, id);
        if (!tmpl) throw new Error('Template not found');

        const eventDef = EVENTS_BY_KEY[tmpl.eventKey];
        if (!eventDef) throw new Error(`Event "${tmpl.eventKey}" not found in catalog`);

        const globalSettings = await getNotificationSettingsByOrg(client, tmpl.organizationId);

        const sampleVars: Partial<Record<VariableKey, string>> = Object.fromEntries(
          eventDef.variables.map((key) => {
            if (key === 'plataforma' && globalSettings.varPlatformName) return [key, globalSettings.varPlatformName];
            if (key === 'enlace_plataforma' && globalSettings.varPlatformUrl) return [key, globalSettings.varPlatformUrl];
            return [key, VARIABLE_DEFS[key]?.example ?? key];
          }),
        );

        const rendered = renderTemplatePreview(
          tmpl.subjectTemplate,
          tmpl.bodyHtmlTemplate,
          tmpl.bodyTextTemplate,
          tmpl.inAppTitleTemplate,
          tmpl.inAppBodyTemplate,
          sampleVars,
        );

        await sendEmailToAddress(
          client,
          tmpl.organizationId,
          body.toEmail.trim(),
          rendered.subject || `[Prueba] ${tmpl.name}`,
          rendered.bodyHtml,
          rendered.bodyText,
        );
      }),
    );
    return NextResponse.json({ ok: true, data: { sent: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to send test email');
  }
}
