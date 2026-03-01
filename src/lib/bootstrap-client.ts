import type { BootstrapPayload } from '@/server/bootstrap/types';

interface BootstrapResponse {
  ok: boolean;
  data: BootstrapPayload;
  error?: string;
  detail?: string;
}

async function postRefresh(): Promise<boolean> {
  const refreshResponse = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return refreshResponse.ok;
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

  if (response.status === 401) {
    const refreshed = await postRefresh();
    if (refreshed) {
      response = await makeRequest();
    }
  }

  const payload = (await response.json()) as BootstrapResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.detail ?? payload.error ?? 'Bootstrap request failed');
  }

  return payload.data;
}
