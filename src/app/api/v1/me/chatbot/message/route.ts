import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { sendMessage } from '@/features/chatbot/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../modules/_utils';

export const runtime = 'nodejs';
// Da margen para el contexto + la llamada a OpenAI con reintentos.
export const maxDuration = 60;

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ conversationId?: string | null; text: string }>(request);
  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return NextResponse.json({ ok: false, error: 'El mensaje está vacío' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        sendMessage(client, identity, { conversationId: body.conversationId ?? null, text: body.text }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to send chatbot message');
  }
}
