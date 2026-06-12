import { requestApi } from '@/lib/api-client';
import type {
  CreateSitePageInput,
  SitePage,
  SitePageSummary,
  UpdateSitePageInput,
} from './types';

export type { SitePage, SitePageSummary, CreateSitePageInput, UpdateSitePageInput } from './types';

interface SafeResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<SafeResponse<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

const BASE = '/api/v1/modules/administracion/site/pages';

export function listSitePages() {
  return safe(() => requestApi<SitePageSummary[]>(BASE));
}

export function getSitePage(pageId: string) {
  return safe(() => requestApi<SitePage>(`${BASE}/${pageId}`));
}

export function createSitePage(input: CreateSitePageInput) {
  return safe(() =>
    requestApi<SitePage>(BASE, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export function updateSitePage(pageId: string, input: UpdateSitePageInput) {
  return safe(() =>
    requestApi<SitePage>(`${BASE}/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export function deleteSitePage(pageId: string) {
  return safe(() => requestApi<void>(`${BASE}/${pageId}`, { method: 'DELETE' }));
}
