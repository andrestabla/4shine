import { requestApi } from '@/lib/api-client';
import type {
    WorkbookTemplateRecord,
    WorkbookTemplateVersionRecord,
    UpdateTemplateDraftInput,
} from './template-service';

export type {
    WorkbookTemplateRecord,
    WorkbookTemplateVersionRecord,
    UpdateTemplateDraftInput,
    WorkbookTemplateContent,
} from './template-service';

export async function getWorkbookTemplate(slug: string): Promise<WorkbookTemplateRecord> {
    return requestApi<WorkbookTemplateRecord>(
        `/api/v1/modules/aprendizaje/templates/${encodeURIComponent(slug)}`,
    );
}

export async function updateWorkbookTemplateDraft(
    slug: string,
    input: UpdateTemplateDraftInput,
): Promise<WorkbookTemplateRecord> {
    return requestApi<WorkbookTemplateRecord>(
        `/api/v1/modules/aprendizaje/templates/${encodeURIComponent(slug)}/draft`,
        {
            method: 'PATCH',
            body: JSON.stringify(input),
            timeoutMs: 45000,
        },
    );
}

export async function publishWorkbookTemplateVersion(
    slug: string,
    notes: string | null,
): Promise<WorkbookTemplateRecord> {
    return requestApi<WorkbookTemplateRecord>(
        `/api/v1/modules/aprendizaje/templates/${encodeURIComponent(slug)}/publish`,
        {
            method: 'POST',
            body: JSON.stringify({ notes }),
            timeoutMs: 45000,
        },
    );
}

export async function listWorkbookTemplateVersions(slug: string): Promise<WorkbookTemplateVersionRecord[]> {
    return requestApi<WorkbookTemplateVersionRecord[]>(
        `/api/v1/modules/aprendizaje/templates/${encodeURIComponent(slug)}/versions`,
    );
}
