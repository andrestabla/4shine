import {
  hasTrackedSessionActivity,
  redirectToLoginAfterSessionTimeout,
  tryRefreshSessionFromActivity,
} from '@/lib/session-timeout-client';
import type { BootstrapPayload } from '@/server/bootstrap/types';

interface BootstrapResponse {
  ok: boolean;
  data: BootstrapPayload;
  error?: string;
  detail?: string;
}

export async function hydrateFromBackend(): Promise<BootstrapPayload> {
  const makeRequest = async (): Promise<Response> =>
    fetch('/api/v1/bootstrap/me', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

  let response = await makeRequest();

  if (response.status === 401 && hasTrackedSessionActivity()) {
    const refreshed = await tryRefreshSessionFromActivity();
    if (refreshed) {
      response = await makeRequest();
    } else {
      await redirectToLoginAfterSessionTimeout();
    }
  }

  const payload = (await response.json()) as BootstrapResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.detail ?? payload.error ?? 'Bootstrap request failed');
  }

  return payload.data;
}
