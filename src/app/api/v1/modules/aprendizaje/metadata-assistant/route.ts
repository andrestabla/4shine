import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { LearningMetadataAssistantInput } from '@/features/aprendizaje/metadata-assistant';
import { extractLearningMetadataAssistant } from '@/features/aprendizaje/metadata-assistant-service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<LearningMetadataAssistantInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await extractLearningMetadataAssistant(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'extract_learning_metadata_ai',
          entityTable: 'app_learning.content_items',
          changeSummary: {
            kind: body.kind,
            contentType: body.contentType,
            youtubeMatched: result.source.youtubeMatched,
            youtubeUsed: result.source.youtubeUsed,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to extract metadata with AI assistant');
  }
}
