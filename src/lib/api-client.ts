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

export async function requestApi<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

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
