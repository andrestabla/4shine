import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { ContentStatus, ContentType } from '@/features/content/service';
import {
  listLearningResources,
  type LearningLibraryLocation,
  type LearningScope,
} from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../_utils';

function parseLearningScope(value: string | null): LearningScope {
  return value === 'formacion_mentores' ? 'formacion_mentores' : 'aprendizaje';
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const scope = parseLearningScope(url.searchParams.get('scope'));
    const query = {
      scope,
      q: url.searchParams.get('q') ?? undefined,
      family:
        (url.searchParams.get('family') as 'resource' | 'course' | null) ??
        undefined,
      libraryLocation:
        (url.searchParams.get('libraryLocation') as LearningLibraryLocation | null) ??
        undefined,
      contentType: (url.searchParams.get('contentType') as ContentType | null) ?? undefined,
      status: (url.searchParams.get('status') as ContentStatus | null) ?? undefined,
      pillar: url.searchParams.get('pillar') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 24),
    };

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listLearningResources(client, identity, query);
        await logModuleAudit(client, request, identity, {
          moduleCode: scope,
          action: 'query_learning_resources',
          entityTable: 'app_learning.content_items',
          changeSummary: { scope, total: result.total, page: result.page, pageSize: result.pageSize },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list learning resources');
  }
}
