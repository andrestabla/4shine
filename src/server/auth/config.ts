const DEFAULT_ACCESS_SECRET = '4shine-dev-access-secret-change-me';
const DEFAULT_REFRESH_SECRET = '4shine-dev-refresh-secret-change-me';

function requiredSecret(value: string | undefined, fallback: string): string {
  if (value && value.trim().length >= 16) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT secrets must be configured in production');
  }

  return fallback;
}

let accessSecretCache: string | null = null;
let refreshSecretCache: string | null = null;

export function getAccessSecret(): string {
  if (accessSecretCache) {
    return accessSecretCache;
  }

  accessSecretCache = requiredSecret(process.env.JWT_ACCESS_SECRET, DEFAULT_ACCESS_SECRET);
  return accessSecretCache;
}

export function getRefreshSecret(): string {
  if (refreshSecretCache) {
    return refreshSecretCache;
  }

  refreshSecretCache = requiredSecret(process.env.JWT_REFRESH_SECRET, DEFAULT_REFRESH_SECRET);
  return refreshSecretCache;
}

export const authConfig = {
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 30 * 24 * 60 * 60,
  lockMaxAttempts: 5,
  lockMinutes: 15,
};
