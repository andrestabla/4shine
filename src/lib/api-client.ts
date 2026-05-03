import {
  hasTrackedSessionActivity,
  redirectToLoginAfterSessionTimeout,
  tryRefreshSessionFromActivity,
} from '@/lib/session-timeout-client';

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
  detail?: string;
}

function buildErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const maybeEnvelope = payload as ApiEnvelope<unknown>;
  if (maybeEnvelope.error && maybeEnvelope.detail) {
    return `${maybeEnvelope.error}: ${maybeEnvelope.detail}`;
  }
  if (maybeEnvelope.error) {
    return maybeEnvelope.error;
  }
  if (maybeEnvelope.detail) {
    return maybeEnvelope.detail;
  }

  return fallback;
}

interface RequestApiInit extends RequestInit {
  timeoutMs?: number;
}

export async function requestApi<T>(input: string, init: RequestApiInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const timeoutMs = typeof init.timeoutMs === "number" ? Math.max(1000, init.timeoutMs) : 0;

  const makeRequest = async () => {
    const controller = timeoutMs > 0 ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      return await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
        cache: 'no-store',
        signal: controller?.signal ?? init.signal,
      });
    } catch (error) {
      if (controller?.signal.aborted) {
        throw new Error("Request timeout");
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  let response = await makeRequest();

  if (response.status === 401 && hasTrackedSessionActivity()) {
    const refreshed = await tryRefreshSessionFromActivity();
    if (refreshed) {
      response = await makeRequest();
    } else {
      await redirectToLoginAfterSessionTimeout();
    }
  }

  const rawText = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(buildErrorMessage(payload, `Request failed (${response.status})`));
  }

  return payload.data as T;
}
