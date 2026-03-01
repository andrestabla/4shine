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

export const authConfig = {
  accessSecret: requiredSecret(process.env.JWT_ACCESS_SECRET, DEFAULT_ACCESS_SECRET),
  refreshSecret: requiredSecret(process.env.JWT_REFRESH_SECRET, DEFAULT_REFRESH_SECRET),
  accessTtlSeconds: 15 * 60,
  refreshTtlSeconds: 30 * 24 * 60 * 60,
  lockMaxAttempts: 5,
  lockMinutes: 15,
};
